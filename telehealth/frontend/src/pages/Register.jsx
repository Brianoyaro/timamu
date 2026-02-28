import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
    // Therapist fields
    specialization: '',
    licenseNumber: '',
    bio: '',
  });

  const [anonymous, setAnonymous] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
  };

  const handleAnonymousToggle = (e) => {
    setAnonymous(e.target.checked);
    if (e.target.checked) {
      setFormData({
        ...formData,
        name: '',
        email: '',
        phone: '',
      });
    }
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate therapist fields
    if (formData.role === 'THERAPIST') {
      if (!formData.specialization || !formData.licenseNumber || !formData.bio) {
        alert('Please fill in all therapist fields');
        return;
      }
    }

    // Prepare data
    const registrationData = {
      password: formData.password,
      role: formData.role,
    };

    // Add optional fields if not anonymous
    if (!anonymous) {
      if (formData.name) registrationData.name = formData.name;
      if (formData.email) registrationData.email = formData.email;
      if (formData.phone) registrationData.phone = formData.phone;
    }

    // Add therapist fields
    if (formData.role === 'THERAPIST') {
      registrationData.specialization = formData.specialization;
      registrationData.licenseNumber = formData.licenseNumber;
      registrationData.bio = formData.bio;
      registrationData.availability = {};
    }

    const result = await register(registrationData);

    if (result.success) {
      const user = useAuthStore.getState().user;
      
      // Redirect based on role
      if (user.role === 'THERAPIST') {
        navigate('/therapist/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12">
      <div className="max-w-2xl w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Join our telehealth platform
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="PATIENT"
                    checked={formData.role === 'PATIENT'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Patient</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="THERAPIST"
                    checked={formData.role === 'THERAPIST'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Therapist</span>
                </label>
              </div>
            </div>

            {/* Anonymous Registration Option (Patients only) */}
            {formData.role === 'PATIENT' && (
              <div className="flex items-center">
                <input
                  id="anonymous"
                  type="checkbox"
                  checked={anonymous}
                  onChange={handleAnonymousToggle}
                  className="mr-2"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700">
                  Register anonymously (no name or email required)
                </label>
              </div>
            )}

            {/* Basic Information */}
            {!anonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name {formData.role === 'THERAPIST' && '*'}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={formData.role === 'THERAPIST'}
                    className="input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address {formData.role === 'THERAPIST' && '*'}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={formData.role === 'THERAPIST'}
                    className="input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {!anonymous && (
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Therapist-specific fields */}
            {formData.role === 'THERAPIST' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">
                  Therapist Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="specialization"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Specialization *
                    </label>
                    <input
                      id="specialization"
                      name="specialization"
                      type="text"
                      required
                      className="input"
                      placeholder="e.g., Clinical Psychology"
                      value={formData.specialization}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="licenseNumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      License Number *
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      className="input"
                      placeholder="Enter license number"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Bio *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={4}
                    className="input"
                    placeholder="Tell us about your experience and approach..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Therapist accounts require admin approval
                    before you can accept bookings.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
