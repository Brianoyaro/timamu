import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  BookOpenIcon,
  PlayIcon,
  HeartIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { ResourceCard } from '../components/resources/ResourceCard'
import { ResourceFilters } from '../components/resources/ResourceFilters'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { analyticsService } from '../services/analyticsService'
import resourcesData from '../config/resources.json'

export function ResourcesPage() {
  const { t } = useTranslation()
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categories: [],
    types: [],
    difficulty: 'any'
  })

  useEffect(() => {
    loadResources()
    analyticsService.page('Resources')
  }, [])

  useEffect(() => {
    applyFilters()
  }, [resources, searchQuery, filters])

  const loadResources = async () => {
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResources(resourcesData.resources)
    } catch (error) {
      console.error('Failed to load resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = resources

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags?.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(resource =>
        filters.categories.includes(resource.category)
      )
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(resource =>
        filters.types.includes(resource.type)
      )
    }

    // Difficulty filter
    if (filters.difficulty !== 'any') {
      filtered = filtered.filter(resource =>
        resource.difficulty === filters.difficulty
      )
    }

    setFilteredResources(filtered)
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
              <LoadingSkeleton className="h-32 w-full mb-4" />
              <LoadingSkeleton className="h-4 w-full mb-2" />
              <LoadingSkeleton className="h-3 w-3/4" />
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
          {t('navigation.resources')}
        </h1>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 sm:mt-0 btn btn-secondary flex items-center"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search resources..."
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
          <ResourceFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters({
              categories: [],
              types: [],
              difficulty: 'any'
            })}
          />
        </motion.div>
      )}

      {/* Results */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="No resources found"
          description="Try adjusting your search criteria or filters"
          action={{
            label: 'Clear filters',
            onClick: () => {
              setSearchQuery('')
              setFilters({
                categories: [],
                types: [],
                difficulty: 'any'
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
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
