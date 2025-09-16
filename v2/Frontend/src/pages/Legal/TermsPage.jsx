import { Link } from 'react-router-dom';

export default function TermsPage() {
  console.log('📄 TermsPage: Component rendered');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8">
          <div className="mb-8">
            <Link
              to="/register"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium transition-colors"
            >
              ← Back to Registration
            </Link>
            <div className="border-l-4 border-blue-500 pl-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
              <p className="text-blue-600 font-medium">Last updated: September 16, 2025</p>
            </div>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8 bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing and using TelePsy ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8 bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
              <h2 className="text-2xl font-semibold text-green-900 mb-4 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Medical Disclaimer
              </h2>
              <p className="text-gray-700 mb-4">
                TelePsy provides a platform for connecting patients with licensed mental health professionals. 
                The services provided through this platform are not intended to replace emergency medical care or in-person treatment when necessary.
              </p>
              <p className="text-gray-700 mb-4">
                <strong className="text-red-600 bg-red-100 px-2 py-1 rounded">⚠️ In case of emergency, please contact your local emergency services immediately.</strong>
              </p>
            </section>

            <section className="mb-8 bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
              <h2 className="text-2xl font-semibold text-purple-900 mb-4 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                User Responsibilities
              </h2>
              <ul className="list-none space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  Provide accurate and truthful information during registration
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  Maintain the confidentiality of your login credentials
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  Use the platform in a respectful and appropriate manner
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  Comply with all applicable laws and regulations
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  Report any technical issues or security concerns promptly
                </li>
              </ul>
            </section>

            <section className="mb-8 bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-400">
              <h2 className="text-2xl font-semibold text-indigo-900 mb-4 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                Privacy and Confidentiality
              </h2>
              <p className="text-gray-700 mb-4">
                We are committed to protecting your privacy and maintaining the confidentiality of your personal health information. 
                All communications between patients and therapists are encrypted and stored securely.
              </p>
              <p className="text-gray-700 mb-4">
                For detailed information about how we collect, use, and protect your data, please review our 
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700 ml-1 font-medium bg-blue-100 px-2 py-1 rounded">🔒 Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8 bg-teal-50 p-6 rounded-lg border-l-4 border-teal-400">
              <h2 className="text-2xl font-semibold text-teal-900 mb-4 flex items-center">
                <span className="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                Therapist Verification
              </h2>
              <p className="text-gray-700 mb-4">
                All therapists on our platform are required to provide valid licensing information and undergo a verification process. 
                However, users are encouraged to verify credentials independently and ensure the therapist is licensed in their jurisdiction.
              </p>
            </section>

            <section className="mb-8 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
              <h2 className="text-2xl font-semibold text-yellow-900 mb-4 flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                Payment and Billing
              </h2>
              <p className="text-gray-700 mb-4">
                Session fees are determined by individual therapists. Payment processing is handled securely through our platform. 
                Refund policies may vary by therapist and will be clearly communicated before booking.
              </p>
            </section>

            <section className="mb-8 bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
              <h2 className="text-2xl font-semibold text-red-900 mb-4 flex items-center">
                <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
                Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                TelePsy serves as a platform connecting patients and therapists. We are not responsible for the quality, effectiveness, 
                or outcomes of therapy sessions. Our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            <section className="mb-8 bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400">
              <h2 className="text-2xl font-semibold text-orange-900 mb-4 flex items-center">
                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
                Termination
              </h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to terminate or suspend accounts that violate these terms or engage in inappropriate behavior. 
                Users may also delete their accounts at any time through their profile settings.
              </p>
            </section>

            <section className="mb-8 bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg border border-blue-200">
                <p className="text-gray-800 font-medium">
                  📧 Email: support@telepsy.com<br />
                  📞 Phone: +1 (555) 123-4567<br />
                  📍 Address: 123 Healthcare Ave, Medical District, NY 10001
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
