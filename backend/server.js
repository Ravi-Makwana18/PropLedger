const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to database
connectDB();

const app = express();
app.use(cookieParser());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - Allow production domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

// Add your production domain when you deploy
if (process.env.NODE_ENV === 'production') {
  // Automatically allow your Vercel deployment
  allowedOrigins.push('https://destination-dholera.vercel.app');
  // Add custom domains if you have them
  allowedOrigins.push('https://destinationdholera.com');
  allowedOrigins.push('https://www.destinationdholera.com');
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // For now, allow all. Change to false in production if needed.
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
// Disable cache for auth endpoints
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, require('./routes/authRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/enquiry', require('./routes/enquiryRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API is running...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Destination Dholera API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      deals: '/api/deals',
      payments: '/api/payments'
    }
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`
========================================
🚀 Server Status: RUNNING
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}
⏰ Started: ${new Date().toLocaleString('en-IN')}
========================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
