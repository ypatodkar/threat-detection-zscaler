# Threat Detection System - Zscaler Web Security Log Analyzer

A full-stack web application designed for SOC (Security Operations Center) analysts to upload, parse, analyze, and detect anomalies in Zscaler Web Security logs. The system provides real-time threat detection, comprehensive log analysis, and an intuitive dashboard for monitoring security events.

## What This Project Does

This application serves as a centralized platform for security log analysis with the following capabilities:

### Core Features

1. **User Authentication & Management**
   - Secure user registration and login with bcrypt password hashing
   - User profile management with name, email, and profile picture upload
   - Each user's uploaded logs are tracked and isolated

2. **Log File Upload & Parsing**
   - Upload Zscaler Web Security log files (`.log` or `.txt` format)
   - Automatic parsing of log entries into structured data
   - Support for large log files with efficient processing
   - User-specific log tracking (each upload is associated with the logged-in user)

3. **Anomaly Detection Engine**
   - Real-time rule-based anomaly detection with 5 configurable rules:
     - **Excessive Traffic**: Flags >100 requests from one IP in 5 minutes (Confidence: 0.85)
     - **Blocked Request Spike**: Detects ≥10 blocked attempts to same domain (Confidence: 0.75)
     - **Threat Classification**: Flags any non-empty threat classification like Malware, Phishing (Confidence: 0.95)
     - **Repeated Errors**: Identifies >20 403/404 errors in 10 minutes (Confidence: 0.70)
     - **Unusual URL Pattern**: Detects SQL injection keywords or encoded payloads (Confidence: 0.80)
   - Each anomaly includes a confidence score (0-1) and detailed explanation
   - Anomalous entries are highlighted in the UI with visual indicators

4. **Event Browser & Search**
   - Comprehensive table view of all security events
   - Real-time search with debounced input (300ms) for:
     - Source IP address
     - Username
     - URL
     - Action (ALLOW/BLOCK)
     - Status code
     - Category
     - Threat classification
   - Optimized database queries with prefix search indexes
   - User-specific data filtering (users only see their own uploaded logs)

5. **Interactive Dashboard**
   - Real-time statistics and KPIs:
     - Total logs, anomalies, blocked/allowed requests
     - High threat count and anomaly rates
   - Visual flow diagram showing log distribution (Total → Allowed/Blocked)
   - Top 3 rankings for:
     - Threat types
     - Source IPs
     - Categories
     - Users
   - Clickable dashboard items that redirect to Events page with pre-filled filters
   - Dynamic KPI display (only shows metrics with available data)

6. **Anomalies View**
   - Dedicated page showing all flagged anomalies
   - Filtered by logged-in user's uploaded logs
   - Displays confidence scores and anomaly reasons

7. **AI Documentation**
   - Comprehensive documentation of anomaly detection rules
   - Explanation of log parsing and field extraction
   - Details on confidence scoring methodology

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework for RESTful APIs
- **PostgreSQL** - Relational database for storing logs and user data
- **bcrypt** - Password hashing library for secure authentication
- **Multer** - Middleware for handling file uploads
- **pg** - PostgreSQL client for Node.js
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing support

### Frontend
- **React 18** - UI library for building interactive interfaces
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Icons** - Icon library (Font Awesome icons)
- **Recharts** - Charting library for data visualization

### Database
- **PostgreSQL** with optimized indexes:
  - `text_pattern_ops` indexes for efficient prefix searching
  - Composite indexes for user-specific queries
  - Timestamp indexes for time-based queries

## How to Use

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

### Installation

#### 1. Clone and Navigate to Project

```bash
cd threat-detection-zscaler
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=threat_detection
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your-secret-key-here
BCRYPT_ROUNDS=10
```

#### 3. Database Setup

Create the PostgreSQL database:

```bash
createdb threat_detection
```

Or using psql:

```sql
CREATE DATABASE threat_detection;
```

Initialize the database schema and create default admin user:

```bash
cd backend
npm run init-db
```

This will:
- Create the `web_logs` and `users` tables
- Create necessary indexes
- Create default admin user (username: `admin`, password: `admin123`)

**If you already have a database**, run the migration to add the `uploaded_by_user_id` column:

```bash
psql -d threat_detection -f db/add-uploaded-by-column.sql
```

Create search indexes for optimized queries:

```bash
npm run create-indexes
```

#### 4. Generate Synthetic Data (Optional)

To populate the dashboard with synthetic log entries:

```bash
cd backend
npm run generate-data
```

Or generate a log file:

```bash
npm run generate-file
```

#### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

### Running the Application

#### Start Backend Server

```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on `http://localhost:3001`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Usage Guide

#### 1. Sign Up / Login

- Navigate to `http://localhost:3000`
- Create a new account or use the default admin credentials:
  - Username: `admin`
  - Password: `admin123`

#### 2. Upload Log Files

