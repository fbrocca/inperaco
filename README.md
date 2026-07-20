# Inperaco — Company Website

Marketing site for **Inperaco**, a consulting firm at the intersection of logistics, capital, and AI: product strategy, strategic advisory, M&A & investment analysis, and AI-agent engineering for supply chain.

Single-page static site — **vanilla HTML/CSS/JS, zero dependencies, no build step**.

## Structure

```
index.html      # all markup & copy
css/style.css   # design system + styling/animations
js/main.js      # all effects (canvas network, smooth scroll, reveals, tilt, etc.)
assets/         # favicon
```

## Preview locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

(Any static file server works; opening `index.html` directly also works.)

## Deploy

Works on any static host with no configuration:

- **GitHub Pages**: repo Settings → Pages → deploy from branch (root).
- **Netlify / Vercel / Cloudflare Pages**: point at the repo, no build command, publish directory = `/`.

## Editing content

All copy lives in `index.html`:

- **Hero headline & intro** — `<section class="hero">`
- **Services** — the four `<article class="card service">` blocks
- **Engagement models** — the four `<article class="stack__card">` blocks
- **Stats** — ⚠️ the numbers in `<section class="stats">` are **placeholders**
  (`data-counter="…"` attributes). Update them with real figures.
- **Contact email** — `mailto:` link in the contact section and mobile menu footer.

Brand colors are CSS variables at the top of `css/style.css` (`--accent-1`, `--accent-2`, `--bg`).

## Effects

All hand-rolled, no libraries: preloader, mouse-reactive canvas "supply network" hero, custom cursor, inertial smooth scrolling, scroll-triggered reveals, scroll-linked manifesto highlighting, infinite marquee, 3D tilt cards with glare, sticky stacked engagement cards, animated counters, aurora gradients + film grain, magnetic buttons, and nav-link text scramble. Everything respects `prefers-reduced-motion`, and heavy effects are disabled on touch devices.
