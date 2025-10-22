import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function WorksCarousel() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/works');
      
      if (response.data.success) {
        setWorks(response.data.works || []);
      }
    } catch (error) {
      console.error('Error fetching works:', error);
      // Fallback to sample data if API fails
      setWorks([
        {
          id: 1,
          title: 'Digital Library Platform',
          description: 'A comprehensive digital library system with advanced search and recommendation features.',
          image_path: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
          category: 'Platform'
        },
        {
          id: 2,
          title: 'Reading Analytics Dashboard',
          description: 'Real-time analytics and insights for tracking reading habits and progress.',
          image_path: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
          category: 'Analytics'
        },
        {
          id: 3,
          title: 'Mobile Reading App',
          description: 'Cross-platform mobile application for seamless reading on the go.',
          image_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
          category: 'Mobile'
        },
        {
          id: 4,
          title: 'E-Book Marketplace',
          description: 'Secure marketplace for buying, selling, and trading digital books.',
          image_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
          category: 'E-commerce'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
            <i className="ri-briefcase-line mr-2"></i>
            Our Portfolio
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Some of Our Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our innovative projects and solutions that are transforming the digital reading experience
          </p>
        </motion.div>

        {/* Carousel */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons - Hidden on mobile */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-all"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-all"
            >
              <i className="ri-arrow-right-line text-xl text-gray-700"></i>
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-12 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {works.map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-72 md:w-80 bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 snap-center"
                  onClick={() => setSelectedWork(work)}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={work.image_path}
                      alt={work.alt_text || work.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all">
                          View Details
                        </button>
                      </div>
                    </div>
                    {work.category && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {work.category}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {work.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedWork && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedWork(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64">
                <img
                  src={selectedWork.image_path}
                  alt={selectedWork.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedWork(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <div className="p-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedWork.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {selectedWork.description}
                </p>
                {selectedWork.category && (
                  <div className="mt-6">
                    <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                      {selectedWork.category}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
