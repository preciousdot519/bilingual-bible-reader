export type Note = {
  id: string;
  marker?: string;
  text: string;
  position?: number;
};

export type ScriptureReference = {
  bookId: string;
  chapter: number;
  verseStart?: string;
  verseEnd?: string;
};

export type CrossReference = {
  id: string;
  marker?: string;
  text: string;
  targets: ScriptureReference[];
  position?: number;
};

export type VerseContent = {
  text: string;
  footnotes: Note[];
  crossReferences: CrossReference[];
};

export type Verse = {
  verse: string;
  en: VerseContent;
  zhSimplified: VerseContent;
  zhTraditional: VerseContent;
};

export type Chapter = {
  bookId: string;
  chapter: number;
  bookEnglish: string;
  bookChineseSimplified: string;
  bookChineseTraditional: string;
  verses: Verse[];
};

export type BibleBook = {
  id: string;
  english: string;
  zhSimplified: string;
  zhTraditional: string;
  chapters: number;
};

export type BibleManifest = {
  generatedAt: string;
  books: BibleBook[];
};