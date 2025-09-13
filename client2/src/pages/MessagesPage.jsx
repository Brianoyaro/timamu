import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Messages page - placeholder for messaging functionality
 */
export function MessagesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your therapists and clients
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center py-12"
      >
        <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Messaging Coming Soon</h3>
        <p className="text-muted-foreground">
          Secure messaging functionality will be available in the next update
        </p>
      </motion.div>
    </div>
  )
}
