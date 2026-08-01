import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import usfm from "usfm-js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "..");

const sourceDirectories = {
  en: path.join(projectRoot, "sources", "english"),
  zhSimplified: path.join(
    projectRoot,
    "sources",
    "chinese-simplified"
  ),
  zhTraditional: path.join(
    projectRoot,
    "sources",
    "chinese-traditional"
  ),
};

const outputDirectory = path.join(
  projectRoot,
  "public",
  "bible"
);

const bibleBooks = [
  { id: "GEN", english: "Genesis", zhSimplified: "\u521B\u4E16\u8BB0", zhTraditional: "\u5275\u4E16\u8A18", expectedChapters: 50 },
  { id: "EXO", english: "Exodus", zhSimplified: "\u51FA\u57C3\u53CA\u8BB0", zhTraditional: "\u51FA\u57C3\u53CA\u8A18", expectedChapters: 40 },
  { id: "LEV", english: "Leviticus", zhSimplified: "\u5229\u672A\u8BB0", zhTraditional: "\u5229\u672A\u8A18", expectedChapters: 27 },
  { id: "NUM", english: "Numbers", zhSimplified: "\u6C11\u6570\u8BB0", zhTraditional: "\u6C11\u6578\u8A18", expectedChapters: 36 },
  { id: "DEU", english: "Deuteronomy", zhSimplified: "\u7533\u547D\u8BB0", zhTraditional: "\u7533\u547D\u8A18", expectedChapters: 34 },
  { id: "JOS", english: "Joshua", zhSimplified: "\u7EA6\u4E66\u4E9A\u8BB0", zhTraditional: "\u7D04\u66F8\u4E9E\u8A18", expectedChapters: 24 },
  { id: "JDG", english: "Judges", zhSimplified: "\u58EB\u5E08\u8BB0", zhTraditional: "\u58EB\u5E2B\u8A18", expectedChapters: 21 },
  { id: "RUT", english: "Ruth", zhSimplified: "\u8DEF\u5F97\u8BB0", zhTraditional: "\u8DEF\u5F97\u8A18", expectedChapters: 4 },
  { id: "1SA", english: "1 Samuel", zhSimplified: "\u6492\u6BCD\u8033\u8BB0\u4E0A", zhTraditional: "\u6492\u6BCD\u8033\u8A18\u4E0A", expectedChapters: 31 },
  { id: "2SA", english: "2 Samuel", zhSimplified: "\u6492\u6BCD\u8033\u8BB0\u4E0B", zhTraditional: "\u6492\u6BCD\u8033\u8A18\u4E0B", expectedChapters: 24 },
  { id: "1KI", english: "1 Kings", zhSimplified: "\u5217\u738B\u7EAA\u4E0A", zhTraditional: "\u5217\u738B\u7D00\u4E0A", expectedChapters: 22 },
  { id: "2KI", english: "2 Kings", zhSimplified: "\u5217\u738B\u7EAA\u4E0B", zhTraditional: "\u5217\u738B\u7D00\u4E0B", expectedChapters: 25 },
  { id: "1CH", english: "1 Chronicles", zhSimplified: "\u5386\u4EE3\u5FD7\u4E0A", zhTraditional: "\u6B77\u4EE3\u5FD7\u4E0A", expectedChapters: 29 },
  { id: "2CH", english: "2 Chronicles", zhSimplified: "\u5386\u4EE3\u5FD7\u4E0B", zhTraditional: "\u6B77\u4EE3\u5FD7\u4E0B", expectedChapters: 36 },
  { id: "EZR", english: "Ezra", zhSimplified: "\u4EE5\u65AF\u62C9\u8BB0", zhTraditional: "\u4EE5\u65AF\u62C9\u8A18", expectedChapters: 10 },
  { id: "NEH", english: "Nehemiah", zhSimplified: "\u5C3C\u5E0C\u7C73\u8BB0", zhTraditional: "\u5C3C\u5E0C\u7C73\u8A18", expectedChapters: 13 },
  { id: "EST", english: "Esther", zhSimplified: "\u4EE5\u65AF\u5E16\u8BB0", zhTraditional: "\u4EE5\u65AF\u5E16\u8A18", expectedChapters: 10 },
  { id: "JOB", english: "Job", zhSimplified: "\u7EA6\u4F2F\u8BB0", zhTraditional: "\u7D04\u4F2F\u8A18", expectedChapters: 42 },
  { id: "PSA", english: "Psalms", zhSimplified: "\u8BD7\u7BC7", zhTraditional: "\u8A69\u7BC7", expectedChapters: 150 },
  { id: "PRO", english: "Proverbs", zhSimplified: "\u7BB4\u8A00", zhTraditional: "\u7BB4\u8A00", expectedChapters: 31 },
  { id: "ECC", english: "Ecclesiastes", zhSimplified: "\u4F20\u9053\u4E66", zhTraditional: "\u50B3\u9053\u66F8", expectedChapters: 12 },
  { id: "SNG", english: "Song of Songs", zhSimplified: "\u96C5\u6B4C", zhTraditional: "\u96C5\u6B4C", expectedChapters: 8 },
  { id: "ISA", english: "Isaiah", zhSimplified: "\u4EE5\u8D5B\u4E9A\u4E66", zhTraditional: "\u4EE5\u8CFD\u4E9E\u66F8", expectedChapters: 66 },
  { id: "JER", english: "Jeremiah", zhSimplified: "\u8036\u5229\u7C73\u4E66", zhTraditional: "\u8036\u5229\u7C73\u66F8", expectedChapters: 52 },
  { id: "LAM", english: "Lamentations", zhSimplified: "\u8036\u5229\u7C73\u54C0\u6B4C", zhTraditional: "\u8036\u5229\u7C73\u54C0\u6B4C", expectedChapters: 5 },
  { id: "EZK", english: "Ezekiel", zhSimplified: "\u4EE5\u897F\u7ED3\u4E66", zhTraditional: "\u4EE5\u897F\u7D50\u66F8", expectedChapters: 48 },
  { id: "DAN", english: "Daniel", zhSimplified: "\u4F46\u4EE5\u7406\u4E66", zhTraditional: "\u4F46\u4EE5\u7406\u66F8", expectedChapters: 12 },
  { id: "HOS", english: "Hosea", zhSimplified: "\u4F55\u897F\u963F\u4E66", zhTraditional: "\u4F55\u897F\u963F\u66F8", expectedChapters: 14 },
  { id: "JOL", english: "Joel", zhSimplified: "\u7EA6\u73E5\u4E66", zhTraditional: "\u7D04\u73E5\u66F8", expectedChapters: 3 },
  { id: "AMO", english: "Amos", zhSimplified: "\u963F\u6469\u53F8\u4E66", zhTraditional: "\u963F\u6469\u53F8\u66F8", expectedChapters: 9 },
  { id: "OBA", english: "Obadiah", zhSimplified: "\u4FC4\u5DF4\u5E95\u4E9A\u4E66", zhTraditional: "\u4FC4\u5DF4\u5E95\u4E9E\u66F8", expectedChapters: 1 },
  { id: "JON", english: "Jonah", zhSimplified: "\u7EA6\u62FF\u4E66", zhTraditional: "\u7D04\u62FF\u66F8", expectedChapters: 4 },
  { id: "MIC", english: "Micah", zhSimplified: "\u5F25\u8FE6\u4E66", zhTraditional: "\u5F4C\u8FE6\u66F8", expectedChapters: 7 },
  { id: "NAM", english: "Nahum", zhSimplified: "\u90A3\u9E3F\u4E66", zhTraditional: "\u90A3\u9D3B\u66F8", expectedChapters: 3 },
  { id: "HAB", english: "Habakkuk", zhSimplified: "\u54C8\u5DF4\u8C37\u4E66", zhTraditional: "\u54C8\u5DF4\u8C37\u66F8", expectedChapters: 3 },
  { id: "ZEP", english: "Zephaniah", zhSimplified: "\u897F\u756A\u96C5\u4E66", zhTraditional: "\u897F\u756A\u96C5\u66F8", expectedChapters: 3 },
  { id: "HAG", english: "Haggai", zhSimplified: "\u54C8\u8BE5\u4E66", zhTraditional: "\u54C8\u8A72\u66F8", expectedChapters: 2 },
  { id: "ZEC", english: "Zechariah", zhSimplified: "\u6492\u8FE6\u5229\u4E9A\u4E66", zhTraditional: "\u6492\u8FE6\u5229\u4E9E\u66F8", expectedChapters: 14 },
  { id: "MAL", english: "Malachi", zhSimplified: "\u739B\u62C9\u57FA\u4E66", zhTraditional: "\u746A\u62C9\u57FA\u66F8", expectedChapters: 4 },
  { id: "MAT", english: "Matthew", zhSimplified: "\u9A6C\u592A\u798F\u97F3", zhTraditional: "\u99AC\u592A\u798F\u97F3", expectedChapters: 28 },
  { id: "MRK", english: "Mark", zhSimplified: "\u9A6C\u53EF\u798F\u97F3", zhTraditional: "\u99AC\u53EF\u798F\u97F3", expectedChapters: 16 },
  { id: "LUK", english: "Luke", zhSimplified: "\u8DEF\u52A0\u798F\u97F3", zhTraditional: "\u8DEF\u52A0\u798F\u97F3", expectedChapters: 24 },
  { id: "JHN", english: "John", zhSimplified: "\u7EA6\u7FF0\u798F\u97F3", zhTraditional: "\u7D04\u7FF0\u798F\u97F3", expectedChapters: 21 },
  { id: "ACT", english: "Acts", zhSimplified: "\u4F7F\u5F92\u884C\u4F20", zhTraditional: "\u4F7F\u5F92\u884C\u50B3", expectedChapters: 28 },
  { id: "ROM", english: "Romans", zhSimplified: "\u7F57\u9A6C\u4E66", zhTraditional: "\u7F85\u99AC\u66F8", expectedChapters: 16 },
  { id: "1CO", english: "1 Corinthians", zhSimplified: "\u54E5\u6797\u591A\u524D\u4E66", zhTraditional: "\u54E5\u6797\u591A\u524D\u66F8", expectedChapters: 16 },
  { id: "2CO", english: "2 Corinthians", zhSimplified: "\u54E5\u6797\u591A\u540E\u4E66", zhTraditional: "\u54E5\u6797\u591A\u5F8C\u66F8", expectedChapters: 13 },
  { id: "GAL", english: "Galatians", zhSimplified: "\u52A0\u62C9\u592A\u4E66", zhTraditional: "\u52A0\u62C9\u592A\u66F8", expectedChapters: 6 },
  { id: "EPH", english: "Ephesians", zhSimplified: "\u4EE5\u5F17\u6240\u4E66", zhTraditional: "\u4EE5\u5F17\u6240\u66F8", expectedChapters: 6 },
  { id: "PHP", english: "Philippians", zhSimplified: "\u8153\u7ACB\u6BD4\u4E66", zhTraditional: "\u8153\u7ACB\u6BD4\u66F8", expectedChapters: 4 },
  { id: "COL", english: "Colossians", zhSimplified: "\u6B4C\u7F57\u897F\u4E66", zhTraditional: "\u6B4C\u7F85\u897F\u66F8", expectedChapters: 4 },
  { id: "1TH", english: "1 Thessalonians", zhSimplified: "\u5E16\u6492\u7F57\u5C3C\u8FE6\u524D\u4E66", zhTraditional: "\u5E16\u6492\u7F85\u5C3C\u8FE6\u524D\u66F8", expectedChapters: 5 },
  { id: "2TH", english: "2 Thessalonians", zhSimplified: "\u5E16\u6492\u7F57\u5C3C\u8FE6\u540E\u4E66", zhTraditional: "\u5E16\u6492\u7F85\u5C3C\u8FE6\u5F8C\u66F8", expectedChapters: 3 },
  { id: "1TI", english: "1 Timothy", zhSimplified: "\u63D0\u6469\u592A\u524D\u4E66", zhTraditional: "\u63D0\u6469\u592A\u524D\u66F8", expectedChapters: 6 },
  { id: "2TI", english: "2 Timothy", zhSimplified: "\u63D0\u6469\u592A\u540E\u4E66", zhTraditional: "\u63D0\u6469\u592A\u5F8C\u66F8", expectedChapters: 4 },
  { id: "TIT", english: "Titus", zhSimplified: "\u63D0\u591A\u4E66", zhTraditional: "\u63D0\u591A\u66F8", expectedChapters: 3 },
  { id: "PHM", english: "Philemon", zhSimplified: "\u8153\u5229\u95E8\u4E66", zhTraditional: "\u8153\u5229\u9580\u66F8", expectedChapters: 1 },
  { id: "HEB", english: "Hebrews", zhSimplified: "\u5E0C\u4F2F\u6765\u4E66", zhTraditional: "\u5E0C\u4F2F\u4F86\u66F8", expectedChapters: 13 },
  { id: "JAS", english: "James", zhSimplified: "\u96C5\u5404\u4E66", zhTraditional: "\u96C5\u5404\u66F8", expectedChapters: 5 },
  { id: "1PE", english: "1 Peter", zhSimplified: "\u5F7C\u5F97\u524D\u4E66", zhTraditional: "\u5F7C\u5F97\u524D\u66F8", expectedChapters: 5 },
  { id: "2PE", english: "2 Peter", zhSimplified: "\u5F7C\u5F97\u540E\u4E66", zhTraditional: "\u5F7C\u5F97\u5F8C\u66F8", expectedChapters: 3 },
  { id: "1JN", english: "1 John", zhSimplified: "\u7EA6\u7FF0\u4E00\u4E66", zhTraditional: "\u7D04\u7FF0\u4E00\u66F8", expectedChapters: 5 },
  { id: "2JN", english: "2 John", zhSimplified: "\u7EA6\u7FF0\u4E8C\u4E66", zhTraditional: "\u7D04\u7FF0\u4E8C\u66F8", expectedChapters: 1 },
  { id: "3JN", english: "3 John", zhSimplified: "\u7EA6\u7FF0\u4E09\u4E66", zhTraditional: "\u7D04\u7FF0\u4E09\u66F8", expectedChapters: 1 },
  { id: "JUD", english: "Jude", zhSimplified: "\u72B9\u5927\u4E66", zhTraditional: "\u7336\u5927\u66F8", expectedChapters: 1 },
  { id: "REV", english: "Revelation", zhSimplified: "\u542F\u793A\u5F55", zhTraditional: "\u555F\u793A\u9304", expectedChapters: 22 },
];

