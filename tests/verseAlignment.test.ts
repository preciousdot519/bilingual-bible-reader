import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { groupVerses } from "../src/utils/verseAlignment.ts";
import type { Chapter, Verse } from "../src/types.ts";

const chapter = (book: string, number: number): Chapter => JSON.parse(
  readFileSync(new URL(`../public/bible/${book}/${number}.json`, import.meta.url), "utf8"),
);

test("Acts 4:29–30 aligns one Chinese passage with two English verses", () => {
  const groups = groupVerses(chapter("ACT", 4).verses);
  const passage = groups.find((group) => group.verse === "29-30")!;
  assert.ok(passage);
  assert.deepEqual(passage.entries.filter((v) => v.zhSimplified.text).map((v) => v.verse), ["29-30"]);
  assert.deepEqual(passage.entries.filter((v) => v.en.text).map((v) => v.verse), ["29", "30"]);
  assert.equal(groups.some((group) => group.verse === "29" || group.verse === "30"), false);
  assert.equal(groups[groups.indexOf(passage) + 1].verse, "31");
  assert.ok(passage.entries.find((v) => v.verse === "29-30")!.zhSimplified.footnotes.length);
});

test("overlapping ranges merge transitively without joining adjacent verses", () => {
  const verse = (label: string) => ({ verse: label } as Verse);
  assert.deepEqual(groupVerses([verse("4"), verse("2-3"), verse("1-2"), verse("5")])
    .map((group) => group.verse), ["1-3", "4", "5"]);
});

test("all 1,189 chapters preserve original entries and align every overlapping range", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/bible/manifest.json", import.meta.url), "utf8"));
  let chapters = 0;
  let ranges = 0;
  for (const book of manifest.books) {
    for (let number = 1; number <= book.chapters; number++) {
      chapters++;
      const original = chapter(book.id, number).verses;
      const groups = groupVerses(original);
      const flattened = groups.flatMap((group) => group.entries);
      assert.equal(flattened.length, original.length);
      assert.ok(original.every((entry) => flattened.includes(entry)), `${book.id} ${number}: no lost text or notes`);
      let previousEnd = 0;
      for (const group of groups) {
        const [start, end = start] = group.verse.split("-").map(Number);
        assert.ok(start > previousEnd, `${book.id} ${number}: disjoint groups`);
        previousEnd = end;
        for (const entry of group.entries) if (entry.verse.includes("-")) ranges++;
      }
    }
  }
  assert.equal(chapters, 1189);
  assert.equal(ranges, 70);
});
