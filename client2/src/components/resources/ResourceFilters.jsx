import React from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'
import resourcesData from '../../config/resources.json'

export function ResourceFilters({ filters, onFiltersChange, onClear }) {
  const { t } = useTranslation()

  const handleCategoryToggle = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    
    onFiltersChange({ ...filters, types: newTypes })
  }

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.types.length > 0 ||
    filters.difficulty !== 'any'

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Filter Resources
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categories
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
            {resourcesData.categories.map((category) => (
              <label key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <div className="space-y-2">
            {resourcesData.types.map((type) => (
              <label key={type.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.types.includes(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {type.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty Level
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value })}
            className="input text-sm"
          >
            <option value="any">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  )
}
