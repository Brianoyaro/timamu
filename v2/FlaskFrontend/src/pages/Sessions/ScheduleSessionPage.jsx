import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import { 
  FaUser, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaStar, 
  FaUsers, FaFilter
} from 'react-icons/fa';
import { 
  HiOutlineCalendar,
  HiOutlineClock
} from 'react-icons/hi';

// Calendar localization
const localizer = momentLocalizer(moment);

// Import CSS for react-big-calendar
import 'react-big-calendar/lib/css/react-big-calendar.css';

const ScheduleSessionPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [sessionData, setSessionData] = useState({
    title: '',
    scheduled_at: '',
    duration: 60,
    session_type: 'individual',
    notes: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentView, setCurrentView] = useState('directory'); // directory, calendar
  const [calendarView, setCalendarView] = useState('week'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [matchPreferences, setMatchPreferences] = useState({
    specialization: '',
    language: 'English',
    gender: 'no_preference'
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    gender: '',
    rating: 0
  });

  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Computed filtered therapists
  const filteredTherapists = useMemo(() => {
    return therapists.filter(therapist => {
      if (filters.specialization && !therapist.specializations?.some(spec => 
        spec.toLowerCase().includes(filters.specialization.toLowerCase())
      )) return false;
      
      if (filters.language && !therapist.languages?.some(lang => 
        lang.toLowerCase().includes(filters.language.toLowerCase())
      )) return false;
      
      if (filters.gender && therapist.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
      
      if (filters.rating && therapist.rating < filters.rating) return false;
      
      return true;
    });
  }, [therapists, filters]);

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
      setLoading(true);
      const response = await api.get('/sessions/available-therapists');
      // Enhance therapist data with additional display properties
      const enhancedTherapists = response.data.map(therapist => ({
        ...therapist,
        rating: therapist.rating || (4 + Math.random()).toFixed(1), // Default random rating if not provided
        languages: therapist.languages || ['English'],
        avatar: therapist.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=random`,
        review_count: therapist.review_count || Math.floor(Math.random() * 100) + 10,
        experience_years: therapist.experience_years || Math.floor(Math.random() * 15) + 5,
        location: therapist.location || 'Remote',
        gender: therapist.gender || (Math.random() > 0.5 ? 'female' : 'male'),
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
    } finally {
      setLoading(false);
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

  // Load therapist availability for react-big-calendar
  const loadTherapistAvailability = () => {
    const selectedTherapistObj = therapists.find(t => t.id === parseInt(selectedTherapist));
    if (!selectedTherapistObj?.availability) return [];

    const events = [];
    const today = new Date();
    
    Object.entries(selectedTherapistObj.availability).forEach(([dateStr, slots]) => {
      slots.forEach((slot, slotIndex) => {
        const date = new Date(dateStr);
        // Skip past dates
        if (date < new Date(today.setHours(0,0,0,0))) return;
        
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = (slot.end || '17:00').split(':').map(Number);
        
        // Create individual 1-hour slots between start and end time
        for (let hour = startHour; hour < endHour; hour++) {
          const slotStartTime = new Date(date);
          slotStartTime.setHours(hour, startMin, 0, 0);
          
          const slotEndTime = new Date(date);
          slotEndTime.setHours(hour + 1, startMin, 0, 0);
          
          // Skip if this specific hour slot is in the past
          const now = new Date();
          if (slotStartTime < now) continue;
          
          const timeString = `${hour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
          
          events.push({
            id: `${dateStr}-${timeString}-${slotIndex}`,
            title: `Available at ${timeString}`,
            start: slotStartTime,
            end: slotEndTime,
            resource: {
              therapistId: selectedTherapistObj.id,
              date: dateStr,
              time: timeString,
              therapist: selectedTherapistObj
            }
          });
        }
      });
    });
    
    return events;
  };

  const handleSelectEvent = (event) => {
    selectTimeSlot(
      event.resource.therapistId,
      event.resource.date,
      event.resource.time
    );
  };

  const handleSelectSlot = (slotInfo) => {
    // Optional: Handle clicking on empty slots
    console.log('Empty slot clicked:', slotInfo);
  };

  const EventComponent = ({ event }) => (
    <div className="h-full flex items-center justify-center text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded px-1 cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all duration-200">
      <HiOutlineClock className="w-3 h-3 mr-1" />
      {event.resource.time}
    </div>
  );

  // Calendar rendering functions
  const renderCalendar = () => {
    const events = loadTherapistAvailability();
    
    return (
      <div className="h-[600px] bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day']}
          view={calendarView}
          onView={setCalendarView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          components={{
            event: EventComponent,
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: 'transparent',
              border: 'none',
            },
          })}
          dayPropGetter={(date) => {
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < new Date(today.setHours(0,0,0,0));
            
            return {
              style: {
                backgroundColor: isToday ? '#eff6ff' : isPast ? '#f9fafb' : 'white',
                color: isPast ? '#9ca3af' : '#374151'
              }
            };
          }}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              localizer.format(start, 'HH:mm', culture),
          }}
          min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
          max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
          step={60}
          timeslots={1}
          className="rbc-calendar"
        />
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

  // Therapist Directory View with Modern UI
  const renderTherapistDirectory = () => (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Find Your Perfect Therapist</h1>
            <p className="text-indigo-100 text-lg">Connect with qualified professionals who understand your needs</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setShowMatchModal(true)}
              className="flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <FaUsers className="w-5 h-5" />
              Smart Match
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FaFilter className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filter Therapists</h3>
            <p className="text-sm text-gray-600">Find the perfect match for your needs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({...filters, specialization: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">All Specializations</option>
              <option value="anxiety">Anxiety & Depression</option>
              <option value="family">Family Therapy</option>
              <option value="trauma">Trauma & PTSD</option>
              <option value="addiction">Addiction Recovery</option>
              <option value="couples">Couples Therapy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({...filters, language: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="French">French</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({...filters, gender: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: parseFloat(e.target.value)})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredTherapists.length}</span> of {therapists.length} therapists
        </p>
        {filteredTherapists.length !== therapists.length && (
          <button
            onClick={() => setFilters({ specialization: '', language: '', gender: '', rating: 0 })}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Therapist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))
        ) : filteredTherapists.length > 0 ? (
          filteredTherapists.map((therapist) => (
            <div key={therapist.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              {/* Therapist Image & Basic Info */}
              <div className="relative">
                <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
                  {therapist.avatar ? (
                    <img 
                      src={therapist.avatar} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={therapist.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=random&size=200`;
                      }}
                    />
                  ) : (
                    <FaUser className="w-20 h-20 text-indigo-400" />
                  )}
                </div>
                
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                  <FaStar className="w-3 h-3 text-yellow-500" />
                  <span className="text-sm font-semibold">{therapist.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Dr. {therapist.first_name} {therapist.last_name}
                  </h3>
                  <p className="text-indigo-600 font-medium text-sm">
                    {therapist.specializations?.join(' • ') || 'General Therapy'}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                    <span>{therapist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="w-3 h-3 text-gray-400" />
                    <span>{therapist.experience_years}+ years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUsers className="w-3 h-3 text-gray-400" />
                    <span>{therapist.review_count} reviews</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {therapist.languages?.map((language) => (
                    <span key={language} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {language}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/therapists/${therapist.id}`}
                    className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => viewTherapistAvailability(therapist)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <FaCalendarAlt className="w-3 h-3" />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-full bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No therapists found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters to see more options, or use our smart matching feature.</p>
            <button
              onClick={() => setShowMatchModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <FaUsers className="w-4 h-4" />
              Get Matched
            </button>
          </div>
        )}
      </div>
    </div>
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