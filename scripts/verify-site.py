#!/usr/bin/env python3
"""Dependency-free structural checks for the public Nawz portfolio."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
WARNINGS = []

def fail(message: str) -> None:
    ERRORS.append(message)

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.asset_refs = []
        self.tags = []
        self.h1_count = 0
        self.title_parts = []
        self.in_title = False
        self.json_ld_parts = []
        self.in_json_ld = False
        self.current_script_type = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        element_id = attrs.get("id")
        if element_id:
            self.ids.append(element_id)
        if tag == "a" and attrs.get("href"):
            self.links.append((attrs["href"], attrs.get("target", ""), attrs.get("rel", "")))
        for key in ("src", "href"):
            value = attrs.get(key, "")
            if value.startswith("/assets/"):
                self.asset_refs.append(value.lstrip("/"))
        if tag == "h1":
            self.h1_count += 1
        if tag == "title":
            self.in_title = True
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_json_ld = True
            self.current_script_type = attrs.get("type", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_json_ld:
            self.in_json_ld = False
            self.current_script_type = ""

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)
        if self.in_json_ld:
            self.json_ld_parts.append(data)

def check_delimiters(source: str, label: str) -> None:
    pairs = {"(": ")", "[": "]", "{": "}"}
    stack = []
    quote = None
    escaped = False
    comment = False
    i = 0
    while i < len(source):
        char = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""
        if comment:
            if char == "*" and nxt == "/":
                comment = False
                i += 2
                continue
            i += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            i += 1
            continue
        if char == "/" and nxt == "*":
            comment = True
            i += 2
            continue
        if char in ("'", '"'):
            quote = char
        elif char in pairs:
            stack.append((char, i))
        elif char in ")]}":
            if not stack or pairs[stack[-1][0]] != char:
                fail(f"{label}: unmatched closing delimiter {char!r} at offset {i}")
                return
            stack.pop()
        i += 1
    if quote:
        fail(f"{label}: unclosed string")
    if comment:
        fail(f"{label}: unclosed comment")
    if stack:
        fail(f"{label}: unclosed delimiter {stack[-1][0]!r} at offset {stack[-1][1]}")

def main() -> int:
    required = [
        "index.html", "404.html", "robots.txt", "sitemap.xml",
        "assets/css/site.css", "assets/css/premium.css", "assets/js/site.js", "assets/js/premium.js", "assets/images/favicon.svg", "assets/images/nawz-mark.svg", "assets/images/nawz-wordmark.svg", "assets/images/og-image.jpg", "assets/previews/formfix.webp", "assets/previews/scamcheck.webp", "assets/previews/momentwise.webp",
    ]
    for relative in required:
        if not (ROOT / relative).is_file():
            fail(f"Required file missing: {relative}")

    index_path = ROOT / "index.html"
    css_path = ROOT / "assets/css/site.css"
    if not index_path.exists() or not css_path.exists():
        print("Required source files are missing.")
        return 1

    html = index_path.read_text(encoding="utf-8")
    css = css_path.read_text(encoding="utf-8")
    parser = SiteParser()
    parser.feed(html)
    parser.close()

    if parser.h1_count != 1:
        fail(f"Expected exactly one h1, found {parser.h1_count}")
    if len(parser.ids) != len(set(parser.ids)):
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        fail("Duplicate HTML IDs: " + ", ".join(duplicates))

    for anchor in ("main", "top", "work", "about", "contact", "formfix-title", "scamcheck-title", "momentwise-title"):
        if anchor not in parser.ids:
            fail(f"Expected target id missing: {anchor}")

    for href, target, rel in parser.links:
        if href.startswith("#") and href[1:] not in parser.ids:
            fail(f"Broken in-page anchor: {href}")
        if target == "_blank" and not {"noopener", "noreferrer"}.issubset(set(rel.split())):
            fail(f"External new-tab link lacks noopener/noreferrer: {href}")

    for asset in parser.asset_refs:
        if not (ROOT / asset).is_file():
            fail(f"Broken local asset reference: /{asset}")

    title = "".join(parser.title_parts).strip()
    if not title or "Nawz" not in title or "Shahnawaz Hussain" not in title:
        fail("Page title must identify Shahnawaz Hussain and the Nawz brand.")
    if len(title) > 65:
        fail(f"Page title is over 65 characters ({len(title)}).")
    if 'name="google-site-verification" content="01omZfSAZVcvwrjPL0O4zI9x9tx9-AXHt6KhZnlq8tw"' not in html:
        fail("Google Search Console verification meta tag is missing or incorrect.")
    for required_meta in (
        'property="og:image" content="https://nawzblaze.github.io/assets/images/og-image.jpg"',
        'name="twitter:card" content="summary_large_image"',
        'name="twitter:image" content="https://nawzblaze.github.io/assets/images/og-image.jpg"',
        'rel="apple-touch-icon"',
    ):
        if required_meta not in html:
            fail("Missing SEO/share metadata: " + required_meta)
    desc = re.search(r'<meta name="description" content="([^"]+)"', html)
    if not desc or not 100 <= len(desc.group(1)) <= 165:
        fail("Meta description should be clear and approximately 100–165 characters.")
    if html.count('class="live-preview-image"') != 3:
        fail("All featured projects must display real website screenshot previews.")
    if 'rel="canonical" href="https://nawzblaze.github.io/"' not in html:
        fail("Expected canonical homepage URL is missing.")
    if "application/ld+json" not in html:
        fail("Person structured data is missing.")
    if not (ROOT / "assets/images/icons/pwa-192.png").is_file() or not (ROOT / "assets/images/icons/pwa-512.png").is_file():
        fail("PWA PNG icon set is incomplete.")
    if not (ROOT / "favicon.ico").is_file():
        fail("Root favicon.ico is missing.")
    if "prefers-reduced-motion:reduce" not in re.sub(r"\s+", "", css):
        fail("Reduced-motion CSS support is missing.")
    if "Flip Trail" in html or "fliptrail" in html.lower():
        fail("Removed project Flip Trail still appears in the homepage source.")

    ordered_titles = [html.find('id="formfix-title"'), html.find('id="scamcheck-title"'), html.find('id="momentwise-title"')]
    if any(position < 0 for position in ordered_titles) or ordered_titles != sorted(ordered_titles):
        fail("Featured projects must appear in this order: FormFix, Scam Check, Momentwise.")

    try:
        if parser.json_ld_parts:
            schema = json.loads("".join(parser.json_ld_parts))
            graph = schema.get("@graph", [])
            person = next((item for item in graph if item.get("@type") == "Person"), schema if schema.get("@type") == "Person" else {})
            types = {item.get("@type") for item in graph}
            if person.get("name") != "Shahnawaz Hussain":
                fail("Person structured data has unexpected identity fields.")
            if not {"Nawz", "NawzBlaze"}.issubset(set(person.get("alternateName", []))):
                fail("Person structured data must connect Nawz and NawzBlaze.")
            if not {"WebSite", "WebPage"}.issubset(types):
                fail("Structured data should identify the WebSite and WebPage entities.")
        else:
            fail("Structured-data JSON could not be read.")
    except (json.JSONDecodeError, AttributeError) as exc:
        fail(f"Invalid structured-data JSON: {exc}")

    robots_path = ROOT / "robots.txt"
    if robots_path.exists() and "https://nawzblaze.github.io/sitemap.xml" not in robots_path.read_text(encoding="utf-8"):
        fail("robots.txt must point to the canonical sitemap.")
    try:
        sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
        if not sitemap.tag.endswith("urlset") or not any(node.text == "https://nawzblaze.github.io/" for node in sitemap.iter() if node.tag.endswith("loc")):
            fail("sitemap.xml must include the canonical homepage.")
    except (ET.ParseError, OSError) as exc:
        fail(f"Invalid sitemap.xml: {exc}")

    css_compact = re.sub(r"\s+", "", css)
    if 'grid-template-areas:"copyvisual"' not in css_compact:
        fail("Desktop projects must share the same copy-left, visual-right grid.")
    if '@media(max-width:960px)' not in css_compact or 'grid-template-areas:"copy""visual"' not in css_compact:
        fail("Tablet and mobile projects must use the deliberate stacked layout.")
    old_scam_rule = css_compact.find(".project-scamcheck{grid-template-columns:minmax(0,1.16fr)minmax(300px,.84fr)")
    aligned_override = css_compact.rfind(".project-scamcheck,.project-momentwise{grid-template-columns:minmax(0,.86fr)minmax(0,1.14fr);")
    if old_scam_rule >= 0 and aligned_override < old_scam_rule:
        fail("Scam Check's old reversed columns must be overridden by the shared project grid.")

    check_delimiters(css, "site.css")
    premium_css_path = ROOT / "assets/css/premium.css"
    if premium_css_path.exists():
        check_delimiters(premium_css_path.read_text(encoding="utf-8"), "premium.css")
    else:
        fail("premium.css is missing.")

    if ERRORS:
        print("SITE CHECK FAILED")
        for error in ERRORS:
            print(" - " + error)
        return 1

    print("SITE CHECK PASSED")
    print(f" - One h1; {len(parser.ids)} unique IDs; {len(parser.links)} links; {len(parser.asset_refs)} local assets checked")
    print(" - FormFix → Scam Check → Momentwise order confirmed")
    print(" - Structured data, canonical URL, sitemap and robots checked")
    print(" - Search Console tag, social cards, real product captures and app icons checked")
    print(" - CSS string/comment/delimiter structure balanced")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
