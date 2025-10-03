import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

const TherapistAvailabilityPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentView, setCurrentView] = useState('week');
  const [availability, setAvailability] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const user = useAuthStore((state) => state.user);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadAvailability();
  }, []);

  useEffect(() => {
    // Initialize week days in availability if they don't exist
    const initialAvailability = { ...availability };
    weekDays.forEach(day => {
      if (!initialAvailability[day]) {
        initialAvailability[day] = [];
      }
    });
    if (Object.keys(initialAvailability).length !== Object.keys(availability).length) {
      setAvailability(initialAvailability);
    }
  }, [availability, weekDays]);

  const loadAvailability = async () => {
    try {
      console.log('[DEBUG] TherapistAvailabilityPage: Loading availability data');
      setLoading(true);
      console.log('[DEBUG] TherapistAvailabilityPage: Making API request to /therapists/availability');
      const response = await api.get('/therapists/availability');
      console.log('[DEBUG] TherapistAvailabilityPage: Received response', response);
      const loadedAvailability = response.data.availability || {};
      console.log('[DEBUG] TherapistAvailabilityPage: Received availability data', loadedAvailability);
      
      // Ensure all weekdays are initialized
      const initialAvailability = {};
      weekDays.forEach(day => {
        initialAvailability[day] = loadedAvailability[day] || [];
      });
      
      // Copy any specific dates
      Object.keys(loadedAvailability).forEach(key => {
        if (!weekDays.includes(key)) {
          initialAvailability[key] = loadedAvailability[key];
        }
      });
      
      console.log('[DEBUG] TherapistAvailabilityPage: Setting availability state', initialAvailability);
      setAvailability(initialAvailability);
    } catch (error) {
      console.error('[DEBUG] TherapistAvailabilityPage: Error loading availability:', error);
      console.error('[DEBUG] TherapistAvailabilityPage: Response data:', error.response?.data);
      console.error('[DEBUG] TherapistAvailabilityPage: Status code:', error.response?.status);
      
      // Initialize with empty availability if no data exists
      const initialAvailability = {};
      weekDays.forEach(day => {
        initialAvailability[day] = [];
      });
      setAvailability(initialAvailability);
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    try {
      console.log('[DEBUG] TherapistAvailabilityPage: Saving availability data');
      setLoading(true);
      
      console.log('[DEBUG] TherapistAvailabilityPage: Current availability data to save', availability);
      console.log('[DEBUG] TherapistAvailabilityPage: Making API POST request to /therapists/availability');
      
      const response = await api.post('/therapists/availability', { availability });
      console.log('[DEBUG] TherapistAvailabilityPage: Save response', response);
      
      setMessage('Availability saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('[DEBUG] TherapistAvailabilityPage: Error saving availability:', error);
      console.error('[DEBUG] TherapistAvailabilityPage: Response data:', error.response?.data);
      console.error('[DEBUG] TherapistAvailabilityPage: Status code:', error.response?.status);
      
      setMessage(`Error: ${error.response?.data?.error || 'Failed to save availability'}`);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = () => {
    return new Date(currentYear, currentMonth).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction) => {
    const today = new Date();
    if (direction === -1) {
      // Prevent going to past months
      if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
        return;
      }
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const openModal = (day) => {
    setActiveDay(day);
    setStartTime('');
    setEndTime('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveDay(null);
    setStartTime('');
    setEndTime('');
  };

  const addTimeSlot = (e) => {
    e.preventDefault();
    
    if (!startTime || !endTime) {
      alert('Please select both start and end times');
      return;
    }

    if (startTime >= endTime) {
      alert('End time must be later than start time');
      return;
    }

    // Check for today's past time restriction
    const today = new Date();
    if (activeDay.includes('-')) {
      const [y, m, d] = activeDay.split('-').map(Number);
      const selectedDate = new Date(y, m - 1, d);
      if (selectedDate.toDateString() === today.toDateString()) {
        const now = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
        if (startTime < now) {
          alert('You cannot set availability in the past');
          return;
        }
      }
    }

    // Check for conflicts
    const currentSlots = availability[activeDay] || [];
    const hasConflict = currentSlots.some(slot =>
      (startTime < slot.end && endTime > slot.start)
    );

    if (hasConflict) {
      alert('Slot collides with an existing one');
      return;
    }

    // Add the new slot
    const newSlot = { start: startTime, end: endTime };
    setAvailability(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), newSlot]
    }));

    closeModal();
  };

  const deleteSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map(day => (
          <div key={day} className="bg-white border rounded-lg shadow p-2 flex flex-col">
            <div className="font-semibold text-center mb-2">{day}</div>
            <div className="flex flex-col gap-1 mb-2 min-h-[120px]">
              {(availability[day] || []).map((slot, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex justify-between items-center text-xs"
                >
                  <span>{slot.start} - {slot.end}</span>
                  <button
                    onClick={() => deleteSlot(day, index)}
                    className="text-red-600 text-xs hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => openModal(day)}
              className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-sm"
            >
              + Add Slot
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const adjustedFirstDay = (firstDay === 0) ? 6 : firstDay - 1; // Adjust for Monday start

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`}></div>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const thisDate = new Date(currentYear, currentMonth, d);
      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <div
          key={d}
          className="bg-white border rounded-lg shadow p-2 flex flex-col relative min-h-[120px]"
        >
          <div className="font-semibold text-sm mb-1">{d}</div>
          <div className="flex flex-col gap-1 mb-2 flex-grow">
            {(availability[dateKey] || []).map((slot, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex justify-between items-center text-xs"
              >
                <span>{slot.start} - {slot.end}</span>
                <button
                  onClick={() => deleteSlot(dateKey, index)}
                  className="text-red-600 text-xs hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {!isPast && (
            <button
              onClick={() => openModal(dateKey)}
              className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-xs"
            >
              + Add Slot
            </button>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  if (user?.role?.toUpperCase() !== 'THERAPIST') {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Only therapists can manage availability.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Availability</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            ◀
          </button>
          <span className="font-semibold px-4">{getMonthLabel()}</span>
          <button
            onClick={() => navigateMonth(1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            ▶
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1 rounded ${
              currentView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1 rounded ${
              currentView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={saveAvailability}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message}
          <button
            onClick={() => setMessage('')}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !message && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading availability...</p>
        </div>
      )}

      {/* Calendar Views */}
      {!loading && (
        <>
          {currentView === 'week' && renderWeekView()}
          {currentView === 'month' && renderMonthView()}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">
              Add Availability - {activeDay}
            </h2>
            <form onSubmit={addTimeSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-1 w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="mt-1 w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistAvailabilityPage;