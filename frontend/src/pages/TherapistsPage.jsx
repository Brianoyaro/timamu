import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Users, Sparkles } from 'lucide-react'
import { TherapistCard } from '../components/therapists/TherapistCard'
import { AdvancedTherapistSearch } from '../components/therapists/AdvancedTherapistSearch'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { userService } from '../services/userService'
import { analyticsService } from '../services/analyticsService'

export function TherapistsPage() {
  const { t } = useTranslation()
  const [therapists, setTherapists] = useState([])
  const [filteredTherapists, setFilteredTherapists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    specializations: [],
    languages: [],
    availability: 'any',
    rating: 0,
    priceRange: 'any',
    sessionType: 'any'
  })

  useEffect(() => {
    loadTherapists()
    analyticsService.page('Therapists Directory')
  }, [])

  useEffect(() => {
    applyFilters()
  }, [therapists, searchQuery, filters])

  const loadTherapists = async () => {
    try {
      setIsLoading(true)
      const therapists = await userService.getTherapists()
      setTherapists(therapists)
    } catch (error) {
      console.error('Failed to load therapists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    analyticsService.track('therapist_search', { query })
  }

  const applyFilters = () => {
    let filtered = therapists

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(therapist =>
        therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.specializations?.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        therapist.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Specialization filter
    if (filters.specializations.length > 0) {
      filtered = filtered.filter(therapist =>
        therapist.specializations && Array.isArray(therapist.specializations) &&
        therapist.specializations.some(spec =>
          filters.specializations.includes(spec)
        )
      )
    }

    // Language filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter(therapist =>
        therapist.languages && Array.isArray(therapist.languages) &&
        therapist.languages.some(lang =>
          filters.languages.includes(lang)
        )
      )
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(therapist =>
        (therapist.rating || 0) >= filters.rating
      )
    }

    // Price range filter
    if (filters.priceRange !== 'any') {
      filtered = filtered.filter(therapist => {
        if (!therapist.sessionRate) return false
        
        const rate = parseInt(therapist.sessionRate.replace(/[^0-9]/g, ''))
        switch (filters.priceRange) {
          case 'budget':
            return rate < 100
          case 'mid':
            return rate >= 100 && rate <= 150
          case 'premium':
            return rate > 150
          default:
            return true
        }
      })
    }

    setFilteredTherapists(filtered)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Users className="h-12 w-12 text-blue-600" />
            <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {t('pages.therapists.title', 'Find Your Perfect Therapist')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('pages.therapists.subtitle', 'Connect with licensed professionals who understand your unique needs and can guide you on your mental health journey.')}
        </p>
      </motion.div>

      {/* Search Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <AdvancedTherapistSearch
          onSearch={handleSearch}
          onFilterChange={setFilters}
          totalTherapists={therapists.length}
          filteredCount={filteredTherapists.length}
        />
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-80" />
            ))}
          </div>
        ) : filteredTherapists.length === 0 ? (
          <EmptyState
            icon={Search}
            title={searchQuery || Object.values(filters).some(f => f !== 'any' && f !== 0 && (!Array.isArray(f) || f.length > 0))
              ? t('pages.therapists.noResults', 'No therapists found')
              : t('pages.therapists.noTherapists', 'No therapists available')
            }
            description={searchQuery || Object.values(filters).some(f => f !== 'any' && f !== 0 && (!Array.isArray(f) || f.length > 0))
              ? t('pages.therapists.noResultsDescription', 'Try adjusting your search criteria or filters')
              : t('pages.therapists.noTherapistsDescription', 'Check back later for new therapists')
            }
            action={
              (searchQuery || Object.values(filters).some(f => f !== 'any' && f !== 0 && (!Array.isArray(f) || f.length > 0))) && {
                label: t('common.clearFilters', 'Clear filters'),
                onClick: () => {
                  setSearchQuery('')
                  setFilters({
                    specializations: [],
                    languages: [],
                    availability: 'any',
                    rating: 0,
                    priceRange: 'any',
                    sessionType: 'any'
                  })
                }
              }
            }
          />
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                {t('pages.therapists.resultsCount', 
                  `Showing ${filteredTherapists.length} of ${therapists.length} therapists`,
                  { filtered: filteredTherapists.length, total: therapists.length }
                )}
              </p>
            </div>

            {/* Therapist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTherapists.map((therapist, index) => (
                <motion.div
                  key={therapist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TherapistCard therapist={therapist} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
