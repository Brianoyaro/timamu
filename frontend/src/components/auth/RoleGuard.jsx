import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ForbiddenPage } from '../../pages/ForbiddenPage'

export function RoleGuard({ allowedRoles, children }) {
  const { hasAnyRole } = useAuthStore()

  if (!hasAnyRole(allowedRoles)) {
    return <ForbiddenPage />
  }

  return children || <Outlet />
}
