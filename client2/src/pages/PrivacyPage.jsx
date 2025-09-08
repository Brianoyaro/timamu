import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8"
        >
          <div className="flex items-center mb-8">
            <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Last updated: January 1, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                schedule appointments, or communicate with healthcare providers through our platform.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Personal information (name, email, phone number)</li>
                <li>Health information shared during sessions</li>
                <li>Communication records and session notes</li>
                <li>Technical information about your device and usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Facilitate therapy sessions and healthcare services</li>
                <li>Enable communication between patients and providers</li>
                <li>Send appointment reminders and important updates</li>
                <li>Improve our platform and develop new features</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                HIPAA Compliance
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                MindLink is committed to protecting your health information in accordance with the 
                Health Insurance Portability and Accountability Act (HIPAA). We implement appropriate 
                safeguards to protect the privacy and security of your protected health information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>End-to-end encryption for video sessions</li>
                <li>Encrypted data storage and transmission</li>
                <li>Regular security audits and assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers with physical security measures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                If you have any questions about this Privacy Policy or our privacy practices, 
                please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Privacy Officer</strong><br />
                  MindLink, Inc.<br />
                  Email: privacy@mindlink.com<br />
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
