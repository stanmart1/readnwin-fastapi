import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAbout } from '../hooks';
import { getFileUrl } from '../lib/fileService';
import ProgressiveImage from './ProgressiveImage';
import { createHTMLProps } from '../utils/htmlUtils';

export default function AboutSection() {
  const { content, loading } = useAbout();

  // Fallback content
  const defaultContent = {
    hero: {
      title: 'About ReadnWin',
      subtitle: 'Empowering The Mind Through Reading'
    },
    mission: {
      description: "Our mission is to make quality literature accessible to everyone, everywhere. We're building the world's most comprehensive digital reading platform, combining cutting-edge technology with timeless storytelling to create an experience that inspires, educates, and entertains."
    },
    values: [
      {
        icon: 'ri-book-open-line',
        title: 'Accessibility',
        description: '<p>Making reading accessible to everyone</p>'
      },
      {
        icon: 'ri-lightbulb-line',
        title: 'Innovation',
        description: '<p>Cutting-edge technology</p>'
      }
    ]
  };

  const aboutContent = content || defaultContent;
  const values = aboutContent.values || defaultContent.values;

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ProgressiveImage
                src={getFileUrl(aboutContent.hero?.image_url) || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800"}
                alt="ReadnWin - Empowering minds through reading"
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>

          {/* Right Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <i className="ri-star-line mr-2"></i>
                About ReadnWin
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {aboutContent.hero?.title || 'About ReadnWin'}
            </h2>
            
            <div className="text-lg md:text-xl text-gray-600 mb-6"
                 {...createHTMLProps(aboutContent.hero?.subtitle || 'Empowering The Mind Through Reading')}
            />
            
            <div className="text-base md:text-lg text-gray-600 mb-8"
                 {...createHTMLProps(aboutContent.mission?.description || defaultContent.mission.description)}
            />

            {/* Values Preview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {values.slice(0, 2).map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <i className={`${value.icon} text-2xl ${
                    index === 0 ? 'text-blue-600' : 'text-purple-600'
                  }`}></i>
                  <div>
                    <h4 className="font-semibold text-gray-900">{value.title}</h4>
                    <p className="text-sm text-gray-600" {...createHTMLProps(value.description)} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/about"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>Learn More</span>
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
