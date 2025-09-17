/**
 * Authentication middleware
 * Handles JWT verification and user authentication
 */

const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    logger.info(`🔐 Authentication attempt for ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    
    logger.debug('Auth header present:', !!authHeader);
    logger.debug('Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('❌ Authentication failed: No valid authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    logger.debug('Token extracted, length:', token ? token.length : 0);
    
    // Verify token
    logger.debug('🔍 Verifying access token...');
    const decoded = verifyAccessToken(token);
    logger.info('✅ Token verified successfully for user ID:', decoded.id);
    logger.info('✅ Token verified successfully for user ID:', decoded.id);
    
    // Get fresh user data from database
    logger.debug('🔍 Fetching user data from database...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true,
        therapistProfile: true,
        adminProfile: true
      }
    });

    logger.debug('User found:', !!user);
    if (user) {
      logger.debug('User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      });
    }

    if (!user || !user.isActive) {
      logger.warn('❌ Authentication failed: User not found or inactive', {
        userExists: !!user,
        isActive: user?.isActive
      });
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Add user to request object
    req.user = user;
    logger.info('✅ Authentication successful for user:', user.email);
    logger.info('✅ Authentication successful for user:', user.email);
    next();
    
  } catch (error) {
    logger.error('❌ Authentication error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      endpoint: `${req.method} ${req.path}`,
      authHeader: req.headers.authorization ? 'present' : 'missing'
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true,
        therapistProfile: true,
        adminProfile: true
      }
    });

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // Silently continue without user if token is invalid
    next();
  }
};

/**
 * Ensure user is verified (email verified)
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }

  next();
};

/**
 * Ensure therapist is approved (for therapist-specific routes)
 */
const requireApprovedTherapist = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'THERAPIST') {
    return res.status(403).json({
      success: false,
      message: 'Therapist access required'
    });
  }

  if (!req.user.therapistProfile || !req.user.therapistProfile.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Therapist approval required'
    });
  }

  next();
};

/**
 * Check if user can access specific resource
 * @param {Function} resourceChecker - Function to check resource access
 */
const checkResourceAccess = (resourceChecker) => {
  return async (req, res, next) => {
    try {
      const hasAccess = await resourceChecker(req.user, req.params, req.body);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Resource access check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource access'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireVerified,
  requireApprovedTherapist,
  checkResourceAccess
};
