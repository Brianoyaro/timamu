import { Link } from 'react-router-dom';
import { useState } from 'react';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('patient');
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                Mental Health Care, <span className="text-yellow-300">Redefined</span>
              </h1>
              <p className="mt-6 text-xl font-light text-indigo-100">
                Timamu connects you with qualified mental health professionals in a secure, 
                supportive environment designed for your wellness journey.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="px-8 py-3 text-base font-medium rounded-md bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 text-base font-medium rounded-md border-2 border-white text-white hover:bg-white hover:text-indigo-700 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/screenshot-wide.png" 
                alt="Timamu Platform" 
                className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x400?text=Timamu+Platform";
                }}
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L80,112C160,128,320,160,480,160C640,160,800,128,960,128C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Choose Timamu</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform offers comprehensive mental health solutions designed with both 
              patients and therapists in mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-indigo-600">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                End-to-end encryption for all communications. Your data is protected with 
                bank-level security and never shared without your permission.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-indigo-600">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Flexible Scheduling</h3>
              <p className="text-gray-600">
                Book sessions that fit your schedule with our easy-to-use calendar system. 
                Receive reminders and manage appointments with ease.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-indigo-600">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
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
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with Timamu is simple and straightforward
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex-1 max-w-md">
              <div className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">1</div>
                  <h3 className="text-xl font-bold text-gray-900">Create an account</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Sign up as a patient or therapist and complete your profile with relevant information.
                </p>
              </div>
              
              <div className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">2</div>
                  <h3 className="text-xl font-bold text-gray-900">Find your match</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Patients can browse therapist profiles or use our matching system to find the right professional.
                </p>
              </div>
              
              <div className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">3</div>
                  <h3 className="text-xl font-bold text-gray-900">Schedule a session</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Book appointments at convenient times using our calendar system.
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">4</div>
                  <h3 className="text-xl font-bold text-gray-900">Begin your journey</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Connect via secure video sessions and track your progress over time.
                </p>
              </div>
            </div>
            
            <div className="hidden md:block flex-1 mt-12 md:mt-0">
              <img 
                src="/how-it-works.jpg" 
                alt="How Timamu Works" 
                className="rounded-lg shadow-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x500?text=How+It+Works";
                }}
              />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Find Support When You Need It</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Connect with licensed therapists specialized in your needs</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Book appointments that fit your schedule</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Track your progress and mood over time</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Access resources and tools for self-care between sessions</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Sign Up as a Patient
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <img 
                  src="/patient-support.jpg" 
                  alt="Patient Support" 
                  className="rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=For+Patients";
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'therapist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="hidden md:block">
                <img 
                  src="/therapist-tools.jpg" 
                  alt="Therapist Tools" 
                  className="rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=For+Therapists";
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Grow Your Practice, Simplified</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Create a professional profile to showcase your expertise</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Manage your calendar and availability efficiently</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Access secure tools for notes, assessments, and treatment plans</span>
                  </li>
                  <li className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Connect with patients through our matching algorithm</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Join as a Therapist
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">What People Say</h2>
            <p className="mt-4 text-xl opacity-80 max-w-3xl mx-auto">
              Hear from our users about how Timamu has impacted their lives
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-lg text-gray-800">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Finding a therapist who understands me used to be difficult. Timamu matched me with 
                someone perfect for my needs, and the scheduling process is so simple. I've made 
                significant progress since starting."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600 font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-bold">Jane D.</h4>
                  <p className="text-gray-500">Patient</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg text-gray-800">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "As a therapist, Timamu has streamlined my practice management. The scheduling 
                system saves me time, and the secure video platform provides a great experience 
                for my patients. Highly recommended."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600 font-bold">MM</span>
                </div>
                <div>
                  <h4 className="font-bold">Dr. Michael M.</h4>
                  <p className="text-gray-500">Licensed Therapist</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg text-gray-800">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The privacy and security of Timamu gave me confidence to seek help online. 
                Being able to connect from home has made therapy accessible for me when I couldn't 
                otherwise attend in-person sessions."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600 font-bold">SK</span>
                </div>
                <div>
                  <h4 className="font-bold">Sarah K.</h4>
                  <p className="text-gray-500">Patient</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-xl text-gray-600">
              Find answers to common questions about Timamu
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">How secure is the Timamu platform?</h3>
              <p className="mt-2 text-gray-600">
                Timamu employs bank-level security with end-to-end encryption for all communications. 
                We are compliant with healthcare privacy regulations and maintain strict data protection protocols.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">What qualifications do therapists on Timamu have?</h3>
              <p className="mt-2 text-gray-600">
                All therapists on our platform are licensed, qualified professionals. We verify credentials, 
                licenses, and conduct background checks before allowing therapists to join our network.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">How does payment work?</h3>
              <p className="mt-2 text-gray-600">
                Timamu offers various payment options for therapy sessions, including insurance integration 
                where applicable. Payments are processed securely, and you'll always know the cost before 
                booking a session.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Can I change therapists if I'm not satisfied?</h3>
              <p className="mt-2 text-gray-600">
                Yes, you can switch therapists at any time. We understand that finding the right match is 
                important, and our platform makes it easy to connect with a different professional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-indigo-700 text-white">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Your Wellness Journey?</h2>
          <p className="mt-4 text-xl text-indigo-100 max-w-3xl mx-auto">
            Join thousands of others who have taken the first step toward better mental health with Timamu.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 text-base font-medium rounded-md bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 text-base font-medium rounded-md border-2 border-white text-white hover:bg-white hover:text-indigo-700 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;