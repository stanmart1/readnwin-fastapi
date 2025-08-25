declare module 'epubjs' {
  export class Zip {
    loadAsync(buffer: Buffer): Promise<any>;
    file(path: string): any;
  }

  export class Book {
    constructor(path: string);
    open(): Promise<void>;
    getMetadata(): Promise<any>;
    getSpine(): Promise<any>;
    getToc(): Promise<any>;
    getChapterRaw(id: string): Promise<string>;
    getChapter(id: string): Promise<string>;
  }

  export function open(path: string): Promise<Book>;
}