const bibleBooksById = new Map(
  bibleBooks.map((book) => [book.id, book])
);
async function listUsfmFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => {
      const name = entry.name.toLowerCase();

      return (
        name.endsWith(".usfm") ||
        name.endsWith(".sfm")
      );
    })
    .map((entry) => path.join(directory, entry.name));
}

function detectBookId(filename, content) {
  const idMatch = content.match(
    /^\\id\s+([A-Z0-9]{3})/m
  );

  if (idMatch) {
    return idMatch[1];
  }

  const filenameTokens =
    filename.toUpperCase().match(/[A-Z0-9]{3}/g) ?? [];

  return (
    filenameTokens.find((token) =>
      bibleBooksById.has(token)
    ) ?? null
  );
}

async function loadBooks(directory) {
  const files = await listUsfmFiles(directory);
  const books = new Map();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");

    const bookId = detectBookId(
      path.basename(file),
      content
    );

    if (!bookId || !bibleBooksById.has(bookId)) {
      continue;
    }

    books.set(bookId, {
      file,
      content,
    });
  }

  return books;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeNestedResult(target, nested) {
  target.text += nested.text;

  target.footnotes.push(
    ...nested.footnotes
  );

  target.crossReferences.push(
    ...nested.crossReferences
  );
}

function cleanWordContent(value) {
  return String(value ?? "")
    .replace(/\|.*$/, "");
}

