# Backend Server Not Running - ERR_CONNECTION_REFUSED

## Error Explanation

`ERR_CONNECTION_REFUSED` means:
- The frontend is trying to connect to `http://localhost:3001`
- But there's **no server running** on port 3001
- The connection is being refused because nothing is listening on that port

## Solution: Start the Backend Server

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Make Sure .env File Exists

Create a `.env` file in the `backend/` directory with:

```env
DB_HOST=your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com
DB_NAME=threat_detection
DB_USER=postgres
DB_PASSWORD=your-password
DB_PORT=5432
JWT_SECRET=your-random-secret-key
PORT=3001
```

### Step 4: Start the Server

**Option A: Production Mode**
```bash
npm start
```

**Option B: Development Mode (with auto-reload)**
```bash
npm run dev
```

### Step 5: Verify Server is Running

You should see:
```
Server running on port 3001
```

### Step 6: Test the Connection

Open a new terminal and test:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok"}`

## Common Issues

### Issue 1: Port Already in Use
If you get "port 3001 already in use":
```bash
# Find what's using the port
lsof -ti:3001

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

### Issue 2: Database Connection Error
- Check your `.env` file has correct database credentials
- Verify RDS security group allows your IP
- Check database is accessible

### Issue 3: Missing Dependencies
```bash
cd backend
npm install
```

## Quick Start Command

```bash
cd backend && npm start
```

Keep this terminal open - the server needs to keep running!

