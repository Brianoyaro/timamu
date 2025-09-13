import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Calendar,
  MessageCircle,
  BookOpen,
  Users,
  Search,
  Star,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { userService } from '../../services/userService'
import { useAuthStore } from '../../store/authStore'
import { LoadingSkeleton } from '../common/LoadingSkeleton'

export function QuickActionsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { hasRole } = useAuthStore()
  const [featuredTherapists, setFeaturedTherapists] = useState([])
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false)
  const [expandedTherapists, setExpandedTherapists] = useState(false)
  const [therapistStats, setTherapistStats] = useState({ total: 0, available: 0 })

  // Load featured therapists for patients
  useEffect(() => {
    if (hasRole('patient')) {
      loadFeaturedTherapists()
      loadTherapistStats()
    }
  }, [hasRole])

  const loadTherapistStats = async () => {
    try {
      const [allTherapists, availableTherapists] = await Promise.all([
        userService.getTherapists(),
        userService.getTherapists({ available: true })
      ])
      setTherapistStats({
        total: allTherapists.length,
        available: availableTherapists.length
      })
    } catch (error) {
      console.error('Failed to load therapist stats:', error)
    }
  }

  const loadFeaturedTherapists = async () => {
    try {
      setIsLoadingTherapists(true)
      const therapists = await userService.getTherapists({ limit: 6 })
      // Filter out any undefined/null therapists and sort by rating
      const validTherapists = therapists.filter(t => t && t.id && t.name)
      const featured = validTherapists
        .filter(t => t.rating >= 4.0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3)
      setFeaturedTherapists(featured)
    } catch (error) {
      console.error('Failed to load featured therapists:', error)
      setFeaturedTherapists([]) // Set empty array on error
    } finally {
      setIsLoadingTherapists(false)
    }
  }

  const quickActions = [
    {
      name: 'Schedule',
      icon: Calendar,
      path: '/schedule',
      color: 'primary'
    },
    {
      name: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      color: 'therapeutic'
    },
    {
      name: 'Resources',
      icon: BookOpen,
      path: '/resources',
      color: 'primary'
    }
  ]

  // Add therapists action only for non-patients or show enhanced version for patients
  if (!hasRole('patient')) {
    quickActions.push({
      name: 'Therapists',
      icon: Users,
      path: '/therapists',
      color: 'therapeutic'
    })
  }

  const handleAction = (action) => {
    if (action.path) {
      navigate(`/t/${tenantId}${action.path}`)
    }
  }

  const handleTherapistClick = (therapistId) => {
    navigate(`/t/${tenantId}/therapists/${therapistId}`)
  }

  const handleFindTherapists = () => {
    navigate(`/t/${tenantId}/therapists`)
  }

  return (
    <div className="space-y-6">
      {/* Regular Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.quickActions')}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={() => handleAction(action)}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <action.icon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mx-auto" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {action.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Therapists Section for Patients */}
      {hasRole('patient') && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-therapeutic-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Find Therapists
              </h2>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {therapistStats.total} total
              </p>
              {therapistStats.available > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {therapistStats.available} available
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions for Therapists */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={handleFindTherapists}
              className="p-3 rounded-lg bg-therapeutic-50 hover:bg-therapeutic-100 dark:bg-therapeutic-900 dark:hover:bg-therapeutic-800 transition-colors group"
            >
              <Search className="h-4 w-4 text-therapeutic-600 dark:text-therapeutic-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-therapeutic-800 dark:text-therapeutic-200">
                Browse
              </p>
            </button>
            
            <button
              onClick={() => navigate(`/t/${tenantId}/schedule?action=book`)}
              className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 transition-colors group"
            >
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                Book Now
              </p>
            </button>

            <button
              onClick={() => setExpandedTherapists(!expandedTherapists)}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors group"
            >
              <Star className="h-4 w-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {expandedTherapists ? 'Hide' : 'Top'} 
              </p>
            </button>
          </div>

          {/* Featured Therapists */}
          {expandedTherapists && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Top Rated
                </h3>
              </div>

              {isLoadingTherapists ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : featuredTherapists.length > 0 ? (
                <div className="space-y-2">
                  {featuredTherapists.filter(therapist => therapist && therapist.id).map((therapist) => (
                    <button
                      key={therapist.id}
                      onClick={() => handleTherapistClick(therapist.id)}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-therapeutic-300 dark:hover:border-therapeutic-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={therapist.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name || 'Unknown')}&background=6366f1&color=fff`}
                          alt={therapist.name || 'Therapist'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {therapist.name || 'Unknown Therapist'}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {therapist.rating || 5.0}
                              </span>
                            </div>
                            {therapist.specializations && Array.isArray(therapist.specializations) && therapist.specializations.length > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {therapist.specializations[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No featured therapists available
                  </p>
                  <button
                    onClick={handleFindTherapists}
                    className="mt-2 text-sm text-therapeutic-600 hover:text-therapeutic-700"
                  >
                    Browse all therapists
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
