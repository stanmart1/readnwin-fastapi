import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Last updated: January 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using ReadnWin, you accept and agree to be bound by these Terms of 
                Service. If you do not agree to these terms, please do not use our services.
              </p>

              <h2>2. User Accounts</h2>
              <p>To access certain features, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h2>3. Subscription and Payment</h2>
              <p>
                Subscription fees are billed in advance on a recurring basis. You authorize us to 
                charge your payment method for all fees incurred.
              </p>
              <ul>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Prices are subject to change with notice</li>
                <li>No refunds for partial subscription periods</li>
                <li>Free trial converts to paid subscription unless cancelled</li>
              </ul>

              <h2>4. Refund Policy</h2>
              <p>
                We offer a 14-day money-back guarantee for new subscriptions. Refund requests must 
                be submitted within 14 days of purchase.
              </p>

              <h2>5. Content and Intellectual Property</h2>
              <p>
                All content on ReadnWin, including books, text, graphics, and software, is protected 
                by copyright and other intellectual property laws.
              </p>
              <ul>
                <li>You may not copy, distribute, or modify our content</li>
                <li>Personal use only - no commercial use</li>
                <li>DRM-protected content cannot be shared</li>
                <li>We retain all rights to our platform and content</li>
              </ul>

              <h2>6. User Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Share account credentials</li>
                <li>Attempt to hack or disrupt our services</li>
                <li>Upload malicious code or viruses</li>
                <li>Harass or abuse other users</li>
              </ul>

              <h2>7. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account for violations of these 
                terms. You may cancel your subscription at any time.
              </p>

              <h2>8. Disclaimers</h2>
              <p>
                Our services are provided "as is" without warranties of any kind. We do not guarantee 
                uninterrupted or error-free service.
              </p>

              <h2>9. Limitation of Liability</h2>
              <p>
                ReadnWin shall not be liable for any indirect, incidental, special, or consequential 
                damages arising from your use of our services.
              </p>

              <h2>10. Changes to Terms</h2>
              <p>
                We may modify these terms at any time. Continued use of our services after changes 
                constitutes acceptance of the new terms.
              </p>

              <h2>11. Governing Law</h2>
              <p>
                These terms are governed by the laws of the jurisdiction in which ReadnWin operates, 
                without regard to conflict of law provisions.
              </p>

              <h2>12. Contact Information</h2>
              <p>
                For questions about these terms, contact us at:
              </p>
              <p>
                Email: legal@readnwin.com<br />
                Address: 123 Reading Street, Book City, BC 12345
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
