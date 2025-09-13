import React from 'react'
import { Outlet } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Authentication layout for login, register, and password reset pages
 * Provides a centered card layout with branding
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Timamu</h1>
          <p className="text-muted-foreground">
            Professional Mental Health Platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Outlet />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>&copy; 2025 Timamu. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
