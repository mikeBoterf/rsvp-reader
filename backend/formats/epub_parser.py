"""
EPUB Parser - Extracts text and structure from EPUB files using EbookLib
"""

import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from typing import Optional
import os


def parse_epub(file_path: str) -> dict:
    """
    Parse an EPUB file and extract its content and structure.

    Returns:
        dict with keys:
        - title: str
        - author: str
        - chapters: list of {title, position}
        - content: list of {chapter_index, text}
    """
    book = epub.read_epub(file_path)

    # Extract metadata
    title = _get_metadata(book, "title") or _extract_title_from_filename(file_path)
    author = _get_metadata(book, "creator") or "Unknown Author"

    # Get table of contents
    toc = book.toc
    chapters = []
    content = []
    current_position = 0

    # Get all document items
    items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))

    # Build chapter list from TOC or items
    if toc:
        chapters, content, _ = _process_toc(book, toc, current_position)
    else:
        # No TOC - use document items as chapters
        for idx, item in enumerate(items):
            chapter_text = _extract_text_from_item(item)
            if chapter_text.strip():
                chapters.append(
                    {"title": f"Chapter {idx + 1}", "position": current_position}
                )
                content.append(
                    {"chapter_index": len(chapters) - 1, "text": chapter_text}
                )
                current_position += len(chapter_text)

    return {
        "title": title,
        "author": author,
        "chapters": chapters,
        "content": content,
        "format": "epub",
    }


def _get_metadata(book, field: str) -> Optional[str]:
    """Safely get metadata from EPUB."""
    try:
        values = book.get_metadata("DC", field)
        if values:
            return values[0][0]
    except:
        pass
    return None


def _process_toc(book, toc, start_position: int):
    """Process table of contents recursively."""
    chapters = []
    content = []
    current_position = start_position

    for item in toc:
        if isinstance(item, tuple):
            # It's a section with nested items
            section, nested = item
            title = section.title if hasattr(section, "title") else str(section)

            chapters.append({"title": title, "position": current_position})

            # Get content for this section
            if hasattr(section, "href"):
                chapter_text = _get_chapter_content(book, section.href)
                content.append(
                    {"chapter_index": len(chapters) - 1, "text": chapter_text}
                )
                current_position += len(chapter_text)
        elif hasattr(item, "title"):
            # It's a Link object
            chapters.append({"title": item.title, "position": current_position})

            chapter_text = _get_chapter_content(book, item.href)
            content.append({"chapter_index": len(chapters) - 1, "text": chapter_text})
            current_position += len(chapter_text)

    return chapters, content, current_position


def _get_chapter_content(book, href: str) -> str:
    """Get text content for a chapter by href."""
    # Handle anchors in href
    if "#" in href:
        href = href.split("#")[0]

    for item in book.get_items():
        if item.get_name().endswith(href) or href in item.get_name():
            return _extract_text_from_item(item)

    return ""


def _extract_text_from_item(item) -> str:
    """Extract plain text from an EPUB item."""
    try:
        content = item.get_content()
        soup = BeautifulSoup(content, "lxml")

        # Remove script and style elements
        for element in soup(["script", "style", "nav"]):
            element.decompose()

        # Get text and clean it
        text = soup.get_text(separator="\n")
        return _clean_text(text)
    except Exception as e:
        return ""


def _extract_title_from_filename(file_path: str) -> str:
    """Extract title from filename if no metadata title."""
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    return name.replace("_", " ").replace("-", " ").title()


def _clean_text(text: str) -> str:
    """Clean extracted text for RSVP display."""
    import re

    # Remove excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\t+", " ", text)

    return text.strip()
