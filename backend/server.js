import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import logRoutes from './routes/logs.js';
import accessLogRoutes from './routes/accessLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - Allow all origins and necessary headers
const corsOptions = {
  origin: '*', // Allow all origins (you can restrict this in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: false, // Set to false when origin is '*'
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// CORS middleware - must be before other middleware
app.use(cors(corsOptions));

// Add CORS headers to ALL responses (not just preflight)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

// Explicit OPTIONS handler for all routes (before other routes)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: File storage is disabled - files are processed in memory only

// Routes
app.use('/auth', authRoutes);
app.use('/logs', logRoutes);
app.use('/access-logs', accessLogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export app for serverless handler (if needed)
export default app;

// Start server (for local development)
// Lambda will not execute this (uses serverless-handler.js)
// Only start if not in serverless environment
if (process.env.VERCEL === undefined && process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  const serverPort = process.env.PORT || PORT;
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`Server running on port ${serverPort}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}


