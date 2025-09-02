import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TodaySessionsCard } from './TodaySessionsCard'
import { PendingMessagesCard } from './PendingMessagesCard'
import { QuickNotesCard } from './QuickNotesCard'
import { UtilizationChart } from './UtilizationChart'

export function TherapistDashboard() {
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
      <motion.div variants={itemVariants} className="xl:col-span-2">
        <TodaySessionsCard />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PendingMessagesCard />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuickNotesCard />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-2">
        <UtilizationChart />
      </motion.div>
    </motion.div>
  )
}