function cleanNoteContent(value) {
  return normalizeText(
    String(value ?? "")
      .replace(/\\(?:fr|ft|fq|fqa|fk|fl|fp|fv|fdc)\s*/g, " ")
      .replace(/\\\+?(?:wh|w)\s*/g, "")
      .replace(/\\\+?(?:wh|w)\*/g, "")
      .replace(/\|[^\\\s]+/g, "")
      .replace(/\\f\*/g, " ")
      .replace(/^\+\s*/, "")
  );
}

function cleanCrossReferenceContent(value) {
  return normalizeText(
    String(value ?? "")
      .replace(/\\(?:xo|xt|xk|xq|xta)\s*/g, " ")
      .replace(/\\x\*/g, " ")
      .replace(/^\+\s*/, "")
  );
}

function extractTextFromVerseObjects(
  verseObjects = []
) {
  const result = {
    text: "",
    footnotes: [],
    crossReferences: [],
  };

  for (const object of verseObjects) {
    if (!object || typeof object !== "object") {
      continue;
    }

    if (
      object.type === "footnote" ||
      object.tag === "f"
    ) {
      const nested = extractTextFromVerseObjects(
        object.children ??
          object.verseObjects ??
          []
      );

      const noteText = cleanNoteContent(
        typeof object.content === "string"
          ? object.content
          : nested.text
      );

      if (noteText) {
        result.footnotes.push({
          id: `f${result.footnotes.length + 1}`,
          text: noteText,
        });
      }

      continue;
    }

    if (
      object.type === "crossReference" ||
      object.type === "cross-reference" ||
      object.tag === "x"
    ) {
      const nested = extractTextFromVerseObjects(
        object.children ??
          object.verseObjects ??
          []
      );

      const referenceText =
        cleanCrossReferenceContent(
          typeof object.content === "string"
            ? object.content
            : nested.text
        );

      if (referenceText) {
        result.crossReferences.push({
          id: `x${result.crossReferences.length + 1}`,
          text: referenceText,
          targets: [],
        });
      }

      continue;
    }

    if (
      object.type === "text" ||
      object.type === "word"
    ) {
      result.text += object.text ?? "";
    } else if (
      (
        object.type === "quote" ||
        object.tag === "wj" ||
        object.tag === "+wj" ||
        object.tag === "pn" ||
        object.tag === "+pn" ||
        object.tag === "add" ||
        object.tag === "+add"
      ) &&
      typeof object.text === "string"
    ) {
      result.text += object.text;
    }

    if (typeof object.content === "string") {
      if (
        object.tag === "w" ||
        object.tag === "+w" ||
        object.tag === "wj" ||
        object.tag === "+wj"
      ) {
        const word = cleanWordContent(
          object.content
        );

        if (word) {
          result.text += `${word} `;
        }
      } else if (
        object.tag === "w*" ||
        object.tag === "+w*" ||
        object.tag === "wj*" ||
        object.tag === "+wj*"
      ) {
        result.text +=
          String(object.content ?? "") +
          String(object.endMarkerChar ?? "");
      } else if (!object.type) {
        result.text += object.content;
      }
    }

    if (Array.isArray(object.verseObjects)) {
      const nested =
        extractTextFromVerseObjects(
          object.verseObjects
        );

      mergeNestedResult(result, nested);
    }

    if (Array.isArray(object.content)) {
      const nested =
        extractTextFromVerseObjects(
          object.content
        );

      mergeNestedResult(result, nested);
    }

    if (Array.isArray(object.children)) {
      const nested =
        extractTextFromVerseObjects(
          object.children
        );

      mergeNestedResult(result, nested);

      if (
        (
          object.tag === "bk" ||
          object.tag === "+bk"
        ) &&
        typeof object.nextChar === "string"
      ) {
        result.text += object.nextChar;
      }
    }
  }

  return {
    text: normalizeText(result.text)
      .replace(/^[|\s]+/, "")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([“‘([{])\s+/g, "$1")
      .replace(/\s+([”’)\]}])/g, "$1"),
    footnotes: result.footnotes,
    crossReferences:
      result.crossReferences,
  };
}
function parseUsfmBook(usfmText) {
  const parsed = usfm.toJSON(usfmText, {
    chunk: false,
    convertToInt: false,
  });

  const chapters = new Map();

  for (const [
    chapterNumber,
    chapterData,
  ] of Object.entries(
    parsed.chapters ?? {}
  )) {
    const verseMap = new Map();

    for (const [
      verseNumber,
      verseData,
    ] of Object.entries(
      chapterData ?? {}
    )) {
      if (verseNumber === "front") {
        continue;
      }

      const verseObjects =
        verseData?.verseObjects ??
        verseData?.verseobjects ??
        [];

      const content =
        extractTextFromVerseObjects(
          verseObjects
        );

      verseMap.set(
        String(verseNumber),
        content
      );
    }

    chapters.set(
      Number(chapterNumber),
      verseMap
    );
  }

  return chapters;
}

