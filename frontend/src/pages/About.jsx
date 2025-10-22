import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAbout } from '../hooks';

export default function About() {
  const { content, loading } = useAbout();

  const defaultContent = {
    hero: {
      title: 'About ReadnWin',
      subtitle: 'Empowering The Mind Through Reading'
    },
    mission: {
      description: 'Our mission is to make quality literature accessible to everyone, everywhere.',
      features: ['Unlimited Access', 'AI-Powered Recommendations', 'Global Community']
    },
    values: [
      { icon: 'ri-book-open-line', title: 'Accessibility', description: 'Making reading accessible to everyone' },
      { icon: 'ri-lightbulb-line', title: 'Innovation', description: 'Cutting-edge technology' },
      { icon: 'ri-heart-line', title: 'Community', description: 'Building connections' },
      { icon: 'ri-shield-check-line', title: 'Quality', description: 'Highest standards' }
    ]
  };

  const aboutData = content || defaultContent;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {aboutData.hero?.title || 'About ReadnWin'}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100">
              {aboutData.hero?.subtitle || 'Empowering The Mind Through Reading'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {aboutData.mission?.description || defaultContent.mission.description}
              </p>
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
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800"
                alt="Our Mission"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${value.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Reading Revolution
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Start your journey with ReadnWin today
            </p>
            <a
              href="/signup"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Get Started Free
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
