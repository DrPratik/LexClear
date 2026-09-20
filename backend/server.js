require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const hpp = require('hpp');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Efficiency: Gzip compress all responses
app.use(compression());

// Security: Helmet for HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use('/api', limiter); // Apply to API routes

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Parse JSON payloads with a strict size limit
app.use(express.json({ limit: '2mb' }));

// Security: HTTP Parameter Pollution protection
app.use(hpp());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRoutes);

// Efficiency: Serve static frontend files in production with Cache-Control
app.use(express.static(path.join(__dirname, '../frontend/dist'), { 
  maxAge: '1y',
  etag: true
}));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err.message);
  res.status(500).json({ error: "An internal server error occurred. Please try again later." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}

module.exports = app;
