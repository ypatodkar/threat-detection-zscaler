import serverless from 'serverless-http';
import app from './server.js';

// Export the Express app wrapped in serverless-http
// This allows Express to work with Lambda
const serverlessHandler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});

// Wrap handler to ensure CORS headers are always present
export const handler = async (event, context) => {
  try {
    // Call the serverless handler
    const response = await serverlessHandler(event, context);
    
    // Get existing headers from Express response
    const headers = response.headers || {};
    
    // Check if CORS headers already exist (in any case)
    const hasOrigin = Object.keys(headers).some(key => 
      key.toLowerCase() === 'access-control-allow-origin'
    );
    const hasMethods = Object.keys(headers).some(key => 
      key.toLowerCase() === 'access-control-allow-methods'
    );
    const hasHeaders = Object.keys(headers).some(key => 
      key.toLowerCase() === 'access-control-allow-headers'
    );
    const hasMaxAge = Object.keys(headers).some(key => 
      key.toLowerCase() === 'access-control-max-age'
    );
    
    // Only add CORS headers if they don't already exist
    // Express CORS middleware should have already set them
    if (!hasOrigin) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    if (!hasMethods) {
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    }
    if (!hasHeaders) {
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-id, X-Requested-With, Accept, Origin';
    }
    if (!hasMaxAge) {
      headers['Access-Control-Max-Age'] = '86400';
    }
    
    return {
      ...response,
      headers
    };
  } catch (error) {
    // Error handling with CORS headers
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, X-Requested-With, Accept, Origin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

