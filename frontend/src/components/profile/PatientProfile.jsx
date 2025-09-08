import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  User,
  Camera,
  Heart,
  FileText
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'

export function PatientProfile() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      emergencyContact: user?.emergencyContact || '',
      goals: user?.goals || '',
      preferences: user?.preferences || ''
    }
  })

  const onSubmit = async (data) => {
    try {
      // Mock API call - replace with real implementation
      console.log('Updating profile:', data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleAvatarUpload = async (file) => {
    setUploadingAvatar(true)
    try {
      // Mock upload - replace with real implementation
      console.log('Uploading avatar:', file)
    } catch (error) {
      console.error('Avatar upload failed:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
          <div className="relative">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
              alt={user?.name}
              className="h-24 w-24 rounded-full object-cover"
            />
            
            <button
              onClick={() => document.getElementById('avatar-upload').click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
              }}
            />
          </div>
          
          <div className="mt-4 sm:mt-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-therapeutic-100 text-therapeutic-800 dark:bg-therapeutic-900 dark:text-therapeutic-200">
                Patient
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-4 sm:mt-0 btn btn-secondary"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Personal Information
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                {...register('name')}
                disabled={!isEditing}
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                disabled={!isEditing}
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                disabled={!isEditing}
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                {...register('dateOfBirth')}
                type="date"
                disabled={!isEditing}
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Emergency Contact
            </label>
            <input
              {...register('emergencyContact')}
              disabled={!isEditing}
              placeholder="Name and phone number"
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Therapy Goals
            </label>
            <textarea
              {...register('goals')}
              disabled={!isEditing}
              rows={3}
              placeholder="What would you like to work on in therapy?"
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferences & Notes
            </label>
            <textarea
              {...register('preferences')}
              disabled={!isEditing}
              rows={3}
              placeholder="Any preferences for your therapy sessions?"
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          {isEditing && (
            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Session history */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Session History
        </h3>
        
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No session history available yet
          </p>
        </div>
      </div>
    </div>
  )
}
