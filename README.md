# AWS EC2 CPU Monitor

A full-stack application for monitoring and visualizing CPU usage of AWS EC2 instances over time.

## Features

- 🖥️ Real-time CPU utilization monitoring from AWS CloudWatch
- 📊 Interactive time-series charts using Recharts
- 🔍 Look up instances by IP address (private or public)
- ⏱️ Configurable time periods (15m to 7 days)
- 📈 Adjustable sampling intervals (1m to 1 hour)
- 📉 Statistical summary (average, max, min)

## Architecture

### Backend (Node.js + Express)
- REST API endpoint for fetching metrics
- AWS SDK integration for EC2 and CloudWatch
- Automatic IP-to-Instance-ID resolution
- Flexible time period and interval parsing

### Frontend (React + Recharts)
- Clean, responsive UI
- Interactive line chart visualization
- Real-time data fetching
- Statistical summary cards

## Prerequisites

- Node.js (v16 or higher)
- AWS Account with:
  - EC2 instances running
  - CloudWatch monitoring enabled
  - IAM credentials with appropriate permissions

## Required AWS Permissions

Your IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

## Installation

### Local Development

### 1. Clone and Setup Backend

```bash
cd backend
npm install
```

### 2. Configure AWS Credentials

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
PORT=3001
```

**Alternative:** Use AWS CLI credentials from `~/.aws/credentials` (the SDK will automatically detect them)

### 3. Setup Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Local Development

### Start Backend Server

```bash
cd backend
npm start
```

The API will run on `http://localhost:3001`

### Start Frontend

In a new terminal:
```bash
cd frontend
npm start
```

The UI will open at `http://localhost:3000`

## Deployment

### Deploy to Vercel (Recommended)

Deploy this app to Vercel in 5 minutes:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables
vercel env add AWS_REGION
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY

# Deploy to production
vercel --prod
```

Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in the Vercel project environment variables before deploying to production.

## Usage

1. **Enter Instance IP Address**
   - Use either the private IP (e.g., `10.0.1.123`) or public IP (e.g., `54.123.45.67`)

2. **Select Time Period**
   - Choose how far back to look (15 minutes to 7 days)

3. **Select Sample Interval**
   - Choose granularity of data points (1 minute to 1 hour)

4. **Click "Fetch Metrics"**
   - The chart will display CPU utilization over time
   - Statistics will show average, max, min values

## API Endpoints

### GET /api/metrics

Fetch CPU metrics for an EC2 instance.

**Query Parameters:**
- `ip` (required): IP address of the instance
- `period` (optional): Time period (default: "1h")
  - Format: `{number}{unit}` where unit is `m` (minutes), `h` (hours), or `d` (days)
  - Examples: "15m", "1h", "3h", "1d", "7d"
- `interval` (optional): Sampling interval (default: "5m")
  - Format: `{number}m`
  - Examples: "1m", "5m", "15m", "30m", "60m"

**Example:**
```bash
curl "http://localhost:3001/api/metrics?ip=10.0.1.123&period=1h&interval=5m"
```

**Response:**
```json
{
  "instanceId": "i-1234567890abcdef0",
  "ip": "10.0.1.123",
  "period": "1h",
  "interval": "5m",
  "dataPoints": [
    {
      "timestamp": "2025-02-02T10:00:00.000Z",
      "value": 45.2
    },
    ...
  ]
}
```

## Troubleshooting

### No Data Points Returned

1. **CloudWatch Monitoring Not Enabled**
   - Enable detailed monitoring on your EC2 instance
   - Basic monitoring provides 5-minute intervals
   - Detailed monitoring provides 1-minute intervals

2. **Instance Too New**
   - CloudWatch data may take a few minutes to appear for new instances

3. **Wrong IP Address**
   - Verify the IP address is correct
   - Try both private and public IP

### Authentication Errors

1. **Check AWS Credentials**
   - Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
   - Or ensure AWS CLI is configured: `aws configure`

2. **Check IAM Permissions**
   - Ensure your IAM user has `ec2:DescribeInstances` and `cloudwatch:GetMetricData`

### CORS Issues

If running backend on different domain:
- Update CORS settings in `backend/server.js`
- Set `REACT_APP_API_URL` environment variable in frontend

## Project Structure

```
aws-cpu-monitor/
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment template
└── frontend/
    ├── src/
    │   ├── App.js          # Main React component
    │   ├── App.css         # Styling
    │   ├── index.js        # React entry point
    │   └── index.css       # Base styles
    ├── public/
    │   └── index.html      # HTML template
    └── package.json        # Frontend dependencies
```

## Technologies Used

### Backend
- **Express.js** - Web framework
- **@aws-sdk/client-cloudwatch** - CloudWatch metrics
- **@aws-sdk/client-ec2** - EC2 instance lookup
- **cors** - Cross-origin requests
- **dotenv** - Environment configuration

### Frontend
- **React** - UI framework
- **Recharts** - Chart visualization
- **Axios** - HTTP client

## Future Enhancements

- [ ] Support for multiple metrics (memory, network, disk)
- [ ] Multiple instance comparison
- [ ] Alert threshold configuration
- [ ] Export data to CSV
- [ ] Real-time streaming updates
- [ ] Auto-refresh capability
- [ ] Dark mode toggle
- [ ] Save favorite instances

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
