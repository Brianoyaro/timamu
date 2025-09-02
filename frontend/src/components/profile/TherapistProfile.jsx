import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  UserIcon,
  CameraIcon,
  AcademicCapIcon,
  StarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'

export function TherapistProfile() {
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
      title: user?.title || '',
      bio: user?.bio || '',
      specializations: user?.specializations?.join(', ') || '',
      languages: user?.languages?.join(', ') || '',
      education: user?.education || '',
      licenses: user?.licenses || '',
      experience: user?.experience || ''
    }
  })

  const onSubmit = async (data) => {
    try {
      // Process specializations and languages
      const processedData = {
        ...data,
        specializations: data.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: data.languages.split(',').map(l => l.trim()).filter(Boolean)
      }
      
      // Mock API call - replace with real implementation
      console.log('Updating therapist profile:', processedData)
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
              <CameraIcon className="h-4 w-4" />
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
              {user?.title || 'Licensed Therapist'}
            </p>
            
            <div className="mt-2 flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                Therapist
              </span>
              
              {user?.rating && (
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.rating} ({user.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
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

      {/* Professional information */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <AcademicCapIcon className="h-5 w-5 mr-2" />
          Professional Information
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
                Professional Title
              </label>
              <input
                {...register('title')}
                disabled={!isEditing}
                placeholder="e.g., Licensed Clinical Social Worker"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Professional Bio
            </label>
            <textarea
              {...register('bio')}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell patients about your approach and experience..."
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specializations
              </label>
              <input
                {...register('specializations')}
                disabled={!isEditing}
                placeholder="Anxiety, Depression, PTSD (comma separated)"
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Languages
              </label>
              <input
                {...register('languages')}
                disabled={!isEditing}
                placeholder="English, Spanish, French (comma separated)"
                className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Education
            </label>
            <textarea
              {...register('education')}
              disabled={!isEditing}
              rows={3}
              placeholder="Your educational background..."
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Licenses & Certifications
            </label>
            <textarea
              {...register('licenses')}
              disabled={!isEditing}
              rows={3}
              placeholder="Your professional licenses and certifications..."
              className="mt-1 input disabled:bg-gray-50 dark:disabled:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Years of Experience
            </label>
            <input
              {...register('experience')}
              type="number"
              disabled={!isEditing}
              placeholder="Years of professional experience"
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
    </div>
  )
}
