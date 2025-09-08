import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Building,
  Plus,
  Search
} from 'lucide-react'
import { TenantCard } from '../../components/admin/TenantCard'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { EmptyState } from '../../components/common/EmptyState'
import { analyticsService } from '../../services/analyticsService'

export function AdminTenantsPage() {
  const { t } = useTranslation()
  const [tenants, setTenants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTenants()
    analyticsService.page('Admin Tenants')
  }, [])

  const loadTenants = async () => {
    try {
      // Mock tenants data - replace with real API call
      const mockTenants = [
        {
          id: 'mindlink-clinic',
          name: 'MindLink Clinic',
          domain: 'clinic.mindlink.com',
          logo: null,
          status: 'active',
          userCount: 245,
          therapistCount: 12,
          patientCount: 233,
          plan: 'professional',
          createdAt: new Date('2024-01-01'),
          settings: {
            primaryColor: '#3b82f6',
            allowRegistration: true,
            requireEmailVerification: true
          }
        },
        {
          id: 'wellness-center',
          name: 'Wellness Center',
          domain: 'wellness.mindlink.com',
          logo: null,
          status: 'active',
          userCount: 156,
          therapistCount: 8,
          patientCount: 148,
          plan: 'basic',
          createdAt: new Date('2024-02-15'),
          settings: {
            primaryColor: '#10b981',
            allowRegistration: false,
            requireEmailVerification: true
          }
        }
      ]
      
      setTenants(mockTenants)
    } catch (error) {
      console.error('Failed to load tenants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTenantUpdate = (updatedTenant) => {
    setTenants(prev => 
      prev.map(tenant => 
        tenant.id === updatedTenant.id ? updatedTenant : tenant
      )
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6">
              <LoadingSkeleton className="h-32 w-full" />
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
          Tenant Management
        </h1>
        
        <button className="mt-4 sm:mt-0 btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tenants grid */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No tenants found"
          description="No tenants match your search criteria"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TenantCard 
                tenant={tenant} 
                onUpdate={handleTenantUpdate}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
