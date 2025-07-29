require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const http = require('http'); // Import http module
const { Server } = require('socket.io'); // Import Server from socket.io

// Import routes
const authRoutes = require('./routes/authRouter');
const userRoutes = require('./routes/userRouter');
const roomRoutes = require('./routes/roomRouter');
const roomOwnerRoutes = require('./routes/roomOwnerRouter');
const partyRoutes = require('./routes/partyRouter');
const messageRoutes = require('./routes/privateMessageRouter');
const paymentRoutes = require('./routes/paymentRouter');
const roomChatRoutes = require('./routes/roomChatRouter');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Allow requests from your frontend
    methods: ["GET", "POST"],
    credentials: true // Allow cookies/headers to be sent
  }
});

// Passport config (ensure this is called before routes if needed for session serialization)
require('./config/passport')(passport);

// CORS setup for Express routes
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Express session middleware (REQUIRED for Passport.js session)
app.use(session({
  secret: process.env.SESSION_SECRET, // Should be a strong, random string
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day, adjust as needed
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body Parsers
// For Stripe webhooks, you might need raw body parser before express.json() for that specific route
// Example for Stripe webhook:
// app.post('/stripe-webhook', express.raw({type: 'application/json'}), handleStripeWebhook);
app.use(express.json()); // For parsing application/json

// Middleware to attach io instance to req object for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/landlord', roomOwnerRoutes);
app.use('/api/party', partyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/room-chat', roomChatRoutes);

// Centralized error handler (should be after all routes)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Socket.IO: User connected: ${socket.id}`);

  // Event to join a specific room chat
  socket.on('joinRoomChat', (roomId) => {
    socket.join(roomId);
    console.log(`Socket.IO: User ${socket.id} joined room chat: ${roomId}`);
  });

  // Event to leave a specific room chat
  socket.on('leaveRoomChat', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket.IO: User ${socket.id} left room chat: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket.IO: User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    // Start the HTTP server (which serves both Express and Socket.IO)
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));