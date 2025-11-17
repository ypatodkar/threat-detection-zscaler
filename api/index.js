// Vercel serverless function wrapper for Express app
import app from '../backend/server.js';

// Vercel expects a handler function
// Export the Express app - Vercel's @vercel/node will handle it
export default app;

