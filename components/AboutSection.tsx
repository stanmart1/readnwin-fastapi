
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Basic HTML sanitization function
const sanitizeHtml = (html: string) => {
  if (typeof html !== 'string') return html;
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '');
};

interface AboutContent {
  hero: {
    title: string;
    subtitle: string;
  };
  aboutSection?: {
    image: string;
    imageAlt: string;
  };
  mission: {
    title: string;
    description: string;
    features: string[];
  };
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export default function AboutSection() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        // Mock data for frontend-only app
        const mockData = {
          hero: {
            title: 'About ReadnWin',
            subtitle: 'Empowering The Mind Through Reading'
          },
          mission: {
            title: 'Our Mission',
            description: 'Making quality literature accessible to everyone, everywhere.',
            features: ['Unlimited Access', 'AI-Powered Recommendations', 'Global Community']
          },
          values: [
            { icon: 'ri-book-open-line', title: 'Accessibility', description: 'Making reading accessible to everyone' },
            { icon: 'ri-lightbulb-line', title: 'Innovation', description: 'Cutting-edge technology' }
          ]
        };
        setContent(mockData);
      } catch (error) {
        console.error('Error fetching about content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Listen for admin content updates
    const handleContentUpdate = () => {
      setLoading(true);
      fetchContent();
    };

    window.addEventListener('about-content-updated', handleContentUpdate);

    return () => {
      window.removeEventListener('about-content-updated', handleContentUpdate);
    };
  }, [refreshKey]);

  // Show loading state
  if (loading) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use fetched content or fallback to default
  const aboutContent = content || {
    hero: {
      title: 'About ReadnWin',
      subtitle: 'Empowering The Mind Through Reading'
    },
    aboutSection: {
      image: '/images/about.png',
      imageAlt: 'ReadnWin about section - Empowering minds through reading',
      overlayTitle: 'About ReadnWin',
      overlayDescription: 'Empowering minds through reading and technology'
    },
    mission: {
      title: 'Our Mission',
      description: 'Our mission is to make quality literature accessible to everyone, everywhere. We\'re building the world\'s most comprehensive digital reading platform, combining cutting-edge technology with timeless storytelling to create an experience that inspires, educates, and entertains.',
      features: ['Unlimited Access', 'AI-Powered Recommendations', 'Global Community']
    },
    values: [
      {
        icon: 'ri-book-open-line',
        title: 'Accessibility',
        description: 'Making reading accessible to everyone'
      },
      {
        icon: 'ri-lightbulb-line',
        title: 'Innovation',
        description: 'Cutting-edge technology'
      }
    ]
  };

  // Clean and truncate mission description for landing page (up to 6 lines)
  const cleanDescription = aboutContent.mission.description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Split into sentences and take first few sentences for 6 lines
  const sentences = cleanDescription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const truncatedDescription = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '');

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={aboutContent.aboutSection?.image || '/images/about.png'}
                alt={aboutContent.aboutSection?.imageAlt || 'ReadnWin about section - Empowering minds through reading'}
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
                onError={(e) => {
                  // Fallback to default image if uploaded image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/about.png';
                  console.warn('Failed to load about section image, using fallback');
                }}
              />
            </div>
          </div>

          {/* Right Column - Content */}
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <i className="ri-star-line mr-2"></i>
                About ReadnWin
              </span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {aboutContent.hero.title}
            </h2>
            
            <p className="text-xl text-gray-600 mb-6">
              {aboutContent.hero.subtitle}
            </p>
            
            <p className="text-lg text-gray-600 mb-8">
              {truncatedDescription}
            </p>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {aboutContent.mission.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100' :
                    index === 1 ? 'bg-purple-100' :
                    'bg-cyan-100'
                  }`}>
                    <i className={`ri-check-line ${
                      index === 0 ? 'text-blue-600' :
                      index === 1 ? 'text-purple-600' :
                      'text-cyan-600'
                    }`}></i>
                  </div>
                  <span className="font-medium text-gray-900">{feature}</span>
                </div>
              ))}
            </div>

            {/* Values Preview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {aboutContent.values.slice(0, 2).map((value, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <i className={`${value.icon} text-2xl ${
                    index === 0 ? 'text-blue-600' : 'text-purple-600'
                  }`}></i>
                  <div>
                    <h4 className="font-semibold text-gray-900">{value.title}</h4>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/about"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                <span>Read More</span>
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
