import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaLanguage, 
  FaClock, 
  FaHeartbeat,
  FaUserMd,
  FaGraduationCap,
  FaCertificate,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle
} from 'react-icons/fa';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);
  const user = useAuthStore((state) => state.user) || location.state?.user;
  const isNewRegistration = location.state?.isNewRegistration || false;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Patient profile form data
  const [patientData, setPatientData] = useState({
    dateOfBirth: '',
    phone: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    preferredLanguage: 'English',
    timezone: 'UTC'
  });

  // Therapist profile form data
  const [therapistData, setTherapistData] = useState({
    licenseNumber: '',
    specializations: [],
    languages: ['English'],
    experience: '',
    education: '',
    bio: '',
    timezone: 'UTC',
    acceptsEmergency: false
  });

  const specializationOptions = [
    'Anxiety Disorders', 'Depression', 'PTSD', 'Relationship Counseling',
    'Family Therapy', 'Cognitive Behavioral Therapy (CBT)', 'Dialectical Behavior Therapy (DBT)',
    'Addiction Counseling', 'Grief Counseling', 'Child Psychology', 'Adolescent Therapy',
    'Stress Management', 'Eating Disorders', 'Sleep Disorders', 'Bipolar Disorder'
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
  ];

  useEffect(() => {
    // Redirect if no user data
    if (!user) {
      navigate('/login');
      return;
    }

    // Show welcome message for new registrations
    if (isNewRegistration) {
      addToast({
        message: `Welcome ${user.firstName}! Let's set up your profile to get started.`,
        type: 'info',
        duration: 5000
      });
    }
  }, [user, navigate, isNewRegistration, addToast]);

  const handlePatientInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleTherapistInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTherapistData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecializationChange = (specialization) => {
    setTherapistData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageChange = (language) => {
    setTherapistData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const profileData = user.role === 'PATIENT' ? {
        date_of_birth: patientData.dateOfBirth,
        phone: patientData.phone,
        address: patientData.address,
        emergency_contact: patientData.emergencyContact,
        medical_history: patientData.medicalHistory,
        preferred_language: patientData.preferredLanguage,
        timezone: patientData.timezone
      } : {
        license_number: therapistData.licenseNumber,
        specializations: therapistData.specializations,
        languages: therapistData.languages,
        experience: parseInt(therapistData.experience) || 0,
        education: therapistData.education,
        bio: therapistData.bio,
        timezone: therapistData.timezone,
        accepts_emergency: therapistData.acceptsEmergency
      };

      await api.put('/auth/profile', profileData);
      
      addToast({
        message: 'Profile setup completed successfully!',
        type: 'success',
        duration: 5000
      });

      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Profile setup error:', error);
      addToast({
        message: 'Failed to save profile. Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    addToast({
      message: 'You can complete your profile later from the dashboard.',
      type: 'info',
      duration: 5000
    });
    navigate('/dashboard');
  };

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const totalSteps = user.role === 'PATIENT' ? 2 : 3;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                {user.role === 'PATIENT' ? <FaHeartbeat className="w-8 h-8" /> : <FaUserMd className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold">Complete Your Profile</h1>
                <p className="text-blue-100 text-lg">
                  Welcome {user.firstName}! {user.role === 'PATIENT' 
                    ? 'Help us provide you with the best care'
                    : 'Set up your professional profile'
                  }
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2 text-blue-100">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {user.role === 'PATIENT' ? (
              // Patient Profile Steps
              <>
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">Personal Information</h2>
                      <p className="text-gray-600 text-lg">This information helps us provide personalized care</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline w-4 h-4 mr-2 text-blue-600" />
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={patientData.dateOfBirth}
                          onChange={handlePatientInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaPhone className="inline w-4 h-4 mr-2 text-blue-600" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={patientData.phone}
                          onChange={handlePatientInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMapMarkerAlt className="inline w-4 h-4 mr-2 text-blue-600" />
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={patientData.address}
                          onChange={handlePatientInputChange}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Your address (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaLanguage className="inline w-4 h-4 mr-2 text-blue-600" />
                          Preferred Language
                        </label>
                        <select
                          name="preferredLanguage"
                          value={patientData.preferredLanguage}
                          onChange={handlePatientInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {languageOptions.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaClock className="inline w-4 h-4 mr-2 text-blue-600" />
                          Timezone
                        </label>
                        <select
                          name="timezone"
                          value={patientData.timezone}
                          onChange={handlePatientInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">Health & Emergency Information</h2>
                      <p className="text-gray-600 text-lg">This information helps in case of emergencies and better care</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline w-4 h-4 mr-2 text-blue-600" />
                          Emergency Contact
                        </label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={patientData.emergencyContact}
                          onChange={handlePatientInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Name and phone number of emergency contact"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaHeartbeat className="inline w-4 h-4 mr-2 text-blue-600" />
                          Medical History (Optional)
                        </label>
                        <textarea
                          name="medicalHistory"
                          value={patientData.medicalHistory}
                          onChange={handlePatientInputChange}
                          rows="6"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Any relevant medical history, current medications, or conditions you'd like your therapist to know about..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Therapist Profile Steps (similar structure with proper spacing)
              <>
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">Professional Credentials</h2>
                      <p className="text-gray-600 text-lg">Verify your professional qualifications</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCertificate className="inline w-4 h-4 mr-2 text-blue-600" />
                          License Number *
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={therapistData.licenseNumber}
                          onChange={handleTherapistInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Your professional license number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaGraduationCap className="inline w-4 h-4 mr-2 text-blue-600" />
                          Education
                        </label>
                        <textarea
                          name="education"
                          value={therapistData.education}
                          onChange={handleTherapistInputChange}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Your educational background, degrees, certifications..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaClock className="inline w-4 h-4 mr-2 text-blue-600" />
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experience"
                          value={therapistData.experience}
                          onChange={handleTherapistInputChange}
                          min="0"
                          max="50"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Years of professional experience"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional therapist steps would go here */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">Specializations & Languages</h2>
                      <p className="text-gray-600 text-lg">What areas do you specialize in?</p>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Specializations (Select all that apply)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                          {specializationOptions.map(spec => (
                            <label key={spec} className="flex items-center hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={therapistData.specializations.includes(spec)}
                                onChange={() => handleSpecializationChange(spec)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                              />
                              <span className="text-sm text-gray-700">{spec}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Languages Spoken (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto border rounded-lg p-4">
                          {languageOptions.map(lang => (
                            <label key={lang} className="flex items-center hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={therapistData.languages.includes(lang)}
                                onChange={() => handleLanguageChange(lang)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                              />
                              <span className="text-sm text-gray-700">{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">About You & Preferences</h2>
                      <p className="text-gray-600 text-lg">Tell patients about yourself</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Professional Bio
                        </label>
                        <textarea
                          name="bio"
                          value={therapistData.bio}
                          onChange={handleTherapistInputChange}
                          rows="6"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Tell patients about your approach, experience, and what makes you unique..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaClock className="inline w-4 h-4 mr-2 text-blue-600" />
                            Timezone
                          </label>
                          <select
                            name="timezone"
                            value={therapistData.timezone}
                            onChange={handleTherapistInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-center">
                          <label className="flex items-center cursor-pointer bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="checkbox"
                              name="acceptsEmergency"
                              checked={therapistData.acceptsEmergency}
                              onChange={handleTherapistInputChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-700">
                              I accept emergency sessions
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t">
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip for now
            </button>

            <div className="flex gap-4">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              {!isLastStep ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
                >
                  Next
                  <FaArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-4 h-4" />
                      Complete Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;