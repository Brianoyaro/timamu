/**
 * Error handling middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');

/**
 * Error response structure
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle 404 Not Found errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Validation errors
  if (err.name === 'ValidationError' && err.details) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new AppError(message, 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      return new AppError(`${field} already exists`, 400);
    
    case 'P2025':
      // Record not found
      return new AppError('Resource not found', 404);
    
    case 'P2003':
      // Foreign key constraint violation
      return new AppError('Cannot delete record due to related data', 400);
    
    case 'P2011':
      // Null constraint violation
      const nullField = err.meta?.constraint || 'field';
      return new AppError(`${nullField} is required`, 400);
    
    case 'P2012':
      // Missing required value
      return new AppError('Missing required field', 400);
    
    case 'P2014':
      // Relation violation
      return new AppError('Invalid relation', 400);
    
    default:
      return new AppError('Database error', 500);
  }
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error formatter
 */
const formatValidationError = (error) => {
  if (error.details) {
    return error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }
  return [{ message: error.message }];
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  formatValidationError
};
