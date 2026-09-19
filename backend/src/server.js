const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const voucherRoutes = require('./routes/vouchers');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (runs on EVERY request before reaching routes)
app.use(cors());                              // Allow frontend to call API
app.use(express.json());                      // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// Serve uploaded files (receipts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Greenfield EMS Backend',
    timestamp: new Date().toISOString()
  });
});

// Routes (the switchboard)
app.use('/api/auth', authRoutes);           // /api/auth/login, /api/auth/register
app.use('/api/projects', projectRoutes);     // /api/projects, /api/projects/:id
app.use('/api/vouchers', voucherRoutes);     // /api/vouchers, /api/vouchers/:id/approve

// 404 handler (no route matched)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Greenfield EMS Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
