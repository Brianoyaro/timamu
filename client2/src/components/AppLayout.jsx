import React from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { useState } from 'react'

/**
 * Main application layout with sidebar navigation
 * Provides consistent layout structure and navigation for authenticated users
 */
export function AppLayout() {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user, logout, hasRole } = useAuthStore()
  const { currentTenant } = useTenantStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    logout()
    navigate('/auth/signin')
  }

  /**
   * Navigation items based on user role
   */
  const getNavigationItems = () => {
    const baseItems = [
      {
        label: 'Dashboard',
        icon: Calendar,
        path: `/t/${tenantId}`,
        roles: ['patient', 'therapist', 'admin'],
      },
    ]

    // Patient-specific navigation
    if (hasRole('patient')) {
      baseItems.push(
        {
          label: 'Find Therapists',
          icon: Users,
          path: `/t/${tenantId}/therapists`,
          roles: ['patient'],
        },
        {
          label: 'My Appointments',
          icon: Calendar,
          path: `/t/${tenantId}/appointments`,
          roles: ['patient'],
        },
        {
          label: 'Messages',
          icon: MessageCircle,
          path: `/t/${tenantId}/messages`,
          roles: ['patient'],
        }
      )
    }

    // Therapist-specific navigation
    if (hasRole('therapist')) {
      baseItems.push(
        {
          label: 'My Schedule',
          icon: Calendar,
          path: `/t/${tenantId}/schedule`,
          roles: ['therapist'],
        },
        {
          label: 'My Patients',
          icon: Users,
          path: `/t/${tenantId}/patients`,
          roles: ['therapist'],
        },
        {
          label: 'Messages',
          icon: MessageCircle,
          path: `/t/${tenantId}/messages`,
          roles: ['therapist'],
        }
      )
    }

    // Admin-specific navigation
    if (hasRole('admin')) {
      baseItems.push(
        {
          label: 'User Management',
          icon: Users,
          path: `/t/${tenantId}/admin/users`,
          roles: ['admin'],
        },
        {
          label: 'System Settings',
          icon: Settings,
          path: `/t/${tenantId}/admin/settings`,
          roles: ['admin'],
        }
      )
    }

    return baseItems.filter(item => 
      item.roles.some(role => hasRole(role))
    )
  }

  const navigationItems = getNavigationItems()

  /**
   * Sidebar component
   */
  const Sidebar = ({ className }) => (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Tenant Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary">
          {currentTenant?.name || 'Timamu'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Mental Health Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              navigate(item.path)
              setSidebarOpen(false)
            }}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate(`/t/${tenantId}/profile`)}
          >
            <User className="mr-2 h-3 w-3" />
            Profile
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate(`/t/${tenantId}/settings`)}
          >
            <Settings className="mr-2 h-3 w-3" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-3 w-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">
            {currentTenant?.name || 'Timamu'}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex h-screen lg:h-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 p-4">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 h-full bg-background p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Sidebar />
            </motion.div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:max-h-screen lg:overflow-auto">
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
