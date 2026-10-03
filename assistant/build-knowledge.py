"""Build the assistant's website index with Python's standard library.

Run from the repository root: python3 assistant/build-knowledge.py
No website requests, subscriptions or runtime dependencies are required.
"""
from html.parser import HTMLParser
from pathlib import Path
import json

class WebsiteText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.capture = None
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag in {'meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'wbr'}:
            return
        self.stack.append(tag)
        if any(x in self.stack for x in ['script', 'style', 'nav', 'header', 'footer', 'form']):
            return
        if tag in {'h1', 'h2', 'h3', 'summary', 'p', 'li', 'figcaption'} and self.capture is None:
            self.capture = [tag, len(self.stack), []]

    def handle_data(self, data):
        if self.capture:
            self.capture[2].append(data)

    def handle_endtag(self, tag):
        if self.capture and tag == self.capture[0] and len(self.stack) == self.capture[1]:
            text = ' '.join(''.join(self.capture[2]).split())
            if text:
                self.blocks.append((tag, text))
            self.capture = None
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

entries = []
pages = []
for path in sorted(Path('.').glob('*.html')):
    if path.stem in {'404', 'thank-you', 'civil-contractor-request', 'design-review'}:
        continue
    parser = WebsiteText()
    parser.feed(path.read_text())
    url = '/' if path.stem == 'index' else '/' + path.stem
    pages.append({'title': path.stem.replace('-', ' ').title(), 'url': url})
    title, paragraphs = '', []
    def flush():
        if title and paragraphs:
            entries.append({'title': title, 'text': '\n'.join(paragraphs), 'url': url})
    for tag, text in parser.blocks:
        if tag in {'h1', 'h2', 'h3', 'summary'}:
            flush()
            title, paragraphs = text, []
        elif title:
            paragraphs.append(text)
    flush()

output = '// Generated from the website. Refresh with python3 assistant/build-knowledge.py\n'
output += 'export const websiteKnowledge = ' + json.dumps(entries, ensure_ascii=False, indent=2) + ';\n'
output += 'export const websitePages = ' + json.dumps(pages, ensure_ascii=False, indent=2) + ';\n'
Path('assistant/knowledge.mjs').write_text(output)
print(f'Indexed {len(entries)} website sections and FAQs across {len(pages)} pages.')
