const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const labelRoutes = require('./routes/label.routes');

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Static file serving for attachments
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/labels', labelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found', status: 404 });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || 'Internal server error',
    status,
  });
});

module.exports = app;
