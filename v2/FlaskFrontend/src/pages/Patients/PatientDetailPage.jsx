import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';
import { 
  FiUser, 
  FiClock, 
  FiCalendar, 
  FiBook,
  FiPhone,
  FiMail,
  FiMapPin,
  FiArrowLeft,
  FiExternalLink
} from 'react-icons/fi';

const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${patientId}`);
      setPatient(response.data);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
            <p className="text-gray-600 mb-8">The requested patient could not be found.</p>
            <button
              onClick={() => navigate('/patients')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <FiArrowLeft className="h-5 w-5 mr-2" />
            Back to Patients
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600">{patient.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Session History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Session History</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {sessions.length > 0 ? (
                  sessions.map(session => (
                    <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.title || 'Therapy Session'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(session.scheduled_at).toLocaleString()}
                          </p>
                          {session.notes && (
                            <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            session.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FiClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                    <p className="text-gray-500">This patient hasn't had any sessions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Patient Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
              </div>
              <div className="p-6 space-y-4">
                {patient.phone && (
                  <div className="flex items-center">
                    <FiPhone className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <FiMail className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{patient.email}</span>
                </div>
                {patient.address && (
                  <div className="flex items-center">
                    <FiMapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <button
                  onClick={() => navigate('/sessions/schedule', { state: { patientId } })}
                  className="w-full mb-3 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiCalendar className="h-5 w-5 mr-2" />
                  Schedule Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;