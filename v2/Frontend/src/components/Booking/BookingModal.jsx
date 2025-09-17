import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';
import AssignmentModal from './AssignmentModal';
import toast from 'react-hot-toast';

export default function BookingModal({ isOpen, onClose, therapist }) {
  const { token, user } = useAuthStore();
  const { createSession, fetchMyAssignments } = useSessionStore();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('VIDEO');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: check assignments, 2: book session
  const [isInitializing, setIsInitializing] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [userAssignments, setUserAssignments] = useState([]);

  // Reset form when modal opens and check current assignments
  useEffect(() => {
    if (isOpen && therapist?.id) {
      setSelectedDate('');
      setSelectedTime('');
      setSessionType('VIDEO');
      setNotes('');
      setIsInitializing(true);
      
      checkUserAssignments();
    }
  }, [isOpen, therapist?.id]);

  const checkUserAssignments = async () => {
    try {
      const assignmentsData = await fetchMyAssignments(token);
      const assignments = assignmentsData.assignments || [];
      setUserAssignments(assignments);
      
      // Check if user has an active assignment with this therapist
      const hasActiveAssignment = assignments.some(assignment => 
        assignment.therapist.user.id === therapist.id && 
        assignment.status === 'ACTIVE'
      );
      
      if (hasActiveAssignment) {
        setStep(2); // Go directly to booking
      } else {
        setStep(1); // Show assignment options
      }
    } catch (error) {
      console.error('Error checking assignments:', error);
      setStep(1); // Default to assignment step
    } finally {
      setIsInitializing(false);
    }
  };

  // Generate available dates (next 60 days, excluding past dates)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const currentTime = new Date();
    
    // Start from tomorrow if it's late in the day (after 6 PM), otherwise start from today
    const startDay = currentTime.getHours() >= 18 ? 1 : 0;
    
    for (let i = startDay; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Include all days - let therapist availability determine actual availability
      // In production, this would check against therapist's actual availability calendar
      dates.push(date);
    }
    
    return dates;
  };

  // Generate available time slots
  const getAvailableTimeSlots = () => {
    const slots = [];
    const workingHours = therapist?.therapistProfile?.workingHours;
    
    // Default working hours (9 AM to 5 PM)
    let startHour = 9;
    let endHour = 17;
    
    // Parse working hours if available
    if (workingHours && typeof workingHours === 'object') {
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(selectedDate).getDay()];
      
      if (workingHours[dayKey] && typeof workingHours[dayKey] === 'object') {
        const dayHours = workingHours[dayKey];
        
        // Safely parse start hour
        if (dayHours.start && typeof dayHours.start === 'string' && dayHours.start.includes(':')) {
          const startTime = dayHours.start.split(':')[0];
          const parsedStart = parseInt(startTime, 10);
          if (!isNaN(parsedStart) && parsedStart >= 0 && parsedStart <= 23) {
            startHour = parsedStart;
          }
        }
        
        // Safely parse end hour
        if (dayHours.end && typeof dayHours.end === 'string' && dayHours.end.includes(':')) {
          const endTime = dayHours.end.split(':')[0];
          const parsedEnd = parseInt(endTime, 10);
          if (!isNaN(parsedEnd) && parsedEnd >= 0 && parsedEnd <= 23 && parsedEnd > startHour) {
            endHour = parsedEnd;
          }
        }
      }
    }
    
    // Generate 30-minute time slots
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour - 1 || (hour === endHour - 1 && endHour < 24)) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const handleRequestAssignment = () => {
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = (assignmentData) => {
    // If assignment is active, go to booking step
    if (assignmentData.status === 'ACTIVE') {
      setStep(2);
      checkUserAssignments(); // Refresh assignments
    } else {
      // If pending approval, close the modal
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!therapist?.id) {
      toast.error('Therapist information is not available');
      return;
    }

    // Check if selected date is in the past
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      toast.error('Selected time must be in the future');
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = {
        therapistId: therapist.id,
        scheduledAt: selectedDateTime.toISOString(),
        sessionType,
        notes: notes.trim() || undefined
      };

      const result = await createSession(sessionData, token);
      
      if (result?.success) {
        toast.success('Session booked successfully!');
        onClose();
        // In production, you might want to refresh the sessions list or redirect
      } else {
        const errorMessage = result?.message || 'Failed to book session';
        toast.error(errorMessage);
        
        // Handle specific error cases
        if (errorMessage.includes('therapist not assigned')) {
          setStep(1); // Go back to assignment step
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred while booking the session';
      toast.error(errorMessage);
      
      // Handle network or authentication errors
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        toast.error('Please log in again to continue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !therapist) return null;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableDates = getAvailableDates();
  const availableTimeSlots = selectedDate ? getAvailableTimeSlots() : [];

  const sessionTypeOptions = [
    { value: 'VIDEO', label: 'Video Call', icon: VideoCameraIcon, description: 'Face-to-face video session' },
    { value: 'AUDIO_ONLY', label: 'Audio Only', icon: PhoneIcon, description: 'Voice-only session' },
    { value: 'CHAT_ONLY', label: 'Text Chat', icon: ChatBubbleLeftRightIcon, description: 'Text-based session' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                {therapist?.avatar ? (
                  <img
                    src={therapist.avatar}
                    alt={`Dr. ${therapist.firstName || ''} ${therapist.lastName || ''}`}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span 
                  className={`text-lg font-semibold text-blue-600 ${therapist?.avatar ? 'hidden' : 'flex'}`}
                  style={{ display: therapist?.avatar ? 'none' : 'flex' }}
                >
                  {therapist?.firstName?.[0] || 'D'}{therapist?.lastName?.[0] || 'R'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {step === 1 ? 'Assign Therapist' : 'Book Session with'} Dr. {therapist?.firstName || 'Unknown'} {therapist?.lastName || 'Therapist'}
                </h2>
                <p className="text-sm text-gray-600">
                  {therapist?.therapistProfile?.education || 'Licensed Therapist'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content based on step */}
          {step === 1 ? (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Request Assignment with Dr. {therapist?.firstName || 'Unknown'} {therapist?.lastName || 'Therapist'}
                </h3>
                <p className="text-gray-600 mb-6">
                  To book sessions, you need to request an assignment with this therapist first. 
                  You can choose the type of care and specialization that best fits your needs.
                </p>

                {/* Current Assignments */}
                {userAssignments.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-medium text-blue-900 mb-2">Your Current Assignments</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      {userAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex justify-between">
                          <span>Dr. {assignment.therapist.user.firstName} {assignment.therapist.user.lastName}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            assignment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Therapist Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">About This Therapist</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Education:</strong> {therapist?.therapistProfile?.education || 'Licensed Therapist'}</p>
                    {therapist?.therapistProfile?.specializations && Array.isArray(therapist.therapistProfile.specializations) && therapist.therapistProfile.specializations.length > 0 && (
                      <p><strong>Specializations:</strong> {therapist.therapistProfile.specializations.join(', ')}</p>
                    )}
                    <p><strong>Experience:</strong> {therapist?.therapistProfile?.experience || 'Several'} years</p>
                    <p><strong>Rate:</strong> ${therapist?.therapistProfile?.hourlyRate || 150}/session</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestAssignment}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Request Assignment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Select Date
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedDate === date.toISOString().split('T')[0]
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <ClockIcon className="h-4 w-4 inline mr-2" />
                    Select Time
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Session Type
                </label>
                <div className="space-y-3">
                  {sessionTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="sessionType"
                        value={option.value}
                        checked={sessionType === option.value}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <option.icon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific topics or concerns you'd like to discuss..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
              </div>

              {/* Session Details Summary */}
              {selectedDate && selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Session Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Type:</strong> {sessionTypeOptions.find(opt => opt.value === sessionType)?.label}</p>
                    <p><strong>Cost:</strong> ${therapist?.therapistProfile?.hourlyRate || 150}.00</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedDate || !selectedTime || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        therapist={therapist}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}
