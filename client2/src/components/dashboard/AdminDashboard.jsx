import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TenantOverviewCard } from './TenantOverviewCard'
import { SystemHealthCard } from './SystemHealthCard'
import { UserStatsCard } from './UserStatsCard'
import { RecentActivityCard } from './RecentActivityCard'

export function AdminDashboard() {
  const { t } = useTranslation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <motion.div variants={itemVariants}>
        <TenantOverviewCard />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SystemHealthCard />
      </motion.div>

      <motion.div variants={itemVariants}>
        <UserStatsCard />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-3">
        <RecentActivityCard />
      </motion.div>
    </motion.div>
  )
}
