import { BookStorageService } from './BookStorageService';

export class EReaderContentLoader {
  static async loadBook(bookId: string) {
    try {
      // Load HTML content from media_root
      const htmlContent = await BookStorageService.loadBookContent(bookId);
      
      // Get book metadata from database
      const bookMetadata = await this.getBookMetadata(bookId);
      
      return {
        content: htmlContent,
        metadata: bookMetadata,
        contentUrl: `/media_root/books/html/${bookId}.html`
      };
    } catch (error) {
      throw new Error(`Failed to load book for e-reader: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async loadBookByUrl(htmlPath: string) {
    try {
      const response = await fetch(htmlPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch book content: ${response.statusText}`);
      }
      
      const htmlContent = await response.text();
      
      // Extract book data from HTML
      const bookData = this.extractBookDataFromHTML(htmlContent);
      
      return {
        content: htmlContent,
        metadata: bookData,
        contentUrl: htmlPath
      };
    } catch (error) {
      throw new Error(`Failed to load book by URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static extractBookDataFromHTML(htmlContent: string) {
    // Extract book data from the embedded script
    const scriptMatch = htmlContent.match(/window\.bookData\s*=\s*({[^}]+})/);
    if (scriptMatch) {
      try {
        return JSON.parse(scriptMatch[1]);
      } catch (e) {
        console.warn('Failed to parse embedded book data:', e);
      }
    }
    
    // Fallback: extract from HTML meta tags
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
    const authorMatch = htmlContent.match(/<meta name="author" content="([^"]+)"/);
    
    return {
      title: titleMatch ? titleMatch[1] : 'Unknown Title',
      author: authorMatch ? authorMatch[1] : 'Unknown Author',
      wordCount: 0,
      pageCount: 0,
      chapterCount: 0
    };
  }

  static async getBookMetadata(bookId: string) {
    // This will be replaced with your actual database query
    // For now, return a placeholder
    console.log('Getting metadata for book:', bookId);
    return { id: bookId };
  }

  static async getBookChapter(bookId: string, chapterIndex: number) {
    try {
      const htmlContent = await BookStorageService.loadBookContent(bookId);
      
      // Extract specific chapter from HTML
      const chapterMatch = htmlContent.match(
        new RegExp(`<section class="chapter" id="chapter-${chapterIndex}"[^>]*>([\\s\\S]*?)<\/section>`)
      );
      
      if (chapterMatch) {
        return {
          chapterIndex,
          content: chapterMatch[1],
          bookId
        };
      }
      
      throw new Error(`Chapter ${chapterIndex} not found`);
    } catch (error) {
      throw new Error(`Failed to load chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 