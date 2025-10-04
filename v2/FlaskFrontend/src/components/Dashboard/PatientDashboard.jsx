import { useNavigate } from 'react-router-dom';

const PatientDashboard = ({ stats, user }) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Welcome, {user.firstName}!</h1>
        <p className="text-gray-600">Here's your therapy dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Sessions</h2>
          {stats.sessions?.upcoming && stats.sessions.upcoming.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {stats.sessions.upcoming.map((session) => (
                <li key={session.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{session.time}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/sessions/${session.id}`)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    with Dr. {session.therapist_name}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No upcoming sessions</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Progress tracking coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          {stats.notifications && stats.notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {stats.notifications.map((notification) => (
                <li key={notification.id} className="py-2">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No new notifications</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/book-session')}
            className="py-3 px-4 bg-indigo-100 rounded-lg text-center hover:bg-indigo-200"
          >
            <span className="block text-indigo-700 font-medium">Book Session</span>
          </button>
          <button
            onClick={() => navigate('/messaging')}
            className="py-3 px-4 bg-green-100 rounded-lg text-center hover:bg-green-200"
          >
            <span className="block text-green-700 font-medium">Messages</span>
          </button>
          <button
            onClick={() => navigate('/assignments')}
            className="py-3 px-4 bg-yellow-100 rounded-lg text-center hover:bg-yellow-200"
          >
            <span className="block text-yellow-700 font-medium">Assignments</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="py-3 px-4 bg-purple-100 rounded-lg text-center hover:bg-purple-200"
          >
            <span className="block text-purple-700 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;