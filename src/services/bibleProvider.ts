import type {
  BibleManifest,
  Chapter,
} from "../types";

const bibleBaseUrl =
  `${import.meta.env.BASE_URL}bible`;

async function fetchJson<T>(
  url: string,
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to load Bible data: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function loadBibleManifest(): Promise<BibleManifest> {
  return fetchJson<BibleManifest>(
    `${bibleBaseUrl}/manifest.json`,
  );
}

export async function loadBibleChapter(
  bookId: string,
  chapter: number,
): Promise<Chapter> {
  return fetchJson<Chapter>(
    `${bibleBaseUrl}/${bookId}/${chapter}.json`,
  );
}