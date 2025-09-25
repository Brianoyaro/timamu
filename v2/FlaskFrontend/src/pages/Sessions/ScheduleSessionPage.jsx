import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

const ScheduleSessionPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [sessionData, setSessionData] = useState({
    title: '',
    scheduled_at: '',
    duration: 60,
    session_type: 'individual',
    notes: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadAvailableTherapists();
  }, []);

  const loadAvailableTherapists = async () => {
    try {
      const response = await api.get('/sessions/available-therapists');
      setTherapists(response.data);
    } catch (error) {
      console.error('Error loading therapists:', error);
      setMessage('Error loading available therapists');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    
    if (!selectedTherapist) {
      setMessage('Please select a therapist');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const scheduleData = {
        ...sessionData,
        therapist_id: parseInt(selectedTherapist)
      };

      const response = await api.post('/sessions/schedule', scheduleData);

      setMessage('Session scheduled successfully! Confirmation emails have been sent.');
      
      // Reset form
      setSessionData({
        title: '',
        scheduled_at: '',
        duration: 60,
        session_type: 'individual',
        notes: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      setSelectedTherapist('');

    } catch (error) {
      console.error('Error scheduling session:', error);
      setMessage(`Error: ${error.response?.data?.message || error.message || 'Failed to schedule session'}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots for the next 30 days (9 AM - 5 PM)
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    for (let day = 1; day <= 30; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      
      // Skip weekends for now (can be made configurable)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (let hour = 9; hour <= 17; hour++) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
        
        const dateTimeString = slotDate.toISOString().slice(0, 16);
        const displayString = slotDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        slots.push({
          value: dateTimeString,
          label: displayString
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (user?.role?.toUpperCase() !== 'PATIENT') {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Only patients can schedule sessions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Schedule Therapy Session</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleScheduleSession} className="space-y-6">
        {/* Session Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Session Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={sessionData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Weekly Check-in, Anxiety Management"
            required
          />
        </div>

        {/* Therapist Selection */}
        <div>
          <label htmlFor="therapist" className="block text-sm font-medium text-gray-700 mb-2">
            Select Therapist
          </label>
          <select
            id="therapist"
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Choose a therapist...</option>
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.name} - {therapist.specializations?.join(', ') || 'General Therapy'}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time Selection */}
        <div>
          <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time
          </label>
          <select
            id="scheduled_at"
            name="scheduled_at"
            value={sessionData.scheduled_at}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select date and time...</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <select
            id="duration"
            name="duration"
            value={sessionData.duration}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>

        {/* Session Type */}
        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700 mb-2">
            Session Type
          </label>
          <select
            id="session_type"
            name="session_type"
            value={sessionData.session_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="individual">Individual Therapy</option>
            <option value="group">Group Therapy</option>
            <option value="emergency">Emergency Session</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={sessionData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any specific topics or concerns you'd like to discuss..."
          />
        </div>

        {/* Timezone Display */}
        <div className="text-sm text-gray-600">
          <p>Times shown in your local timezone: {sessionData.timezone}</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {loading ? 'Scheduling...' : 'Schedule Session'}
        </button>
      </form>
    </div>
  );
};

export default ScheduleSessionPage;