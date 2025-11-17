// Quick test to verify the route is exported correctly
import logRoutes from './routes/logs.js';
import express from 'express';

const app = express();
app.use('/logs', logRoutes);

// List all registered routes
console.log('Registered routes:');
logRoutes.stack.forEach((r) => {
  if (r.route) {
    console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
  }
});

