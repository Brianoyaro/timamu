import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import { TherapistCard } from '../components/therapists/TherapistCard'
import { TherapistFilters } from '../components/therapists/TherapistFilters'
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
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    specializations: [],
    languages: [],
    availability: 'any',
    rating: 0
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
      const data = await userService.getTherapists()
      setTherapists(data)
    } catch (error) {
      console.error('Failed to load therapists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = therapists

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(therapist =>
        therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.specializations?.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Specialization filter
    if (filters.specializations.length > 0) {
      filtered = filtered.filter(therapist =>
        therapist.specializations?.some(spec =>
          filters.specializations.includes(spec)
        )
      )
    }

    // Language filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter(therapist =>
        therapist.languages?.some(lang =>
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

    setFilteredTherapists(filtered)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="h-10 w-32 mt-4 sm:mt-0" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6">
              <LoadingSkeleton className="h-16 w-16 rounded-full mx-auto" />
              <LoadingSkeleton className="h-4 w-32 mx-auto mt-4" />
              <LoadingSkeleton className="h-3 w-24 mx-auto mt-2" />
              <LoadingSkeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.therapists')}
        </h1>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 sm:mt-0 btn btn-secondary flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search therapists by name or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <TherapistFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters({
              specializations: [],
              languages: [],
              availability: 'any',
              rating: 0
            })}
          />
        </motion.div>
      )}

      {/* Results */}
      {filteredTherapists.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No therapists found"
          description="Try adjusting your search criteria or filters"
          action={{
            label: 'Clear filters',
            onClick: () => {
              setSearchQuery('')
              setFilters({
                specializations: [],
                languages: [],
                availability: 'any',
                rating: 0
              })
            }
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
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
        </motion.div>
      )}
    </div>
  )
}
