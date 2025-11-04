import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAbout } from '../hooks';
import { getFileUrl } from '../lib/fileService';
import { createHTMLProps } from '../utils/htmlUtils';

export default function About() {
  const { content, loading } = useAbout();
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultContent = {
    hero: {
      title: 'About ReadnWin',
      subtitle: 'Empowering The Mind Through Reading'
    },
    mission: {
      description: '<p>At ReadnWin, we believe that reading is the gateway to knowledge, imagination, and personal growth. Our mission is to make quality literature accessible to everyone, everywhere, breaking down barriers between readers and the books they love.</p><p>We combine cutting-edge technology with a passion for literature to create an immersive reading experience that adapts to your lifestyle. Whether you prefer physical books or digital formats, we\'re here to support your reading journey every step of the way.</p>',
      features: [
        'Unlimited Access to Thousands of Titles',
        'AI-Powered Personalized Recommendations',
        'Vibrant Global Reading Community',
        'Seamless Cross-Platform Experience',
        'Support for Authors and Publishers'
      ]
    },
    values: [
      { icon: 'ri-book-open-line', title: 'Accessibility', description: 'We believe everyone deserves access to quality literature, regardless of location or economic status. Our platform breaks down barriers to make reading accessible to all.' },
      { icon: 'ri-lightbulb-line', title: 'Innovation', description: 'We leverage cutting-edge technology to enhance the reading experience, from AI recommendations to seamless digital delivery, while preserving the joy of traditional reading.' },
      { icon: 'ri-heart-line', title: 'Community', description: 'Reading is better together. We foster a vibrant community where readers can connect, share insights, and discover new perspectives through literature.' },
      { icon: 'ri-shield-check-line', title: 'Quality', description: 'We maintain the highest standards in content curation, user experience, and customer service, ensuring every interaction with ReadnWin exceeds expectations.' }
    ]
  };

  // Only use default content if loading is complete and no content from API
  const aboutData = loading ? defaultContent : (content || defaultContent);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (!aboutData.team || aboutData.team.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === aboutData.team.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [aboutData.team]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20" style={aboutData.hero?.image_url ? {
        backgroundImage: `linear-gradient(rgba(147, 51, 234, 0.8), rgba(79, 70, 229, 0.8)), url(${getFileUrl(aboutData.hero.image_url)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {aboutData.hero?.title || 'About ReadnWin'}
            </h1>
            <div className="text-xl md:text-2xl text-purple-100"
                 {...createHTMLProps(aboutData.hero?.subtitle || 'Empowering The Mind Through Reading')}
            />
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <div className="text-lg text-gray-600 mb-6"
                   {...createHTMLProps(aboutData.mission?.description || defaultContent.mission.description)}
              />
              <div className="space-y-3">
                {(aboutData.mission?.features || defaultContent.mission.features).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <i className="ri-check-line text-2xl text-green-600"></i>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={aboutData.mission?.image_url ? getFileUrl(aboutData.mission.image_url) : 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'}
                alt="Our Mission"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {aboutData.stats && aboutData.stats.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {aboutData.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(aboutData.values || defaultContent.values).map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${value.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <div className="text-gray-600"
                     {...createHTMLProps(value.description)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {aboutData.team && aboutData.team.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-600">
                The people behind ReadnWin
              </p>
            </motion.div>

            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="w-full max-w-sm">
                      <div
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => setSelectedMember(aboutData.team[currentIndex])}
                      >
                        {aboutData.team[currentIndex].image && (
                          <img
                            src={getFileUrl(aboutData.team[currentIndex].image)}
                            alt={aboutData.team[currentIndex].name}
                            className="w-full h-80 object-cover"
                          />
                        )}
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {aboutData.team[currentIndex].name}
                          </h3>
                          <p className="text-lg text-purple-600 font-medium mb-4">
                            {aboutData.team[currentIndex].role}
                          </p>
                          <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                            <span>View Bio</span>
                            <i className="ri-arrow-right-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Arrows */}
              {aboutData.team.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev === 0 ? aboutData.team.length - 1 : prev - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-arrow-left-line text-2xl text-gray-700"></i>
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev === aboutData.team.length - 1 ? 0 : prev + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-arrow-right-line text-2xl text-gray-700"></i>
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {aboutData.team.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-purple-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Team Member Bio Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMember(null)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedMember.image && (
                <img
                  src={getFileUrl(selectedMember.image)}
                  alt={selectedMember.name}
                  className="w-full h-80 object-cover rounded-t-2xl"
                />
              )}
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-2xl text-gray-700"></i>
              </button>
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedMember.name}
              </h2>
              <p className="text-xl text-purple-600 font-medium mb-6">
                {selectedMember.role}
              </p>
              <div className="prose prose-lg max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: selectedMember.bio }} />
            </div>
          </motion.div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {aboutData.cta?.title || 'Join the Reading Revolution'}
            </h2>
            <div className="text-xl mb-8 text-purple-100"
                 {...createHTMLProps(aboutData.cta?.description || 'Start your journey with ReadnWin today')}
            />
            <a
              href="/signup"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              {aboutData.cta?.primaryButton || 'Get Started Free'}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
