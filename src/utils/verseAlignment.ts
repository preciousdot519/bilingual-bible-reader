import type { Verse } from "../types";

export type VerseGroup = {
  verse: string;
  entries: Verse[];
};

// Overlapping verse divisions belong to one aligned passage. Keep each
// translation's original labels, text and notes within that passage.
export function groupVerses(verses: Verse[]): VerseGroup[] {
  const sorted = verses.map((entry) => {
    const [start, end = start] = entry.verse.split("-").map(Number);
    return { entry, start, end };
  }).sort((a, b) => a.start - b.start || a.end - b.end);

  const groups: { start: number; end: number; entries: Verse[] }[] = [];
  for (const { entry, start, end } of sorted) {
    const previous = groups[groups.length - 1];
    if (previous && start <= previous.end) {
      previous.end = Math.max(previous.end, end);
      previous.entries.push(entry);
    } else {
      groups.push({ start, end, entries: [entry] });
    }
  }
  return groups.map(({ start, end, entries }) => ({
    verse: start === end ? String(start) : `${start}-${end}`,
    entries,
  }));
}
