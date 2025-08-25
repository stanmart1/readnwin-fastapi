
'use client';

import { useState, useEffect } from 'react';
import BookCard from './BookCard';

interface NewBook {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  cover: string;
  isAvailable: boolean;
}

export default function NewReleases() {
  const [currentPage, setCurrentPage] = useState(0);
  const [books, setBooks] = useState<NewBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const booksPerPage = 4;

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          limit: '8',
          is_new_release: 'true',
          sort_by: 'created_at',
          sort_order: 'desc'
        });
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch new releases');
        }
        
        const data = await response.json();
        
        const apiBooks = data.books || data;
        
        if (apiBooks && apiBooks.length > 0) {
          // Transform API data to match our NewBook interface
          const transformedBooks: NewBook[] = apiBooks.map((book: any) => ({
            id: book.id.toString(),
            title: book.title,
            author: book.author_name || 'Unknown Author',
            price: book.price,
            originalPrice: book.original_price,
            rating: book.rating || 0,
            reviewCount: book.review_count || 0,
            cover: book.cover_image_url || '',
            isAvailable: book.status === 'published'
          }));
          
          setBooks(transformedBooks);
        } else {
          setBooks([]);
        }
      } catch (error) {
        console.error('Error fetching new releases:', error);
        setError('Failed to load new releases');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  const totalPages = Math.ceil(books.length / booksPerPage);
  const startIndex = currentPage * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading new releases...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">
            <p>No new releases available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">New Releases</h2>
            <p className="text-gray-600">Discover the latest books from your favorite authors</p>
          </div>
          {totalPages > 1 && (
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextPage}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentBooks.map((book) => (
            <div key={book.id} className="relative">
              {book.originalPrice && book.originalPrice > book.price && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
                </div>
              )}
              <BookCard
                id={book.id}
                title={book.title}
                author_name={book.author}
                price={book.price}
                original_price={book.originalPrice}
                rating={book.rating}
                reviewCount={book.reviewCount}
                cover_image_url={book.cover}
                isAvailable={book.isAvailable}
                hideReadButton={true}
              />
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentPage === i ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
