#!/usr/bin/env python3
"""
RSVP Reader Backend - CLI entry point for Tauri
Parses ebook files and returns JSON for the frontend
"""
import sys
import json
import argparse
import io

# Force UTF-8 encoding for stdout on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from parser import parse_ebook, get_supported_formats



def main():
    parser = argparse.ArgumentParser(
        description="Parse ebook files for RSVP Reader"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Parse command
    parse_cmd = subparsers.add_parser("parse", help="Parse an ebook file")
    parse_cmd.add_argument("file", help="Path to ebook file")
    parse_cmd.add_argument(
        "--words-only",
        action="store_true",
        help="Return only the word list (smaller response)"
    )
    
    # Info command
    info_cmd = subparsers.add_parser("info", help="Get metadata only")
    info_cmd.add_argument("file", help="Path to ebook file")
    
    # Formats command
    subparsers.add_parser("formats", help="List supported formats")
    
    # Version command
    subparsers.add_parser("version", help="Show version")
    
    args = parser.parse_args()
    
    if args.command == "parse":
        result = parse_ebook(args.file)
        
        if args.words_only and "words" in result:
            # Return compact response with just words
            output = {
                "title": result.get("title", ""),
                "author": result.get("author", ""),
                "format": result.get("format", ""),
                "word_count": result.get("word_count", 0),
                "words": result.get("words", []),
                "chapters": result.get("chapters", [])
            }
        else:
            output = result
        
        print(json.dumps(output, ensure_ascii=False))
        
    elif args.command == "info":
        result = parse_ebook(args.file)
        # Return just metadata, no content
        output = {
            "title": result.get("title", ""),
            "author": result.get("author", ""),
            "format": result.get("format", ""),
            "chapters": result.get("chapters", []),
            "word_count": result.get("word_count", 0)
        }
        print(json.dumps(output, ensure_ascii=False))
        
    elif args.command == "formats":
        print(json.dumps({
            "formats": get_supported_formats()
        }))
        
    elif args.command == "version":
        print(json.dumps({
            "version": "1.0.0",
            "name": "RSVP Reader Backend"
        }))
        
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
