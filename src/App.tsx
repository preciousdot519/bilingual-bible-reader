import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Link2,
  Moon,
  Search,
  Sun,
  Type,
  X,
} from "lucide-react";

import {
  loadBibleChapter,
  loadBibleManifest,
} from "./services/bibleProvider";

import type {
  BibleBook,
  BibleManifest,
  Chapter,
} from "./types";

import { groupVerses } from "./utils/verseAlignment";

type OpenNote = {
  kind: "footnote" | "crossReference";
  translation: string;
  reference: string;
  text: string;
} | null;

export default function App() {
  const [manifest, setManifest] =
    useState<BibleManifest | null>(null);

  const [selectedBookId, setSelectedBookId] =
    useState("GEN");

  const [selectedChapter, setSelectedChapter] =
    useState(1);

  const [chapter, setChapter] =
    useState<Chapter | null>(null);

  const [simplified, setSimplified] =
    useState(true);

  const [dark, setDark] =
    useState(false);

  const [fontSize, setFontSize] =
    useState(20);

  const [activeVerse, setActiveVerse] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const noteDialog = useRef<HTMLDialogElement>(null);

  const [openNote, setOpenNote] =
    useState<OpenNote>(null);

  useEffect(() => {
    if (openNote && !noteDialog.current?.open) {
      noteDialog.current?.showModal();
    }
  }, [openNote]);

  useEffect(() => {
    let cancelled = false;

    async function initialiseBible() {
      try {
        setLoading(true);
        setError("");

        const loadedManifest =
          await loadBibleManifest();

        if (cancelled) {
          return;
        }

        setManifest(loadedManifest);

        const firstBook =
          loadedManifest.books[0];

        if (firstBook) {
          setSelectedBookId(firstBook.id);
          setSelectedChapter(1);
        }
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the Bible manifest.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialiseBible();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest) {
      return;
    }

    let cancelled = false;

    async function loadSelectedChapter() {
      try {
        setLoading(true);
        setError("");

        const loadedChapter =
          await loadBibleChapter(
            selectedBookId,
            selectedChapter,
          );

        if (!cancelled) {
          setChapter(loadedChapter);
          setActiveVerse(null);
          setOpenNote(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setChapter(null);

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load this chapter.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSelectedChapter();

    return () => {
      cancelled = true;
    };
  }, [
    manifest,
    selectedBookId,
    selectedChapter,
  ]);

  const verseGroups = useMemo(
    () => groupVerses(chapter?.verses ?? []),
    [chapter],
  );

  const books =
    manifest?.books ?? [];

  const selectedBook = useMemo(
    () =>
      books.find(
        (book) =>
          book.id === selectedBookId,
      ) ?? null,
    [books, selectedBookId],
  );

  const selectedBookIndex =
    books.findIndex(
      (book) =>
        book.id === selectedBookId,
    );

  const title = chapter
    ? `${
        simplified
          ? chapter.bookChineseSimplified
          : chapter.bookChineseTraditional
      } ${chapter.chapter}`
    : "";

  function selectBook(bookId: string) {
    setSelectedBookId(bookId);
    setSelectedChapter(1);
    setNotice("");
  }

  function moveChapter(delta: number) {
    if (!selectedBook) {
      return;
    }

    const targetChapter =
      selectedChapter + delta;

    if (
      targetChapter >= 1 &&
      targetChapter <=
        selectedBook.chapters
    ) {
      setSelectedChapter(
        targetChapter,
      );

      return;
    }

    const adjacentBook =
      books[
        selectedBookIndex +
          (delta > 0 ? 1 : -1)
      ];

    if (!adjacentBook) {
      return;
    }

    setSelectedBookId(
      adjacentBook.id,
    );

    setSelectedChapter(
      delta > 0
        ? 1
        : adjacentBook.chapters,
    );
  }

  function canMovePrevious() {
    return !(
      selectedBookIndex === 0 &&
      selectedChapter === 1
    );
  }

  function canMoveNext() {
    if (
      !selectedBook ||
      selectedBookIndex < 0
    ) {
      return false;
    }

    return !(
      selectedBookIndex ===
        books.length - 1 &&
      selectedChapter ===
        selectedBook.chapters
    );
  }

  function normaliseReference(
    value: string,
  ) {
    return value
      .toLowerCase()
      .replace(/[\s:：.-]+/g, "");
  }

  function findBookFromQuery(
    searchText: string,
  ): BibleBook | undefined {
    return books.find((book) => {
      const names = [
        book.id,
        book.english,
        book.zhSimplified,
        book.zhTraditional,
      ];

      return names.some((name) =>
        normaliseReference(
          searchText,
        ).startsWith(
          normaliseReference(name),
        ),
      );
    });
  }

  function searchReference(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    const targetBook =
      findBookFromQuery(trimmed);

    if (!targetBook) {
      setNotice(
        "That book is not currently included in the generated dataset.",
      );

      return;
    }

    const chapterMatches =
      trimmed.match(/\d+/g);

    const requestedChapter =
      chapterMatches
        ? Number(
            chapterMatches[0],
          )
        : 1;

    if (
      !Number.isInteger(
        requestedChapter,
      ) ||
      requestedChapter < 1 ||
      requestedChapter >
        targetBook.chapters
    ) {
      setNotice(
        `Please enter a chapter between 1 and ${targetBook.chapters}.`,
      );

      return;
    }

    setSelectedBookId(
      targetBook.id,
    );

    setSelectedChapter(
      requestedChapter,
    );

    setNotice("");
  }

  function showNote(
    kind: "footnote" | "crossReference",
    translation: string,
    verse: string,
    text: string,
  ) {
    if (!chapter) {
      return;
    }

    setOpenNote({
      kind,
      translation,
      reference:
        `${chapter.bookEnglish} ${chapter.chapter}:${verse}`,
      text,
    });
  }

  async function copyVerse(
    verse: string,
  ) {
    const group = verseGroups.find((candidate) => candidate.verse === verse);
    if (!group || !chapter) {
      return;
    }
    const chineseLanguage = simplified ? "zhSimplified" : "zhTraditional";
    const copiedText = [
      `${title}:${verse}`,
      ...group.entries.filter((item) => item[chineseLanguage].text.trim())
        .map((item) => `${item.verse} ${item[chineseLanguage].text}`),
      "",
      `${chapter.bookEnglish} ${chapter.chapter}:${verse}`,
      ...group.entries.filter((item) => item.en.text.trim())
        .map((item) => `${item.verse} ${item.en.text}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        copiedText,
      );

      setNotice(
        `Verse ${verse} copied.`,
      );

      window.setTimeout(
        () => setNotice(""),
        1600,
      );
    } catch {
      setNotice(
        "The verse could not be copied.",
      );
    }
  }

  return (
    <div
      className={
        dark ? "app dark" : "app"
      }
    >
      <header className="topbar">
        <div className="brand">
          <BookOpen size={26} />

          <div>
            <strong>双语圣经</strong>
            <span>Bilingual Bible</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() =>
              setFontSize((size) =>
                Math.min(28, size + 1),
              )
            }
            title="Increase font size"
          >
            <Type size={18} />+
          </button>

          <button
            className="icon-button"
            onClick={() =>
              setFontSize((size) =>
                Math.max(15, size - 1),
              )
            }
            title="Decrease font size"
          >
            <Type size={18} />−
          </button>

          <button
            className="icon-button"
            onClick={() =>
              setDark(
                (current) => !current,
              )
            }
            title="Toggle dark mode"
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">
            READ • COMPARE • REFLECT
          </p>

          <h1>
            Scripture, side by side
          </h1>

          <p>
            Read Chinese and English Bible verses together in a focused,
            synchronized layout.
          </p>
        </section>

        <section className="controls">
          <form
            onSubmit={searchReference}
            className="search-box"
          >
            <Search size={18} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="John 3, Psalm 23, 约翰福音 3…"
            />

            <button type="submit">
              Go
            </button>
          </form>

          <div className="selector-row">
            <select
              value={selectedBookId}
              onChange={(event) =>
                selectBook(
                  event.target.value,
                )
              }
              aria-label="Select book"
            >
              {books.map((book) => (
                <option
                  key={book.id}
                  value={book.id}
                >
                  {simplified
                    ? book.zhSimplified
                    : book.zhTraditional}
                  {" · "}
                  {book.english}
                </option>
              ))}
            </select>

            <select
              value={selectedChapter}
              onChange={(event) =>
                setSelectedChapter(
                  Number(
                    event.target.value,
                  ),
                )
              }
              aria-label="Select chapter"
              disabled={!selectedBook}
            >
              {selectedBook &&
                Array.from(
                  {
                    length:
                      selectedBook.chapters,
                  },
                  (_, index) =>
                    index + 1,
                ).map(
                  (chapterNumber) => (
                    <option
                      key={chapterNumber}
                      value={chapterNumber}
                    >
                      Chapter {chapterNumber}
                    </option>
                  ),
                )}
            </select>

            <button
              className="toggle"
              onClick={() =>
                setSimplified(
                  (current) => !current,
                )
              }
            >
              {simplified
                ? "简体中文"
                : "繁體中文"}
            </button>
          </div>
        </section>

        {notice && (
          <div className="notice">
            {notice}
          </div>
        )}

        {error && (
          <div className="notice">
            {error}
          </div>
        )}

        {loading && !chapter && (
          <div className="notice">
            Loading Bible data…
          </div>
        )}

        {chapter && (
          <>
            <section className="chapter-heading">
              <button
                onClick={() =>
                  moveChapter(-1)
                }
                disabled={
                  !canMovePrevious()
                }
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <div>
                <h2>{title}</h2>

                <span>
                  {chapter.bookEnglish}{" "}
                  {chapter.chapter}
                </span>
              </div>

              <button
                onClick={() =>
                  moveChapter(1)
                }
                disabled={
                  !canMoveNext()
                }
              >
                Next
                <ChevronRight size={20} />
              </button>
            </section>

            <section
              className="reader-grid"
              style={
                {
                  "--verse-size":
                    `${fontSize}px`,
                } as React.CSSProperties
              }
            >
              <div className="panel-title" lang={simplified ? "zh-Hans" : "zh-Hant"}>
                <div>
                  <small>CHINESE</small>
                  <h3>{simplified ? "和合本（简体）" : "和合本（繁體）"}</h3>
                </div>
                <span>CUV</span>
              </div>
              <div className="panel-title" lang="en">
                <div>
                  <small>ENGLISH</small>
                  <h3>World English Bible</h3>
                </div>
                <span>WEB</span>
              </div>

              {verseGroups.map((group) => (
                <div className="verse-pair" key={group.verse} data-verse={group.verse}>
                  {(["zh", "en"] as const).map((language) => (
                    <div className="verse-stack" key={language}>
                      {group.entries.filter((item) => {
                        const content = language === "en" ? item.en
                          : simplified ? item.zhSimplified : item.zhTraditional;
                        return content.text.trim() || content.footnotes.length || content.crossReferences.length;
                      }).map((item) => {
                        const content = language === "en"
                          ? item.en
                          : simplified ? item.zhSimplified : item.zhTraditional;
                        const translation = language === "en"
                          ? "World English Bible"
                          : simplified
                            ? "Chinese Union Version — Simplified"
                            : "Chinese Union Version — Traditional";

                        return (
                          <div
                            key={item.verse}
                            lang={language === "en" ? "en" : simplified ? "zh-Hans" : "zh-Hant"}
                            className={activeVerse === group.verse ? "verse active" : "verse"}
                            onMouseEnter={() => setActiveVerse(group.verse)}
                            onMouseLeave={() => setActiveVerse(null)}
                            onClick={() => setActiveVerse(group.verse)}
                          >
                            <sup>{item.verse}</sup>
                            <p>{content.text}</p>
                            <div className="verse-tools">
                              {content.footnotes.map((note, index) => (
                                <button
                                  key={note.id}
                                  className="note-marker footnote-marker"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    showNote("footnote", translation, item.verse, note.text);
                                  }}
                                  title="Open footnote"
                                  aria-haspopup="dialog"
                                  aria-label={`Open ${translation} footnote ${index + 1} for verse ${item.verse}`}
                                >
                                  <FileText size={13} />F
                                </button>
                              ))}
                              {content.crossReferences.map((reference, index) => (
                                <button
                                  key={reference.id}
                                  className="note-marker reference-marker"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    showNote("crossReference", translation, item.verse, reference.text);
                                  }}
                                  title="Open cross-reference"
                                  aria-haspopup="dialog"
                                  aria-label={`Open ${translation} cross-reference ${index + 1} for verse ${item.verse}`}
                                >
                                  <Link2 size={13} />R
                                </button>
                              ))}
                              <button
                                className="copy-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void copyVerse(group.verse);
                                }}
                                aria-label={`Copy passage ${group.verse}`}
                              >
                                <Copy size={15} />
                              </button>

                    </div>
                      </div>
                    );
                    })}
                    </div>
                  ))}
                </div>
              ))}
              <p className="attribution">
                Chinese Union Version, Simplified and Traditional Chinese editions.
              </p>
              <p className="attribution">
                World English Bible, Protestant edition (engwebp).
              </p>
            </section>

            {openNote && (
              <dialog
                ref={noteDialog}
                className={`notes-panel ${openNote.kind}`}
                aria-labelledby="note-heading"
                aria-describedby="note-text"
                onCancel={(event) => {
                  event.preventDefault();
                  noteDialog.current?.close();
                }}
                onClose={() => setOpenNote(null)}
              >
                <div className="notes-panel-heading">
                  <div>
                    <span className="note-type">
                      {openNote.kind === "footnote"
                        ? "Footnote"
                        : "Cross-reference"}
                    </span>

                    <h3 id="note-heading">{openNote.reference}</h3>

                    <small>
                      {openNote.translation}
                    </small>
                  </div>

                  <button
                    className="notes-close"
                    onClick={() =>
                      noteDialog.current?.close()
                    }
                    aria-label="Close note"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p id="note-text">{openNote.text}</p>
              </dialog>
            )}
          </>
        )}

        <section className="licensing">
          <h3>
            Sources &amp; licensing
          </h3>

          <p>
            Bible text is generated locally from downloaded eBible.org USFM source
            files. This application does not scrape Bible websites.
          </p>
        </section>
      </main>

      <footer>
        Built for thoughtful bilingual reading.
      </footer>
    </div>
  );
}
