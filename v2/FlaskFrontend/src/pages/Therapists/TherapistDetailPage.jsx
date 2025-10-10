import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';

const TherapistDetailPage = () => {
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);

  const user = useAuthStore((state) => state.user);
  
  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadTherapistDetails();
  }, [therapistId]);

  const loadTherapistDetails = async () => {
    try {
      setLoading(true);
      // Get therapist details from the dedicated endpoint
      const response = await api.get(`/therapists/${therapistId}`);
      const therapistData = response.data;
      
      // Enhance with calculated fields and UI-friendly data
      const enhancedTherapist = {
        ...therapistData,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(therapistData.name)}&background=random&size=300`,
        rating: (4 + Math.random()).toFixed(1), // Mock rating for now
        reviewCount: Math.floor(Math.random() * 50) + 10, // Mock review count
        hourlyRate: Math.floor(Math.random() * 50) + 50, // Mock rate for now
        acceptsInsurance: true, // Mock for now
        availableHours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 2:00 PM', // Mock for now
        responseTime: '24 hours', // Mock for now
        certifications: [
          'Licensed Clinical Therapist',
          'Cognitive Behavioral Therapy Specialist',
          'Trauma-Informed Care Certified'
        ], // Mock for now
        approachDescription: therapistData.bio || 'I believe in creating a safe, non-judgmental space where clients can explore their thoughts and feelings. My approach combines evidence-based techniques with compassionate understanding to help individuals overcome challenges and achieve their goals.',
        treatmentApproaches: [
          'Cognitive Behavioral Therapy (CBT)',
          'Dialectical Behavior Therapy (DBT)',
          'Mindfulness-Based Therapy',
          'Solution-Focused Brief Therapy'
        ], // Mock for now
        areasOfExpertise: therapistData.specializations || [
          'Anxiety & Depression',
          'Relationship Issues',
          'Stress Management',
          'Life Transitions'
        ],
        sessionFormats: ['Individual Therapy', 'Couples Therapy', 'Group Therapy'], // Mock for now
        ageGroups: ['Adults (18+)', 'Young Adults (18-25)', 'Seniors (65+)'], // Mock for now
        yearsOfExperience: therapistData.experience || Math.floor(Math.random() * 15) + 5,
        reviews: [
          {
            id: 1,
            rating: 5,
            comment: "Dr. " + therapistData.name.split(' ')[1] + " has been incredibly helpful in my journey. Very professional and understanding.",
            date: "2024-09-15",
            initials: "A.K."
          },
          {
            id: 2,
            rating: 5,
            comment: "Excellent therapist! I've seen significant improvement in my mental health since starting sessions.",
            date: "2024-08-22",
            initials: "M.W."
          },
          {
            id: 3,
            rating: 4,
            comment: "Great listener and provides practical strategies. Would recommend!",
            date: "2024-07-10",
            initials: "J.M."
          }
        ] // Mock reviews for now
      };

      setTherapist(enhancedTherapist);
    } catch (error) {
      console.error('Error loading therapist details:', error);
      setError('Failed to load therapist details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    // Navigate to schedule page with this therapist pre-selected and show their availability
    navigate(`/sessions/schedule?therapist=${therapistId}&view=calendar`);
  };

  const handleSendMessage = () => {
    // In a real app, this would open a messaging interface
    alert('Messaging feature coming soon!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <Link to="/sessions/schedule" className="text-red-600 underline mt-2 inline-block">
            ← Back to therapist directory
          </Link>
        </div>
      </div>
    );
  }

  if (!therapist) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link 
          to="/sessions/schedule" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Therapist Directory
        </Link>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img 
              src={therapist.avatar} 
              alt={therapist.name}
              className="w-full h-64 md:h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300x400?text=Therapist";
              }}
            />
          </div>
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{therapist.name}</h1>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(therapist.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">
                      {therapist.rating} ({therapist.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>{therapist.yearsOfExperience}</strong> years of experience
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {therapist.languages.map((language, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Only show for patients */}
              {user?.role?.toUpperCase() === 'PATIENT' && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleBookSession}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Book Session
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Send Message
                  </button>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">${therapist.hourlyRate}</div>
                <div className="text-sm text-gray-600">per session</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{therapist.total_sessions || '100+'}+</div>
                <div className="text-sm text-gray-600">sessions</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{therapist.responseTime}</div>
                <div className="text-sm text-gray-600">response time</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {therapist.acceptsInsurance ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-600">insurance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {therapist.approachDescription}
            </p>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Education & Credentials</h3>
              <p className="text-gray-700 mb-2">{therapist.education || 'Ph.D. in Clinical Psychology'}</p>
              <div className="flex flex-wrap gap-2">
                {therapist.certifications.map((cert, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Treatment Approaches */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Treatment Approaches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {therapist.treatmentApproaches.map((approach, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{approach}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas of Expertise */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas of Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {therapist.areasOfExpertise.map((area, index) => (
                <span 
                  key={index}
                  className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Reviews</h2>
            <div className="space-y-4">
              {therapist.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {review.initials} • {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Availability</h3>
            <div className="space-y-2">
              <div className="text-gray-700 whitespace-pre-line">
                {therapist.availableHours}
              </div>
            </div>
            
            {user?.role?.toUpperCase() === 'PATIENT' && (
              <button
                onClick={handleBookSession}
                className="w-full mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                View Available Times
              </button>
            )}
          </div>

          {/* Session Formats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Session Formats</h3>
            <div className="space-y-2">
              {therapist.sessionFormats.map((format, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{format}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Age Groups</h3>
            <div className="space-y-2">
              {therapist.ageGroups.map((group, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{group}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact & Booking</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Response Time:</strong> {therapist.responseTime}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Insurance:</strong> {therapist.acceptsInsurance ? 'Accepted' : 'Not Accepted'}
              </div>
              
              {user?.role?.toUpperCase() === 'PATIENT' && (
                <div className="space-y-2 pt-2 border-t">
                  <button
                    onClick={handleBookSession}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Schedule Session
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDetailPage;