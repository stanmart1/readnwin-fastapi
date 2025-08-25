'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
              How we collect, use, and protect your personal information
            </p>
            <div className="mt-6 text-blue-100 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">1. Introduction</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                At ReadnWin ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our reading platform and services.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                By using our Service, you consent to the collection and use of your information as described in this Privacy Policy.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">2. Information We Collect</h2>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">2.1 Personal Information</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-none space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Name and email address when you create an account</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Profile information such as reading preferences and interests</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Payment information for subscription services</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Communications with our support team</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Feedback and reviews you submit</span>
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">2.2 Usage Information</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We automatically collect certain information about your use of our Service:
              </p>
              <ul className="list-none space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Reading progress and book preferences</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Time spent reading and reading patterns</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Device information and browser type</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">IP address and location data</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Pages visited and features used</span>
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">2.3 Cookies and Tracking Technologies</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                We use cookies, web beacons, and similar technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">3. How We Use Your Information</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Provide and maintain our reading platform and services</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Personalize your reading experience and recommendations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Process payments and manage subscriptions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Send you updates, newsletters, and promotional materials</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Respond to your inquiries and provide customer support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Analyze usage patterns to improve our services</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Detect and prevent fraud, abuse, and security threats</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Comply with legal obligations and enforce our terms</span>
                </li>
              </ul>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">4. Information Sharing and Disclosure</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">4.1 Service Providers</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We may share information with trusted third-party service providers who assist us in operating our platform, such as:
              </p>
              <ul className="list-none space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Payment processors for subscription billing</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Cloud hosting providers for data storage</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Analytics services to understand usage patterns</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Customer support platforms</span>
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">4.2 Legal Requirements</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We may disclose your information if required by law or in response to:
              </p>
              <ul className="list-none space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Valid legal requests from government authorities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Court orders or subpoenas</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Protection of our rights, property, or safety</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Investigation of potential violations of our terms</span>
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">4.3 Business Transfers</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, subject to the same privacy protections.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">5. Data Security</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Encryption of data in transit and at rest</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Regular security assessments and updates</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Access controls and authentication mechanisms</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Employee training on data protection practices</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Incident response and breach notification procedures</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">6. Your Rights and Choices</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You have certain rights regarding your personal information:
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">6.1 Access and Update</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You can access and update your personal information through your account settings or by contacting us directly.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">6.2 Deletion</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You may request deletion of your account and associated data, subject to our legal obligations to retain certain information.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">6.3 Marketing Communications</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You can opt out of marketing communications by following the unsubscribe instructions in our emails or updating your preferences in your account settings.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-6">6.4 Cookies and Tracking</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                You can control cookies through your browser settings, though disabling certain cookies may affect the functionality of our Service.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">7. Children's Privacy</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to remove such information.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">8. International Data Transfers</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                For users in the European Union, we rely on adequacy decisions, standard contractual clauses, or other appropriate safeguards for international data transfers.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">9. Data Retention</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Provide our services to you</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Comply with legal obligations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Resolve disputes and enforce agreements</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Improve our services and user experience</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                When we no longer need your information, we will securely delete or anonymize it in accordance with our data retention policies.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">10. Changes to This Privacy Policy</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of material changes by:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Posting the updated policy on our website</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Sending email notifications to registered users</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Displaying in-app notifications</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                Your continued use of the Service after such changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">11. Contact Us</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <i className="ri-mail-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">privacy@readnwin.com</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className="ri-map-pin-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">123 Reading Street, Book City, BC 12345</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className="ri-phone-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">+1 (555) 123-4567</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Protection Officer</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <i className="ri-user-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">dpo@readnwin.com</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className="ri-time-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">Response within 48 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 