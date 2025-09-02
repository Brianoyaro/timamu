import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export function UtilizationChart() {
  const { t } = useTranslation()

  // Mock utilization data - replace with real API call
  const weeklyData = [
    { day: 'Mon', sessions: 6, hours: 6 },
    { day: 'Tue', sessions: 8, hours: 7.5 },
    { day: 'Wed', sessions: 5, hours: 5 },
    { day: 'Thu', sessions: 7, hours: 6.5 },
    { day: 'Fri', sessions: 6, hours: 6 },
    { day: 'Sat', sessions: 3, hours: 3 },
    { day: 'Sun', sessions: 0, hours: 0 }
  ]

  const totalSessions = weeklyData.reduce((sum, day) => sum + day.sessions, 0)
  const totalHours = weeklyData.reduce((sum, day) => sum + day.hours, 0)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Weekly Utilization
        </h2>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Sessions</p>
            <p className="font-semibold text-gray-900 dark:text-white">{totalSessions}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Hours</p>
            <p className="font-semibold text-gray-900 dark:text-white">{totalHours}</p>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Bar 
              dataKey="sessions" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
