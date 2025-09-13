import React, { useState, useEffect, useRef } from 'react'
import { Search, User, ChevronDown, X, Check } from 'lucide-react'
import { userService } from '../../services/userService'

export function TherapistSelector({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Search and select a therapist...",
  className = "",
  error = null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [therapists, setTherapists] = useState([])
  const [filteredTherapists, setFilteredTherapists] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTherapist, setSelectedTherapist] = useState(null)
  
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadTherapists()
  }, [])

  useEffect(() => {
    // Find selected therapist when value changes
    if (value && therapists.length > 0) {
      const selected = therapists.find(t => t.id === value)
      setSelectedTherapist(selected)
    } else {
      setSelectedTherapist(null)
    }
  }, [value, therapists])

  useEffect(() => {
    // Filter therapists based on search term
    if (!searchTerm.trim()) {
      setFilteredTherapists(therapists)
    } else {
      const filtered = therapists.filter(therapist =>
        therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.specializations?.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        therapist.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTherapists(filtered)
    }
  }, [searchTerm, therapists])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTherapists = async () => {
    try {
      setLoading(true)
      const response = await userService.getUsers({
        roles: 'therapist',
        limit: 100, // Load first 100 therapists
        includeProfile: true
      })
      setTherapists(response.users || [])
      setFilteredTherapists(response.users || [])
    } catch (error) {
      console.error('Failed to load therapists:', error)
      setTherapists([])
      setFilteredTherapists([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        // Focus search input when opening
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const handleSelectTherapist = (therapist) => {
    setSelectedTherapist(therapist)
    onChange(therapist.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedTherapist(null)
    onChange('')
    setSearchTerm('')
  }

  const getDisplayText = () => {
    if (selectedTherapist) {
      return selectedTherapist.name
    }
    return placeholder
  }

  const getTherapistSubtext = (therapist) => {
    const parts = []
    if (therapist.title) parts.push(therapist.title)
    if (therapist.specializations?.length > 0) {
      parts.push(therapist.specializations.slice(0, 2).join(', '))
      if (therapist.specializations.length > 2) {
        parts[parts.length - 1] += ` +${therapist.specializations.length - 2} more`
      }
    }
    return parts.join(' • ')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main selector button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border-2 rounded-lg text-left transition-all
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2'
          }
          ${isOpen ? 'ring-2 ring-blue-200 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedTherapist ? (
            <>
              {selectedTherapist.avatar ? (
                <img
                  src={selectedTherapist.avatar}
                  alt={selectedTherapist.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-gray-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {selectedTherapist.name}
                </div>
                {selectedTherapist.title && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedTherapist.title}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 truncate">{placeholder}</span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {selectedTherapist && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search therapists..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Therapist list */}
          <div className="overflow-y-auto max-h-64">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading therapists...
              </div>
            ) : filteredTherapists.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No therapists found matching your search' : 'No therapists available'}
              </div>
            ) : (
              filteredTherapists.map((therapist) => (
                <button
                  key={therapist.id}
                  type="button"
                  onClick={() => handleSelectTherapist(therapist)}
                  className={`
                    w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors
                    ${value === therapist.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {therapist.avatar ? (
                      <img
                        src={therapist.avatar}
                        alt={therapist.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {therapist.name}
                        </span>
                        {value === therapist.id && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {therapist.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {therapist.email}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-600 truncate">
                        {getTherapistSubtext(therapist)}
                      </div>
                      
                      {therapist.languages?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {therapist.languages.slice(0, 3).map((lang, idx) => (
                            <span 
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded"
                            >
                              {lang}
                            </span>
                          ))}
                          {therapist.languages.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{therapist.languages.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Load more button if needed */}
          {!loading && filteredTherapists.length >= 100 && (
            <div className="p-3 border-t border-gray-100">
              <button
                type="button"
                onClick={loadTherapists}
                className="w-full text-sm text-blue-600 hover:text-blue-700 text-center"
              >
                Load more therapists...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
