import serverless from 'serverless-http';
import app from './server.js';

// Export the Express app wrapped in serverless-http
// This allows Express to work with Lambda
const serverlessHandler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});

// Wrap handler to ensure CORS headers are always present
export const handler = async (event, context) => {
  // Call the serverless handler
  const response = await serverlessHandler(event, context);
  
  // Ensure CORS headers are present for all responses
  const headers = response.headers || {};
  
  // Add CORS headers if not already present
  if (!headers['Access-Control-Allow-Origin']) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  if (!headers['Access-Control-Allow-Methods']) {
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  }
  if (!headers['Access-Control-Allow-Headers']) {
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-id, X-Requested-With, Accept, Origin';
  }
  if (!headers['Access-Control-Max-Age']) {
    headers['Access-Control-Max-Age'] = '86400';
  }
  
  return {
    ...response,
    headers
  };
};

