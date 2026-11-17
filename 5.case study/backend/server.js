const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic CORS configuration (Handles Vercel frontend, local dev, and Render backend)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5500', // Live Server
  'https://sms-frontend.vercel.app',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for academic presentation
      }
    },
    credentials: true,
  })
);

// MongoDB Atlas Connection (with safe in-memory fallback)
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then((conn) => {
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    })
    .catch((err) => {
      console.warn(`[Database] MongoDB Atlas connection warning: ${err.message}`);
      console.log(`[Database] Running in In-Memory Demo Mode for Student records.`);
    });
} else {
  console.log(`[Database] No MONGO_URI specified in .env. Running in In-Memory Demo Mode.`);
}

// REST API Routes
const studentRoutes = require('./routes/studentRoutes');
const dnsRoutes = require('./routes/dnsRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/dns', dnsRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: mongoose.connection.readyState === 1 ? 'Connected (MongoDB Atlas)' : 'In-Memory Store',
    platform: 'Render / Express Node.js Web Service',
  });
});

// Serve frontend static files from "../frontend"
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// SPA Fallback for client-side routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Student Management Backend API is LIVE!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Architecture: Backend (Render) & Frontend (Vercel)`);
  console.log(`=======================================================`);
});
