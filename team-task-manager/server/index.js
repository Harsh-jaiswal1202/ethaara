require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true,
  },
});

// Set io inside app so controllers can access it.
app.set('io', io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }

    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid socket token.'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('joinProject', async (projectId) => {
    try {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: socket.user.id,
          },
        },
      });

      if (!member) {
        socket.emit('projectJoinError', { projectId, message: 'You are not a member of this project.' });
        return;
      }

      socket.join(`project:${projectId}`);
    } catch {
      socket.emit('projectJoinError', { projectId, message: 'Unable to join project updates.' });
    }
  });

  socket.on('leaveProject', (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
