import { useState, useEffect } from 'react';
import api from '../../utils/api';

const TherapistVerification = () => {
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchPendingTherapists();
  }, []);

  const fetchPendingTherapists = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/therapists/pending');
      setPendingTherapists(response.data);
    } catch (error) {
      console.error('Error fetching pending therapists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (therapistId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`verify_${therapistId}`]: true }));
      await api.post(`/admin/therapists/${therapistId}/verify`);
      setPendingTherapists(prev => prev.filter(t => t.id !== therapistId));
      alert('Therapist verified successfully!');
    } catch (error) {
      console.error('Error verifying therapist:', error);
      alert('Failed to verify therapist.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`verify_${therapistId}`]: false }));
    }
  };

  const handleReject = async (therapistId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [`reject_${therapistId}`]: true }));
      await api.post(`/admin/therapists/${therapistId}/reject`, { reason });
      setPendingTherapists(prev => prev.filter(t => t.id !== therapistId));
      alert('Therapist application rejected.');
    } catch (error) {
      console.error('Error rejecting therapist:', error);
      alert('Failed to reject therapist.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject_${therapistId}`]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Therapist Verification</h1>
      
      {pendingTherapists.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No pending therapist verifications.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingTherapists.map((therapist) => (
            <div key={therapist.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{therapist.name}</h3>
                  <p className="text-gray-600">{therapist.email}</p>
                  <p className="text-sm text-gray-500">
                    Applied: {new Date(therapist.submissionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p><strong>License Number:</strong> {therapist.license_number || 'Not provided'}</p>
                  <p><strong>Experience:</strong> {therapist.experience || 'Not specified'} years</p>
                  <p><strong>Education:</strong> {therapist.education || 'Not specified'}</p>
                </div>
                <div>
                  <p><strong>Specializations:</strong> {therapist.specializations?.join(', ') || 'Not specified'}</p>
                  <p><strong>Languages:</strong> {therapist.languages?.join(', ') || 'Not specified'}</p>
                </div>
              </div>
              
              {therapist.bio && (
                <div className="mb-4">
                  <p><strong>Bio:</strong></p>
                  <p className="text-gray-700 mt-1">{therapist.bio}</p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleVerify(therapist.id)}
                  disabled={actionLoading[`verify_${therapist.id}`]}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[`verify_${therapist.id}`] ? 'Verifying...' : 'Verify Therapist'}
                </button>
                <button
                  onClick={() => handleReject(therapist.id)}
                  disabled={actionLoading[`reject_${therapist.id}`]}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[`reject_${therapist.id}`] ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TherapistVerification;