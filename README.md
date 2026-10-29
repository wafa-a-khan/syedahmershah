# Syed Ahmer Shah: Pyramid Portfolio

A premium yellow-and-gold 3D portfolio for https://wafa-a-khan.github.io/syedahmershah/

- **three.js**: a stepped, stone-coursed gold pyramid (7 tiers plus a glowing capstone), bloom, reflections, dunes, floating shards and dust. Each of the 8 sections lights one tier. Hover a tier for a tooltip, click it to jump to that section.
- **anime.js**: hero text, headings, counters, timeline and stairs reveals.
- **Lenis**: smooth scrolling that also drives the camera and pyramid pose.
- Respects `prefers-reduced-motion`, falls back to a flat SVG pyramid if WebGL is unavailable, and lowers quality on phones.
- Data snapshot: **22/10/2026**. Details can change; ahmershah.dev is the official source.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page. CSS is inlined; JS is one bundle. |
| `assets/app.js` | Bundled three.js, anime.js, Lenis and page logic (built from `src/`). |
| `assets/og.png`, `assets/favicon.svg`, `assets/fonts/` | Social image, icon, self-hosted fonts. |
| `404.html` | Not-found page with absolute links. |
| `sitemap.xml`, `llms.txt`, `llms-full.txt` | Search and LLM-readable summaries. |
| `.nojekyll` | Tells GitHub Pages to serve files as they are. |
| `src/` | Source for `assets/app.js` (`scene.js`, `main.js`). |

Rebuild the bundle after editing `src/`:

```bash
npm install
npm run build
```

## Deploy on GitHub Pages

1. Copy everything in this folder into the repository root (repo `wafa-a-khan/syedahmershah`).
2. **Keep your existing Google verification file** (`googleXXXXXXXX.html`) if the repo has one. Do not delete it when replacing files.
3. Settings, Pages: deploy from the `main` branch, `/ (root)`.
4. Open https://wafa-a-khan.github.io/syedahmershah/ and hard-refresh.

## Canonical and Google visibility

The earlier live page declared `https://ahmer-tribute.example.com/` as its canonical URL, `og:url` and `og:image`. That was a placeholder, and it told Google the real page was somewhere that does not exist. This version uses the self-referencing canonical `https://wafa-a-khan.github.io/syedahmershah/` (with the trailing slash) in the canonical tag, Open Graph, Twitter tags, JSON-LD, sitemap and llms files.

After deploying:

1. In Search Console, use a **URL-prefix property** for `https://wafa-a-khan.github.io/syedahmershah/`. A domain-level `github.io` property is not something you can verify.
2. **URL Inspection**, paste the page URL. Compare "User-declared canonical" with "Google-selected canonical". They should both be the page itself.
3. Click **Test Live URL**, then **Request Indexing**.
4. **Sitemaps**, submit `https://wafa-a-khan.github.io/syedahmershah/sitemap.xml`.
5. Link to the page from places Google already crawls: ahmershah.dev, your GitHub profile README and repository description, LinkedIn.
6. Check with `site:wafa-a-khan.github.io/syedahmershah` after a few days.

Things to know:

- "Indexed" in Search Console does not mean it ranks for a name search. If this page closely duplicates ahmershah.dev, Google may pick that one as canonical ("Duplicate, Google chose different canonical than user") and show it instead. This page is a portfolio with its own layout and content, but ranking can't be guaranteed.
- New or thin pages often sit in "Crawled, currently not indexed" for a while. Backlinks and time help.
- There is no `robots.txt` here on purpose: for a project site it would live at `wafa-a-khan.github.io/robots.txt`, which Google only reads from the domain root, and this repo doesn't control that.
- Indexing and ranking are Google's decisions; nothing in the page can force them.

Private contact details are intentionally left out. Only `sales@ahmershah.dev` and `support@ahmershah.dev` appear.

"Top Software Engineer" is a headline, not an official ranking or award.