function createEmptyContent() {
  return {
    text: "",
    footnotes: [],
    crossReferences: [],
  };
}

function sortVerseNumbers(
  verseNumbers
) {
  return [...verseNumbers].sort(
    (left, right) => {
      const leftNumber =
        Number.parseInt(left, 10);

      const rightNumber =
        Number.parseInt(right, 10);

      if (leftNumber !== rightNumber) {
        return leftNumber - rightNumber;
      }

      return left.localeCompare(right);
    }
  );
}

async function writeChapter({
  bookId,
  chapterNumber,
  enChapter,
  zhSimplifiedChapter,
  zhTraditionalChapter,
}) {
  const verseNumbers = new Set([
    ...(enChapter?.keys() ?? []),
    ...(
      zhSimplifiedChapter?.keys() ??
      []
    ),
    ...(
      zhTraditionalChapter?.keys() ??
      []
    ),
  ]);

  const verses = sortVerseNumbers(
    verseNumbers
  ).map((verseNumber) => ({
    verse: verseNumber,

    en:
      enChapter?.get(verseNumber) ??
      createEmptyContent(),

    zhSimplified:
      zhSimplifiedChapter?.get(
        verseNumber
      ) ?? createEmptyContent(),

    zhTraditional:
      zhTraditionalChapter?.get(
        verseNumber
      ) ?? createEmptyContent(),
  }));

  const chapter = {
    bookId,
    chapter: chapterNumber,
    bookEnglish:
      bibleBooksById.get(bookId).english,
    bookChineseSimplified:
      bibleBooksById.get(bookId).zhSimplified,
    bookChineseTraditional:
      bibleBooksById.get(bookId).zhTraditional,
    verses,
  };

  const bookDirectory = path.join(
    outputDirectory,
    bookId
  );

  await fs.mkdir(bookDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    path.join(
      bookDirectory,
      `${chapterNumber}.json`
    ),
    JSON.stringify(chapter, null, 2),
    "utf8"
  );
}

