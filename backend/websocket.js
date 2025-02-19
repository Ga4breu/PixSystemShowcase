// websocket.js
const { Server } = require('socket.io'); 
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Middleware for authenticating sockets using JWT from cookies
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies found'));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.authToken;

    if (!token) {
      return next(new Error('Authentication error: No authToken found'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Assign user to appropriate room based on 'nivel'
    if (socket.user.nivel === 0 || socket.user.nivel === 1) {
      socket.join('admin');
    } else if (socket.user.nivel === 2) {
      socket.join(`client_${socket.user.id}`);
    }

    // Removed the 'test_status_update' event listener as it's no longer needed

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
}

module.exports = initializeWebSocket;
