const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: "*", // Adjust this for production to match your frontend URL
    methods: ["GET", "POST"]
  }
});

// Attach io to app so it's accessible in controllers
app.set('io', io);

// --- Middleware Setup --- //
// Parse incoming JSON request bodies
app.use(express.json());
// Enable cross-origin resource sharing for frontend communication
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));

// Basic Route
app.get('/', (req, res) => {
  res.send('RecipeNest API is running...');
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  
  socket.on('join_recipe', (recipeId) => {
    socket.join(recipeId);
    console.log(`User ${socket.id} joined room: ${recipeId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
