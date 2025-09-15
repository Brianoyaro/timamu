/**
 * File routes
 * Handles secure file upload, download, and management
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { prisma } = require('../utils/database');
const { authenticate, authorize, requireVerified, checkResourceAccess } = require('../middleware/authMiddleware');
const { validate, uuidSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Create user-specific directory
    const userDir = path.join(uploadDir, req.user.id);
    await fs.mkdir(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Check if user can access file
 */
const canAccessFile = async (user, params) => {
  const file = await prisma.file.findUnique({
    where: { id: params.id },
    include: {
      uploader: true,
      session: {
        include: {
          patient: true,
          therapist: true
        }
      }
    }
  });

  if (!file) return false;

  // File uploader can always access
  if (file.uploaderId === user.id) return true;

  // Public files can be accessed by anyone
  if (file.isPublic) return true;

  // Session participants can access session files
  if (file.session) {
    if (file.session.patientId === user.id || file.session.therapistId === user.id) {
      return true;
    }
  }

  // Admins can access all files
  if (user.role === 'ADMIN') return true;

  return false;
};

/**
 * @route   POST /api/files/upload
 * @desc    Upload files
 * @access  Private
 */
router.post('/upload', 
  authenticate, 
  requireVerified,
  upload.array('files', 5),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const { sessionId, isPublic = false } = req.body;

    // Verify session if provided
    if (sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id }
          ]
        }
      });

      if (!session) {
        throw new AppError('Session not found or access denied', 404);
      }
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        // In production, implement actual file encryption here
        const encryptionKey = crypto.randomBytes(32).toString('hex');

        const fileRecord = await prisma.file.create({
          data: {
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
            uploaderId: req.user.id,
            sessionId: sessionId || null,
            isPublic: isPublic === 'true',
            isEncrypted: true,
            encryptionKey // In production, encrypt this key
          }
        });

        uploadedFiles.push(fileRecord);

        // Log audit event
        await createAuditLog({
          action: AUDIT_ACTIONS.FILE_UPLOAD,
          userId: req.user.id,
          userEmail: req.user.email,
          resource: 'FILE',
          resourceId: fileRecord.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'SUCCESS',
          details: {
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            sessionId
          }
        });

      } catch (error) {
        logger.error('Failed to save file record:', error);
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {});
        throw new AppError(`Failed to process file: ${file.originalname}`, 500);
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: { files: uploadedFiles }
    });
  })
);

/**
 * @route   GET /api/files
 * @desc    Get user's files
 * @access  Private
 */
router.get('/', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sessionId, mimeType } = req.query;
    const skip = (page - 1) * limit;

    let where = {
      OR: [
        { uploaderId: req.user.id },
        { isPublic: true }
      ]
    };

    // Add additional filters based on user role
    if (req.user.role === 'PATIENT') {
      // Patients can see files from their sessions
      where.OR.push({
        session: {
          patientId: req.user.id
        }
      });
    } else if (req.user.role === 'THERAPIST') {
      // Therapists can see files from their sessions
      where.OR.push({
        session: {
          therapistId: req.user.id
        }
      });
    }

    // Filter by session
    if (sessionId) {
      where.sessionId = sessionId;
    }

    // Filter by file type
    if (mimeType) {
      where.mimeType = { contains: mimeType };
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          session: {
            select: {
              id: true,
              scheduledAt: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.file.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/files/:id
 * @desc    Get file metadata
 * @access  Private
 */
router.get('/:id', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessFile),
  asyncHandler(async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            status: true
          }
        }
      }
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    res.json({
      success: true,
      data: { file }
    });
  })
);

/**
 * @route   GET /api/files/:id/download
 * @desc    Download file
 * @access  Private
 */
router.get('/:id/download', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessFile),
  asyncHandler(async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Check if file exists on disk
    try {
      await fs.access(file.filePath);
    } catch (error) {
      throw new AppError('File not available', 404);
    }

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.FILE_DOWNLOAD,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'FILE',
      resourceId: file.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { fileName: file.originalName }
    });

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);

    // In production, implement decryption here if file is encrypted
    res.sendFile(path.resolve(file.filePath));
  })
);

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete file
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  asyncHandler(async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Only file uploader or admin can delete
    if (file.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: req.params.id }
    });

    // Delete file from disk
    try {
      await fs.unlink(file.filePath);
    } catch (error) {
      logger.error('Failed to delete file from disk:', error);
      // Don't fail the request if file deletion from disk fails
    }

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.FILE_DELETE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'FILE',
      resourceId: file.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { fileName: file.originalName }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  })
);

/**
 * @route   GET /api/files/stats
 * @desc    Get file statistics
 * @access  Private
 */
router.get('/stats', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    let where = { uploaderId: req.user.id };

    // For therapists, include files from their sessions
    if (req.user.role === 'THERAPIST') {
      where = {
        OR: [
          { uploaderId: req.user.id },
          {
            session: {
              therapistId: req.user.id
            }
          }
        ]
      };
    }

    const [
      totalFiles,
      totalSize,
      fileTypes,
      recentFiles
    ] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.aggregate({
        where,
        _sum: { size: true }
      }),
      prisma.file.groupBy({
        by: ['mimeType'],
        where,
        _count: { mimeType: true },
        orderBy: { _count: { mimeType: 'desc' } }
      }),
      prisma.file.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalFiles,
        totalSize: totalSize._sum.size || 0,
        fileTypes: fileTypes.map(type => ({
          mimeType: type.mimeType,
          count: type._count.mimeType
        })),
        recentFiles
      }
    });
  })
);

/**
 * Error handling middleware for multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
  }
  
  if (error.message === 'File type not allowed') {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed'
    });
  }
  
  next(error);
});

module.exports = router;
