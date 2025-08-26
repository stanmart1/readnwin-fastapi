
'use client';

import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import FeaturedBooks from '@/components/FeaturedBooks';
import EReaderShowcase from '@/components/EReaderShowcase';
import WorksCarousel from '@/components/WorksCarousel';
import BlogSection from '@/components/BlogSection';
import ReviewSection from '@/components/ReviewSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <FeaturedBooks />
        <EReaderShowcase />
        <WorksCarousel />
        <BlogSection />
        <ReviewSection />
      </main>
      <Footer />
    </div>
  );
}
