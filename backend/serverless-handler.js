import serverless from 'serverless-http';
import app from './server.js';

// Export the Express app wrapped in serverless-http
// This allows Express to work with Lambda
export const handler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});

