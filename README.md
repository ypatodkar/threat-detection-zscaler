# Threat Detection System

A comprehensive Security Operations Center (SOC) management platform that analyzes security logs from multiple sources to identify potential threats and suspicious patterns using rule-based anomaly detection.

![Threat Detection](https://img.shields.io/badge/Status-Production-green)
![License](https://img.shields.io/badge/License-ISC-blue)

## 📋 Table of Contents

- [What is This App?](#what-is-this-app)
- [Who Can Use It?](#who-can-use-it)
- [Supported Log Formats](#supported-log-formats)
- [Anomaly Detection](#anomaly-detection)
- [Technologies Used](#technologies-used)
- [Hosting & Deployment](#hosting--deployment)
- [Features](#features)
- [Getting Started](#getting-started)

---

## 🎯 What is This App?

The Threat Detection System is a web-based security log analysis platform designed for Security Operations Centers (SOCs) and IT security teams. It provides:

- **Automated Log Analysis**: Upload and process security logs from multiple sources
- **Real-time Anomaly Detection**: Identify suspicious patterns and potential threats automatically
- **Dual Log Type Support**: Analyze both Zscaler Web Security logs and Apache/Nginx access logs
- **Interactive Dashboards**: Visualize security events, statistics, and anomalies
- **Advanced Search**: Search through logs by IP, user, URL, status code, and more
- **User Management**: Multi-user support with authentication and profile management

### Key Capabilities

- ✅ Upload and parse security logs in real-time
- ✅ Detect anomalies using 5 rule-based algorithms per log type
- ✅ Visualize security statistics and trends
- ✅ Search and filter logs with advanced queries
- ✅ Track anomalies with confidence scores
- ✅ Multi-user support with role-based access

---

## 👥 Who Can Use It?

This platform is designed for:

### Primary Users

- **Security Operations Center (SOC) Analysts**: Monitor and analyze security events
- **IT Security Teams**: Investigate potential threats and security incidents
- **Network Administrators**: Track network access patterns and anomalies
- **Security Engineers**: Review and audit security logs

### Use Cases

- **Threat Detection**: Identify malicious activities and potential attacks
- **Security Monitoring**: Continuous monitoring of network traffic and access logs
- **Incident Response**: Investigate security events and anomalies
- **Compliance Auditing**: Track and analyze security events for compliance
- **Log Analysis**: Centralized analysis of security logs from multiple sources

---

## 📁 Supported Log Formats

### 1. Zscaler Web Security Logs

**Format**: Space-separated text files (`.log` or `.txt`)

**Example Format**:
```
1763208424 10.1.1.27 edward.norton https://suspicious-domain.net/union%20select%20*%20from%20users BLOCK 301 2408 17441 Entertainment Suspicious
```

**Fields Extracted**:
- `timestamp` - Access timestamp (epoch seconds)
- `src_ip` - Source IP address
- `user` - Username
- `url` - Requested URL
- `action` - Action taken (ALLOW/BLOCK)
- `status_code` - HTTP status code
- `bytes_sent` - Bytes sent
- `bytes_received` - Bytes received
- `category` - Content category
- `threat_classification` - Threat type (Malware, Phishing, etc.)

### 2. Apache/Nginx Access Logs

**Format**: Common Log Format (CLF) or Extended Log Format (`.log` or `.txt`)

**Example Format**:
```
192.168.1.100 - - [17/Jan/2025:10:30:45 +0000] "GET /admin?id=1' OR '1'='1 HTTP/1.1" 403 1234 "https://example.com" "Mozilla/5.0"
```

**Fields Extracted**:
- `timestamp` - Access timestamp
- `src_ip` - Source IP address
- `user` - Authenticated user (if available)
- `http_method` - HTTP method (GET, POST, etc.)
- `url_path` - Requested URL path
- `http_version` - HTTP version
- `status_code` - HTTP status code
- `response_size` - Response size in bytes
- `referer` - HTTP referer
- `user_agent` - User agent string

### File Requirements

- **File Types**: `.log` or `.txt` files
- **Maximum Size**: 50MB per file
- **Encoding**: UTF-8 text files
- **Format**: One log entry per line

---

## 🔍 Anomaly Detection

The system uses **rule-based anomaly detection** with 5 specialized algorithms for each log type. Each rule assigns an anomaly score (0.0 to 1.0) and provides a reason for detection.

### Web Security Logs - Detection Rules

#### 1. Excessive Traffic Detection
- **Rule**: Detects when a single IP generates >100 requests within 5 minutes
- **Confidence**: 0.85
- **Use Case**: DDoS attacks, brute force attempts, bot traffic

#### 2. Blocked Request Spike
- **Rule**: Identifies ≥10 blocked attempts to the same domain within 10 minutes
- **Confidence**: 0.75
- **Use Case**: Targeted attacks, persistent threat actors

#### 3. Threat Classification Detection
- **Rule**: Flags any log entry with non-empty threat classification (Malware, Phishing, Trojan, etc.)
- **Confidence**: 0.95
- **Use Case**: Known threats identified by security systems

#### 4. Repeated Errors
- **Rule**: Detects >20 403/404 status codes within 10 minutes
- **Confidence**: 0.70
- **Use Case**: Scanning attempts, reconnaissance activities

#### 5. Unusual URL Patterns
- **Rule**: Detects SQL injection attempts, encoded payloads (%00, SQL keywords), suspicious patterns
- **Confidence**: 0.80
- **Use Case**: Injection attacks, XSS attempts, encoded exploits

### Access Logs - Detection Rules

#### 1. Excessive Traffic from One IP
- **Rule**: Detects >100 requests from a single IP in 5 minutes
- **Confidence**: 0.85
- **Use Case**: DDoS attacks, automated scanners

#### 2. Repeated 4xx/5xx Errors
- **Rule**: Identifies >20 error responses (4xx/5xx) within 10 minutes
- **Confidence**: 0.70
- **Use Case**: Directory traversal attempts, failed authentication

#### 3. Unusual URL Pattern
- **Rule**: Detects SQL injection patterns, encoded payloads, suspicious URL structures
- **Confidence**: 0.80
- **Use Case**: SQL injection, path traversal, XSS attempts

#### 4. Suspicious User-Agent
- **Rule**: Flags empty user agents or known scanner/bot signatures (sqlmap, nikto, nmap, etc.)
- **Confidence**: 0.75 (scanners) / 0.60 (empty)
- **Use Case**: Automated attacks, bot traffic, reconnaissance

#### 5. Unusual HTTP Method
- **Rule**: Detects non-standard HTTP methods (other than GET, POST, HEAD, OPTIONS)
- **Confidence**: 0.65
- **Use Case**: Protocol abuse, custom attack methods

### How Detection Works

1. **Upload**: User uploads a log file (`.log` or `.txt`)
2. **Parsing**: System parses each log entry and extracts relevant fields
3. **Analysis**: Each log entry is analyzed against all 5 detection rules
4. **Scoring**: Anomaly scores are calculated (0.0 = normal, 1.0 = high threat)
5. **Storage**: Logs are stored in PostgreSQL with anomaly scores and reasons
6. **Visualization**: Anomalies are highlighted in dashboards and event lists

### Anomaly Score Interpretation

- **0.0 - 0.3**: Normal traffic (no anomalies detected)
- **0.3 - 0.6**: Low risk (minor anomalies, monitor)
- **0.6 - 0.8**: Medium risk (suspicious activity, investigate)
- **0.8 - 1.0**: High risk (potential threat, immediate action)

---

## 🛠 Technologies Used

### Frontend

- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Icons** - Icon library
- **CSS3** - Custom styling with dark theme

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **Multer** - File upload handling (in-memory)
- **CORS** - Cross-origin resource sharing

### Deployment & Infrastructure

- **AWS Amplify** - Frontend hosting and CI/CD
- **AWS Lambda** - Serverless backend functions
- **Lambda Function URLs** - HTTP endpoints for Lambda
- **PostgreSQL Database** - Cloud-hosted database
- **GitHub** - Version control and source code management

### Development Tools

- **ES6 Modules** - Modern JavaScript module system
- **dotenv** - Environment variable management
- **Nodemon** - Development server auto-reload

### Security

- **bcryptjs** - Secure password hashing
- **CORS** - Cross-origin security
- **Input Validation** - File type and size validation
- **SQL Parameterization** - Protection against SQL injection

---

## 🌐 Hosting & Deployment

### Frontend - AWS Amplify

- **Platform**: AWS Amplify
- **URL**: `https://main.djqvks4i9xlkw.amplifyapp.com`
- **Features**:
  - Automatic deployments from GitHub
  - Global CDN distribution
  - HTTPS/SSL certificates
  - Custom domain support
  - Environment variable management

### Backend - AWS Lambda

- **Platform**: AWS Lambda (Serverless)
- **Runtime**: Node.js 20.x
- **Architecture**: Serverless functions with Function URLs
- **Features**:
  - Auto-scaling
  - Pay-per-request pricing
  - No server management
  - High availability

### Database - PostgreSQL

- **Platform**: Cloud-hosted PostgreSQL
- **Features**:
  - Relational data storage
  - Optimized indexes for search
  - User authentication
  - Log storage and retrieval

### CI/CD Pipeline

1. **Code Push**: Developer pushes to GitHub
2. **Auto-Deploy**: AWS Amplify detects changes
3. **Build**: Frontend is built and deployed
4. **Lambda Update**: Backend code is packaged and uploaded to Lambda
5. **Database**: Migrations run automatically (if configured)

### Environment Variables

**Frontend (Amplify)**:
- `VITE_API_BASE_URL` - Backend API endpoint

**Backend (Lambda)**:
- `DB_HOST` - Database host
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port (default: 5432)
- `JWT_SECRET` - JWT signing secret

---

## ✨ Features

### Core Features

- ✅ **Dual Log Type Support**: Web Security Logs (Zscaler) and Access Logs (Apache/Nginx)
- ✅ **Real-time Anomaly Detection**: 5 rule-based algorithms per log type
- ✅ **Interactive Dashboards**: Visual statistics and trends
- ✅ **Advanced Search**: Search by IP, user, URL, status code, and more
- ✅ **User Authentication**: Secure login and signup
- ✅ **Profile Management**: User profiles with customization
- ✅ **Progress Tracking**: Real-time upload and processing progress
- ✅ **Responsive Design**: Works on desktop and mobile devices

### Dashboard Features

- **Web Security Dashboard**: Statistics for Zscaler logs
- **Access Logs Dashboard**: Statistics for Apache/Nginx logs
- **Anomaly Highlights**: Visual indicators for detected threats
- **Real-time Updates**: Live statistics and event counts

### Search & Filter

- **Field-based Search**: Search by specific log fields
- **Prefix Matching**: Fast prefix search with optimized indexes
- **Pagination**: Efficient handling of large result sets
- **Sorting**: Sort by timestamp, IP, status code, etc.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS account (for deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ypatodkar/threat-detection-zscaler.git
   cd threat-detection-zscaler
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure database credentials
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database Setup**:
   ```bash
   cd backend
   npm run init-db  # Creates tables and default admin user
   ```

5. **Access the Application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change these credentials in production!**

### Upload Your First Log

1. Log in with default credentials
2. Navigate to "Upload" page
3. Select log type (Web Security or Access Logs)
4. Upload a `.log` or `.txt` file
5. View results in Dashboard or Events page

---

## 📊 Project Structure

```
threat-detection-zscaler/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── config/       # Configuration files
│   └── public/           # Static assets
├── backend/              # Node.js backend
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration
│   ├── db/               # Database migrations
│   └── scripts/          # Utility scripts
├── api/                  # Vercel serverless function
└── test-logs/            # Sample log files
```

---

## 📝 License

ISC License

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for Security Operations Centers**

