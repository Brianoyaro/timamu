import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  console.log('🏠 LandingPage: Component rendered');

  const features = [
    {
      icon: HeartIcon,
      title: 'Compassionate Care',
      description: 'Connect with licensed mental health professionals who truly understand and care about your wellbeing.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'HIPAA Compliant',
      description: 'Your privacy and security are our top priority. All sessions are encrypted and fully confidential.'
    },
    {
      icon: ClockIcon,
      title: 'Flexible Scheduling',
      description: 'Book sessions that fit your schedule. Available 7 days a week with both day and evening options.'
    },
    {
      icon: UserGroupIcon,
      title: 'Expert Therapists',
      description: 'Our platform features only licensed, verified mental health professionals with proven expertise.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Patient',
      rating: 5,
      content: 'TelePsy changed my life. The convenience of online therapy made it possible for me to get the help I needed.'
    },
    {
      name: 'Dr. Jennifer L.',
      role: 'Licensed Therapist',
      rating: 5,
      content: 'As a therapist, I love how TelePsy makes it easy to connect with clients and provide quality care remotely.'
    },
    {
      name: 'Michael R.',
      role: 'Patient',
      rating: 5,
      content: 'The platform is intuitive and secure. I feel completely comfortable discussing my mental health here.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Successful Sessions' },
    { number: '500+', label: 'Licensed Therapists' },
    { number: '98%', label: 'Patient Satisfaction' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/logo.svg" 
                  alt="TelePsy" 
                  className="h-10 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Mental Health Care,
              <span className="text-primary-600 block">Reimagined</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with licensed therapists from the comfort of your home. 
              Professional, secure, and accessible mental health care when you need it most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                Start Your Journey
              </Link>
              <Link
                to="/therapists"
                className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                Find Therapists
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-40 -mr-40 w-80 h-80 bg-primary-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-40 -ml-40 w-80 h-80 bg-primary-300 rounded-full opacity-30"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TelePsy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to making mental health care accessible, secure, and effective for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Getting started with online therapy is simple and straightforward.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Your Profile</h3>
              <p className="text-gray-600">
                Sign up and complete your profile. Tell us about your needs and preferences 
                to help us match you with the right therapist.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Therapist</h3>
              <p className="text-gray-600">
                Browse our network of licensed professionals and select a therapist 
                who specializes in your areas of concern.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Your Session</h3>
              <p className="text-gray-600">
                Schedule and attend secure video sessions from anywhere. 
                All sessions are private, encrypted, and HIPAA compliant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people who've found help through TelePsy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Begin Your Mental Health Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people who have found support, healing, and growth through TelePsy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              Get Started Today
            </Link>
            <Link
              to="/login"
              className="border border-white text-white hover:bg-primary-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img 
                src="/logo.svg" 
                alt="TelePsy" 
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400">
                Professional mental health care, accessible from anywhere.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/therapists" className="hover:text-white transition-colors">Find Therapists</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@telepsy.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="tel:+15551234567" className="hover:text-white transition-colors">Emergency: (555) 123-4567</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TelePsy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
