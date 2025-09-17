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
import toast from 'react-hot-toast';

export default function BookingModal({ isOpen, onClose, therapist }) {
  const { token } = useAuthStore();
  const { createSession, assignTherapist } = useSessionStore();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('VIDEO');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: assign therapist, 2: book session

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSessionType('VIDEO');
      setNotes('');
      setStep(1);
    }
  }, [isOpen]);

  // Generate available dates (next 30 days, excluding weekends for demo)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for demo (can be customized based on therapist availability)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Generate available time slots
  const getAvailableTimeSlots = () => {
    const slots = [];
    const workingHours = therapist?.therapistProfile?.workingHours;
    
    // Default working hours if not specified
    let startHour = 9;
    let endHour = 17;
    
    // Parse working hours if available (simplified for demo)
    if (workingHours && typeof workingHours === 'object') {
      const selectedDay = new Date(selectedDate).toLocaleLowerCase();
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(selectedDate).getDay()];
      
      if (workingHours[dayKey]) {
        const dayHours = workingHours[dayKey];
        if (dayHours.start) {
          startHour = parseInt(dayHours.start.split(':')[0]);
        }
        if (dayHours.end) {
          endHour = parseInt(dayHours.end.split(':')[0]);
        }
      }
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
  };

  const handleAssignTherapist = async () => {
    setIsLoading(true);

    try {
      const result = await assignTherapist(therapist.id, token);
      
      if (result.success) {
        toast.success('Therapist assigned successfully!');
        setStep(2);
      } else {
        toast.error(result.message || 'Failed to assign therapist');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      if (error.message.includes('already have an assigned therapist')) {
        // If already assigned, skip to booking step
        setStep(2);
      } else {
        toast.error(error.message || 'Failed to assign therapist');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const sessionData = {
        therapistId: therapist.id,
        scheduledAt: scheduledAt.toISOString(),
        sessionType,
        notes: notes.trim() || undefined
      };

      const result = await createSession(sessionData, token);
      
      if (result.success) {
        toast.success('Session booked successfully!');
        onClose();
      } else {
        toast.error(result.message || 'Failed to book session');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to book session');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
                    alt={`${therapist.firstName} ${therapist.lastName}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-blue-600">
                    {therapist?.firstName[0]}{therapist?.lastName[0]}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {step === 1 ? 'Assign Therapist' : 'Book Session with'} Dr. {therapist?.firstName} {therapist?.lastName}
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
                  Assign Dr. {therapist?.firstName} {therapist?.lastName} as Your Therapist
                </h3>
                <p className="text-gray-600 mb-6">
                  To book sessions, you need to have this therapist assigned to your account first. 
                  This is a one-time setup that allows for secure communication and session scheduling.
                </p>
                
                {/* Therapist Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">About This Therapist</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Education:</strong> {therapist?.therapistProfile?.education || 'Licensed Therapist'}</p>
                    {therapist?.therapistProfile?.specializations && (
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
                    onClick={handleAssignTherapist}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Assigning...' : 'Assign Therapist & Continue'}
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
    </div>
  );
}
