import { Link } from 'react-router-dom';

export default function TermsPage() {
  console.log('📄 TermsPage: Component rendered');

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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
            <p className="text-gray-600">Last updated: September 16, 2025</p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using TelePsy ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Medical Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                TelePsy provides a platform for connecting patients with licensed mental health professionals. 
                The services provided through this platform are not intended to replace emergency medical care or in-person treatment when necessary.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>In case of emergency, please contact your local emergency services immediately.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate and truthful information during registration</li>
                <li>Maintain the confidentiality of your login credentials</li>
                <li>Use the platform in a respectful and appropriate manner</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Report any technical issues or security concerns promptly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Privacy and Confidentiality</h2>
              <p className="text-gray-700 mb-4">
                We are committed to protecting your privacy and maintaining the confidentiality of your personal health information. 
                All communications between patients and therapists are encrypted and stored securely.
              </p>
              <p className="text-gray-700 mb-4">
                For detailed information about how we collect, use, and protect your data, please review our 
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500 ml-1">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Therapist Verification</h2>
              <p className="text-gray-700 mb-4">
                All therapists on our platform are required to provide valid licensing information and undergo a verification process. 
                However, users are encouraged to verify credentials independently and ensure the therapist is licensed in their jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Billing</h2>
              <p className="text-gray-700 mb-4">
                Session fees are determined by individual therapists. Payment processing is handled securely through our platform. 
                Refund policies may vary by therapist and will be clearly communicated before booking.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TelePsy serves as a platform connecting patients and therapists. We are not responsible for the quality, effectiveness, 
                or outcomes of therapy sessions. Our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to terminate or suspend accounts that violate these terms or engage in inappropriate behavior. 
                Users may also delete their accounts at any time through their profile settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  Email: support@telepsy.com<br />
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
