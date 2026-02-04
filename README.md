# AWS EC2 CPU Monitor ☁️ 📊

![Project Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![AWS](https://img.shields.io/badge/AWS-SDK%20v3-orange)

A real-time full-stack application that monitors the CPU utilization of AWS EC2 instances. This tool solves the common problem of needing to look up Instance IDs by allowing users to query metrics directly using an **IP Address**.

It features a polished React frontend for visualization and a Node.js/Express backend that acts as a secure middleware to communicate with AWS CloudWatch.

## 🌟 Key Features

* **IP-Based Lookup:** Automatically resolves Private/Public IPs to AWS Instance IDs.
* **Interactive Visualization:** Dynamic Line and Area charts using `recharts`.
* **Customizable Sampling:** Adjustable time periods (1h to 7d) and sample intervals (1m to 1h).
* **Threshold Alerts:** Visual warnings when CPU usage exceeds a user-defined percentage.
* **Dual Views:** Toggle between visual charts and raw data tables.
* **Mock Mode:** Built-in simulation mode to demonstrate UI features without active AWS credentials.
* **Statistical Summary:** Automatic calculation of Average, Min, Max, and Peak usage times.

## 🛠️ Tech Stack

### Frontend
* **React.js:** Component-based UI architecture.
* **Recharts:** Data visualization library.
* **Axios:** HTTP client for API requests.
* **CSS3:** Custom responsive styling.

### Backend
* **Node.js & Express:** RESTful API server.
* **AWS SDK v3:** Modular import of `EC2` and `CloudWatch` clients for optimized performance.
* **Dotenv:** Environment variable management.

---

## 🏗️ Architecture

The application follows a standard client-server architecture:

1.  **Client:** Sends an IP address and time range configuration.
2.  **Server:**
    * Queries **AWS EC2 API** to find the instance ID associated with the IP.
    * Queries **AWS CloudWatch API** to fetch CPU metrics for that ID.
    * Formats the timestamped data and returns it to the client.
3.  **Client:** Renders the data into interactive charts.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v14 or higher)
* An active AWS Account
* AWS IAM User credentials with read access (`ec2:DescribeInstances` and `cloudwatch:GetMetricData`).

### 1. Clone the Repository
```bash
git clone [https://github.com/PrimeDaniel/AWS_CPU_Monitor.git](https://github.com/PrimeDaniel/AWS_CPU_Monitor.git)
cd AWS_CPU_Monitor
2. Backend Setup
Navigate to the backend directory (or root, depending on your structure) and install dependencies:

Bash
# Assuming backend code is in the root or a /server folder
npm install
Create a .env file in the server directory with your AWS credentials:

Code snippet
PORT=3001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
Start the server:

Bash
npm start
# Server runs on http://localhost:3001
3. Frontend Setup
Open a new terminal, navigate to the frontend directory (if separated), and install dependencies:

Bash
# Assuming frontend code is in /client or similar
npm install
Start the React application:

Bash
npm start
# Client runs on http://localhost:3000
📸 Usage
Enter IP: Type the Private or Public IP of your EC2 instance.

Select Period: Choose how far back you want to see (e.g., "Last 3 Hours").

Set Interval: Choose the granularity of data points (e.g., "5 Minutes").

Fetch: Click "Fetch Metrics" to visualize the data.

Note: If you do not have active AWS credentials, check the "Use mock data" box to see the application in simulation mode.
