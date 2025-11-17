import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import logRoutes from './routes/logs.js';
import accessLogRoutes from './routes/accessLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Export app for serverless handler
export default app;

// Only start server if not in Lambda environment
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

