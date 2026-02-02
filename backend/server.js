const express = require('express');
const cors = require('cors');
const { CloudWatchClient, GetMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize AWS clients
const cloudWatchClient = new CloudWatchClient({ 
  region: process.env.AWS_REGION || 'us-east-1'
});

const ec2Client = new EC2Client({ 
  region: process.env.AWS_REGION || 'us-east-1'
});

app.use(cors());
app.use(express.json());

// Helper function to find instance ID by IP address
async function findInstanceByIP(ipAddress) {
  try {
    const command = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'private-ip-address',
          Values: [ipAddress]
        }
      ]
    });
    
    let response = await ec2Client.send(command);
    
    // If not found by private IP, try public IP
    if (!response.Reservations || response.Reservations.length === 0) {
      const publicCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'ip-address',
            Values: [ipAddress]
          }
        ]
      });
      response = await ec2Client.send(publicCommand);
    }

    if (response.Reservations && response.Reservations.length > 0) {
      const instance = response.Reservations[0].Instances[0];
      return instance.InstanceId;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding instance:', error);
    throw error;
  }
}

// Helper function to parse time period (e.g., "1h", "30m", "2d")
function parseTimePeriod(period) {
  const match = period.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error('Invalid period format. Use format like "1h", "30m", "2d"');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  return value * multipliers[unit];
}

// Helper function to parse interval (e.g., "5m", "1m")
function parseInterval(interval) {
  const match = interval.match(/^(\d+)m$/);
  if (!match) {
    throw new Error('Invalid interval format. Use format like "1m", "5m"');
  }
  
  return parseInt(match[1]) * 60;
}

// API endpoint to get CPU metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const { ip, period = '1h', interval = '5m' } = req.query;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    console.log(`Fetching metrics for IP: ${ip}, Period: ${period}, Interval: ${interval}`);

    // Find instance ID by IP
    const instanceId = await findInstanceByIP(ip);
    
    if (!instanceId) {
      return res.status(404).json({ error: 'No instance found with the specified IP address' });
    }

    console.log(`Found instance: ${instanceId}`);

    // Calculate time range
    const periodSeconds = parseTimePeriod(period);
    const intervalSeconds = parseInterval(interval);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (periodSeconds * 1000));

    // Query CloudWatch for CPU metrics
    const command = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: 'cpu_utilization',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/EC2',
              MetricName: 'CPUUtilization',
              Dimensions: [
                {
                  Name: 'InstanceId',
                  Value: instanceId
                }
              ]
            },
            Period: intervalSeconds,
            Stat: 'Average'
          }
        }
      ]
    });

    const response = await cloudWatchClient.send(command);
    
    // Format the response data
    const metricData = response.MetricDataResults[0];
    const dataPoints = metricData.Timestamps.map((timestamp, index) => ({
      timestamp: timestamp.toISOString(),
      value: metricData.Values[index]
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      instanceId,
      ip,
      period,
      interval,
      dataPoints
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metrics',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  });
}

// Export for Vercel serverless
module.exports = app;
