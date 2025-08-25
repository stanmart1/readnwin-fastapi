
'use client';

import { useState, useEffect } from 'react';
import BookCard from './BookCard';
import Link from 'next/link';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviewCount: number;
  cover: string;
  isAvailable: boolean;
  genre: string;
  reason: string;
}

export default function PersonalizedRecommendations() {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const genres = [
    { id: 'all', name: 'All Recommendations' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'non-fiction', name: 'Non-Fiction' },
    { id: 'self-help', name: 'Self-Help' },
    { id: 'mystery', name: 'Mystery' }
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          limit: '6',
          is_featured: 'true'
        });
        
        if (selectedGenre !== 'all') {
          params.append('category', selectedGenre);
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        
        const apiBooks = data.books || data;
        
        if (apiBooks && apiBooks.length > 0) {
          // Transform API data to match our Recommendation interface
          const transformedRecommendations: Recommendation[] = apiBooks.map((book: any) => ({
            id: book.id.toString(),
            title: book.title,
            author: book.author_name || 'Unknown Author',
            price: book.price,
            rating: book.rating || 0,
            reviewCount: book.review_count || 0,
            cover: book.cover_image_url || '',
            isAvailable: book.status === 'published',
            genre: book.category_name || 'General',
            reason: `Recommended based on your reading preferences`
          }));
          
          setRecommendations(transformedRecommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('Failed to load recommendations');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [selectedGenre]);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading recommendations...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">
            <p>No recommendations available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Recommended for You</h2>
            <p className="text-gray-600">Discover books tailored to your interests</p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((book) => (
            <div key={book.id} className="relative">
              <BookCard
                id={book.id}
                title={book.title}
                author_name={book.author}
                price={book.price}
                rating={book.rating}
                reviewCount={book.reviewCount}
                cover_image_url={book.cover}
                isAvailable={book.isAvailable}
                genre={book.genre}
                hideReadButton={true}
              />
              <div className="mt-2 text-sm text-blue-600">
                {book.reason}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/books"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Books
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
