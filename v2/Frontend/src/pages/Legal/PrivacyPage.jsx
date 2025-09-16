import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  console.log('🔒 PrivacyPage: Component rendered');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-8">
          <div className="mb-8">
            <Link
              to="/register"
              className="inline-flex items-center text-green-600 hover:text-green-700 mb-4 font-medium transition-colors"
            >
              ← Back to Registration
            </Link>
            <div className="border-l-4 border-green-500 pl-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">🔒 Privacy Policy</h1>
              <p className="text-green-600 font-medium">Last updated: September 16, 2025</p>
            </div>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8 bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                TelePsy ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal 
                and health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our telepsychology platform.
              </p>
            </section>

            <section className="mb-8 bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
              <h2 className="text-2xl font-semibold text-green-900 mb-4 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                🏥 HIPAA Compliance
              </h2>
              <p className="text-gray-700 mb-4">
                As a healthcare technology platform, we are committed to complying with the Health Insurance Portability and 
                Accountability Act (HIPAA) and other applicable privacy regulations. Your Protected Health Information (PHI) 
                is handled with the highest level of security and confidentiality.
              </p>
            </section>

            <section className="mb-8 bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
              <h2 className="text-2xl font-semibold text-purple-900 mb-4 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                📊 Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-purple-800 mb-3 flex items-center">
                👤 Personal Information
              </h3>
              <ul className="list-none space-y-2 text-gray-700 mb-4">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Name, email address, phone number
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Date of birth and demographic information
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Insurance information (if applicable)
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Emergency contact information
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-800 mb-3 flex items-center">
                ⚕️ Health Information
              </h3>
              <ul className="list-none space-y-2 text-gray-700 mb-4">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Medical history and current symptoms
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Treatment goals and preferences
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Session notes and treatment plans
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Communication records with healthcare providers
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-800 mb-3 flex items-center">
                💻 Technical Information
              </h3>
              <ul className="list-none space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Device information and browser type
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  IP address and location data
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Usage patterns and platform interactions
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Session recordings (with explicit consent)
                </li>
              </ul>
            </section>

            <section className="mb-8 bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-400">
              <h2 className="text-2xl font-semibold text-indigo-900 mb-4 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                🎯 How We Use Your Information
              </h2>
              <ul className="list-none space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Facilitate therapy sessions and treatment
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Match you with appropriate healthcare providers
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Process payments and insurance claims
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Improve our platform and services
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Ensure platform security and prevent fraud
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Comply with legal and regulatory requirements
                </li>
              </ul>
            </section>

            <section className="mb-8 bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
              <h2 className="text-2xl font-semibold text-red-900 mb-4 flex items-center">
                <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                🔄 Information Sharing
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">👩‍⚕️ With Your Therapist</h4>
                  <p className="text-gray-600 text-sm">To facilitate treatment and care coordination</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">✅ With Your Consent</h4>
                  <p className="text-gray-600 text-sm">When you explicitly authorize information sharing</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">⚖️ Legal Requirements</h4>
                  <p className="text-gray-600 text-sm">When required by law or court order</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">🚨 Emergency Situations</h4>
                  <p className="text-gray-600 text-sm">To prevent imminent harm to you or others</p>
                </div>
              </div>
            </section>

            <section className="mb-8 bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-400">
              <h2 className="text-2xl font-semibold text-cyan-900 mb-4 flex items-center">
                <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                🔐 Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-cyan-200">
                  <h4 className="font-semibold text-cyan-800 mb-2">🔒 End-to-end encryption</h4>
                  <p className="text-gray-600 text-sm">For all communications</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-cyan-200">
                  <h4 className="font-semibold text-cyan-800 mb-2">💾 Secure data storage</h4>
                  <p className="text-gray-600 text-sm">With regular backups</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-cyan-200">
                  <h4 className="font-semibold text-cyan-800 mb-2">🔑 Multi-factor authentication</h4>
                  <p className="text-gray-600 text-sm">For account access</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-cyan-200">
                  <h4 className="font-semibold text-cyan-800 mb-2">🛡️ Security audits</h4>
                  <p className="text-gray-600 text-sm">Regular testing and monitoring</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent for data processing</li>
                <li>Receive a copy of your data in a portable format</li>
                <li>File a complaint with regulatory authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information only as long as necessary for treatment purposes, legal compliance, and platform operations. 
                Medical records are typically retained for 7 years after your last session, in accordance with healthcare industry standards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze platform usage, and ensure security. 
                You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically. We will notify you of any material changes via email or platform notification. 
                Your continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8 bg-emerald-50 p-6 rounded-lg border-l-4 border-emerald-400">
              <h2 className="text-2xl font-semibold text-emerald-900 mb-4 flex items-center">
                <span className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">11</span>
                📞 Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-6 rounded-lg border border-emerald-200">
                <p className="text-gray-800 font-medium">
                  <strong className="text-emerald-700">🛡️ Privacy Officer</strong><br />
                  📧 Email: privacy@telepsy.com<br />
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
