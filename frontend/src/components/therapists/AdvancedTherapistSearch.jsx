import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign,
  Filter,
  X
} from 'lucide-react'

export function AdvancedTherapistSearch({ onSearch, filters, onFiltersChange }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleQuickFilter = (filterType, value) => {
    onFiltersChange({
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter(item => item !== value)
        : [...filters[filterType], value]
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      specializations: [],
      languages: [],
      availability: 'any',
      rating: 0,
      priceRange: 'any'
    })
    setSearchQuery('')
    onSearch('')
  }

  const quickFilters = {
    specializations: [
      'Anxiety', 'Depression', 'PTSD', 'Couples Therapy', 'CBT'
    ],
    approaches: [
      'Cognitive Behavioral Therapy',
      'Dialectical Behavior Therapy', 
      'EMDR',
      'Mindfulness-Based Therapy',
      'Psychodynamic Therapy'
    ]
  }

  const hasActiveFilters = 
    filters.specializations.length > 0 ||
    filters.languages.length > 0 ||
    filters.availability !== 'any' ||
    filters.rating > 0 ||
    searchQuery.length > 0

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, specialization, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12 pr-20 text-lg h-14"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Filter className="h-4 w-4" />
          </button>
          
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary flex items-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => handleQuickFilter('specializations', spec)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.specializations.includes(spec)
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) => onFiltersChange({ ...filters, availability: e.target.value })}
                className="input text-sm"
              >
                <option value="any">Any time</option>
                <option value="today">Available today</option>
                <option value="thisWeek">This week</option>
                <option value="nextWeek">Next week</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Price Range
              </label>
              <select
                value={filters.priceRange || 'any'}
                onChange={(e) => onFiltersChange({ ...filters, priceRange: e.target.value })}
                className="input text-sm"
              >
                <option value="any">Any price</option>
                <option value="budget">Under $100</option>
                <option value="mid">$100 - $150</option>
                <option value="premium">$150+</option>
              </select>
            </div>

            {/* Location Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Session Type
              </label>
              <select
                value={filters.sessionType || 'any'}
                onChange={(e) => onFiltersChange({ ...filters, sessionType: e.target.value })}
                className="input text-sm"
              >
                <option value="any">Any format</option>
                <option value="video">Video sessions</option>
                <option value="phone">Phone sessions</option>
                <option value="inPerson">In-person (if available)</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => onFiltersChange({ ...filters, rating: parseInt(e.target.value) })}
                className="input text-sm"
              >
                <option value={0}>Any rating</option>
                <option value={3}>3+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={5}>5 stars only</option>
              </select>
            </div>
          </div>

          {/* Therapy Approaches */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Therapy Approaches
            </label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.approaches.map((approach) => (
                <button
                  key={approach}
                  onClick={() => handleQuickFilter('specializations', approach)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.specializations.includes(approach)
                      ? 'bg-therapeutic-100 text-therapeutic-800 dark:bg-therapeutic-900 dark:text-therapeutic-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {approach}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
