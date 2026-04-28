// Core Express server configuration
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Pull environment variables from .env file (Secrets like DB URI, JWT keys)
dotenv.config();

// Establish connection to MongoDB Atlas
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

/**
 * Socket.io Setup
 * We're using HTTP server directly to wrap Express for real-time capabilities
 * especially for the live recipe update features.
 */
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: "*", // Using wildcard for local dev, should be locked down in production
    methods: ["GET", "POST"]
  }
});

// Storing the io instance in app settings so controllers can emit events easily
app.set('io', io);

// --- Global Middleware --- //
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Use Helmet to secure HTTP headers
app.use(helmet());

// Global Rate Limiter to prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use('/api', apiLimiter);

// Handle JSON payloads — vital for our React frontend which sends JSON exclusively
app.use(express.json());

// CORS is required since our frontend (Port 5173) and backend (Port 5000) run on different ports
app.use(cors());

// Swagger Documentation - accessible at /api-docs
// This provides an interactive UI for testing endpoints without Postman
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API Routing --- //
// We've modularized routes into separate files to keep this main file clean
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));

// Health check route to verify server status
app.get('/', (req, res) => {
  res.send('RecipeNest API is running...');
});

// Global error handler for Express
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;

// Real-time event handling via WebSockets
io.on('connection', (socket) => {
  console.log('New client handshake established:', socket.id);
  
  // Rooms allow us to broadcast updates only to users viewing a specific recipe
  socket.on('join_recipe', (recipeId) => {
    socket.join(recipeId);
    console.log(`User ${socket.id} joined room: ${recipeId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from socket server');
  });
});
