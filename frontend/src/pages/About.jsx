import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAbout } from '../hooks';
import { getFileUrl } from '../lib/fileService';
import { createHTMLProps } from '../utils/htmlUtils';

export default function About() {
  const { content, loading } = useAbout();
  const [selectedMember, setSelectedMember] = useState(null);
  const carouselRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const aboutData = content || {};
  
  // Create infinite loop array by tripling the team members
  const infiniteTeam = aboutData.team && aboutData.team.length > 0 ? [...aboutData.team, ...aboutData.team, ...aboutData.team] : [];

  // Initialize scroll position to middle section
  useEffect(() => {
    if (carouselRef.current && aboutData.team && aboutData.team.length > 0) {
      const cardWidth = 376; // 360px width + 16px gap
      carouselRef.current.scrollLeft = cardWidth * aboutData.team.length;
    }
  }, [aboutData.team]);

  // Auto-scroll effect with infinite loop
  useEffect(() => {
    if (!isAutoScrolling || !carouselRef.current || !aboutData.team || aboutData.team.length === 0) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const cardWidth = 376;
        carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, aboutData.team]);

  // Handle infinite scroll reset with debouncing
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !aboutData.team || aboutData.team.length === 0) return;

    const handleScroll = () => {
      if (isUserScrolling) return;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const cardWidth = 376;
        const { scrollLeft } = carousel;
        const sectionWidth = cardWidth * aboutData.team.length;

        if (scrollLeft >= sectionWidth * 2 - cardWidth / 2) {
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = scrollLeft - sectionWidth;
          requestAnimationFrame(() => {
            carousel.style.scrollBehavior = 'smooth';
          });
        }
        else if (scrollLeft <= cardWidth / 2) {
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = scrollLeft + sectionWidth;
          requestAnimationFrame(() => {
            carousel.style.scrollBehavior = 'smooth';
          });
        }
      }, 150);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [aboutData.team, isUserScrolling]);

  // Pause auto-scroll on user interaction
  const handleTouchStart = () => {
    setIsAutoScrolling(false);
    setIsUserScrolling(true);
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 300);
    
    setTimeout(() => {
      setIsAutoScrolling(true);
    }, 5000);
  };

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
            {aboutData.hero?.title && (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {aboutData.hero.title}
              </h1>
            )}
            {aboutData.hero?.subtitle && (
              <div className="text-xl md:text-2xl text-purple-100"
                   {...createHTMLProps(aboutData.hero.subtitle)}
              />
            )}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      {aboutData.mission && (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              {aboutData.mission?.title && (
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {aboutData.mission.title}
                </h2>
              )}
              {aboutData.mission?.description && (
                <div className="text-lg text-gray-600 mb-6"
                     {...createHTMLProps(aboutData.mission.description)}
                />
              )}
              {aboutData.mission?.features && aboutData.mission.features.length > 0 && (
                <div className="space-y-3">
                  {aboutData.mission.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <i className="ri-check-line text-2xl text-green-600"></i>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              {aboutData.mission?.image_url && (
                <img
                  src={getFileUrl(aboutData.mission.image_url)}
                  alt="Our Mission"
                  className="rounded-2xl shadow-2xl"
                />
              )}
            </motion.div>
          </div>
        </div>
      </section>
      )}

      {/* Values Section */}
      {aboutData.values && aboutData.values.length > 0 && (
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
            {aboutData.values && aboutData.values.map((value, index) => (
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
      )}

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
              <div
                ref={carouselRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {infiniteTeam.map((member, index) => (
                  <motion.div
                    key={`${member.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % aboutData.team.length) * 0.1 }}
                    className="flex-shrink-0 w-[360px] bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer snap-center"
                    onClick={() => setSelectedMember(member)}
                  >
                    {member.image && (
                      <img
                        src={getFileUrl(member.image)}
                        alt={member.name}
                        className="w-full h-80 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {member.name}
                      </h3>
                      <p className="text-lg text-purple-600 font-medium mb-4">
                        {member.role}
                      </p>
                      <span className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                        <span>View Bio</span>
                        <i className="ri-arrow-right-line"></i>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Auto-scroll indicator */}
              <div className="flex justify-center mt-8 gap-3 items-center">
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-md"
                >
                  <i className={`ri-${isAutoScrolling ? 'pause' : 'play'}-circle-line text-lg`}></i>
                  {isAutoScrolling ? 'Auto-scroll' : 'Paused'}
                </button>
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
      {aboutData.cta && (
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            {aboutData.cta?.title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {aboutData.cta.title}
              </h2>
            )}
            {aboutData.cta?.description && (
              <div className="text-xl mb-8 text-purple-100"
                   {...createHTMLProps(aboutData.cta.description)}
              />
            )}
            {aboutData.cta?.primaryButton && (
              <a
                href="/signup"
                className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                {aboutData.cta.primaryButton}
              </a>
            )}
          </motion.div>
        </div>
      </section>
      )}

      <Footer />
    </div>
  );
}

// Add scrollbar hide styles
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
