import { useState } from 'react';
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
  FaTimes,
  FaArrowRight,
  FaForward
} from 'react-icons/fa';
import { useToastStore } from '../../stores/toastStore';
import api from '../../utils/api';

const ProfileSetupModal = ({ isOpen, onClose, user, onProfileComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

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

      onProfileComplete();
      onClose();
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
    onProfileComplete();
    onClose();
  };

  if (!isOpen || !user) return null;

  const totalSteps = user.role === 'PATIENT' ? 2 : 3;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {user.role === 'PATIENT' ? <FaHeartbeat className="w-6 h-6" /> : <FaUserMd className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-blue-100">
                {user.role === 'PATIENT' 
                  ? 'Help us provide you with the best care'
                  : 'Set up your professional profile'
                }
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2 text-blue-100">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {user.role === 'PATIENT' ? (
            // Patient Profile Steps
            <>
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
                    <p className="text-gray-600">This information helps us provide personalized care</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline w-4 h-4 mr-2" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={patientData.dateOfBirth}
                        onChange={handlePatientInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="inline w-4 h-4 mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={patientData.phone}
                        onChange={handlePatientInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline w-4 h-4 mr-2" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={patientData.address}
                        onChange={handlePatientInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your address (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaLanguage className="inline w-4 h-4 mr-2" />
                        Preferred Language
                      </label>
                      <select
                        name="preferredLanguage"
                        value={patientData.preferredLanguage}
                        onChange={handlePatientInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {languageOptions.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline w-4 h-4 mr-2" />
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        value={patientData.timezone}
                        onChange={handlePatientInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Health & Emergency Information</h3>
                    <p className="text-gray-600">This information helps in case of emergencies and better care</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="inline w-4 h-4 mr-2" />
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={patientData.emergencyContact}
                        onChange={handlePatientInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Name and phone number of emergency contact"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaHeartbeat className="inline w-4 h-4 mr-2" />
                        Medical History (Optional)
                      </label>
                      <textarea
                        name="medicalHistory"
                        value={patientData.medicalHistory}
                        onChange={handlePatientInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any relevant medical history, current medications, or conditions you'd like your therapist to know about..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Therapist Profile Steps
            <>
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Credentials</h3>
                    <p className="text-gray-600">Verify your professional qualifications</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCertificate className="inline w-4 h-4 mr-2" />
                        License Number *
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={therapistData.licenseNumber}
                        onChange={handleTherapistInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your professional license number"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaGraduationCap className="inline w-4 h-4 mr-2" />
                        Education
                      </label>
                      <textarea
                        name="education"
                        value={therapistData.education}
                        onChange={handleTherapistInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your educational background, degrees, certifications..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline w-4 h-4 mr-2" />
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={therapistData.experience}
                        onChange={handleTherapistInputChange}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Years of professional experience"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Specializations & Languages</h3>
                    <p className="text-gray-600">What areas do you specialize in?</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Specializations (Select all that apply)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {specializationOptions.map(spec => (
                          <label key={spec} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={therapistData.specializations.includes(spec)}
                              onChange={() => handleSpecializationChange(spec)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Languages Spoken (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {languageOptions.map(lang => (
                          <label key={lang} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={therapistData.languages.includes(lang)}
                              onChange={() => handleLanguageChange(lang)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">About You & Preferences</h3>
                    <p className="text-gray-600">Tell patients about yourself</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Bio
                      </label>
                      <textarea
                        name="bio"
                        value={therapistData.bio}
                        onChange={handleTherapistInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell patients about your approach, experience, and what makes you unique..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaClock className="inline w-4 h-4 mr-2" />
                          Timezone
                        </label>
                        <select
                          name="timezone"
                          value={therapistData.timezone}
                          onChange={handleTherapistInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="acceptsEmergency"
                            checked={therapistData.acceptsEmergency}
                            onChange={handleTherapistInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
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
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaForward className="w-4 h-4" />
            Skip for now
          </button>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <FaArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <FaArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;