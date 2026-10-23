# Nawz / NawzBlaze — Personal Website

A custom static portfolio for **Nawz**, also known online as **NawzBlaze**, with the full-name identity **Shahnawaz Hussain**.

## Creative direction

This is a field-note editorial system, not a generic template: asymmetric structure, mineral paper, deep botanical charcoal, a chartreuse signature field, restrained rust details, a typographic mark and project visuals built around the actual work. The mobile layout uses dedicated composition changes rather than merely squeezing desktop content.

## Architecture

- \`index.html\`: semantic page content, canonical URL, social metadata and Person structured data.
- \`assets/css/site.css\`: design tokens, responsive layout, component styling and motion.
- \`assets/js/site.js\`: accessible mobile navigation, motion reveals and dynamic copyright year.
- \`assets/images/favicon.svg\`: custom lightweight identity mark.
- \`404.html\`, \`robots.txt\`, \`sitemap.xml\`: error recovery and indexing essentials.
- \`.github/workflows/pages.yml\`: verification and automatic GitHub Pages deployment.

No runtime frameworks, external font requests, or third-party animation libraries are required.

## Local checks

\`\`\`sh
node --check assets/js/site.js
\`\`\`

## Deploy

In repository Settings → Pages, select **GitHub Actions** as the source. Pushes to \`main\` execute the checks, prepare a clean public artifact, and deploy it. After deployment, inspect the live page on desktop and real mobile devices. Then verify the property in Google Search Console and submit \`https://nawzblaze.github.io/sitemap.xml\`.

## Content integrity

Flip Trail is accurately labelled as in development. FormFix is linked as a public project. The project art is an original CSS illustration rather than a misleading screenshot. No client logos, fabricated testimonials or invented metrics are presented.

A passing local check does not prove that GitHub Pages has deployed or that a search engine has indexed the site; those must be verified separately.