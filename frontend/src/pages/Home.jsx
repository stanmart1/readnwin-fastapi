import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import FeaturedBooks from '../components/FeaturedBooks';
import EReaderShowcase from '../components/EReaderShowcase';
import WorksCarousel from '../components/WorksCarousel';
import BlogSection from '../components/BlogSection';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden max-w-full">
      <Header />
      <HeroSection />
      <AboutSection />
      <FeaturedBooks />
      <EReaderShowcase />
      <WorksCarousel />
      <BlogSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
