const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mediasoup = require('mediasoup');
require('dotenv').config();

const app = express();
const server = createServer(app);

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true
  }
});

// MediaSoup configuration
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

const webRtcTransportOptions = {
  listenIps: [
    {
      ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  portRange: {
    min: parseInt(process.env.RTC_MIN_PORT) || 40000,
    max: parseInt(process.env.RTC_MAX_PORT) || 49999,
  },
};

// Global variables
let worker;
let router;
const rooms = new Map(); // roomId -> { participants: Map() }

// Initialize MediaSoup
async function initializeMediaSoup() {
  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: parseInt(process.env.RTC_MIN_PORT) || 40000,
    rtcMaxPort: parseInt(process.env.RTC_MAX_PORT) || 49999,
  });

  worker.on('died', () => {
    console.error('MediaSoup worker died, exiting...');
    process.exit(1);
  });

  router = await worker.createRouter({ mediaCodecs });
  console.log('MediaSoup initialized successfully');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join-room', async (data) => {
    try {
      const { roomId } = data;
      socket.roomId = roomId;
      
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { participants: new Map() });
      }
      
      const room = rooms.get(roomId);
      
      // Add participant to room
      room.participants.set(socket.id, {
        socketId: socket.id,
        producers: new Map(),
        consumers: new Map(),
        transports: new Map(),
      });
      
      socket.join(roomId);
      
      // Send router RTP capabilities
      socket.emit('room-joined', {
        rtpCapabilities: router.rtpCapabilities,
      });
      
      // Notify other participants
      socket.to(roomId).emit('participant-joined', {
        socketId: socket.id,
      });
      
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('create-transport', async (data) => {
    try {
      const { direction } = data; // 'send' or 'recv'
      
      const transport = await router.createWebRtcTransport(webRtcTransportOptions);
      
      const participant = getParticipant(socket);
      if (participant) {
        participant.transports.set(transport.id, transport);
      }
      
      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          transport.close();
        }
      });
      
      socket.emit('transport-created', {
        transportId: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
      
    } catch (error) {
      console.error('Error creating transport:', error);
      socket.emit('error', { message: 'Failed to create transport' });
    }
  });

  socket.on('connect-transport', async (data) => {
    try {
      const { transportId, dtlsParameters } = data;
      
      const participant = getParticipant(socket);
      const transport = participant?.transports.get(transportId);
      
      if (!transport) {
        throw new Error('Transport not found');
      }
      
      await transport.connect({ dtlsParameters });
      socket.emit('transport-connected');
      
    } catch (error) {
      console.error('Error connecting transport:', error);
      socket.emit('error', { message: 'Failed to connect transport' });
    }
  });

  socket.on('produce', async (data) => {
    try {
      const { transportId, kind, rtpParameters } = data;
      
      const participant = getParticipant(socket);
      const transport = participant?.transports.get(transportId);
      
      if (!transport) {
        throw new Error('Transport not found');
      }
      
      const producer = await transport.produce({
        kind,
        rtpParameters,
      });
      
      participant.producers.set(producer.id, producer);
      
      producer.on('transportclose', () => {
        participant.producers.delete(producer.id);
      });
      
      // Notify other participants about new producer
      socket.to(socket.roomId).emit('new-producer', {
        producerId: producer.id,
        socketId: socket.id,
        kind,
      });
      
      socket.emit('produced', {
        producerId: producer.id,
      });
      
    } catch (error) {
      console.error('Error producing:', error);
      socket.emit('error', { message: 'Failed to produce media' });
    }
  });

  socket.on('consume', async (data) => {
    try {
      const { transportId, producerId, rtpCapabilities } = data;
      
      const participant = getParticipant(socket);
      const transport = participant?.transports.get(transportId);
      
      if (!transport) {
        throw new Error('Transport not found');
      }
      
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Cannot consume');
      }
      
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });
      
      participant.consumers.set(consumer.id, consumer);
      
      consumer.on('transportclose', () => {
        participant.consumers.delete(consumer.id);
      });
      
      consumer.on('producerclose', () => {
        participant.consumers.delete(consumer.id);
        socket.emit('consumer-closed', { consumerId: consumer.id });
      });
      
      socket.emit('consumed', {
        consumerId: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        paused: consumer.paused,
      });
      
    } catch (error) {
      console.error('Error consuming:', error);
      socket.emit('error', { message: 'Failed to consume media' });
    }
  });

  socket.on('resume-consumer', async (data) => {
    try {
      const { consumerId } = data;
      
      const participant = getParticipant(socket);
      const consumer = participant?.consumers.get(consumerId);
      
      if (!consumer) {
        throw new Error('Consumer not found');
      }
      
      await consumer.resume();
      socket.emit('consumer-resumed', { consumerId });
      
    } catch (error) {
      console.error('Error resuming consumer:', error);
      socket.emit('error', { message: 'Failed to resume consumer' });
    }
  });

  socket.on('get-producers', () => {
    try {
      const room = rooms.get(socket.roomId);
      if (!room) return;
      
      const producers = [];
      
      for (const [socketId, participant] of room.participants) {
        if (socketId !== socket.id) {
          for (const [producerId, producer] of participant.producers) {
            producers.push({
              producerId,
              socketId,
              kind: producer.kind,
            });
          }
        }
      }
      
      socket.emit('producers-list', { producers });
      
    } catch (error) {
      console.error('Error getting producers:', error);
      socket.emit('error', { message: 'Failed to get producers' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      
      if (room) {
        const participant = room.participants.get(socket.id);
        
        if (participant) {
          // Close all transports, producers, and consumers
          for (const transport of participant.transports.values()) {
            transport.close();
          }
          
          room.participants.delete(socket.id);
          
          // Notify other participants
          socket.to(socket.roomId).emit('participant-left', {
            socketId: socket.id,
          });
        }
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomId);
        }
      }
    }
  });
});

// Helper function to get participant
function getParticipant(socket) {
  const room = rooms.get(socket.roomId);
  return room?.participants.get(socket.id);
}

// Basic health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeMediaSoup();
    
    server.listen(PORT, () => {
      console.log(`MediaSoup server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();