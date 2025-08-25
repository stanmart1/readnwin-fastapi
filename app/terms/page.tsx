'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
              Please read these terms carefully before using our reading platform
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
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">1. Acceptance of Terms</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                By accessing and using ReadnWin ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                These Terms of Service ("Terms") govern your use of our website located at readnwin.com and any related services provided by ReadnWin.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">2. Description of Service</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                ReadnWin is a digital reading platform that provides access to books, reading tools, and community features. Our service includes:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Access to a digital library of books and publications</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Reading progress tracking and analytics</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Social reading features and book clubs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Reading goals and challenges</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Mobile and web applications</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Community forums and discussions</span>
                </li>
              </ul>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">3. User Accounts</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                To access certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Maintaining the confidentiality of your account credentials</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">All activities that occur under your account</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Providing accurate and complete information during registration</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Updating your account information as necessary</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                You must be at least 13 years old to create an account. If you are under 18, you must have parental consent to use our Service.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">4. Acceptable Use</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Violate any applicable laws or regulations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Infringe upon the rights of others</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Upload or share inappropriate, offensive, or harmful content</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Interfere with the proper functioning of the Service</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Use automated tools to access the Service without permission</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Share your account credentials with others</span>
                </li>
              </ul>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">5. Content and Intellectual Property</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The Service contains content owned by ReadnWin and third-party content providers. You may not:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Copy, distribute, or reproduce any content without permission</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Modify or create derivative works from our content</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Remove any copyright or proprietary notices</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-close-line text-red-500 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Use our trademarks or branding without written consent</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                You retain ownership of content you create and share on the platform, but grant us a license to use, display, and distribute such content as part of the Service.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">6. Privacy and Data Protection</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">7. Subscription and Payment</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Some features of the Service may require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Pay all fees associated with your subscription</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Provide accurate billing information</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Authorize us to charge your payment method</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Cancel your subscription before the next billing cycle to avoid charges</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                Subscription fees are non-refundable except as required by law or as specified in our refund policy.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">8. Termination</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We may terminate or suspend your account and access to the Service at any time, with or without cause, with or without notice.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                You may terminate your account at any time by contacting our support team or using the account deletion feature in your settings.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Upon termination, your right to use the Service will cease immediately, and we may delete your account and data in accordance with our data retention policies.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">9. Disclaimers and Limitations</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
                <p className="text-lg text-red-800 font-semibold mb-2">Important Notice:</p>
                <p className="text-lg text-red-700 leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                IN NO EVENT SHALL READNWIN BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our total liability to you for any claims arising from these Terms or your use of the Service shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">10. Changes to Terms</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by:
              </p>
              <ul className="list-none space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <i className="ri-check-line text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                  <span className="text-lg text-gray-700">Posting the updated Terms on our website</span>
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
                Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">11. Governing Law</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ReadnWin operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">12. Contact Information</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <i className="ri-mail-line text-blue-600 text-xl"></i>
                        <span className="text-lg text-gray-700">legal@readnwin.com</span>
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h3>
                    <div className="space-y-2">
                      <p className="text-lg text-gray-700">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-lg text-gray-700">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-lg text-gray-700">Sunday: Closed</p>
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