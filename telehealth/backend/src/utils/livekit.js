import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

/**
 * Generate LiveKit access token
 * @param {string} roomName - Name of the room
 * @param {string} participantName - Name of the participant
 * @param {string} participantId - Unique ID of the participant
 * @returns {Promise<string>} Access token
 */
export const generateLiveKitToken = async (roomName, participantName, participantId) => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }

  console.log('🔧 Generating LiveKit token with:', {
    roomName,
    participantName,
    participantId,
    apiKey: LIVEKIT_API_KEY,
    secretLength: LIVEKIT_API_SECRET?.length
  });

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantId,
    name: participantName,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  
  console.log('🎫 Generated token:', {
    type: typeof token,
    tokenLength: token?.length,
    tokenPreview: token?.substring(0, 50) + '...',
    isString: typeof token === 'string'
  });

  return token;
};

/**
 * Generate unique room name for booking
 * @param {string} bookingId - Booking ID
 * @returns {string} Room name
 */
export const generateRoomName = (bookingId) => {
  return `session-${bookingId}`;
};
