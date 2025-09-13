import React from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center py-12"
      >
        <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">User Management Coming Soon</h3>
        <p className="text-muted-foreground">
          User management tools will be available in the next update
        </p>
      </motion.div>
    </div>
  )
}
