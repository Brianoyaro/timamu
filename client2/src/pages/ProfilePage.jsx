import React from 'react'
import { motion } from 'framer-motion'
import { User, Edit, Camera } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

/**
 * Profile page - placeholder for user profile management
 */
export function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Change Photo
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-muted-foreground">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{user?.email || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <p className="text-muted-foreground capitalize">{user?.role || 'Not set'}</p>
              </div>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Information
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center py-8"
      >
        <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Full profile management features coming soon
        </p>
      </motion.div>
    </div>
  )
}
