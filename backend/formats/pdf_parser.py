"""
PDF Parser - Extracts text and structure from PDF files using PyMuPDF
"""
import fitz  # PyMuPDF
from typing import Optional


def parse_pdf(file_path: str) -> dict:
    """
    Parse a PDF file and extract its content and structure.
    
    Returns:
        dict with keys:
        - title: str
        - author: str
        - chapters: list of {title, page, position}
        - content: list of {chapter_index, text}
        - total_pages: int
    """
    doc = fitz.open(file_path)
    
    # Extract metadata
    metadata = doc.metadata or {}
    title = metadata.get("title", "") or _extract_title_from_filename(file_path)
    author = metadata.get("author", "Unknown Author")
    
    # Extract table of contents (bookmarks)
    toc = doc.get_toc()  # Returns list of [level, title, page]
    chapters = []
    
    if toc:
        for level, chapter_title, page in toc:
            if level == 1:  # Top-level chapters only
                chapters.append({
                    "title": chapter_title,
                    "page": page,
                    "position": 0  # Will calculate character position later
                })
    
    # If no TOC, create chapters by pages (every 10 pages or so)
    if not chapters:
        total_pages = len(doc)
        chapter_size = min(10, max(1, total_pages // 10))
        for i in range(0, total_pages, chapter_size):
            chapters.append({
                "title": f"Section {i // chapter_size + 1}",
                "page": i + 1,
                "position": 0
            })
    
    # Extract text content
    content = []
    current_position = 0
    
    for chapter_idx, chapter in enumerate(chapters):
        start_page = chapter["page"] - 1  # 0-indexed
        end_page = chapters[chapter_idx + 1]["page"] - 1 if chapter_idx + 1 < len(chapters) else len(doc)
        
        chapter["position"] = current_position
        chapter_text = ""
        
        for page_num in range(start_page, end_page):
            if page_num < len(doc):
                page = doc[page_num]
                page_text = page.get_text("text")
                chapter_text += page_text + "\n"
        
        # Clean up the text
        chapter_text = _clean_text(chapter_text)
        current_position += len(chapter_text)
        
        content.append({
            "chapter_index": chapter_idx,
            "text": chapter_text
        })
    
    # Save total_pages BEFORE closing document
    total_pages = len(doc)
    doc.close()
    
    return {
        "title": title,
        "author": author,
        "chapters": chapters,
        "content": content,
        "total_pages": total_pages,
        "format": "pdf"
    }


def _extract_title_from_filename(file_path: str) -> str:
    """Extract title from filename if no metadata title."""
    import os
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    return name.replace("_", " ").replace("-", " ").title()


def _clean_text(text: str) -> str:
    """Clean extracted text for RSVP display."""
    import re
    
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    # Remove page numbers (common patterns)
    text = re.sub(r'\n\d+\n', '\n', text)
    
    # Remove hyphenation at line breaks
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    
    return text.strip()
