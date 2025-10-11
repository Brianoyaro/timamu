import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  FaHeart, 
  FaBrain, 
  FaCalendarAlt, 
  FaShieldAlt, 
  FaComments, 
  FaUserMd,
  FaUsers,
  FaClock,
  FaCheck,
  FaStar,
  FaArrowRight,
  FaLightbulb,
  FaHandsHelping,
  FaLeaf,
  FaQuestionCircle,
  FaChevronDown,
  FaUserPlus,
  FaSignInAlt,
  FaCertificate,
  FaCreditCard
} from 'react-icons/fa';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('patient');
  const [activeQuestion, setActiveQuestion] = useState(null);
  
  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20"></div>
        
        {/* Floating Elements for Mental Health Theme */}
        <div className="absolute top-20 left-10 opacity-20">
          <FaHeart className="w-16 h-16 text-white animate-pulse" />
        </div>
        <div className="absolute top-40 right-20 opacity-15">
          <FaBrain className="w-20 h-20 text-white animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute bottom-20 left-20 opacity-20">
          <FaLeaf className="w-12 h-12 text-white animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <FaHandsHelping className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Your Journey to <span className="text-emerald-300">Mental Wellness</span> Starts Here
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with licensed mental health professionals in a secure, supportive environment designed for your healing and growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="group px-8 py-4 text-lg font-semibold rounded-xl bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Your Journey
                <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white text-white hover:bg-white hover:text-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaUsers className="w-4 h-4" />
                Sign In
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <FaShieldAlt className="w-5 h-5" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <FaUserMd className="w-5 h-5" />
                <span className="text-sm font-medium">Licensed Professionals</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <FaClock className="w-5 h-5" />
                <span className="text-sm font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
            <path 
              fill="#f8fafc" 
              fillOpacity="1" 
              d="M0,96L80,112C160,128,320,160,480,160C640,160,800,128,960,128C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                <FaLightbulb className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Timamu</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform offers comprehensive mental health solutions designed with both 
              patients and therapists in mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-teal-500 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                End-to-end encryption for all communications. Your data is protected with 
                bank-level security and never shared without your permission.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-500 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaCalendarAlt className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Flexible Scheduling</h3>
              <p className="text-gray-600">
                Book sessions that fit your schedule with our easy-to-use calendar system. 
                Receive reminders and manage appointments with ease.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-indigo-500 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaComments className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless Communication</h3>
              <p className="text-gray-600">
                High-quality video sessions, secure messaging, and file sharing make 
                communication between patients and therapists effortless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <FaBrain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with Timamu is simple and straightforward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">
                Sign up as a patient or therapist and complete your profile with relevant information.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Find Your Match</h3>
              <p className="text-gray-600">
                Patients can browse therapist profiles or use our matching system to find the right professional.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Schedule Session</h3>
              <p className="text-gray-600">
                Book appointments at convenient times using our intuitive calendar system.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaHeart className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Begin Journey</h3>
              <p className="text-gray-600">
                Connect via secure video sessions and track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section with Tabs */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Who We Serve</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Timamu is designed for both patients seeking help and professionals providing care
            </p>
          </div>

          <div className="mb-8 border-b border-gray-200">
            <div className="flex justify-center">
              <button 
                onClick={() => setActiveTab('patient')} 
                className={`py-3 px-6 font-medium text-lg border-b-2 ${
                  activeTab === 'patient' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                For Patients
              </button>
              <button 
                onClick={() => setActiveTab('therapist')} 
                className={`py-3 px-6 font-medium text-lg border-b-2 ${
                  activeTab === 'therapist' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                For Therapists
              </button>
            </div>
          </div>

          {activeTab === 'patient' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaHeart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Find Support When You Need It</h3>
                  <p className="text-lg text-gray-600">Take control of your mental health with professional support</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">Connect with licensed therapists specialized in your needs</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">Book appointments that fit your schedule</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">Track your progress and mood over time</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">Access resources and tools for self-care between sessions</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaHeart className="w-4 h-4" />
                    Sign Up as a Patient
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'therapist' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaUserMd className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Grow Your Practice, Simplified</h3>
                  <p className="text-lg text-gray-600">Empower more patients with our comprehensive platform</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700">Create a professional profile to showcase your expertise</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700">Manage your calendar and availability efficiently</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700">Access secure tools for notes, assessments, and treatment plans</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700">Connect with patients through our matching algorithm</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaUserMd className="w-4 h-4" />
                    Join as a Therapist
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHandsHelping className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real Stories, Real Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from people who have found support and growth through our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">S</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Sarah M.</h3>
                  <p className="text-gray-600 text-sm">Anxiety & Depression</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="w-5 h-5" />
                ))}
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "Finding the right therapist through this platform was life-changing. The booking process was seamless, and my therapist truly understands my needs. I feel more supported than ever."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">M</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Dr. Michael R.</h3>
                  <p className="text-gray-600 text-sm">Licensed Therapist</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="w-5 h-5" />
                ))}
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "As a therapist, this platform has streamlined my practice management. The scheduling tools and patient communication features have saved me countless hours while improving care quality."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">J</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">James L.</h3>
                  <p className="text-gray-600 text-sm">Relationship Counseling</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="w-5 h-5" />
                ))}
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "The platform made it easy to find a couples therapist who specialized in our specific challenges. The progress tracking features helped us see our growth week by week."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaQuestionCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our mental health platform
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
              <button
                className="flex justify-between items-center w-full text-left"
                onClick={() => setActiveQuestion(activeQuestion === 1 ? null : 1)}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <FaShieldAlt className="w-5 h-5 text-blue-600" />
                  How secure is the Timamu platform?
                </h3>
                <FaChevronDown className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${activeQuestion === 1 ? 'rotate-180' : ''}`} />
              </button>
              {activeQuestion === 1 && (
                <div className="mt-4 text-gray-700 leading-relaxed">
                  Timamu employs bank-level security with end-to-end encryption for all communications. We are compliant with healthcare privacy regulations and maintain strict data protection protocols.
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
              <button
                className="flex justify-between items-center w-full text-left"
                onClick={() => setActiveQuestion(activeQuestion === 2 ? null : 2)}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <FaUserMd className="w-5 h-5 text-teal-600" />
                  What qualifications do therapists on Timamu have?
                </h3>
                <FaChevronDown className={`w-5 h-5 text-teal-600 transition-transform duration-200 ${activeQuestion === 2 ? 'rotate-180' : ''}`} />
              </button>
              {activeQuestion === 2 && (
                <div className="mt-4 text-gray-700 leading-relaxed">
                  All therapists on our platform are licensed, qualified professionals. We verify credentials, licenses, and conduct background checks before allowing therapists to join our network.
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
              <button
                className="flex justify-between items-center w-full text-left"
                onClick={() => setActiveQuestion(activeQuestion === 3 ? null : 3)}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <FaCreditCard className="w-5 h-5 text-purple-600" />
                  How does payment work?
                </h3>
                <FaChevronDown className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${activeQuestion === 3 ? 'rotate-180' : ''}`} />
              </button>
              {activeQuestion === 3 && (
                <div className="mt-4 text-gray-700 leading-relaxed">
                  Timamu offers various payment options for therapy sessions, including insurance integration where applicable. Payments are processed securely, and you'll always know the cost before booking a session.
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-100">
              <button
                className="flex justify-between items-center w-full text-left"
                onClick={() => setActiveQuestion(activeQuestion === 4 ? null : 4)}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <FaCalendarAlt className="w-5 h-5 text-emerald-600" />
                  Can I change therapists if I'm not satisfied?
                </h3>
                <FaChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-200 ${activeQuestion === 4 ? 'rotate-180' : ''}`} />
              </button>
              {activeQuestion === 4 && (
                <div className="mt-4 text-gray-700 leading-relaxed">
                  Yes, you can switch therapists at any time. We understand that finding the right match is important, and our platform makes it easy to connect with a different professional.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-300"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <FaHeart className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Start Your 
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"> Wellness Journey</span>?
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            Join thousands of others who have taken the first step toward better mental health with our compassionate platform.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <FaUserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Create Your Account
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              <FaSignInAlt className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Sign In
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-blue-200 text-sm">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="w-4 h-4" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCertificate className="w-4 h-4" />
              <span>Licensed Professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;