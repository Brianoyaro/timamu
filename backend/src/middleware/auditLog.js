import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to capture response
      const originalJson = res.json
      
      res.json = function(data) {
        // Only log successful operations
        if (data.success !== false && req.user && req.tenantId) {
          // Log asynchronously to avoid blocking response
          setImmediate(async () => {
            try {
              await prisma.auditLog.create({
                data: {
                  action,
                  details: `${req.method} ${req.originalUrl}`,
                  ipAddress: req.ip || req.connection.remoteAddress,
                  userAgent: req.get('User-Agent'),
                  tenantId: req.tenantId,
                  userId: req.user.id
                }
              })
            } catch (auditError) {
              console.error('Audit log error:', auditError)
            }
          })
        }
        
        return originalJson.call(this, data)
      }
      
      next()
    } catch (error) {
      next()
    }
  }
}
