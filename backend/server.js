const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // Replace with your frontend URL in production
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data.offer, data.sender);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data.answer, data.sender);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data.candidate, data.sender);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