async function main() {
  console.log(
    "Loading USFM source files..."
  );

  const englishBooks = await loadBooks(
    sourceDirectories.en
  );

  const simplifiedBooks =
    await loadBooks(
      sourceDirectories.zhSimplified
    );

  const traditionalBooks =
    await loadBooks(
      sourceDirectories.zhTraditional
    );

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  const manifestBooks = [];

  for (const book of bibleBooks) {
    const bookId = book.id;
    const englishSource =
      englishBooks.get(bookId);

    const simplifiedSource =
      simplifiedBooks.get(bookId);

    const traditionalSource =
      traditionalBooks.get(bookId);

    if (
      !englishSource ||
      !simplifiedSource ||
      !traditionalSource
    ) {
      const missingLanguages = [
        !englishSource ? "English" : null,
        !simplifiedSource ? "Simplified Chinese" : null,
        !traditionalSource ? "Traditional Chinese" : null,
      ].filter(Boolean);

      throw new Error(
        `Missing source file(s) for ${bookId}: ${missingLanguages.join(", ")}`
      );
    }

    console.log(
      `Parsing ${bookId}...`
    );

    const englishChapters =
      parseUsfmBook(
        englishSource.content
      );

    const simplifiedChapters =
      parseUsfmBook(
        simplifiedSource.content
      );

    const traditionalChapters =
      parseUsfmBook(
        traditionalSource.content
      );

    const chapterNumbers = new Set([
      ...englishChapters.keys(),
      ...simplifiedChapters.keys(),
      ...traditionalChapters.keys(),
    ]);

    const sortedChapterNumbers = [
      ...chapterNumbers,
    ].sort((a, b) => a - b);

    const chapterCounts = {
      English: englishChapters.size,
      "Simplified Chinese": simplifiedChapters.size,
      "Traditional Chinese": traditionalChapters.size,
    };

    for (const [language, actualCount] of Object.entries(chapterCounts)) {
      if (actualCount !== book.expectedChapters) {
        throw new Error(
          `${bookId} ${language} chapter count mismatch: expected ${book.expectedChapters}, found ${actualCount}`
        );
      }
    }

    const expectedChapterNumbers = Array.from(
      { length: book.expectedChapters },
      (_, index) => index + 1
    );

    for (const chapterNumber of expectedChapterNumbers) {
      if (
        !englishChapters.has(chapterNumber) ||
        !simplifiedChapters.has(chapterNumber) ||
        !traditionalChapters.has(chapterNumber)
      ) {
        throw new Error(
          `${bookId} chapter ${chapterNumber} is missing from one or more translations`
        );
      }
    }

    for (
      const chapterNumber of
        sortedChapterNumbers
    ) {
      await writeChapter({
        bookId,
        chapterNumber,
        enChapter:
          englishChapters.get(
            chapterNumber
          ),
        zhSimplifiedChapter:
          simplifiedChapters.get(
            chapterNumber
          ),
        zhTraditionalChapter:
          traditionalChapters.get(
            chapterNumber
          ),
      });
    }

    manifestBooks.push({
      id: bookId,
      english:
        bibleBooksById.get(bookId).english,
      zhSimplified:
        bibleBooksById.get(bookId).zhSimplified,
      zhTraditional:
        bibleBooksById.get(bookId).zhTraditional,
      chapters: book.expectedChapters,
    });
  }

  await fs.writeFile(
    path.join(
      outputDirectory,
      "manifest.json"
    ),
    JSON.stringify(
      {
        generatedAt:
          new Date().toISOString(),
        books: manifestBooks,
      },
      null,
      2
    ),
    "utf8"
  );

  const sourcesDocument = `# Bible Sources and Licensing

This application contains the complete 66-book Protestant Bible generated from local USFM source files downloaded from eBible.org.

## Included editions

### English

- Translation: World English Bible, Protestant edition
- Dataset ID: \`engwebp\`
- Canon: 66-book Protestant canon
- Source: https://ebible.org/engwebp/
- Licensing status: Public domain
- Trademark note: "World English Bible" is a trademark of eBible.org. eBible.org asks that a text changed from the World English Bible not continue to be called the World English Bible.

### Simplified Chinese

- Translation: Chinese Union Version, New Punctuation
- Dataset ID: \`cmn-cu89s\`
- Script: Simplified Chinese
- Source: https://ebible.org/cmn-cu89s/
- Licensing status: Public domain

### Traditional Chinese

- Translation: Chinese Union Version, New Punctuation
- Dataset ID: \`cmn-cu89t\`
- Script: Traditional Chinese
- Source: https://ebible.org/cmn-cu89t/
- Licensing status: Public domain

## Data processing

The source USFM files are converted into static chapter-level JSON for this application.

The conversion:

- preserves the supplied Scripture wording while removing USFM markup from displayed text;
- preserves footnotes and cross-references as structured note data;
- omits Strong's-number attributes from displayed verse text;
- preserves visible text carried by USFM character markers such as word, quotation, supplied-word, proper-name and book-title markers;
- aligns translations by their original verse labels without rewriting edition-specific versification;
- excludes non-canonical front matter and glossary files from the 66-book manifest.

Because the editions sometimes combine, divide or number verses differently, some aligned rows can be empty in one translation while the corresponding text appears under a neighboring or combined verse label in another translation.

## Provenance

The raw USFM source folders are intentionally excluded from Git. The generated files under \`public/bible/\` are committed because the deployed GitHub Pages application loads them as static assets.

Generated by:

\`\`\`powershell
npm run build:bible
\`\`\`
`;

  await fs.writeFile(
    path.join(
      outputDirectory,
      "SOURCES.md"
    ),
    sourcesDocument,
    "utf8"
  );
  console.log(
    "Bible data generated successfully."
  );

  console.log(
    `Output: ${outputDirectory}`
  );
}

main().catch((error) => {
  console.error(
    "Bible data generation failed."
  );

  console.error(error);

  process.exitCode = 1;
});















