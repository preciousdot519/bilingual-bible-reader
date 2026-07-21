export type Verse = {
  verse: number;
  zhTraditional: string;
  zhSimplified: string;
  en: string;
};

export type Chapter = {
  id: string;
  bookEnglish: string;
  bookChineseTraditional: string;
  bookChineseSimplified: string;
  chapter: number;
  verses: Verse[];
};
