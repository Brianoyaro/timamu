import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Star, 
  MapPin, 
  Calendar,
  Filter,
  ChevronDown,
  Users,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { userService } from '@/services/userService'
import { formatCurrency } from '@/lib/utils'

/**
 * Therapist listing page with search and filtering
 * Displays available therapists with their information
 */
export function TherapistListPage() {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const [therapists, setTherapists] = useState([])
  const [filteredTherapists, setFilteredTherapists] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [specializations, setSpecializations] = useState([])

  useEffect(() => {
    loadTherapists()
  }, [])

  useEffect(() => {
    filterAndSortTherapists()
  }, [therapists, searchTerm, sortBy, selectedSpecialization])

  /**
   * Load therapists from the API
   */
  const loadTherapists = async () => {
    try {
      setIsLoading(true)
      const data = await userService.getTherapists()
      setTherapists(data)
      
      // Extract unique specializations
      const allSpecializations = data
        .flatMap(t => t.specializations || [])
        .filter((spec, index, arr) => arr.indexOf(spec) === index)
        .sort()
      setSpecializations(allSpecializations)
      
    } catch (error) {
      console.error('Failed to load therapists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Filter and sort therapists based on current criteria
   */
  const filterAndSortTherapists = () => {
    let filtered = [...therapists]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(therapist =>
        therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (therapist.specializations || []).some(spec =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Specialization filter
    if (selectedSpecialization) {
      filtered = filtered.filter(therapist =>
        (therapist.specializations || []).includes(selectedSpecialization)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0)
        default:
          return 0
      }
    })

    setFilteredTherapists(filtered)
  }

  /**
   * Handle therapist selection
   */
  const handleTherapistClick = (therapistId) => {
    navigate(`/t/${tenantId}/therapists/${therapistId}`)
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSpecialization('')
    setSortBy('rating')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Find Therapists</h1>
          <p className="text-muted-foreground">
            Connect with qualified mental health professionals
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {filteredTherapists.length} therapist{filteredTherapists.length !== 1 ? 's' : ''} available
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Specialization
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setSelectedSpecialization('')}>
              All Specializations
            </DropdownMenuItem>
            {specializations.map((spec) => (
              <DropdownMenuItem
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
              >
                {spec}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Sort by: {sortBy === 'rating' ? 'Rating' : sortBy === 'name' ? 'Name' : 'Price'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('rating')}>
              Highest Rating
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price')}>
              Lowest Price
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {(searchTerm || selectedSpecialization || sortBy !== 'rating') && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </motion.div>

      {/* Active Filters */}
      {(selectedSpecialization || searchTerm) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {searchTerm && (
            <Badge variant="secondary">
              Search: "{searchTerm}"
            </Badge>
          )}
          {selectedSpecialization && (
            <Badge variant="secondary">
              Specialization: {selectedSpecialization}
            </Badge>
          )}
        </motion.div>
      )}

      {/* Therapist Grid */}
      {filteredTherapists.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTherapists.map((therapist, index) => (
            <motion.div
              key={therapist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => handleTherapistClick(therapist.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {therapist.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {therapist.name}
                        </CardTitle>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {therapist.rating?.toFixed(1) || '5.0'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({therapist.reviewCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Specializations */}
                  {therapist.specializations && therapist.specializations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {therapist.specializations.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {therapist.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{therapist.specializations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {therapist.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {therapist.bio}
                    </p>
                  )}

                  {/* Location and Price */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{therapist.location || 'Online'}</span>
                    </div>
                    {therapist.hourlyRate && (
                      <div className="text-sm font-medium">
                        {formatCurrency(therapist.hourlyRate)}/hour
                      </div>
                    )}
                  </div>

                  {/* Availability indicator */}
                  {therapist.isAvailable !== false && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Available for booking</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No therapists found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear all filters
          </Button>
        </motion.div>
      )}
    </div>
  )
}
