import React, { useState } from 'react';
import axios from 'axios';
import { Analytics } from '@vercel/analytics/react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

function getChartYDomain(chartData) {
  if (!chartData || chartData.length === 0) return [0, 100];
  const values = chartData.map((d) => d.cpu);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  const padding = range === 0 ? 1 : Math.max(range * 0.15, 0.5);
  const domainMin = Math.max(0, minVal - padding);
  const domainMax = Math.min(100, maxVal + padding);
  if (domainMin === domainMax) return [domainMin, Math.min(100, domainMax + 1)];
  return [domainMin, domainMax];
}

function generateMockData(ip, period, interval) {
  const periodMinutes = { '15m': 15, '30m': 30, '1h': 60, '3h': 180, '6h': 360, '12h': 720, '1d': 1440, '3d': 4320, '7d': 10080 };
  const intervalMinutes = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '60m': 60 };
  const totalMins = periodMinutes[period] || 60;
  const stepMins = intervalMinutes[interval] || 5;
  const count = Math.min(Math.floor(totalMins / stepMins), 100);
  const now = Date.now();
  const dataPoints = [];
  for (let i = count; i >= 0; i--) {
    const ts = new Date(now - i * stepMins * 60 * 1000);
    const value = 20 + Math.random() * 60 + (Math.sin(i * 0.3) * 15);
    dataPoints.push({ timestamp: ts.toISOString(), value: Math.min(100, Math.max(0, value)) });
  }
  return {
    instanceId: 'i-mock' + Math.random().toString(36).slice(2, 10),
    ip: ip || '10.0.0.1',
    period,
    interval,
    dataPoints
  };
}

function App() {
  const [ipAddress, setIpAddress] = useState('');
  const [period, setPeriod] = useState('1h');
  const [interval, setInterval] = useState('5m');
  const [useMock, setUseMock] = useState(USE_MOCK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [viewMode, setViewMode] = useState('chart');
  const [threshold, setThreshold] = useState('');
  const [thresholdEnabled, setThresholdEnabled] = useState(false);

  const thresholdValue = threshold !== '' ? parseFloat(threshold) : null;
  const showThreshold = thresholdEnabled && thresholdValue !== null;

  // tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const cpuValue = payload[0].value;
      const isAboveThreshold = showThreshold && cpuValue > thresholdValue;
      return (
        <div className="custom-tooltip">
          <div className="label">{label}</div>
          <div className="value">{cpuValue.toFixed(2)}%</div>
          {isAboveThreshold && (
            <div className="warning">Above threshold ({thresholdValue}%)</div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      let responseData;
      if (useMock) {
        await new Promise(r => setTimeout(r, 500));
        responseData = generateMockData(ipAddress || '10.0.0.1', period, interval);
      } else {
        const response = await axios.get(`${API_BASE_URL}/api/metrics`, {
          params: { ip: ipAddress, period, interval }
        });
        responseData = response.data;
      }

      // format data for chart
      const points = responseData.dataPoints;
      const rangeMs = points.length >= 2
        ? new Date(points[points.length - 1].timestamp) - new Date(points[0].timestamp)
        : 0;
      const showDate = rangeMs > 24 * 60 * 60 * 1000;

      const formattedData = points.map(point => {
        const d = new Date(point.timestamp);
        const time = showDate
          ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        return {
          time,
          cpu: parseFloat(Number(point.value).toFixed(2))
        };
      });

      setData({
        ...responseData,
        chartData: formattedData
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AWS EC2 CPU Monitor</h1>
      </header>

      <main className="App-main">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="ipAddress">Instance IP Address:</label>
            <input
              type="text"
              id="ipAddress"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 10.0.1.123 or 54.123.45.67"
              required
            />
          </div>
          <div className="form-group form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
              />
              Use mock data (no API)
            </label>
          </div>


          <div className="form-row">
            <div className="form-group">
              <label htmlFor="period">Time Period:</label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="3h">3 hours</option>
                <option value="6h">6 hours</option>
                <option value="12h">12 hours</option>
                <option value="1d">1 day</option>
                <option value="3d">3 days</option>
                <option value="7d">7 days</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="interval">Sample Interval:</label>
              <select
                id="interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="60m">1 hour</option>
              </select>
            </div>
          </div>

         
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? <><span className="spinner"></span>Loading...</> : 'Fetch Metrics'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && data.chartData && data.chartData.length > 0 && (() => {
          const yDomain = getChartYDomain(data.chartData);
          return (
          <div className="chart-container">
            <div className="chart-info">
              <h2>CPU Utilization</h2>
              <p>
                <span><strong>Instance:</strong> {data.instanceId}</span>
                <span><strong>IP:</strong> {data.ip}</span>
                <span><strong>Period:</strong> {data.period}</span>
                <span><strong>Interval:</strong> {data.interval}</span>
              </p>
            </div>

            {/* Chart controls */}
            <div className="chart-controls">
              <div className="toggle-group">
                <button
                  className={viewMode === 'chart' ? 'active' : ''}
                  onClick={() => setViewMode('chart')}
                >
                  Chart
                </button>
                <button
                  className={viewMode === 'table' ? 'active' : ''}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>

              {viewMode === 'chart' && (
                <div className="toggle-group">
                  <button
                    className={chartType === 'line' ? 'active' : ''}
                    onClick={() => setChartType('line')}
                  >
                    Line
                  </button>
                  <button
                    className={chartType === 'area' ? 'active' : ''}
                    onClick={() => setChartType('area')}
                  >
                    Area
                  </button>
                </div>
              )}

              <div className="threshold-input">
                <label className="threshold-checkbox-label">
                  <input
                    type="checkbox"
                    checked={thresholdEnabled}
                    onChange={(e) => setThresholdEnabled(e.target.checked)}
                  />
                  Enable threshold
                </label>
                <div className="threshold-input-row">
                  <label htmlFor="threshold">Alert above (%):</label>
                  <input
                    type="number"
                    id="threshold"
                    min="0"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="e.g. 80"
                    disabled={!thresholdEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Chart view */}
            {viewMode === 'chart' && (
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' ? (
                  <LineChart
                    data={data.chartData}
                    margin={{ top: 24, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007bff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#007bff" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#555555', fontSize: 12 }}
                      axisLine={{ stroke: '#cccccc' }}
                      tickLine={{ stroke: '#cccccc' }}
                    />
                    <YAxis 
                      tick={{ fill: '#555555', fontSize: 12 }}
                      axisLine={{ stroke: '#cccccc' }}
                      tickLine={{ stroke: '#cccccc' }}
                      domain={yDomain}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {showThreshold && (
                      <ReferenceLine
                        y={thresholdValue}
                        stroke="#ffa500"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'Threshold', fill: '#ffa500', position: 'top', fontSize: 12 }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#007bff', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#00bfff', stroke: '#007bff', strokeWidth: 2 }}
                      name="CPU Usage (%)"
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                ) : (
                  <AreaChart
                    data={data.chartData}
                    margin={{ top: 24, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorCpuArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007bff" stopOpacity={0.6}/>
                        <stop offset="50%" stopColor="#00bfff" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#00bfff" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#555555', fontSize: 12 }}
                      axisLine={{ stroke: '#cccccc' }}
                      tickLine={{ stroke: '#cccccc' }}
                    />
                    <YAxis 
                      tick={{ fill: '#555555', fontSize: 12 }}
                      axisLine={{ stroke: '#cccccc' }}
                      tickLine={{ stroke: '#cccccc' }}
                      domain={yDomain}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {showThreshold && (
                      <ReferenceLine
                        y={thresholdValue}
                        stroke="#ffa500"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ value: 'Threshold', fill: '#ffa500', position: 'top', fontSize: 12 }}
                      />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      fill="url(#colorCpuArea)"
                      name="CPU Usage (%)"
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}

            {/* Table view */}
            {viewMode === 'table' && (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Time</th>
                      <th>CPU (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chartData.map((point, index) => {
                      const isAbove = showThreshold && point.cpu > thresholdValue;
                      return (
                        <tr key={index} className={isAbove ? 'above-threshold' : ''}>
                          <td>{index + 1}</td>
                          <td>{point.time}</td>
                          <td>{point.cpu.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}


            <div className="stats-summary">
              <div className="stat-card avg">
                <h3>Average</h3>
                <p>{(data.chartData.reduce((sum, d) => sum + d.cpu, 0) / data.chartData.length).toFixed(1)}%</p>
              </div>
              <div className="stat-card max">
                <h3>Maximum</h3>
                <p>{Math.max(...data.chartData.map(d => d.cpu)).toFixed(1)}%</p>
              </div>
              <div className="stat-card min">
                <h3>Minimum</h3>
                <p>{Math.min(...data.chartData.map(d => d.cpu)).toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <h3>Peak Hour</h3>
                
                <p style={{ fontSize: '1.5rem' }}>
                  {data?.chartData?.length > 0
                    ? data.chartData.reduce((prev, curr) => prev.cpu > curr.cpu ? prev : curr).time
                    : '--'}
                </p>
              </div>
              <div className="stat-card">
                
                <h3>Data Points</h3>
                
                <p>{data.chartData.length}</p>
              </div>
              {showThreshold && (
                <div className="stat-card threshold-stat">
                  <h3>Above Threshold</h3>
                  <p>{((data.chartData.filter(d => d.cpu > thresholdValue).length / data.chartData.length) * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        ); })()}

        {data && data.chartData && data.chartData.length === 0 && (
          <div className="info-message">
            No data available for the specified time period. The instance may be new or CloudWatch monitoring may not be enabled.
          </div>
        )}
      </main>

      <section className="trusted-by">
        <span className="trusted-by-label">TRUSTED BY:</span>
        <div className="trusted-by-logos">
          <div className="trusted-by-logo" aria-label="Intel">
            
          <img src={require('./assets/images/intel.png')} alt="ISEF" />
            
          </div>
          <div className="trusted-by-logo" aria-label="ISEF">
          <img src={require('./assets/images/ISEF.png')} alt="ISEF" />

          </div>
          <div className="trusted-by-logo trusted-by-logo-rtl" aria-label="Israeli Navy">
            
          <img src={require('./assets/images/IsraeliNavy.png')} alt="ISEF" />
          </div>
        </div>
      </section>

      <footer className="cta-section">
        <div className="cta-section-inner">
          <h2 className="cta-headline">Schedule a call with a AWS CPU Monitor Expert</h2>
          <div className="cta-avatars">
            <div className="cta-avatar cta-avatar-first">
              <img src={require('./assets/images/ginger.jpg')} alt="Ginger" />
            </div>
            <div className="cta-avatar cta-avatar-second">
              <img src={require('./assets/images/daniel.jpg')} alt="Daniel" />
            </div>
          </div>
          <a href="mailto:dfraimo@gmail.com" target="_blank" rel="noopener noreferrer" className="cta-btn">
            Contact Me by Email
          </a>
        </div>
        
        

      </footer>

        <div className="footer-signature" style={{textAlign: 'center', marginTop: '2rem'}}>
          <span className="footer-madeby">Crafted with <span style={{color: '#ff4b2b', fontWeight: 'bold'}}>♥</span> by</span>
          <span className="footer-author" style={{fontWeight: 700, letterSpacing: '0.03em', marginLeft: 6}}>Daniel Fraimovich</span>
        </div>

      <Analytics />
    </div>
  );
}

export default App;
