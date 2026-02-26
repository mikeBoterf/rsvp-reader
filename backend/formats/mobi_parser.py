"""
MOBI Parser - Extracts text and structure from MOBI/AZW3 files
Uses the mobi library to unpack to HTML, then parses with BeautifulSoup
"""
import os
import tempfile
import shutil
from bs4 import BeautifulSoup
from typing import Optional

try:
    import mobi
    MOBI_AVAILABLE = True
except ImportError:
    MOBI_AVAILABLE = False


def parse_mobi(file_path: str) -> dict:
    """
    Parse a MOBI/AZW3 file and extract its content and structure.
    
    Returns:
        dict with keys:
        - title: str  
        - author: str
        - chapters: list of {title, position}
        - content: list of {chapter_index, text}
    """
    if not MOBI_AVAILABLE:
        return {
            "error": "MOBI support not available. Install with: pip install mobi",
            "title": "",
            "author": "",
            "chapters": [],
            "content": [],
            "format": "mobi"
        }
    
    # Create temp directory for unpacked content
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Unpack MOBI file
        tempdir, extracted_file = mobi.extract(file_path)
        
        # Read the extracted HTML
        with open(extracted_file, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Extract metadata
        title = _extract_title(soup, file_path)
        author = _extract_author(soup)
        
        # Extract chapters and content
        chapters, content = _extract_chapters(soup)
        
        return {
            "title": title,
            "author": author,
            "chapters": chapters,
            "content": content,
            "format": "mobi"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "title": _extract_title_from_filename(file_path),
            "author": "Unknown Author",
            "chapters": [],
            "content": [],
            "format": "mobi"
        }
    finally:
        # Clean up temp directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


def _extract_title(soup: BeautifulSoup, file_path: str) -> str:
    """Extract title from MOBI HTML or filename."""
    title_tag = soup.find('title')
    if title_tag and title_tag.string:
        return title_tag.string.strip()
    
    h1_tag = soup.find('h1')
    if h1_tag:
        return h1_tag.get_text(strip=True)
    
    return _extract_title_from_filename(file_path)


def _extract_author(soup: BeautifulSoup) -> str:
    """Extract author from MOBI HTML."""
    # Look for common author metadata patterns
    author_meta = soup.find('meta', attrs={'name': 'author'})
    if author_meta and author_meta.get('content'):
        return author_meta['content']
    
    return "Unknown Author"


def _extract_chapters(soup: BeautifulSoup) -> tuple:
    """Extract chapters from MOBI HTML content."""
    chapters = []
    content = []
    current_position = 0
    
    # Look for chapter headers (h1, h2 with "chapter" in text)
    chapter_headers = soup.find_all(['h1', 'h2', 'h3'])
    
    if chapter_headers:
        for idx, header in enumerate(chapter_headers):
            chapter_title = header.get_text(strip=True)
            if not chapter_title:
                continue
            
            # Get content until next header
            chapter_text = _get_content_until_next_header(header)
            
            chapters.append({
                "title": chapter_title,
                "position": current_position
            })
            
            content.append({
                "chapter_index": len(chapters) - 1,
                "text": chapter_text
            })
            
            current_position += len(chapter_text)
    else:
        # No headers found - treat entire content as one chapter
        full_text = _clean_text(soup.get_text(separator='\n'))
        chapters.append({
            "title": "Content",
            "position": 0
        })
        content.append({
            "chapter_index": 0,
            "text": full_text
        })
    
    return chapters, content


def _get_content_until_next_header(header) -> str:
    """Get all text content from header until the next header."""
    text_parts = []
    
    for sibling in header.find_next_siblings():
        if sibling.name in ['h1', 'h2', 'h3']:
            break
        text_parts.append(sibling.get_text(separator='\n'))
    
    return _clean_text('\n'.join(text_parts))


def _extract_title_from_filename(file_path: str) -> str:
    """Extract title from filename."""
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    return name.replace("_", " ").replace("-", " ").title()


def _clean_text(text: str) -> str:
    """Clean extracted text for RSVP display."""
    import re
    
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\t+', ' ', text)
    
    return text.strip()
