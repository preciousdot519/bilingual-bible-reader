# 双语圣经 | Bilingual Bible Reader

A responsive Chinese–English Bible reader built with React, TypeScript and Vite.

## Features

- Chinese on the left and English on the right
- Responsive stacked mobile layout
- Simplified / Traditional Chinese toggle
- Synchronized verse highlighting
- Reference search
- Chapter navigation
- Font-size and dark-mode controls
- Bilingual copy action
- Provider abstraction for future API integrations
- Netlify and GitHub Pages deployment files

## Bible text, provenance and licensing

This project deliberately **does not scrape Bible Gateway or other Bible websites**.

The bundled dataset contains the complete 66-book Protestant Bible in three editions downloaded as USFM files from eBible.org:

- English: World English Bible, Protestant edition (`engwebp`)
- Simplified Chinese: Chinese Union Version, New Punctuation (`cmn-cu89s`)
- Traditional Chinese: Chinese Union Version, New Punctuation (`cmn-cu89t`)

eBible.org identifies all three editions as public domain. "World English Bible" is a trademark of eBible.org; text changed from that edition should not continue to be represented as the World English Bible.

The application converts the local USFM files into chapter-level JSON under `public/bible/`. Display formatting and USFM markup are transformed for the reader, while verse text, footnotes and cross-references are retained as structured data. Translation-specific verse divisions and numbering are preserved rather than rewritten.

See `public/bible/SOURCES.md` for source identifiers, provenance, processing notes and licensing links.
## Local setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Netlify

1. Push this folder to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository.
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy.

`netlify.toml` already contains these settings.

## GitHub Pages

1. Push to a repository with `main` as the default branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Push a new commit or run the workflow manually.

The included workflow builds and deploys the site.

## API.Bible configuration

Copy `.env.example` to `.env` and add:

```env
VITE_API_BIBLE_KEY=your_key
VITE_API_BIBLE_ENGLISH_ID=your_english_bible_id
VITE_API_BIBLE_CHINESE_ID=your_chinese_bible_id
```

For a public production app, do not expose a valuable API key directly in browser code. Put API calls behind a Netlify Function or another server-side proxy.

## Expanding the app

The provider interface is in:

```text
src/services/bibleProvider.ts
```

Implement the provider with an approved API, map both translations by canonical book/chapter/verse identifiers, and retain the local provider as an offline fallback.


