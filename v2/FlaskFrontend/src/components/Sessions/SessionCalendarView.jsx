import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';

const SessionCalendarView = ({ onSelectSession }) => {
  const { sessions } = useSessionStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week of first day in month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Calendar navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Date formatting
  const formatMonth = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySessionsCount = getSessionsForDate(date).length;
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const isInPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-100 p-2 cursor-pointer transition-colors
            ${isToday ? 'bg-blue-50' : ''}
            ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50' : ''}
            ${isInPast && !isToday ? 'bg-gray-50' : ''}
            hover:bg-blue-50`}
        >
          <div className="flex justify-between">
            <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
              {day}
            </span>
            {daySessionsCount > 0 && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {daySessionsCount}
              </span>
            )}
          </div>
          
          {daySessionsCount > 0 && (
            <div className="mt-1 space-y-1 overflow-hidden max-h-16">
              {getSessionsForDate(date).slice(0, 2).map((session, idx) => (
                <div 
                  key={idx}
                  className={`text-xs px-1.5 py-0.5 rounded truncate
                    ${session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'}`}
                >
                  {new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              ))}
              {daySessionsCount > 2 && (
                <div className="text-xs text-gray-500">+{daySessionsCount - 2} more</div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // Sessions for selected date
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Session Calendar</h3>
        <div className="flex items-center space-x-4">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">{formatMonth(currentMonth)}</span>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px mb-2 text-center text-sm font-medium text-gray-700">
          <div className="py-2">Sun</div>
          <div className="py-2">Mon</div>
          <div className="py-2">Tue</div>
          <div className="py-2">Wed</div>
          <div className="py-2">Thu</div>
          <div className="py-2">Fri</div>
          <div className="py-2">Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px">
          {renderCalendarDays()}
        </div>

        {/* Selected Date Sessions */}
        {selectedDate && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="text-blue-600 w-5 h-5" />
              <h4 className="font-medium text-lg">
                Sessions for {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h4>
            </div>

            {selectedDateSessions.length > 0 ? (
              <div className="space-y-3">
                {selectedDateSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession?.(session)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{session.title}</h5>
                        <p className="text-sm text-gray-600">
                          {new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {session.duration} minutes
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.therapist_name || session.patient_name}
                        </p>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full
                          ${session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            session.status === 'started' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {session.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500">No sessions scheduled for this date.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCalendarView;