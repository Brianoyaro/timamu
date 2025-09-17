/**
 * Validation middleware using Joi
 * Provides request validation for all API endpoints
 */

const Joi = require('joi');
const { formatValidationError } = require('./errorMiddleware');

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = formatValidationError(error);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Common validation schemas

/**
 * Email validation
 */
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

/**
 * Password validation
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  });

/**
 * UUID validation
 */
const uuidSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.uuid': 'Invalid ID format',
    'any.required': 'ID is required'
  });

/**
 * UUID params validation (for route parameters)
 */
const uuidParamsSchema = Joi.object({
  id: uuidSchema
});

/**
 * UUID params validation for recipientId parameter
 */
const recipientIdParamsSchema = Joi.object({
  recipientId: uuidSchema
});

/**
 * Name validation
 */
const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s-']+$/)
  .trim()
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
    'any.required': 'Name is required'
  });

/**
 * Phone validation
 */
const phoneSchema = Joi.string()
  .pattern(/^\+?[\d\s-()]+$/)
  .min(10)
  .max(20)
  .optional()
  .messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.min': 'Phone number must be at least 10 digits',
    'string.max': 'Phone number must not exceed 20 characters'
  });

/**
 * Date validation
 */
const dateSchema = Joi.date()
  .iso()
  .max('now')
  .optional()
  .messages({
    'date.max': 'Date cannot be in the future',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
  });

// Auth validation schemas

const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: Joi.string().valid('PATIENT', 'THERAPIST').default('PATIENT'),
  phone: phoneSchema,
  dateOfBirth: dateSchema,
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional(),
  
  // Therapist-specific fields
  licenseNumber: Joi.when('role', {
    is: 'THERAPIST',
    then: Joi.string().required().messages({
      'any.required': 'License number is required for therapists'
    }),
    otherwise: Joi.forbidden()
  }),
  specializations: Joi.when('role', {
    is: 'THERAPIST',
    then: Joi.array().items(Joi.string()).min(1).required().messages({
      'array.min': 'At least one specialization is required for therapists',
      'any.required': 'Specializations are required for therapists'
    }),
    otherwise: Joi.forbidden()
  }),
  experience: Joi.when('role', {
    is: 'THERAPIST',
    then: Joi.number().integer().min(0).max(50).required().messages({
      'any.required': 'Years of experience is required for therapists'
    }),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: emailSchema
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: passwordSchema
});

// Profile validation schemas

const updateProfileSchema = Joi.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  dateOfBirth: dateSchema,
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional(),
  avatar: Joi.string().uri().optional(),
  
  // Patient-specific fields
  medicalHistory: Joi.string().max(2000).optional(),
  emergencyContact: Joi.string().max(200).optional(),
  insuranceInfo: Joi.string().max(500).optional(),
  
  // Therapist-specific fields
  specializations: Joi.array().items(Joi.string()).optional(),
  experience: Joi.number().integer().min(0).max(50).optional(),
  education: Joi.string().max(1000).optional(),
  biography: Joi.string().max(2000).optional(),
  hourlyRate: Joi.number().positive().precision(2).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: passwordSchema
});

// Session validation schemas

const createSessionSchema = Joi.object({
  therapistId: uuidSchema,
  scheduledAt: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Session must be scheduled for a future date and time',
    'any.required': 'Scheduled date and time is required'
  }),
  sessionType: Joi.string().valid('VIDEO', 'AUDIO_ONLY', 'CHAT_ONLY').default('VIDEO'),
  notes: Joi.string().max(500).optional()
});

const updateSessionSchema = Joi.object({
  scheduledAt: Joi.date().iso().greater('now').optional(),
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW').optional(),
  notes: Joi.string().max(500).optional()
});

// Message validation schemas

const sendMessageSchema = Joi.object({
  receiverId: uuidSchema,
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message must not exceed 2000 characters',
    'any.required': 'Message content is required'
  }),
  messageType: Joi.string().valid('TEXT', 'FILE', 'IMAGE').default('TEXT'),
  sessionId: Joi.string().uuid().optional()
});

// Pagination validation

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  validate,
  
  // Schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
  paginationSchema,
  
  // Common schemas
  uuidSchema,
  uuidParamsSchema,
  recipientIdParamsSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  dateSchema
};
