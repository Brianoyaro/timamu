import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import { 
  FaCalendarPlus, 
  FaCopy, 
  FaTrash, 
  FaClock, 
  FaRedo,
  FaMagic,
  FaSave,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaUserClock,
  FaBolt
} from 'react-icons/fa';
import { HiOutlineTemplate, HiOutlineCalendar } from 'react-icons/hi';

const localizer = momentLocalizer(moment);

const TherapistAvailabilityPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'template', 'recurring'
  const [view, setView] = useState('week'); // Add view state
  const [date, setDate] = useState(new Date()); // Add date state for navigation
  const [formData, setFormData] = useState({
    title: 'Available',
    start: new Date(),
    end: new Date(),
    recurrence: 'none', // 'none', 'daily', 'weekly', 'monthly'
    duration: 4, // weeks for recurrence
  });

  const user = useAuthStore((state) => state.user);

  // Predefined templates for quick setup
  const availabilityTemplates = [
    {
      name: 'Standard Work Week',
      description: 'Mon-Fri, 9 AM - 5 PM',
      slots: [
        { day: 1, start: '09:00', end: '17:00' }, // Monday
        { day: 2, start: '09:00', end: '17:00' }, // Tuesday
        { day: 3, start: '09:00', end: '17:00' }, // Wednesday
        { day: 4, start: '09:00', end: '17:00' }, // Thursday
        { day: 5, start: '09:00', end: '17:00' }, // Friday
      ]
    },
    {
      name: 'Extended Hours',
      description: 'Mon-Fri, 8 AM - 7 PM',
      slots: [
        { day: 1, start: '08:00', end: '19:00' },
        { day: 2, start: '08:00', end: '19:00' },
        { day: 3, start: '08:00', end: '19:00' },
        { day: 4, start: '08:00', end: '19:00' },
        { day: 5, start: '08:00', end: '19:00' },
      ]
    },
    {
      name: 'Part-Time Schedule',
      description: 'Mon, Wed, Fri - 10 AM - 4 PM',
      slots: [
        { day: 1, start: '10:00', end: '16:00' }, // Monday
        { day: 3, start: '10:00', end: '16:00' }, // Wednesday
        { day: 5, start: '10:00', end: '16:00' }, // Friday
      ]
    },
    {
      name: 'Weekend Warrior',
      description: 'Sat-Sun, 9 AM - 6 PM',
      slots: [
        { day: 6, start: '09:00', end: '18:00' }, // Saturday
        { day: 0, start: '09:00', end: '18:00' }, // Sunday
      ]
    },
    {
      name: 'Evening Sessions',
      description: 'Mon-Thu, 5 PM - 9 PM',
      slots: [
        { day: 1, start: '17:00', end: '21:00' },
        { day: 2, start: '17:00', end: '21:00' },
        { day: 3, start: '17:00', end: '21:00' },
        { day: 4, start: '17:00', end: '21:00' },
      ]
    }
  ];

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get('/therapists/availability');
      const availabilityData = response.data.availability || {};
      
      // Convert availability data to calendar events
      const calendarEvents = [];
      Object.keys(availabilityData).forEach(dateKey => {
        const slots = availabilityData[dateKey];
        if (Array.isArray(slots)) {
          slots.forEach((slot, index) => {
            const startDateTime = moment(`${dateKey} ${slot.start}`).toDate();
            const endDateTime = moment(`${dateKey} ${slot.end}`).toDate();
            
            calendarEvents.push({
              id: `${dateKey}-${index}`,
              title: 'Available',
              start: startDateTime,
              end: endDateTime,
              resource: { dateKey, slotIndex: index }
            });
          });
        }
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading availability:', error);
      setMessage('Error loading availability data');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    try {
      setLoading(true);
      
      // Convert events back to the API format
      const availability = {};
      events.forEach(event => {
        const dateKey = moment(event.start).format('YYYY-MM-DD');
        const startTime = moment(event.start).format('HH:mm');
        const endTime = moment(event.end).format('HH:mm');
        
        if (!availability[dateKey]) {
          availability[dateKey] = [];
        }
        
        availability[dateKey].push({
          start: startTime,
          end: endTime
        });
      });
      
      await api.post('/therapists/availability', { availability });
      setMessage('Availability saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving availability:', error);
      setMessage(`Error: ${error.response?.data?.error || 'Failed to save availability'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = useCallback(({ start, end }) => {
    setFormData({
      title: 'Available',
      start,
      end,
      recurrence: 'none',
      duration: 4,
    });
    setModalType('create');
    setShowModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      start: event.start,
      end: event.end,
      recurrence: 'none',
      duration: 4,
    });
    setModalType('edit');
    setShowModal(true);
  }, []);

  const createAvailabilitySlot = () => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      title: formData.title,
      start: formData.start,
      end: formData.end,
    };

    if (formData.recurrence !== 'none') {
      // Create recurring slots
      const recurringEvents = [];
      const startDate = moment(formData.start);
      const endDate = moment(formData.end);
      const duration = endDate.diff(startDate);
      
      for (let week = 0; week < formData.duration; week++) {
        let nextStart, nextEnd;
        
        if (formData.recurrence === 'weekly') {
          nextStart = startDate.clone().add(week, 'weeks');
          nextEnd = nextStart.clone().add(duration);
        } else if (formData.recurrence === 'daily') {
          nextStart = startDate.clone().add(week * 7, 'days'); // Daily for 4 weeks
          nextEnd = nextStart.clone().add(duration);
        }
        
        recurringEvents.push({
          id: `${Date.now()}-${week}-${Math.random()}`,
          title: formData.title,
          start: nextStart.toDate(),
          end: nextEnd.toDate(),
        });
      }
      
      setEvents(prev => [...prev, ...recurringEvents]);
    } else {
      setEvents(prev => [...prev, newEvent]);
    }
    
    setShowModal(false);
    resetForm();
  };

  const updateAvailabilitySlot = () => {
    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? { ...event, title: formData.title, start: formData.start, end: formData.end }
        : event
    ));
    setShowModal(false);
    resetForm();
  };

  const deleteAvailabilitySlot = () => {
    setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
    setShowModal(false);
    resetForm();
  };

  const clearAllAvailability = () => {
    if (window.confirm('Are you sure you want to clear all availability? This action cannot be undone.')) {
      setEvents([]);
    }
  };

  const applyTemplate = (template) => {
    const startOfWeek = moment().startOf('week').add(1, 'day'); // Start from Monday
    const newEvents = [];
    
    // Apply template for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      template.slots.forEach(slot => {
        const slotDate = startOfWeek.clone().add(week, 'weeks').day(slot.day);
        const startTime = slotDate.clone().set({
          hour: parseInt(slot.start.split(':')[0]),
          minute: parseInt(slot.start.split(':')[1])
        });
        const endTime = slotDate.clone().set({
          hour: parseInt(slot.end.split(':')[0]),
          minute: parseInt(slot.end.split(':')[1])
        });
        
        newEvents.push({
          id: `template-${week}-${slot.day}-${Math.random()}`,
          title: 'Available',
          start: startTime.toDate(),
          end: endTime.toDate(),
        });
      });
    }
    
    setEvents(prev => [...prev, ...newEvents]);
    setMessage(`Applied ${template.name} template for the next 4 weeks`);
    setTimeout(() => setMessage(''), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: 'Available',
      start: new Date(),
      end: new Date(),
      recurrence: 'none',
      duration: 4,
    });
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '8px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaUserClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Availability</h1>
                <p className="text-gray-600">Set your schedule and let patients book sessions</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setModalType('template'); setShowModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
              >
                <HiOutlineTemplate className="w-4 h-4 mr-2" />
                Quick Setup
              </button>
              <button
                onClick={() => { setModalType('recurring'); setShowModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FaRedo className="w-4 h-4 mr-2" />
                Recurring
              </button>
              <button
                onClick={clearAllAvailability}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Clear All
              </button>
              <button
                onClick={saveAvailability}
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-400"
              >
                {loading ? (
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg flex items-center justify-between ${
            message.includes('Error') 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.includes('Error') ? (
                <FaTimes className="w-4 h-4" />
              ) : (
                <FaCheck className="w-4 h-4" />
              )}
              {message}
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                <div className="text-sm text-gray-600">Available Slots</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaClock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(events.reduce((total, event) => {
                    return total + (moment(event.end).diff(moment(event.start), 'hours', true));
                  }, 0))}h
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaBolt className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(events.map(event => moment(event.start).format('YYYY-MM-DD'))).size}
                </div>
                <div className="text-sm text-gray-600">Active Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Availability Calendar</h2>
            <p className="text-sm text-gray-600">
              Click and drag to create new availability slots. Click existing slots to edit or delete them.
            </p>
          </div>
          
          {loading && !events.length ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your availability...</p>
              </div>
            </div>
          ) : (
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onView={setView}
                onNavigate={setDate}
                view={view}
                date={date}
                selectable
                popup
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day']}
                defaultView="week"
                min={moment().hour(6).minute(0).toDate()}
                max={moment().hour(22).minute(0).toDate()}
                step={30}
                timeslots={2}
                className="modern-calendar"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            
            {/* Quick Setup Template Modal */}
            {modalType === 'template' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HiOutlineTemplate className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Quick Setup Templates</h2>
                    <p className="text-sm text-gray-600">Choose a pre-configured schedule</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {availabilityTemplates.map((template, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => {
                        applyTemplate(template);
                        setShowModal(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <FaMagic className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Recurring Availability Modal */}
            {modalType === 'recurring' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FaRedo className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recurring Availability</h2>
                    <p className="text-sm text-gray-600">Set up repeating time slots</p>
                  </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); createAvailabilitySlot(); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setFormData(prev => ({ ...prev, start: new Date(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setFormData(prev => ({ ...prev, end: new Date(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Pattern</label>
                    <select
                      value={formData.recurrence}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="none">No Repeat</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily (Weekdays)</option>
                    </select>
                  </div>
                  
                  {formData.recurrence !== 'none' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration ({formData.recurrence === 'weekly' ? 'weeks' : 'days'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
                    >
                      Create Recurring Slots
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Create/Edit Slot Modal */}
            {(modalType === 'create' || modalType === 'edit') && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaCalendarPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {modalType === 'create' ? 'Create Availability Slot' : 'Edit Availability Slot'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {moment(formData.start).format('MMMM Do, YYYY')}
                    </p>
                  </div>
                </div>
                
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  modalType === 'create' ? createAvailabilitySlot() : updateAvailabilitySlot();
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setFormData(prev => ({ ...prev, start: new Date(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setFormData(prev => ({ ...prev, end: new Date(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-2 pt-4">
                    <div>
                      {modalType === 'edit' && (
                        <button
                          type="button"
                          onClick={deleteAvailabilitySlot}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
                        >
                          <FaTrash className="w-4 h-4 inline mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                      >
                        {modalType === 'create' ? 'Create Slot' : 'Update Slot'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .modern-calendar {
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .rbc-calendar {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        .rbc-header {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          padding: 12px 8px;
          font-weight: 600;
          border: none;
        }
        
        .rbc-toolbar {
          background: #f9fafb;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-toolbar button {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .rbc-time-view {
          border-radius: 0 0 12px 12px;
        }
        
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .rbc-timeslot-group {
          border-right: 1px solid #e5e7eb;
        }
        
        .rbc-event {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .rbc-event:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
        
        .rbc-day-bg {
          background: white;
        }
        
        .rbc-day-bg:hover {
          background: #f8fafc;
        }
        
        .rbc-today {
          background: #eff6ff !important;
        }
        
        .rbc-off-range-bg {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default TherapistAvailabilityPage;