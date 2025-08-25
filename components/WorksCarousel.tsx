'use client';

import { useRef, useState, useEffect } from 'react';
import WorkModal from './WorkModal';
import OptimizedImage from '@/components/OptimizedImage';

export default function WorksCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<{
    id: number;
    src: string;
    alt: string;
    title: string;
    description: string;
  } | null>(null);
  const [truncatedWorks, setTruncatedWorks] = useState<Set<number>>(new Set());



  const [worksImages, setWorksImages] = useState<Array<{
    id: number;
    src: string;
    alt: string;
    title: string;
    description: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorks();
  }, []);

  // Additional check for text truncation after component mounts and DOM is ready
  useEffect(() => {
    if (worksImages.length > 0) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        worksImages.forEach((work) => {
          const cardElement = document.querySelector(`[data-work-id="${work.id}"] .line-clamp-3`);
          if (cardElement) {
            const isActuallyTruncated = cardElement.scrollHeight > cardElement.clientHeight;
            if (isActuallyTruncated && !truncatedWorks.has(work.id)) {
              setTruncatedWorks(prev => new Set(prev).add(work.id));
            }
          }
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [worksImages, truncatedWorks]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/`);
      if (response.ok) {
        const portfolioItems = await response.json();
        const works = portfolioItems
          .filter((item: any) => item.is_active !== false) // Only show active works
          .map((item: any) => {
            const imagePath = item.image_url || '';
            const fullImageUrl = imagePath.startsWith('http') 
              ? imagePath 
              : `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
            
            return {
              id: item.id,
              src: fullImageUrl,
              alt: item.title,
              title: item.title,
              description: item.description || 'Innovative solutions that enhance the digital reading experience.'
            };
          });
        setWorksImages(works);
        
        // Check for text truncation after setting works
        works.forEach((work: { id: number; description: string; title: string }) => {
          checkTextTruncation(work.id, work.description || '', work.title);
        });
      } else {
        setWorksImages([]);
      }

    } catch (error) {
      console.error('Error fetching works:', error);
      setError('Error loading works');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll carousel every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % worksImages.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, worksImages.length]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * index;
      carouselRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToNext = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % worksImages.length;
      scrollToIndex(nextIndex);
      return nextIndex;
    });
  };

  const scrollToPrev = () => {
    setCurrentIndex((prevIndex) => {
      const prevIndexValue = prevIndex === 0 ? worksImages.length - 1 : prevIndex - 1;
      scrollToIndex(prevIndexValue);
      return prevIndexValue;
    });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const openModal = (work: {
    id: number;
    src: string;
    alt: string;
    title: string;
    description: string;
  }) => {
    setSelectedWork(work);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWork(null);
  };

  const isTextTruncated = (element: HTMLElement | null) => {
    if (!element) return false;
    
    // Create a temporary element to measure the full text height
    const tempElement = element.cloneNode(true) as HTMLElement;
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.height = 'auto';
    tempElement.style.maxHeight = 'none';
    tempElement.style.webkitLineClamp = 'none';
    tempElement.style.display = 'block';
    
    document.body.appendChild(tempElement);
    const fullHeight = tempElement.scrollHeight;
    document.body.removeChild(tempElement);
    
    // Compare with the original element's height
    const originalHeight = element.scrollHeight;
    
    return fullHeight > originalHeight;
  };

  const checkTextTruncation = (workId: number, description: string, title: string) => {
    // Check if description is longer than ~100 characters (definitely more than 3 lines)
    // Using a very conservative character count to ensure consistent 3-line display
    const isLongDescription = description.length > 100;
    
    if (isLongDescription) {
      setTruncatedWorks(prev => new Set(prev).add(workId));
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Some Of Our Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our innovative projects and creative solutions that transform the reading experience
            </p>
          </div>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Some Of Our Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our innovative projects and creative solutions that transform the reading experience
            </p>
          </div>
          <div className="text-center py-12">
            <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Works</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (worksImages.length === 0) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Some Of Our Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our innovative projects and creative solutions that transform the reading experience
            </p>
          </div>
          <div className="text-center py-12">
            <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Works Available</h3>
            <p className="text-gray-600">Check back soon for our latest projects and innovations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Some Of Our Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our innovative projects and creative solutions that transform the reading experience
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={scrollToPrev}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300"
            aria-label="Previous work"
          >
            <i className="ri-arrow-left-s-line text-2xl"></i>
          </button>

          <button
            onClick={scrollToNext}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300"
            aria-label="Next work"
          >
            <i className="ri-arrow-right-s-line text-2xl"></i>
          </button>

          {/* Works Carousel */}
          <div 
            ref={carouselRef}
            className="flex space-x-6 overflow-x-auto scrollbar-hide pb-8 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {worksImages.map((work, index) => (
              <div key={work.id} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3" data-work-id={work.id}>
                <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden min-h-[450px] flex flex-col">
                  <div className="relative overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={work.src}
                      alt={work.alt}
                      className="w-full h-64 object-cover object-center"
                      width={400}
                      height={256}
                      fallback="https://via.placeholder.com/400x256?text=Work+Image"
                    />
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {work.title}
                    </h3>
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {work.description || 'Innovative solutions that enhance the digital reading experience and connect readers with their favorite books.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {worksImages.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

                  {/* Auto-play toggle */}
          <div className="text-center mt-8">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="inline-flex items-center space-x-2 text-gray-600 transition-colors"
            >
              <i className={`text-xl ${isAutoPlaying ? 'ri-pause-circle-line' : 'ri-play-circle-line'}`}></i>
              <span className="text-sm font-medium">
                {isAutoPlaying ? 'Pause' : 'Play'} Auto-scroll
              </span>
            </button>
          </div>
      </div>
      
      {/* Work Modal */}
      <WorkModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        work={selectedWork}
      />
    </div>
  );
} 