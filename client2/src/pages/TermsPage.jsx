import React from 'react'
import { motion } from 'framer-motion'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8"
        >
          <div className="flex items-center mb-8">
            <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Last updated: January 1, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                By accessing and using MindLink, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Description of Service
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                MindLink is a telepsychology platform that connects patients with licensed 
                mental health professionals through secure video conferencing, messaging, 
                and digital tools.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Our services include but are not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                <li>Video therapy sessions</li>
                <li>Secure messaging with healthcare providers</li>
                <li>Mental health assessments and tracking</li>
                <li>Educational resources and tools</li>
                <li>Appointment scheduling and management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Responsibilities
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                As a user of MindLink, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the service only for lawful purposes</li>
                <li>Respect the privacy and rights of other users</li>
                <li>Follow all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Medical Disclaimer
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  <strong>Important:</strong> MindLink is not intended for emergency mental health situations. 
                  If you are experiencing a mental health emergency, please contact emergency services 
                  (911) or go to your nearest emergency room immediately.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Privacy and Confidentiality
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We are committed to protecting your privacy and maintaining the confidentiality 
                of your health information. Please review our Privacy Policy for detailed 
                information about how we collect, use, and protect your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                MindLink provides a platform for connecting patients with healthcare providers. 
                We do not provide medical advice, diagnosis, or treatment. The healthcare providers 
                using our platform are independent professionals responsible for their own services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Legal Department</strong><br />
                  MindLink, Inc.<br />
                  Email: legal@mindlink.com<br />
                  Phone: 1-800-MINDLINK
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
