"""
TXT Parser - Simple parser for plain text files
"""
import os
import re


def parse_txt(file_path: str) -> dict:
    """
    Parse a plain text file and extract its content.
    
    Returns:
        dict with keys:
        - title: str  
        - author: str
        - chapters: list of {title, position}
        - content: list of {chapter_index, text}
    """
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    
    title = _extract_title_from_filename(file_path)
    
    # Try to detect chapters in the text
    chapters, content = _extract_chapters(text)
    
    return {
        "title": title,
        "author": "Unknown Author",
        "chapters": chapters,
        "content": content,
        "format": "txt"
    }


def _extract_chapters(text: str) -> tuple:
    """
    Try to detect chapter breaks in plain text.
    Looks for patterns like "Chapter 1", "CHAPTER ONE", "Part I", etc.
    """
    chapters = []
    content = []
    
    # Patterns that might indicate chapter breaks
    chapter_pattern = re.compile(
        r'^(?:'
        r'chapter\s+\d+|'
        r'chapter\s+[ivxlc]+|'
        r'chapter\s+\w+|'
        r'part\s+\d+|'
        r'part\s+[ivxlc]+|'
        r'section\s+\d+|'
        r'\d+\.\s+\w+'
        r')\s*$',
        re.IGNORECASE | re.MULTILINE
    )
    
    matches = list(chapter_pattern.finditer(text))
    
    if matches:
        current_position = 0
        
        for idx, match in enumerate(matches):
            chapter_title = match.group().strip()
            start_pos = match.end()
            end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            
            chapter_text = _clean_text(text[start_pos:end_pos])
            
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
        # No chapters detected - split by paragraph breaks or fixed size
        chapters, content = _split_by_size(text)
    
    return chapters, content


def _split_by_size(text: str, words_per_section: int = 2000) -> tuple:
    """Split text into sections of approximately equal word count."""
    words = text.split()
    total_words = len(words)
    
    if total_words <= words_per_section:
        return (
            [{"title": "Content", "position": 0}],
            [{"chapter_index": 0, "text": _clean_text(text)}]
        )
    
    chapters = []
    content = []
    current_position = 0
    section_num = 1
    
    for i in range(0, total_words, words_per_section):
        section_words = words[i:i + words_per_section]
        section_text = ' '.join(section_words)
        
        chapters.append({
            "title": f"Section {section_num}",
            "position": current_position
        })
        
        content.append({
            "chapter_index": len(chapters) - 1,
            "text": _clean_text(section_text)
        })
        
        current_position += len(section_text)
        section_num += 1
    
    return chapters, content


def _extract_title_from_filename(file_path: str) -> str:
    """Extract title from filename."""
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    return name.replace("_", " ").replace("-", " ").title()


def _clean_text(text: str) -> str:
    """Clean text for RSVP display."""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\t+', ' ', text)
    
    return text.strip()
