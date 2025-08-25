'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";;
import Header from '@/components/Header';
import UnifiedEbookReader from '../components/UnifiedEbookReader';
import { Book } from '@/types/ereader';
import { EnhancedApiClient } from '@/lib/api-enhanced';

export default function BookReadingPage() {
  const params = useParams();
  const { user, isAuthenticated, status } = useAuth();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookId = params.bookId as string;

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const api = new EnhancedApiClient();
  
  const fetchBook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the book and reading progress
        const [bookData, progressData] = await Promise.all([
          api.request(`/books/${bookId}`),
          api.getReadingProgress(Number(bookId))
        ]);
        
        console.log('🔍 Book page: API response data:', bookData);
        console.log('🔍 Book page: Reading progress:', progressData);
        
        if (bookData.book) {
          // Transform API data to match our Book interface
          const transformedBook: Book = {
            id: bookData.book.id.toString(),
            title: bookData.book.title,
            author: bookData.book.author_name || 'Unknown Author',
            cover: bookData.book.cover_image_url || '',
            contentType: 'markdown', // Default to markdown for ebook content
            format: bookData.book.format || 'unknown',
            fileUrl: bookData.book.ebook_file_url,
            totalPages: bookData.book.pages || 0,
            wordCount: bookData.book.word_count || 0,
            category: bookData.book.category_name,
            description: bookData.book.description,
            publishedDate: bookData.book.publication_date,
            isbn: bookData.book.isbn,
            language: bookData.book.language,
            currentPage: progressData.currentPage || 0,
            lastReadAt: progressData.lastReadAt
          };
          
          console.log('🔍 Book page: Transformed book format:', transformedBook.format);
          
          // Note: Reading progress is handled by the UnifiedEbookReader internally
          
          setBook(transformedBook);
        } else {
          setError('Book not found');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        setError('Failed to load book');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, session, status, router]);

  const handleCloseReader = () => {
    router.push('/dashboard');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || "The book you're looking for doesn't exist or you don't have access to it."}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Book reading page debug:', {
    id: book.id,
    title: book.title,
    format: book.format,
    fileUrl: book.fileUrl
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <UnifiedEbookReader 
        bookId={book.id} 
        fileUrl={book.fileUrl || ''} 
        bookTitle={book.title}
        bookAuthor={book.author}
        bookFormat={book.format || 'unknown'}
        onClose={handleCloseReader} 
      />
    </div>
  );
} 