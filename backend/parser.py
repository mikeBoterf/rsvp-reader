"""
Main Parser - Unified interface for parsing different ebook formats
Detects file type and delegates to appropriate parser
"""

import os
from typing import Optional

from formats.pdf_parser import parse_pdf
from formats.epub_parser import parse_epub
from formats.mobi_parser import parse_mobi
from formats.txt_parser import parse_txt


# Supported file extensions
SUPPORTED_FORMATS = {
    ".pdf": parse_pdf,
    ".epub": parse_epub,
    ".mobi": parse_mobi,
    ".azw": parse_mobi,
    ".azw3": parse_mobi,
    ".txt": parse_txt,
    ".text": parse_txt,
}


def parse_ebook(file_path: str) -> dict:
    """
    Parse an ebook file and return structured content.

    Args:
        file_path: Path to the ebook file

    Returns:
        dict with keys:
        - title: str
        - author: str
        - chapters: list of {title, position}
        - content: list of {chapter_index, text}
        - format: str (pdf, epub, mobi, txt)
        - words: list of all words for RSVP display
        - word_count: int
        - error: str (if any error occurred)
    """
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    # Get file extension
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    if ext not in SUPPORTED_FORMATS:
        return {
            "error": f"Unsupported format: {ext}. Supported: {', '.join(SUPPORTED_FORMATS.keys())}"
        }

    # Parse with appropriate parser
    parser = SUPPORTED_FORMATS[ext]

    try:
        result = parser(file_path)

        # Add word list for RSVP display
        if "content" in result and not result.get("error"):
            all_text = " ".join([c["text"] for c in result["content"]])
            words = tokenize_for_rsvp(all_text)
            result["words"] = words
            result["word_count"] = len(words)

            # Recalculate chapter positions as word indices.
            # The format parsers produce character offsets, but the
            # frontend RSVP engine needs word indices for navigation.
            if "chapters" in result and result["chapters"]:
                word_position = 0
                for content_item in result["content"]:
                    chapter_idx = content_item.get("chapter_index", -1)
                    if 0 <= chapter_idx < len(result["chapters"]):
                        result["chapters"][chapter_idx]["position"] = word_position
                    # Count words in this content segment
                    segment_words = content_item["text"].split()
                    word_position += len(segment_words)

        return result

    except Exception as e:
        return {
            "error": str(e),
            "title": os.path.basename(file_path),
            "author": "Unknown",
            "chapters": [],
            "content": [],
            "format": ext[1:],
            "words": [],
            "word_count": 0,
        }


def tokenize_for_rsvp(text: str) -> list:
    """
    Tokenize text into words optimized for RSVP display.

    Returns list of dicts with:
    - word: the word to display
    - orp_index: optimal recognition point (where eye should focus)
    - pause_after: extra pause multiplier (for punctuation)
    """
    import re

    # Split into words, keeping punctuation attached
    words = text.split()
    result = []

    for word in words:
        if not word.strip():
            continue

        # Calculate ORP (Optimal Recognition Point)
        # Generally around 25-30% into the word
        clean_word = re.sub(r"[^\w]", "", word)
        word_len = len(clean_word)

        if word_len <= 1:
            orp_index = 0
        elif word_len <= 5:
            orp_index = 1
        elif word_len <= 9:
            orp_index = 2
        elif word_len <= 13:
            orp_index = 3
        else:
            orp_index = 4

        # Determine pause multiplier based on punctuation
        pause_after = 1.0
        if word.endswith((".", "!", "?")):
            pause_after = 2.0  # Longer pause at sentence end
        elif word.endswith((",", ";", ":")):
            pause_after = 1.5  # Medium pause at clause breaks
        elif word.endswith(("-", "—")):
            pause_after = 1.3

        result.append(
            {"word": word, "orp_index": orp_index, "pause_after": pause_after}
        )

    return result


def get_supported_formats() -> list:
    """Return list of supported file extensions."""
    return list(SUPPORTED_FORMATS.keys())
