import type { Chapter } from "../types";
import { chapters } from "../data/sampleBible";

export interface BibleProvider {
  getChapter(id: string): Promise<Chapter>;
  listChapters(): Promise<Chapter[]>;
}

export class LocalBibleProvider implements BibleProvider {
  async getChapter(id: string): Promise<Chapter> {
    const chapter = chapters.find((item) => item.id === id);
    if (!chapter) throw new Error("Chapter not found in the local demo dataset.");
    return chapter;
  }

  async listChapters(): Promise<Chapter[]> {
    return chapters;
  }
}

/**
 * API.Bible adapter placeholder.
 *
 * API.Bible requires a licensed API key and Bible version IDs.
 * Keep production secrets in Netlify environment variables.
 * A serverless proxy is recommended for a public production app so the key
 * is not shipped to browsers.
 */
export class ApiBibleProvider {
  private apiKey = import.meta.env.VITE_API_BIBLE_KEY as string | undefined;
  private englishBibleId = import.meta.env.VITE_API_BIBLE_ENGLISH_ID as string | undefined;
  private chineseBibleId = import.meta.env.VITE_API_BIBLE_CHINESE_ID as string | undefined;

  isConfigured() {
    return Boolean(this.apiKey && this.englishBibleId && this.chineseBibleId);
  }
}