- Click on **"Upload Logs"** in the sidebar
- Drag & drop or select a `.log` or `.txt` file containing Zscaler Web Security logs
- The system will automatically:
  - Parse all log entries
  - Run anomaly detection on each entry
  - Store results in the database
  - Associate logs with your user account

**Log Format Expected:**
```
timestamp src_ip user url action status_code bytes_sent bytes_received category threat_classification
```

**Example:**
```
1731529200 10.1.1.25 john.doe https://malicious-site.com BLOCK 403 1200 5400 Malware Trojan
```

#### 3. View Dashboard

- The **Dashboard** shows:
  - Real-time statistics (total logs, anomalies, blocked/allowed requests)
  - Top 3 threat types, source IPs, categories, and users
  - Visual flow diagram
  - Key performance indicators
- Click on any dashboard item (threat type, IP, category, user, or Allowed/Blocked) to navigate to Events page with that filter pre-applied

#### 4. Browse Events

- Navigate to **"Events"** page
- View all uploaded logs in a searchable table
- Use individual search fields for:
  - Source IP
  - Username
  - URL
  - Action
  - Status Code
  - Category
  - Threat Classification
- Search is "as you type" with 300ms debounce
- Anomalous entries are highlighted with red borders
- Click **"Clear All"** to reset all search filters

#### 5. View Anomalies

- Navigate to **"Anomalies"** page
- See all flagged entries with:
  - Confidence scores (0-1)
  - Detailed anomaly reasons
  - Full log entry details

#### 6. Manage Profile

- Click on your **profile icon** in the sidebar footer
- View your account information
- Edit your name and email
- Upload a profile picture
- View statistics (total logs uploaded)

#### 7. AI Documentation

- Navigate to **"AI Documentation"** page
- Review detailed explanations of:
  - Anomaly detection rules
  - Confidence scoring methodology
  - Log parsing and field extraction

### API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/profile` - Get user profile (requires `x-user-id` header)
- `PUT /auth/profile` - Update user profile (requires `x-user-id` header)

#### Logs
- `POST /logs/upload` - Upload and process log file (requires `x-user-id` header)
- `GET /logs/events` - Get paginated log events (requires `x-user-id` header)
- `GET /logs/search?field=<field>&q=<query>` - Search logs by field (requires `x-user-id` header)
- `GET /logs/anomalies` - Get all flagged anomalies (requires `x-user-id` header)
- `GET /logs/stats` - Get dashboard statistics (requires `x-user-id` header)

### Database Schema

#### `web_logs` table
- Stores all parsed log entries
- Includes `uploaded_by_user_id` foreign key to track uploader
- Fields: `id`, `timestamp`, `src_ip`, `user`, `url`, `action`, `status_code`, `bytes_sent`, `bytes_received`, `category`, `threat_classification`, `anomaly_score`, `anomaly_reason`, `uploaded_by_user_id`, `created_at`

#### `users` table
- Stores user accounts
- Fields: `id`, `username`, `password_hash`, `email`, `name`, `profile_picture`, `created_at`

### Project Structure

```
threat-detection-zscaler/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── db/
│   │   ├── migrations.sql       # Initial database schema
│   │   ├── add-uploaded-by-column.sql
│   │   ├── add-email-column.sql
│   │   ├── add-profile-fields.sql
│   │   └── create-search-indexes.sql
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── logs.js              # Log processing routes
│   ├── utils/
│   │   ├── logParser.js         # Zscaler log parser
│   │   └── anomalyDetection.js  # Anomaly detection rules
│   ├── scripts/
│   │   ├── init-db.js          # Database initialization
│   │   ├── generate-synthetic-data.js
│   │   └── generate-log-file.js
│   ├── uploads/
│   │   └── profiles/            # Uploaded profile pictures
│   ├── server.js                # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx   # Main layout with sidebar
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Events.jsx      # Event browser with search
│   │   │   ├── Anomalies.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── AIDocumentation.jsx
│   │   ├── components/
│   │   │   └── ThreatDetectionWidget.jsx  # Dashboard widget
│   │   ├── hooks/
│   │   │   └── useDebouncedValue.js
│   │   ├── App.jsx              # Main app with routing
│   │   └── App.css
│   └── package.json
└── README.md
```

### Troubleshooting

**Database Connection Issues:**
- Ensure PostgreSQL is running: `pg_isready`
- Verify `.env` file has correct database credentials
- Check database exists: `psql -l | grep threat_detection`

**Port Already in Use:**
- Change `PORT` in backend `.env` file
- Update frontend API calls if backend port changes

**Search Not Working:**
- Ensure search indexes are created: `npm run create-indexes` in backend
- Restart backend server after creating indexes

**Upload Fails:**
- Check file format matches expected Zscaler log format
- Ensure file is not empty
- Check backend console for parsing errors

### Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- User data is isolated (users only see their own logs)
- File uploads are validated (only `.log` and `.txt` files)
- SQL injection prevention through parameterized queries
- CORS is configured for frontend-backend communication

---

**Built for SOC analysts to efficiently analyze and detect threats in Zscaler Web Security logs.**

