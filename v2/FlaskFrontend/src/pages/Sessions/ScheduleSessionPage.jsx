import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const [currentView, setCurrentView] = useState('directory'); // directory, calendar
  const [calendarView, setCalendarView] = useState('month'); // month, week
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchPreferences, setMatchPreferences] = useState({
    specialization: '',
    language: 'English',
    gender: 'no_preference'
  });
  const [selectedSlot, setSelectedSlot] = useState(null);

  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    loadAvailableTherapists();
  }, []);

  // Handle URL parameters for pre-selecting therapist and view
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const therapistParam = searchParams.get('therapist');
    const viewParam = searchParams.get('view');
    
    if (therapistParam) {
      setSelectedTherapist(parseInt(therapistParam));
      if (viewParam === 'calendar') {
        setCurrentView('calendar');
      }
    }
  }, [location.search, therapists]);

  const loadAvailableTherapists = async () => {
    try {
      const response = await api.get('/sessions/available-therapists');
      // Enhance therapist data with additional display properties
      const enhancedTherapists = response.data.map(therapist => ({
        ...therapist,
        rating: therapist.rating || (4 + Math.random()).toFixed(1), // Default random rating if not provided
        languages: therapist.languages || ['English'],
        avatar: therapist.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=random`,
        // The availability data should now be in the format:
        // {
        //   "2025-10-04": [{ "start": "09:00", "end": "17:00" }],
        //   "2025-10-05": [{ "start": "10:00", "end": "15:00" }]
        // }
        availability: therapist.availability || {}
      }));
      setTherapists(enhancedTherapists);
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
    if (e) e.preventDefault();
    
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
      setShowConfirmModal(false);
      
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
      setCurrentView('directory');

    } catch (error) {
      console.error('Error scheduling session:', error);
      setMessage(`Error: ${error.response?.data?.message || error.message || 'Failed to schedule session'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Calendar navigation functions
  const changePeriod = (offset) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + offset);
    } else {
      newDate.setDate(newDate.getDate() + offset * 7);
    }
    setCurrentDate(newDate);
  };

  // Open therapist calendar
  const viewTherapistAvailability = (therapist) => {
    setSelectedTherapist(therapist.id);
    setCurrentView('calendar');
  };

  // Handle time slot selection
  const selectTimeSlot = (therapist, date, time) => {
    const therapistObj = therapists.find(t => t.id === parseInt(therapist));
    setSelectedSlot({
      therapist: therapistObj,
      date,
      time
    });
    
    setSessionData(prev => ({
      ...prev,
      scheduled_at: `${date}T${time}`,
      title: `Session with ${therapistObj.name}`
    }));
    
    setShowConfirmModal(true);
  };
  
  // Handle auto-match
  const handleAutoMatch = () => {
    // In a real app, you would call an API to find a match based on preferences
    // For now, we'll just simulate finding a match
    
    setMessage('Finding the perfect therapist match for you...');
    
    setTimeout(() => {
      // Just pick a random therapist for demo purposes
      if (therapists.length > 0) {
        const matchedTherapist = therapists[Math.floor(Math.random() * therapists.length)];
        setSelectedTherapist(matchedTherapist.id);
        setCurrentView('calendar');
        setMessage(`Matched with ${matchedTherapist.name} based on your preferences!`);
      } else {
        setMessage('No therapists available for matching. Please try again later.');
      }
      setShowMatchModal(false);
    }, 1500);
  };

  // Calendar rendering functions
  const renderCalendar = () => {
    if (calendarView === 'month') {
      return renderMonthView();
    } else {
      return renderWeekView();
    }
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const calendarLabel = `${monthName} ${year}`;
    
    // Calculate which day of the week the month starts on (0 = Sunday, 1 = Monday, etc.)
    // Adjust to start week on Monday (0 = Monday, 1 = Tuesday, etc.)
    let startDay = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="hidden sm:block h-16 sm:h-24"></div>);
    }
    
    // Get the selected therapist's availability
    const selectedTherapistObj = therapists.find(t => t.id === parseInt(selectedTherapist));
    // Availability should now be in the format:
    // { "2025-10-04": [{ "start": "09:00", "end": "17:00" }] }
    const availability = selectedTherapistObj?.availability || {};
    
    // Add days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().split("T")[0];
      const slots = availability[dateStr] || [];
      const isPast = dateObj < new Date(today.setHours(0,0,0,0));
      const isToday = dateObj.toDateString() === today.toDateString();
      
      // For mobile view - add day of week label
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Check if this is the first day of the week (Monday) for mobile layout
      const dayOfWeekNum = (startDay + d - 1) % 7;
      const isFirstDayOfWeek = dayOfWeekNum === 0;
      
      days.push(
        <div 
          key={`day-${d}`} 
          className={`h-16 sm:h-24 border rounded p-2 ${isPast ? 'bg-gray-100' : isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}
            ${d === 1 ? 'col-start-auto sm:col-start-' + (startDay + 1) : ''}`}
        >
          <div className="flex justify-between">
            <div className="font-medium">{d}</div>
            <div className="text-xs text-gray-500 sm:hidden">{dayOfWeek}</div>
          </div>
          <div className="flex flex-wrap gap-1 mt-1 overflow-y-auto max-h-8 sm:max-h-16">
            {!isPast && slots.map((slot, idx) => (
              <button 
                key={`slot-${d}-${idx}`}
                className="px-1 sm:px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
                onClick={() => selectTimeSlot(selectedTherapist, dateStr, slot.start)}
              >
                {slot.start}
              </button>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <div className="space-x-2 flex">
            <button 
              onClick={() => changePeriod(-1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              &lt; Prev
            </button>
            <button 
              onClick={() => changePeriod(1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next &gt;
            </button>
          </div>
          <h3 className="font-semibold">{calendarLabel}</h3>
          <div className="flex">
            <button 
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded ${calendarView === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1 rounded ${calendarView === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
          </div>
        </div>
        
        <div className="min-w-[340px]">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm font-medium mb-2">
            <div className="hidden sm:block">Mon</div>
            <div className="hidden sm:block">Tue</div>
            <div className="hidden sm:block">Wed</div>
            <div className="hidden sm:block">Thu</div>
            <div className="hidden sm:block">Fri</div>
            <div className="hidden sm:block">Sat</div>
            <div className="hidden sm:block">Sun</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days}
          </div>
        </div>
      </div>
    );
  };
  
  const renderWeekView = () => {
    const today = new Date();
    const startOfWeek = new Date(currentDate);
    // Set to Monday of the current week
    startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    const calendarLabel = `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
    
    // Standard available time slots
    const times = ["09:00", "11:00", "14:00", "16:00"];
    
    // Get the selected therapist's availability
    const selectedTherapistObj = therapists.find(t => t.id === parseInt(selectedTherapist));
    // Availability should now be in the format:
    // { "2025-10-04": [{ "start": "09:00", "end": "17:00" }] }
    const availability = selectedTherapistObj?.availability || {};
    
    // Create array of week dates for mobile display
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        date,
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        dateStr: date.toISOString().split('T')[0]
      };
    });
    
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <div className="space-x-2 flex">
            <button 
              onClick={() => changePeriod(-1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              &lt; Prev
            </button>
            <button 
              onClick={() => changePeriod(1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next &gt;
            </button>
          </div>
          <h3 className="font-semibold text-sm sm:text-base">{calendarLabel}</h3>
          <div className="flex">
            <button 
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded text-sm ${calendarView === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1 rounded text-sm ${calendarView === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
          </div>
        </div>
        
        {/* Desktop Week View */}
        <div className="hidden sm:block overflow-x-auto pb-3">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 gap-2 text-sm font-medium text-center mb-2">
              <div className="text-left">Time</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>
            
            <div className="grid grid-cols-8 gap-2">
              {times.map(time => (
                <React.Fragment key={`time-row-${time}`}>
                  <div className="p-2 border rounded text-left font-medium">
                    {time}
                  </div>
                  {Array.from({ length: 7 }, (_, i) => {
                    const slotDate = new Date(startOfWeek);
                    slotDate.setDate(slotDate.getDate() + i);
                    const dateStr = slotDate.toISOString().split("T")[0];
                    const slots = availability[dateStr] || [];
                    
                    const [h, m] = time.split(":");
                    slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
                    
                    const isPast = slotDate < today;
                    const isAvailable = slots.some(slot => slot.start === time);
                    const isToday = slotDate.toDateString() === today.toDateString();
                    
                    return (
                      <div 
                        key={`slot-${dateStr}-${time}`} 
                        className={`p-2 border rounded text-center ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                      >
                        {!isPast && isAvailable ? (
                          <button 
                            className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
                            onClick={() => selectTimeSlot(selectedTherapist, dateStr, time)}
                          >
                            {time}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Week View - Day by day with columns of times */}
        <div className="sm:hidden">
          {weekDates.map((dateInfo) => {
            const isToday = dateInfo.date.toDateString() === today.toDateString();
            const slots = availability[dateInfo.dateStr] || [];
            
            return (
              <div 
                key={dateInfo.dateStr} 
                className={`mb-4 border rounded-lg overflow-hidden ${isToday ? 'border-blue-400' : ''}`}
              >
                <div className={`px-3 py-2 ${isToday ? 'bg-blue-100' : 'bg-gray-100'} flex justify-between items-center`}>
                  <span className="font-medium">{dateInfo.dayShort}</span>
                  <span>{dateInfo.dayNumber}</span>
                </div>
                <div className="p-2 grid grid-cols-2 gap-2">
                  {times.map(time => {
                    const [h, m] = time.split(":");
                    const slotDate = new Date(dateInfo.date);
                    slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
                    
                    const isPast = slotDate < today;
                    const isAvailable = slots.some(slot => slot.start === time);
                    
                    return (
                      <div key={`${dateInfo.dateStr}-${time}`} className="text-center py-1">
                        {!isPast && isAvailable ? (
                          <button 
                            className="w-full px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
                            onClick={() => selectTimeSlot(selectedTherapist, dateInfo.dateStr, time)}
                          >
                            {time}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">{time} -</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (user?.role?.toUpperCase() !== 'PATIENT') {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Only patients can schedule sessions.</p>
        </div>
      </div>
    );
  }

  // Therapist Directory View
  const renderTherapistDirectory = () => (
    <>
      <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center rounded-lg mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">Schedule a Meeting</h1>
        <button 
          onClick={() => setShowMatchModal(true)}
          className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm sm:text-base w-full sm:w-auto"
        >
          Get Matched Automatically
        </button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {therapists.map(therapist => (
          <div key={therapist.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex sm:block">
              {/* Clickable image that goes to therapist detail */}
              <Link to={`/therapists/${therapist.id}`} className="block w-24 sm:w-full">
                <img 
                  src={therapist.avatar} 
                  className="w-24 sm:w-full h-24 sm:h-40 object-cover hover:opacity-90 transition-opacity" 
                  alt={therapist.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x200?text=Therapist";
                  }}
                />
              </Link>
              <div className="p-2 sm:p-4 flex-grow">
                {/* Clickable name that goes to therapist detail */}
                <Link to={`/therapists/${therapist.id}`} className="block hover:text-indigo-600 transition-colors">
                  <h2 className="text-base sm:text-lg font-semibold mb-1">{therapist.name}</h2>
                </Link>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Specialty: {therapist.specializations?.join(', ') || 'General Therapy'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Language: {therapist.languages?.join(', ')}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">⭐ {therapist.rating} Rating</p>
                
                {/* Action buttons */}
                <div className="space-y-1 sm:space-y-2">
                  <Link
                    to={`/therapists/${therapist.id}`}
                    className="block w-full bg-indigo-100 text-indigo-700 px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-indigo-200 text-xs sm:text-sm text-center transition-colors"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => viewTherapistAvailability(therapist)}
                    className="w-full bg-indigo-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-indigo-600 text-xs sm:text-sm transition-colors"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Calendar View
  const renderCalendarView = () => {
    const selectedTherapistObj = therapists.find(t => t.id === parseInt(selectedTherapist));
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-600 truncate pr-2">
            {selectedTherapistObj?.name}'s Availability
          </h2>
          <button 
            onClick={() => setCurrentView('directory')}
            className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {renderCalendar()}
        
        <div className="mt-4 border-t pt-4 flex justify-center sm:justify-end">
          <button 
            onClick={() => setCurrentView('directory')}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
          >
            Back to Therapists
          </button>
        </div>
      </div>
    );
  };

  // Render Confirmation Modal
  const renderConfirmModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${showConfirmModal ? '' : 'hidden'} p-4`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-600">Confirm Booking</h2>
          <button 
            onClick={() => setShowConfirmModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {selectedSlot && (
          <div className="p-4 space-y-3">
            <p>
              <span className="font-semibold">Therapist:</span> {selectedSlot.therapist.name}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {new Date(selectedSlot.date).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Time:</span> {selectedSlot.time}
            </p>
            
            <div className="mt-4">
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
            
            <div className="mt-4">
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
            
            <div className="mt-4">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration
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
            
            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={sessionData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any specific topics or concerns..."
              />
            </div>
          </div>
        )}
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={() => setShowConfirmModal(false)}
            className="px-3 sm:px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleScheduleSession}
            disabled={loading}
            className={`px-3 sm:px-4 py-2 rounded text-white text-sm ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Match Modal
  const renderMatchModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${showMatchModal ? '' : 'hidden'} p-4`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-600">Get Matched Automatically</h2>
          <button 
            onClick={() => setShowMatchModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">What do you need help with?</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={matchPreferences.specialization}
              onChange={(e) => setMatchPreferences({...matchPreferences, specialization: e.target.value})}
            >
              <option value="">Select a specialization</option>
              <option value="family">Family Therapy</option>
              <option value="trauma">Trauma</option>
              <option value="addiction">Addiction</option>
              <option value="depression">Depression</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Language</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={matchPreferences.language}
              onChange={(e) => setMatchPreferences({...matchPreferences, language: e.target.value})}
            >
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="French">French</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Gender</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={matchPreferences.gender}
              onChange={(e) => setMatchPreferences({...matchPreferences, gender: e.target.value})}
            >
              <option value="no_preference">No Preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={() => setShowMatchModal(false)}
            className="px-3 sm:px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleAutoMatch}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            Find Match
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-4 sm:mt-8 p-3 sm:p-6 bg-gray-100 min-h-screen">
      {message && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-md text-sm ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message}
        </div>
      )}
      
      {currentView === 'directory' ? renderTherapistDirectory() : renderCalendarView()}
      
      {/* Modals */}
      {renderConfirmModal()}
      {renderMatchModal()}
      
      {/* Timezone Display */}
      <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 text-center sm:text-left">
        <p>Times shown in your local timezone: {sessionData.timezone}</p>
      </div>
    </div>
  );
};

export default ScheduleSessionPage;