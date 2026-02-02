# AWS EC2 CPU Monitor

A full-stack application for monitoring and visualizing CPU usage of AWS EC2 instances over time.

--------------------------------------------------

Fetch CPU metrics for an EC2 instance.

**Query Parameters:**
- `ip` (required): IP address of the instance
- `period` (optional): Time period (default: "1h")
  - Format: `{number}{unit}` where unit is `m` (minutes), `h` (hours), or `d` (days)
  - Examples: "15m", "1h", "3h", "1d", "7d"
- `interval` (optional): Sampling interval (default: "5m")
  - Format: `{number}m`
  - Examples: "1m", "5m", "15m", "30m", "60m"


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

