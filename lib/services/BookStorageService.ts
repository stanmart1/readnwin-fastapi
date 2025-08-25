import fs from 'fs';
import path from 'path';

export class BookStorageService {
  static MEDIA_ROOT = process.env.NODE_ENV === 'production' ? '/app/media_root' : path.join(process.cwd(), 'media_root');
  static BOOKS_DIR = path.join(this.MEDIA_ROOT, 'books');
  static TEMP_DIR = path.join(this.MEDIA_ROOT, 'temp');
  static ASSETS_DIR = path.join(this.MEDIA_ROOT, 'books', 'assets');

  // Initialize directory structure
  static initializeDirectories() {
    const dirs = [
      this.BOOKS_DIR,
      this.TEMP_DIR,
      this.ASSETS_DIR,
      path.join(this.BOOKS_DIR, 'html'),
      path.join(this.BOOKS_DIR, 'originals'),
      path.join(this.ASSETS_DIR, 'images'),
      path.join(this.ASSETS_DIR, 'fonts')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  static async saveBook(bookData: any, htmlContent: string) {
    try {
      this.initializeDirectories();

      // 1. Save HTML content to file system
      const htmlPath = await this.saveHTMLContent(bookData.id, htmlContent);
      
      // 2. Save metadata to database
      const dbBook = await this.saveBookMetadata({
        id: bookData.id,
        title: bookData.metadata.title,
        author: bookData.metadata.author,
        description: bookData.metadata.description,
        wordCount: bookData.metadata.wordCount,
        pageCount: bookData.metadata.pageCount,
        chapterCount: bookData.metadata.chapterCount,
        language: bookData.metadata.language,
        isbn: bookData.metadata.isbn,
        htmlFilePath: htmlPath,
        structure: JSON.stringify(bookData.structure),
        originalFileName: bookData.originalFileName,
        processingStatus: 'completed',
        createdAt: new Date()
      });

      // 3. Save chapter data
      await this.saveChapters(bookData.id, bookData.chapters);

      return {
        bookId: bookData.id,
        htmlPath,
        dbBook
      };

    } catch (error) {
      console.error('Book storage failed:', error);
      throw new Error(`Failed to store book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async saveHTMLContent(bookId: string, htmlContent: string) {
    const fileName = `${bookId}.html`;
    const filePath = path.join(this.BOOKS_DIR, 'html', fileName);
    
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    
    // Return URL path for web access
    return `/media_root/books/html/${fileName}`;
  }

  static async saveOriginalFile(bookId: string, originalFilePath: string, originalFileName: string) {
    const extension = path.extname(originalFileName);
    const fileName = `${bookId}_original${extension}`;
    const destinationPath = path.join(this.BOOKS_DIR, 'originals', fileName);
    
    fs.copyFileSync(originalFilePath, destinationPath);
    
    return `/media_root/books/originals/${fileName}`;
  }

  static async saveBookAssets(bookId: string, assets: any[]) {
    const assetPaths = [];
    
    for (const asset of assets) {
      const fileName = `${bookId}_${asset.name}`;
      let destinationDir;
      
      if (asset.type.startsWith('image/')) {
        destinationDir = path.join(this.ASSETS_DIR, 'images');
      } else if (asset.type.includes('font')) {
        destinationDir = path.join(this.ASSETS_DIR, 'fonts');
      } else {
        destinationDir = this.ASSETS_DIR;
      }
      
      const destinationPath = path.join(destinationDir, fileName);
      fs.writeFileSync(destinationPath, asset.data);
      
      assetPaths.push({
        original: asset.name,
        path: `/media_root/books/assets/${path.relative(this.ASSETS_DIR, destinationPath)}`
      });
    }
    
    return assetPaths;
  }

  static async loadBookContent(bookId: string) {
    try {
      const htmlPath = path.join(this.BOOKS_DIR, 'html', `${bookId}.html`);
      
      if (!fs.existsSync(htmlPath)) {
        throw new Error(`Book content not found: ${bookId}`);
      }
      
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      return htmlContent;
      
    } catch (error) {
      throw new Error(`Failed to load book content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteBook(bookId: string) {
    try {
      // Delete HTML file
      const htmlPath = path.join(this.BOOKS_DIR, 'html', `${bookId}.html`);
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
      }

      // Delete original file
      const originalsDir = path.join(this.BOOKS_DIR, 'originals');
      if (fs.existsSync(originalsDir)) {
        const originalFiles = fs.readdirSync(originalsDir)
          .filter(file => file.startsWith(`${bookId}_original`));
        
        originalFiles.forEach(file => {
          fs.unlinkSync(path.join(originalsDir, file));
        });
      }

      // Delete assets
      if (fs.existsSync(this.ASSETS_DIR)) {
        const deleteAssetsRecursively = (dir: string) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              deleteAssetsRecursively(filePath);
            } else if (file.startsWith(`${bookId}_`)) {
              fs.unlinkSync(filePath);
            }
          });
        };
        deleteAssetsRecursively(this.ASSETS_DIR);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete book files:', error);
      return false;
    }
  }

  static async saveBookMetadata(bookData: any) {
    // This will be replaced with your actual database implementation
    // For now, we'll use the existing database service
    console.log('Saving book metadata:', bookData);
    return bookData;
  }

  static async saveChapters(bookId: string, chapters: any[]) {
    // This will be replaced with your actual database implementation
    for (const chapter of chapters) {
      console.log('Saving chapter:', {
        bookId,
        chapterIndex: chapter.index,
        title: chapter.title,
        wordCount: chapter.wordCount,
        estimatedReadTime: chapter.estimatedReadTime
      });
    }
  }
} 