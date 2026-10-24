# Syed Ahmer Shah: tribute and support page

An unofficial, static tribute page for **Syed Ahmer Shah**, a software engineer and full-stack developer from **Hyderabad, Sindh, Pakistan**. It gathers his education, about, projects, experience, credentials and every public profile into one fast page with a premium sports-car look in navy blue and purple.

> **Data snapshot: 22/10/2026 (22 October 2026).** Everything was collected from public pages and can change. The official source is [ahmershah.dev](https://ahmershah.dev).

"Top Software Engineer" in the headline is the supporters' tribute line, not an official ranking or award.

## What is inside

```
.
├── index.html       The whole page: HTML, CSS, JavaScript and fonts in ONE file
├── og.png           1200x630 social preview image
├── llms.txt         Short, structured summary for AI crawlers (llmstxt.org format)
├── llms-full.txt    Complete plain-text version of every fact on the page
├── sitemap.xml      Sitemap with lastmod 2026-10-22
├── robots.txt       Allows all crawlers and points to the sitemap
└── README.md
```

No build step, no dependencies, no tracking, no network requests. The two typefaces (Anton and Barlow, both SIL Open Font License) are embedded in `index.html`, so the page looks the same offline.

## Design

- **Theme:** midnight navy and electric purple with a faint carbon-fibre weave, silver type and a magenta redline accent.
- **Type:** Anton for the rugged, heavy, slanted headlines; Barlow for reading text.
- **Hero:** the name rushes in on speed streaks beside a rev counter. The needle sweeps to the redline and settles on the number of projects shipped in 2026.
- **Details:** chamfered panels with a pointer-following light, a road-and-lane-marking education timeline, spec-sheet project rows with a headlight sweep, a speed bar showing page progress, and a gear indicator (N to 7) that follows the section you are reading.
- **Responsive and accessible:** fluid type, collapsing menu under 820px, single column on phones, skip link, visible focus, `prefers-reduced-motion` respected, sensible print styles.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy

Plain static files, so any host works: GitHub Pages, Netlify, Cloudflare Pages, Vercel or a normal web server. Keep `llms.txt`, `llms-full.txt`, `sitemap.xml` and `robots.txt` at the site root.

### Set your real domain

The files ship with the placeholder `https://ahmer-tribute.example.com`. Replace it everywhere before publishing:

```bash
# macOS
grep -rl "ahmer-tribute.example.com" . | xargs sed -i '' 's#ahmer-tribute.example.com#YOUR-DOMAIN.com#g'

# Linux
grep -rl "ahmer-tribute.example.com" . | xargs sed -i 's#ahmer-tribute.example.com#YOUR-DOMAIN.com#g'
```

This updates the canonical URL, Open Graph and Twitter tags, JSON-LD, `llms.txt`, `llms-full.txt`, `sitemap.xml` and `robots.txt`.

## Keeping the data fresh

When something changes (a new project, a new certificate, a graduation):

1. Edit `index.html` for the visible page. If the number of projects changes, update the gauge number and the needle angle (`rotate(...)` on `#needle`).
2. Mirror the change in `llms-full.txt` (and `llms.txt` if it is a headline fact).
3. Update the snapshot date in `index.html` (hero plate, "About this data" block, footer), in both llms files, and the `lastmod` values in `sitemap.xml`.

## What was deliberately left out

A skills section, by request. Private contact details (personal e-mail, phone number, street address) are not published. Only the business addresses `sales@ahmershah.dev` and `support@ahmershah.dev`, which Ahmer lists publicly, appear. Client review text is not copied.

## Sources

Public pages as of 22/10/2026: ahmershah.dev, LinkedIn, Coursera, LeetCode, HackerNoon, G2 and DesignRush.

## Disclaimer

This is a community tribute, not operated or endorsed by Ahmer Shah unless he says so. Names, logos and profiles belong to their respective owners. If something is wrong or you would like it changed, please say so and it will be fixed.
