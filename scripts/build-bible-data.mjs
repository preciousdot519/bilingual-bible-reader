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

const testBooks = {
  GEN: {
    english: "Genesis",
    zhSimplified: "创世记",
    zhTraditional: "創世記",
  },
  PSA: {
    english: "Psalms",
    zhSimplified: "诗篇",
    zhTraditional: "詩篇",
  },
  JHN: {
    english: "John",
    zhSimplified: "约翰福音",
    zhTraditional: "約翰福音",
  },
};

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

  const filenameMatch = filename
    .toUpperCase()
    .match(
      /(?:^|[^A-Z0-9])(GEN|PSA|JHN)(?:[^A-Z0-9]|$)/
    );

  return filenameMatch?.[1] ?? null;
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

    if (!bookId || !testBooks[bookId]) {
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
      object.type === "text" ||
      object.type === "word"
    ) {
      result.text += object.text ?? "";
      continue;
    }

    if (object.type === "milestone") {
      continue;
    }

    if (object.type === "footnote") {
      const nested = extractTextFromVerseObjects(
        object.content ??
          object.verseObjects ??
          []
      );

      const noteText = normalizeText(
        nested.text
      );

      if (noteText) {
        result.footnotes.push({
          id: `f${
            result.footnotes.length + 1
          }`,
          text: noteText,
        });
      }

      continue;
    }

    if (
      object.type === "crossReference" ||
      object.type === "cross-reference"
    ) {
      const nested = extractTextFromVerseObjects(
        object.content ??
          object.verseObjects ??
          []
      );

      const referenceText = normalizeText(
        nested.text
      );

      if (referenceText) {
        result.crossReferences.push({
          id: `x${
            result.crossReferences.length + 1
          }`,
          text: referenceText,
          targets: [],
        });
      }

      continue;
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
  }

  return {
    text: normalizeText(result.text),
    footnotes: result.footnotes,
    crossReferences:
      result.crossReferences,
  };
}

function parseUsfmBook(usfmText) {
  const parsed = usfm.toJSON(usfmText, {
    chunk: true,
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
      testBooks[bookId].english,
    bookChineseSimplified:
      testBooks[bookId].zhSimplified,
    bookChineseTraditional:
      testBooks[bookId].zhTraditional,
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

  for (
    const bookId of Object.keys(
      testBooks
    )
  ) {
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
      console.warn(
        `Skipping ${bookId}: one or more source files are missing.`
      );
      continue;
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
        testBooks[bookId].english,
      zhSimplified:
        testBooks[bookId]
          .zhSimplified,
      zhTraditional:
        testBooks[bookId]
          .zhTraditional,
      chapters: Math.max(
        ...sortedChapterNumbers
      ),
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
