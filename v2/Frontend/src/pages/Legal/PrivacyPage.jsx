import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  console.log('🔒 PrivacyPage: Component rendered');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <Link
              to="/register"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-4"
            >
              ← Back to Registration
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: September 16, 2025</p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                TelePsy ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal 
                and health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our telepsychology platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. HIPAA Compliance</h2>
              <p className="text-gray-700 mb-4">
                As a healthcare technology platform, we are committed to complying with the Health Insurance Portability and 
                Accountability Act (HIPAA) and other applicable privacy regulations. Your Protected Health Information (PHI) 
                is handled with the highest level of security and confidentiality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name, email address, phone number</li>
                <li>Date of birth and demographic information</li>
                <li>Insurance information (if applicable)</li>
                <li>Emergency contact information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Health Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Medical history and current symptoms</li>
                <li>Treatment goals and preferences</li>
                <li>Session notes and treatment plans</li>
                <li>Communication records with healthcare providers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage patterns and platform interactions</li>
                <li>Session recordings (with explicit consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Facilitate therapy sessions and treatment</li>
                <li>Match you with appropriate healthcare providers</li>
                <li>Process payments and insurance claims</li>
                <li>Improve our platform and services</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>With Your Therapist:</strong> To facilitate treatment and care coordination</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize information sharing</li>
                <li><strong>Legal Requirements:</strong> When required by law or court order</li>
                <li><strong>Emergency Situations:</strong> To prevent imminent harm to you or others</li>
                <li><strong>Service Providers:</strong> With trusted partners who assist in platform operations (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>End-to-end encryption for all communications</li>
                <li>Secure data storage with regular backups</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee training on privacy and security protocols</li>
              </ul>
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

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  <strong>Privacy Officer</strong><br />
                  Email: privacy@telepsy.com<br />
                  Phone: +1 (555) 123-4567<br />
                  Address: 123 Healthcare Ave, Medical District, NY 10001
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
