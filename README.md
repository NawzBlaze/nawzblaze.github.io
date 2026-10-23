# Nawz / NawzBlaze — Personal Portfolio

A custom static personal site for **Shahnawaz Hussain**, known online as **Nawz** and **NawzBlaze**.

## Creative concept

**Files. Trust. Attention.** The portfolio is built around the shared human concerns behind the three featured products:

1. **FormFix** — browser-based image, PDF, QR, signature and utility tools; processing runs locally in the browser.
2. **Scam Check** — a second opinion for suspicious messages, links, emails and screenshots, with evidence-based risk signals.
3. **Momentwise** — an intentional phone-use companion in development, designed to encourage deliberate choices without punitive lockouts.

Each project has its own art direction rather than being forced into repeated cards. The visual studies are original illustrations, not claimed screenshots of live interfaces. Product status is stated directly; no false metrics, testimonials, client logos or release claims are used.

## Architecture

- \`index.html\` — semantic content, canonical metadata, social metadata and Person structured data.
- \`assets/css/site.css\` — design tokens, responsive layouts, project-specific visuals and reduced-motion behavior.
- \`assets/js/site.js\` — accessible mobile navigation, scroll reveals and dynamic footer year.
- \`assets/images/favicon.svg\` — custom geometric identity mark.
- \`404.html\`, \`robots.txt\`, \`sitemap.xml\` — error recovery and search-engine essentials.
- \`scripts/verify-site.py\` — dependency-free checks for required content, links, metadata, ordering and CSS structure.
- \`.github/workflows/pages.yml\` — automated verification and GitHub Pages deployment.

The site uses no JavaScript framework, animation library or build-time package dependencies. Google Fonts are loaded with system fallbacks, so text remains readable if the font service is unavailable.

## Verification

\`\`\`sh
node --check assets/js/site.js
python3 scripts/verify-site.py
\`\`\`

## Deployment

The workflow verifies the site and deploys to GitHub Pages from \`main\`. In repository Settings → Pages, select **GitHub Actions** as the source.

- Site: https://nawzblaze.github.io/
- FormFix: https://formfix.vexr.dev/
- Scam Check: https://trustcheck.devs.surf/
- Momentwise: https://nawzblaze.github.io/momentwise/
- Momentwise source: https://github.com/NawzBlaze/momentwise

After deployment, inspect current desktop and mobile browsers, then verify the property in Google Search Console and submit \`https://nawzblaze.github.io/sitemap.xml\`.

## Content integrity

Momentwise is labelled **in development**. Its public repository states there is currently no signed public APK release. Scam Check is described as a risk assessment, not a guarantee that every scam can be detected.