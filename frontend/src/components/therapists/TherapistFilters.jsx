import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const specializations = [
  'Anxiety',
  'Depression',
  'PTSD',
  'Addiction',
  'Couples Therapy',
  'Family Therapy',
  'Cognitive Behavioral Therapy',
  'Dialectical Behavior Therapy',
  'EMDR',
  'Mindfulness'
]

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Arabic',
  'Swahili'
]

export function TherapistFilters({ filters, onFiltersChange, onClear }) {
  const { t } = useTranslation()

  const handleSpecializationToggle = (spec) => {
    const newSpecs = filters.specializations.includes(spec)
      ? filters.specializations.filter(s => s !== spec)
      : [...filters.specializations, spec]
    
    onFiltersChange({ ...filters, specializations: newSpecs })
  }

  const handleLanguageToggle = (lang) => {
    const newLangs = filters.languages.includes(lang)
      ? filters.languages.filter(l => l !== lang)
      : [...filters.languages, lang]
    
    onFiltersChange({ ...filters, languages: newLangs })
  }

  const hasActiveFilters = 
    filters.specializations.length > 0 ||
    filters.languages.length > 0 ||
    filters.availability !== 'any' ||
    filters.rating > 0

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Filter Therapists
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Specializations
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
            {specializations.map((spec) => (
              <label key={spec} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.specializations.includes(spec)}
                  onChange={() => handleSpecializationToggle(spec)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {spec}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Languages
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
            {languages.map((lang) => (
              <label key={lang} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.languages.includes(lang)}
                  onChange={() => handleLanguageToggle(lang)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Availability
          </label>
          <select
            value={filters.availability}
            onChange={(e) => onFiltersChange({ ...filters, availability: e.target.value })}
            className="input text-sm"
          >
            <option value="any">Any time</option>
            <option value="today">Available today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
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
            <option value={5}>5 stars</option>
          </select>
        </div>
      </div>
    </div>
  )
}
