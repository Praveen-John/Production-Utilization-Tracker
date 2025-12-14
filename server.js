require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const tsNode = require('ts-node');

// Register TypeScript compiler
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    target: 'es2020',
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  },
});

// Import API routes (TypeScript files)
const loginRoute = require('./api/login.ts').default;
const usersRoute = require('./api/users.ts').default;
const recordsRoute = require('./api/records.ts').default;
const dataRoute = require('./api/data.ts').default;

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/login', loginRoute);
app.use('/api/users', usersRoute);
app.use('/api/records', recordsRoute);
app.use('/api/data', dataRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For development, serve static files from frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - commented out for now
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});