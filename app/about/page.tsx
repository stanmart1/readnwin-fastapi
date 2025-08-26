'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  mission: {
    title: string;
    description: string;
    features: string[];
  };
  missionGrid: Array<{
    icon: string;
    title: string;
    description: string;
    color: string;
  }>;
  stats: Array<{
    number: string;
    label: string;
  }>;
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  story: {
    title: string;
    description: string;
    timeline: Array<{
      year: string;
      title: string;
      description: string;
    }>;
  };
  team: Array<{
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin: string;
    twitter: string;
  }>;
  cta: {
    title: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
  };
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // Add aggressive cache-busting parameters to ensure fresh data
        const timestamp = Date.now();
        const random = Math.random();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/about?t=${timestamp}&v=${random}&cb=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setContent(data);
          console.log('About content updated:', data);
        } else {
          console.error('Failed to fetch about content');
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Listen for admin content updates
    const handleContentUpdate = (event?: Event) => {
      const customEvent = event as CustomEvent;
      console.log('About content update event received', customEvent?.detail);
      fetchContent();
    };

    // Listen for both custom event and storage events
    window.addEventListener('about-content-updated', handleContentUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'about-content-updated') {
        handleContentUpdate();
      }
    });

    // Check for updates more frequently (every 10 seconds)
    const interval = setInterval(() => {
      fetchContent();
    }, 10000);

    return () => {
      window.removeEventListener('about-content-updated', handleContentUpdate);
      window.removeEventListener('storage', handleContentUpdate);
      clearInterval(interval);
    };
  }, []);

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Provide default values to prevent undefined errors
  const hero = content.hero || { title: 'About ReadnWin', subtitle: 'Revolutionizing reading' };
  const mission = content.mission || { title: 'Our Mission', description: '', features: [] };
  const missionGrid = content.missionGrid || [];
  const stats = content.stats || [];
  const values = content.values || [];
  const story = content.story || { title: 'Our Story', description: '', timeline: [] };
  const team = content.team || [];
  const cta = content.cta || { title: 'Get Started', description: '', primaryButton: 'Start Now', secondaryButton: 'Learn More' };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Debug refresh button - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => {
              setLoading(true);
              const timestamp = Date.now();
              const random = Math.random();
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/about?t=${timestamp}&v=${random}&cb=${timestamp}`, {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              })
                .then(res => res.json())
                .then(data => {
                  setContent(data);
                  setLoading(false);
                  console.log('Manual refresh successful:', data);
                })
                .catch(err => {
                  console.error('Manual refresh failed:', err);
                  setLoading(false);
                });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
          >
            🔄 Refresh Content
          </button>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              {hero.title}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {mission.title}
              </h2>
              <div 
                className="text-xl text-gray-600 mb-6 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(mission.description) }}
              />
              <div className="flex flex-wrap gap-4">
                {mission.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-blue-600">
                    <i className="ri-check-line text-xl"></i>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {(missionGrid || []).map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                      <i className={`${item.icon} text-3xl ${item.color} mb-3`}></i>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Numbers that tell the story of our commitment to revolutionizing reading
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className={`${value.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <div 
                    className="text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(value.description) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
                <div className="space-y-6">
                  {story.timeline.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-purple-600' :
                          index === 2 ? 'bg-cyan-600' :
                          'bg-green-600'
                        }`}></div>
                        <h3 className="font-semibold text-gray-900">{item.year} - {item.title}</h3>
                      </div>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {story.title}
              </h2>
              <div 
                className="text-xl text-gray-600 mb-6 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.description) }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind ReadnWin&apos;s mission to revolutionize reading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className="relative">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={400}
                      height={256}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        // Fallback to a default placeholder image
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/team/placeholder-avatar.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-3">
                        <a href={member.linkedin} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                          <i className="ri-linkedin-fill text-sm"></i>
                        </a>
                        <a href={member.twitter} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                          <i className="ri-twitter-fill text-sm"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-4">
                      {member.role}
                    </p>
                    <div 
                      className="text-gray-600 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.bio) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {cta.title}
          </h2>
          <div 
            className="text-xl text-blue-100 mb-8 prose prose-lg max-w-none prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(cta.description) }}
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors">
              {cta.primaryButton}
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-colors">
              {cta.secondaryButton}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 