/**
 * JWT utility functions for authentication
 * Handles token generation, verification, and refresh logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('./database');
const logger = require('./logger');

/**
 * Generate access token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
    issuer: 'telepsychology-platform',
    audience: 'telepsychology-users'
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'telepsychology-platform',
    audience: 'telepsychology-users'
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens
 */
const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    logger.debug('🔐 JWT: Attempting to verify access token...');
    logger.debug('JWT: Token length:', token ? token.length : 0);
    logger.debug('JWT: JWT_SECRET present:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'telepsychology-platform',
      audience: 'telepsychology-users'
    });
    
    logger.debug('✅ JWT: Token verified successfully', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    return decoded;
  } catch (error) {
    logger.error('❌ JWT: Access token verification failed', {
      error: error.message,
      name: error.name,
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
      secretPresent: !!process.env.JWT_SECRET
    });
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'telepsychology-platform',
      audience: 'telepsychology-users'
    });

    // Check if token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    return { decoded, user: storedToken.user };
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Revoke refresh token
 * @param {string} token - Token to revoke
 * @returns {Promise<void>}
 */
const revokeRefreshToken = async (token) => {
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true }
    });
  } catch (error) {
    logger.error('Failed to revoke refresh token:', error.message);
    throw new Error('Failed to revoke token');
  }
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const revokeAllUserTokens = async (userId) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });
  } catch (error) {
    logger.error('Failed to revoke all user tokens:', error.message);
    throw new Error('Failed to revoke user tokens');
  }
};

/**
 * Clean up expired tokens (should be run periodically)
 * @returns {Promise<number>} Number of tokens cleaned up
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    });
    
    logger.info(`Cleaned up ${result.count} expired/revoked tokens`);
    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens:', error.message);
    throw new Error('Failed to cleanup tokens');
  }
};

/**
 * Generate secure random token for email verification, password reset, etc.
 * @param {number} length - Token length (default: 32)
 * @returns {string} Random hex token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  generateSecureToken
};
