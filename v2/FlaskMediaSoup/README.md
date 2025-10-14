# MediaSoup Server

This is the MediaSoup WebRTC SFU (Selective Forwarding Unit) server for the Timamu application. It handles real-time video calling, audio communication, and data channels for chat messages.

## Features

- WebRTC video and audio streaming
- Data channels for real-time messaging
- Multi-participant video calls
- SCTP support for reliable data transmission
- Configurable CORS origins
- Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd FlaskMediaSoup
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```bash
   # MediaSoup Configuration
   NODE_ENV=development
   PORT=3001
   MEDIASOUP_LISTEN_IP=0.0.0.0
   MEDIASOUP_ANNOUNCED_IP=127.0.0.1
   RTC_MIN_PORT=40000
   RTC_MAX_PORT=49999

   # CORS Configuration (comma-separated list)
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. Run the server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `MEDIASOUP_LISTEN_IP` | IP address to listen on | `0.0.0.0` |
| `MEDIASOUP_ANNOUNCED_IP` | Public IP for WebRTC | `127.0.0.1` |
| `RTC_MIN_PORT` | Minimum RTC port range | `40000` |
| `RTC_MAX_PORT` | Maximum RTC port range | `49999` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://localhost:5173` |

## Deployment Configuration

### Development
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
```

### Production
```bash
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
MEDIASOUP_ANNOUNCED_IP=your.public.ip.address
```

### Docker
```bash
CORS_ORIGINS=http://frontend-service:3000
MEDIASOUP_ANNOUNCED_IP=mediasoup-service
```

## API Endpoints

- `GET /health` - Health check endpoint

## Technology Stack

- MediaSoup (WebRTC SFU)
- Socket.IO (Real-time communication)
- Express.js (HTTP server)
- Node.js

## Architecture

The server creates MediaSoup workers and routers to handle WebRTC connections. Each room maintains:
- Participants map with their transports, producers, and consumers
- Data producers/consumers for chat messages
- SCTP-enabled transports for reliable data channels

## Troubleshooting

1. **Port conflicts**: Make sure ports 3001 and 40000-49999 are available
2. **CORS errors**: Add your frontend URL to `CORS_ORIGINS`
3. **Connection issues**: Check `MEDIASOUP_ANNOUNCED_IP` matches your server's public IP
4. **Firewall**: Ensure RTC port range is open in your firewall