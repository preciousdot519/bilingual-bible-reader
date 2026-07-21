import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Copy, Moon, Search, Sun, Type } from "lucide-react";
import { LocalBibleProvider } from "./services/bibleProvider";
import type { Chapter } from "./types";

const provider = new LocalBibleProvider();

export default function App() {
  const [available, setAvailable] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState("psalm-23");
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [simplified, setSimplified] = useState(true);
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    provider.listChapters().then(setAvailable);
  }, []);

  useEffect(() => {
    provider.getChapter(selectedId).then(setChapter);
  }, [selectedId]);

  const currentIndex = useMemo(
    () => available.findIndex((item) => item.id === selectedId),
    [available, selectedId]
  );

  const title = chapter
    ? `${simplified ? chapter.bookChineseSimplified : chapter.bookChineseTraditional} ${chapter.chapter}`
    : "";

  function move(delta: number) {
    const target = available[currentIndex + delta];
    if (target) setSelectedId(target.id);
  }

  function searchReference(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase().replace(/\s+/g, "");
    const target = available.find((item) => {
      const candidates = [
        `${item.bookEnglish}${item.chapter}`,
        `${item.bookChineseSimplified}${item.chapter}`,
        `${item.bookChineseTraditional}${item.chapter}`,
        item.id.replace("-", "")
      ].map((value) => value.toLowerCase().replace(/\s+/g, ""));
      return candidates.some((value) => normalized.includes(value));
    });
    if (target) {
      setSelectedId(target.id);
      setNotice("");
    } else {
      setNotice("This reference is not included in the bundled demo dataset.");
    }
  }

  async function copyVerse(verse: number) {
    const item = chapter?.verses.find((v) => v.verse === verse);
    if (!item || !chapter) return;
    const zh = simplified ? item.zhSimplified : item.zhTraditional;
    await navigator.clipboard.writeText(
      `${title}:${verse}\n${zh}\n\n${chapter.bookEnglish} ${chapter.chapter}:${verse}\n${item.en}`
    );
    setNotice(`Verse ${verse} copied.`);
    window.setTimeout(() => setNotice(""), 1600);
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <div className="brand">
          <BookOpen size={26} />
          <div>
            <strong>双语圣经</strong>
            <span>Bilingual Bible</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setFontSize((s) => Math.min(28, s + 1))} title="Increase font size"><Type size={18} />+</button>
          <button className="icon-button" onClick={() => setFontSize((s) => Math.max(15, s - 1))} title="Decrease font size"><Type size={18} />−</button>
          <button className="icon-button" onClick={() => setDark(!dark)} title="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">READ • COMPARE • REFLECT</p>
          <h1>Scripture, side by side</h1>
          <p>Read Chinese and English Bible verses together in a focused, synchronized layout.</p>
        </section>

        <section className="controls">
          <form onSubmit={searchReference} className="search-box">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="John 3, Psalm 23, 约翰福音 3…" />
            <button type="submit">Go</button>
          </form>

          <div className="selector-row">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {simplified ? item.bookChineseSimplified : item.bookChineseTraditional} {item.chapter} · {item.bookEnglish} {item.chapter}
                </option>
              ))}
            </select>
            <button className="toggle" onClick={() => setSimplified(!simplified)}>
              {simplified ? "简体中文" : "繁體中文"}
            </button>
          </div>
        </section>

        {notice && <div className="notice">{notice}</div>}

        {chapter && (
          <>
            <section className="chapter-heading">
              <button onClick={() => move(-1)} disabled={currentIndex <= 0}><ChevronLeft size={20} /> Previous</button>
              <div>
                <h2>{title}</h2>
                <span>{chapter.bookEnglish} {chapter.chapter}</span>
              </div>
              <button onClick={() => move(1)} disabled={currentIndex >= available.length - 1}>Next <ChevronRight size={20} /></button>
            </section>

            <section className="reader-grid" style={{ "--verse-size": `${fontSize}px` } as React.CSSProperties}>
              <article className="translation-panel">
                <div className="panel-title">
                  <div><small>CHINESE</small><h3>{simplified ? "和合本（简体）" : "和合本（繁體）"}</h3></div>
                  <span>CUV</span>
                </div>
                <div className="verses">
                  {chapter.verses.map((item) => (
                    <div
                      key={item.verse}
                      className={activeVerse === item.verse ? "verse active" : "verse"}
                      onMouseEnter={() => setActiveVerse(item.verse)}
                      onMouseLeave={() => setActiveVerse(null)}
                      onClick={() => setActiveVerse(item.verse)}
                    >
                      <sup>{item.verse}</sup>
                      <p>{simplified ? item.zhSimplified : item.zhTraditional}</p>
                      <button onClick={() => copyVerse(item.verse)} aria-label={`Copy verse ${item.verse}`}><Copy size={15} /></button>
                    </div>
                  ))}
                </div>
                <p className="attribution">Chinese Union Version. Public-domain demo text; verify local jurisdiction before commercial distribution.</p>
              </article>

              <article className="translation-panel">
                <div className="panel-title">
                  <div><small>ENGLISH</small><h3>World English Bible</h3></div>
                  <span>WEB</span>
                </div>
                <div className="verses">
                  {chapter.verses.map((item) => (
                    <div
                      key={item.verse}
                      className={activeVerse === item.verse ? "verse active" : "verse"}
                      onMouseEnter={() => setActiveVerse(item.verse)}
                      onMouseLeave={() => setActiveVerse(null)}
                      onClick={() => setActiveVerse(item.verse)}
                    >
                      <sup>{item.verse}</sup>
                      <p>{item.en}</p>
                      <button onClick={() => copyVerse(item.verse)} aria-label={`Copy verse ${item.verse}`}><Copy size={15} /></button>
                    </div>
                  ))}
                </div>
                <p className="attribution">World English Bible (WEB), public domain.</p>
              </article>
            </section>
          </>
        )}

        <section className="licensing">
          <h3>Sources & licensing</h3>
          <p>This starter does not scrape Bible Gateway or other Bible websites. It uses a provider abstraction so you can connect an authorized API such as API.Bible or YouVersion Platform and comply with the translation publisher’s attribution and usage conditions.</p>
        </section>
      </main>

      <footer>Built for thoughtful bilingual reading.</footer>
    </div>
  );
}
