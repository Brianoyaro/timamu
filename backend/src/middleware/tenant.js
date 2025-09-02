export const requireTenant = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id']
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID required in x-tenant-id header'
    })
  }

  req.tenantId = tenantId
  next()
}

export const optionalTenant = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id']
  
  if (tenantId) {
    req.tenantId = tenantId
  }
  
  next()
}

export const validateTenantAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.tenantId) {
      return next()
    }

    // Check if user belongs to the tenant or is an admin
    if (req.user.tenantId !== req.tenantId && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this tenant'
      })
    }

    next()
  } catch (error) {
    console.error('Tenant validation error:', error)
    res.status(500).json({
      success: false,
      error: 'Tenant validation failed'
    })
  }
}
