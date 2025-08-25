
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { filterBooksWithCovers, constructImageUrl } from '@/lib/imageUtils';

export default function HeroSection() {
  const [floatingBooks, setFloatingBooks] = useState([]);

  useEffect(() => {
    const fetchFloatingBooks = async () => {
      try {
        // Fetch more books to filter for ones with cover images
        let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?limit=12&is_featured=true`);
        let data = await response.json();
        let books = data.books || [];
        
        // If no featured books, fetch any books
        if (books.length === 0) {
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?limit=12`);
          data = await response.json();
          books = data.books || [];
        }
        
        // Filter books that have cover images
        const booksWithCovers = filterBooksWithCovers(books);
        
        if (booksWithCovers.length > 0) {
          const positions = ['top-left', 'bottom-left', 'top-right', 'bottom-right'];
          
          const updatedBooks = booksWithCovers.slice(0, 4).map((book: any, index: number) => {
            const coverPath = book.cover_image_url || book.cover_image || book.cover;
            const fullImageUrl = constructImageUrl(coverPath);
            
            return {
              id: book.id.toString(),
              title: book.title,
              author: book.author_name || book.author,
              image: fullImageUrl,
              position: positions[index]
            };
          });
          
          setFloatingBooks(updatedBooks);
        }
      } catch (error) {
        console.error('Error fetching floating books:', error);
      }
    };
    
    fetchFloatingBooks();
  }, []);

  const stats = [
    { number: '10,000+', label: 'Books Available' },
    { number: '1M+', label: 'Happy Readers' },
    { number: '24/7', label: 'Customer Support' }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-screen gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center">
          {/* Centered headline with white text */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-white">
            <span className="block">
              Your favorite book could
            </span>
            <span className="block">
              win you amazing prices!
            </span>
          </h1>
          
          {/* Subtext */}
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join our community of students and book lovers around the world. We thrive to promote the reading culture via incentive programs in African schools.
          </p>
          
          {/* Two CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/books"
              className="bg-gradient-to-r from-blue-800 to-purple-700 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-900 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link 
              href="/books"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2"
            >
              <i className="ri-book-line text-lg"></i>
              <span>Browse Collection</span>
            </Link>
          </div>
          

        </div>
      </div>
      
      {/* Floating book cards with increased size and subtle floating animation - Hidden on mobile */}
      {floatingBooks.map((book) => (
        <div
          key={book.id}
          className={`absolute hidden md:block ${
            book.position === 'top-left' ? 'top-20 left-10' :
            book.position === 'bottom-left' ? 'bottom-20 left-10' :
            book.position === 'top-right' ? 'top-20 right-10' :
            'bottom-20 right-10'
          }`}
        >
          <div className="relative group animate-float">
            <div className="transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
              <OptimizedImage
                src={book.image}
                alt={book.title}
                className="w-36 h-48 object-cover rounded-lg shadow-2xl"
                width={144}
                height={192}
                showPlaceholderOnError={false}
              />
              <div className="absolute -bottom-8 left-0 right-0 text-center">
                <div className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
                  <div className="truncate">{book.title}</div>
                  {book.author && (
                    <div className="text-gray-600 text-xs truncate">{book.author}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Mobile floating books - Removed for cleaner mobile experience */}
      
      {/* Decorative floating elements */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-white/25 rounded-full animate-pulse delay-500"></div>
      
      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
}
