/**
 * Middleware to check if user has required role(s)
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is patient
 */
export const isPatient = roleMiddleware('PATIENT');

/**
 * Middleware to check if user is therapist
 */
export const isTherapist = roleMiddleware('THERAPIST');

/**
 * Middleware to check if user is admin
 */
export const isAdmin = roleMiddleware('ADMIN');

/**
 * Middleware to check if user is therapist or admin
 */
export const isTherapistOrAdmin = roleMiddleware('THERAPIST', 'ADMIN');
