# Syed Ahmer Shah: tribute and support page

An unofficial, static tribute page for **Syed Ahmer Shah**, a software engineer and full-stack developer from **Hyderabad, Sindh, Pakistan**. It gathers his education, about, skills, projects, experience, credentials and every public profile into one fast page, in a frosted-glass "old glasspaper" design.

> **Data snapshot: 22/10/2026 (22 October 2026).** Everything was collected from public pages and can change. The official source is [ahmershah.dev](https://ahmershah.dev).

"Top Software Engineer" in the headline is the supporters' tribute line, not an official ranking or award.

## What is inside

```
.
├── index.html          The whole page (semantic HTML, JSON-LD Person + WebPage)
├── assets/
│   ├── style.css       Glassmorphism, layout, responsive rules
│   ├── main.js         Pointer light, hero parallax, skill filters, mobile menu
│   ├── favicon.svg     Site icon
│   └── og.png          1200x630 social preview image
├── llms.txt            Short, structured summary for AI crawlers (llmstxt.org format)
├── llms-full.txt       Complete plain-text version of every fact on the page
├── sitemap.xml         Sitemap with lastmod 2026-10-22
├── robots.txt          Allows all crawlers and points to the sitemap
└── README.md
```

No build step, no dependencies, no tracking. Fonts (Fraunces and Hanken Grotesk) load from Google Fonts and fall back to Georgia and the system sans.

## Design

- **Look:** frosted bottle-glass panes (`backdrop-filter`) floating over drifting sea-glass, amber and rose light, with paper grain and faint creases. Each pane has a "glasspaper" tooth texture and a highlight that follows the pointer.
- **One big moment:** the hero pane clears from fog on load and glides over an outlined "Ahmer", so the blur is visible.
- **Responsive:** fluid type, a collapsing menu under 820px, single-column stacking on phones, safe-area viewport.
- **Accessible:** skip link, visible keyboard focus, `prefers-reduced-motion` respected, skill levels announced as "Level N of 5", sensible print styles.
- **Fallback:** browsers without `backdrop-filter` get a solid tinted pane.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy

It is plain static files, so any host works: GitHub Pages, Netlify, Cloudflare Pages, Vercel or a normal web server. Keep `llms.txt`, `llms-full.txt`, `sitemap.xml` and `robots.txt` at the site root.

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

1. Edit `index.html` for the visible page.
2. Mirror the change in `llms-full.txt` (and `llms.txt` if it is a headline fact).
3. Update the snapshot date in `index.html` (hero note, "About this data" block, footer), in both llms files, and the `lastmod` values in `sitemap.xml`.

## What was deliberately left out

Private contact details (personal e-mail, phone number and street address) are not published here. Only the business addresses `sales@ahmershah.dev` and `support@ahmershah.dev`, which Ahmer lists publicly for enquiries, appear. Client review text is not copied; the page links to the originals.

## Sources

Public pages as of 22/10/2026: ahmershah.dev, LinkedIn, Coursera, LeetCode, HackerNoon, G2 and DesignRush.

## Disclaimer

This is a community tribute, not operated or endorsed by Ahmer Shah unless he says so. Names, logos and profiles belong to their respective owners. If something is wrong or you would like it changed, please say so and it will be fixed.
