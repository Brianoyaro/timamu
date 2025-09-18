import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';
import toast from 'react-hot-toast';

export default function BookingModal({ isOpen, onClose, therapist }) {
  const { token, user } = useAuthStore();
  const { createSession } = useSessionStore();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('VIDEO');
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSessionType('VIDEO');
      setNotes('');
      setTitle('');
      setIsEmergency(false);
      setEmergencyNotes('');
    }
  }, [isOpen]);

  // Generate available dates (next 30 days, excluding past dates)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const currentTime = new Date();
    
    // Start from tomorrow if it's late in the day (after 6 PM), otherwise start from today
    const startDay = currentTime.getHours() >= 18 ? 1 : 0;
    
    for (let i = startDay; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for regular sessions (emergency sessions can be anytime)
      if (!isEmergency && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }
      
      dates.push(date);
    }
    
    return dates;
  };

  // Generate available time slots based on therapist availability
  const getAvailableTimeSlots = () => {
    const slots = [];
    const availability = therapist?.therapistProfile?.availability;
    
    if (!selectedDate) return [];
    
    const selectedDateObj = new Date(selectedDate);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[selectedDateObj.getDay()];
    
    // Default working hours (9 AM to 5 PM)
    let startHour = 9;
    let endHour = 17;
    
    // Parse therapist availability if available
    if (availability && typeof availability === 'object' && availability[dayKey]) {
      const daySchedule = availability[dayKey];
      if (typeof daySchedule === 'object') {
        const times = Object.keys(daySchedule);
        if (times.length > 0) {
          const startTime = times[0];
          const endTime = daySchedule[startTime];
          
          startHour = parseInt(startTime.split(':')[0]);
          endHour = parseInt(endTime.split(':')[0]);
        }
      }
    }
    
    // For emergency sessions, extend hours
    if (isEmergency) {
      startHour = Math.max(startHour - 2, 7); // Start 2 hours earlier, minimum 7 AM
      endHour = Math.min(endHour + 3, 22); // End 3 hours later, maximum 10 PM
    }
    
    // Generate hourly slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of ['00', '30']) {
        if (hour === endHour - 1 && minute === '30') break; // Don't add the last half hour
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
        slots.push(timeStr);
      }
    }
    
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!title.trim()) {
      toast.error('Please provide a brief title for your session');
      return;
    }

    if (isEmergency && !emergencyNotes.trim()) {
      toast.error('Please provide emergency details');
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time into a single datetime
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const sessionData = {
        therapistId: therapist.id,
        scheduledAt: scheduledAt.toISOString(),
        sessionType,
        title: title.trim(),
        notes: notes.trim() || null,
        isEmergency,
        emergencyNotes: isEmergency ? emergencyNotes.trim() : null
      };

      await createSession(sessionData, token);
      
      toast.success('Session booked successfully!');
      onClose();
    } catch (error) {
      console.error('Error booking session:', error);
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
                  Book Session with Dr. {therapist?.firstName || 'Unknown'} {therapist?.lastName || 'Therapist'}
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

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Emergency Session Toggle */}
            {therapist?.therapistProfile?.acceptsEmergency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="emergency"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <label htmlFor="emergency" className="text-sm font-medium text-red-900 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Emergency Session
                    </label>
                    <p className="text-xs text-red-700 mt-1">
                      For urgent mental health concerns requiring immediate attention
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Session Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Initial consultation, Follow-up session, Anxiety management"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Emergency Notes */}
            {isEmergency && (
              <div>
                <label htmlFor="emergencyNotes" className="block text-sm font-medium text-red-700 mb-2">
                  Emergency Details *
                </label>
                <textarea
                  id="emergencyNotes"
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  placeholder="Please describe the urgent nature of your situation..."
                  rows="3"
                  className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            )}

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

            {/* Session Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topics you'd like to discuss or information the therapist should know..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Therapist Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Session Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Therapist:</strong> Dr. {therapist?.firstName} {therapist?.lastName}</p>
                {therapist?.therapistProfile?.specializations && (
                  <p><strong>Specializations:</strong> {therapist.therapistProfile.specializations.join(', ')}</p>
                )}
                <p><strong>Experience:</strong> {therapist?.therapistProfile?.experience || 'Several'} years</p>
                {therapist?.therapistProfile?.languages && (
                  <p><strong>Languages:</strong> {therapist.therapistProfile.languages.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedDate || !selectedTime || !title.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading || !selectedDate || !selectedTime || !title.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isEmergency
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isLoading ? 'Booking...' : isEmergency ? 'Book Emergency Session' : 'Book Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
