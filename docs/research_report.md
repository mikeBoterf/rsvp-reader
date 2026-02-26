# RSVP Reader - Market Research & Technology Analysis

## Executive Summary

This report analyzes the landscape for building a **cross-platform RSVP (Rapid Serial Visual Presentation) reader** that can parse various ebook formats (PDF, EPUB, MOBI, etc.), extract document structure (chapters, TOC), and display content word-by-word for speed reading. The app will be **free, open-source, and downloadable from GitHub** for Windows and macOS.

---

## 1. Existing RSVP Readers

### Open Source Solutions

| Name | Platform | Language | Key Features | Limitations |
|------|----------|----------|--------------|-------------|
| **[Speedread](https://github.com/pasky/speedread)** | Terminal (Linux/Mac/Win) | Perl | CLI-based, ORP alignment, WPM control | Text files only, no GUI |
| **[Gritz](https://github.com/jeffkowalski/gritz)** | Desktop (Win/Mac/Linux) | C++ | GPL licensed, configurable pace | Plain text only |
| **[Spray Speed-Reader](https://github.com/chaimpeck/spray)** | Web | JavaScript | Browser-based RSVP | No file parsing |
| **[Sprits-it!](https://github.com/the-happy-hippo/sprits-it)** | Web | JavaScript | Speed-reads web pages | Web content only |
| **[Comfort Reader](https://github.com/mschlauch/comfortreader)** | Android | Java | Mobile RSVP | Android only |

### Commercial Solutions

| Name | Pricing | Strengths | Weaknesses |
|------|---------|-----------|------------|
| **Spreeder** | Freemium ($79/year) | Guided training, drills, polished UX | Expensive, web-only |
| **SwiftRead** | Freemium | Browser extension, web content | Limited file support |
| **Sprint Reader** | Free extension | Chrome extension, 1800+ WPM | Web text only |
| **Outread** | Paid | iOS native, clean design | Apple ecosystem only |

### Market Gap Identified

> [!IMPORTANT]
> **No existing open-source solution combines:**
> - Multi-format ebook parsing (PDF, EPUB, MOBI, AZW3)
> - Document structure awareness (chapters, TOC navigation)
> - Cross-platform desktop app (Windows + macOS)
> - Customizable RSVP display with ORP (Optimal Recognition Point)

---

## 2. Cross-Platform Desktop Frameworks

### Tauri vs Electron Comparison

| Aspect | **Tauri** | **Electron** |
|--------|-----------|--------------|
| **Memory (idle)** | 30-40 MB | 200-300 MB |
| **Bundle size** | ~2-10 MB | ~150-200+ MB |
| **Backend language** | Rust (or Python via sidecar) | JavaScript/Node.js |
| **Frontend** | Any web framework | Any web framework |
| **Native webview** | ✅ Uses system webview | ❌ Bundles Chromium |
| **Maturity** | Newer, growing ecosystem | Established, widely used |
| **Examples** | pgMagic, Payload, Noor | VS Code, Discord, Slack |

### Recommendation

> [!TIP]
> **Tauri is the recommended choice** for this project because:
> 1. **Smaller footprint** – Critical for a simple utility app
> 2. **Python integration** – Via `tauri-plugin-python` or sidecar for ebook parsing
> 3. **Modern architecture** – Uses native webview, future-proof
> 4. **Active development** – Strong community, v2 recently released

### Python Integration with Tauri

1. **Sidecar approach** – Bundle a Python executable that Tauri calls as a subprocess
2. **tauri-plugin-python** – RustPython or PyO3 interpreter embedded in Tauri
3. **PyO3** – Compile Python code to Rust for direct integration

For this project, **sidecar with a bundled Python runtime** is simplest for leveraging Python's rich ebook parsing ecosystem.

---

## 3. Ebook Parsing Libraries

### PDF Parsing

| Library | Language | Structure Extraction | Speed | Notes |
|---------|----------|---------------------|-------|-------|
| **[PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)** | Python | ✅ TOC, bookmarks, outlines | Fast | **Recommended** – Handles text, structure, images |
| **[pdfplumber](https://github.com/jsvine/pdfplumber)** | Python | ⚠️ Limited | Medium | Good for tables, detailed layout |
| **PyPDF2** | Python | ⚠️ Outlines only | Medium | Basic text extraction |
| **pdf.js** | JavaScript | ❌ Text only | Fast | Browser-based rendering |

**Winner: PyMuPDF** – Extracts text, TOC, bookmarks, and page structure efficiently.

### EPUB Parsing

| Library | Language | Structure Extraction | Notes |
|---------|----------|---------------------|-------|
| **[EbookLib](https://github.com/aerkalov/ebooklib)** | Python | ✅ Full TOC, chapters, metadata | **Recommended** – EPUB2/EPUB3 support |
| **[epub-utils](https://github.com/epub-utils)** | Python | ✅ CLI + library | Newer, inspection-focused |
| **ebooklib-rs** | Rust | ✅ Basic | Less mature |

**Winner: EbookLib** – Mature, well-documented, extracts chapters and TOC.

### MOBI/Kindle Parsing

| Library | Language | Features | Notes |
|---------|----------|----------|-------|
| **[mobi](https://github.com/iscc/mobi)** | Python | Unpacks MOBI to HTML/images | **Recommended** – Converts to parseable format |
| **KindleUnpack** | Python | AZW3 → EPUB conversion | Part of Calibre ecosystem |
| **Calibre (ebook-convert)** | CLI | Universal converter | Heavy dependency but comprehensive |

**Winner: mobi library + Calibre as fallback** for broad format support.

### Unified Approach

```
┌─────────────────────────────────────────────────────────┐
│                    File Input                            │
│            (PDF, EPUB, MOBI, AZW3, TXT)                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Format Detection                        │
│              (by file extension/magic bytes)             │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
     ┌─────────┐       ┌─────────┐       ┌─────────┐
     │ PyMuPDF │       │EbookLib │       │  mobi   │
     │  (PDF)  │       │ (EPUB)  │       │ (MOBI)  │
     └─────────┘       └─────────┘       └─────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Unified Content Model                       │
│  - Title, Author, Metadata                               │
│  - TOC (chapters with page/position references)          │
│  - Text content (cleaned, normalized)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   RSVP Engine                            │
│  - Word tokenization                                     │
│  - ORP calculation                                       │
│  - Speed control (WPM)                                   │
│  - Chapter navigation                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Recommended Technology Stack

### Primary Recommendation: Tauri + Python Backend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Desktop Framework** | Tauri v2 | Small footprint, native webview, cross-platform |
| **Frontend** | React + TypeScript | Popular, rich ecosystem, easy styling |
| **CSS Framework** | Vanilla CSS or Tailwind | Clean, customizable |
| **Backend** | Python (sidecar) | Rich ebook parsing libraries |
| **PDF Parsing** | PyMuPDF | Fast, structure-aware |
| **EPUB Parsing** | EbookLib | Mature, full TOC support |
| **MOBI Parsing** | mobi + Calibre fallback | Comprehensive format support |
| **Packaging** | Tauri bundler + PyInstaller | Single executable with bundled Python |

### Alternative: Pure Rust/JavaScript Stack

| Component | Technology | Trade-offs |
|-----------|------------|------------|
| **Backend** | Rust | Faster, but fewer ebook libraries |
| **PDF** | pdf-rs or lopdf | Less mature than PyMuPDF |
| **EPUB** | epubie-lib | Basic, newer |

> [!WARNING]
> The pure Rust ecosystem for ebook parsing is less mature than Python. Recommended only if you want to avoid Python dependency entirely.

---

## 5. Core Feature Recommendations

### RSVP Display Features

1. **ORP Highlighting** – Optimal Recognition Point (red letter) for faster word recognition
2. **Word Chunking** – Display 1-3 words at a time
3. **Variable Speed** – Slow down for long words, punctuation
4. **WPM Control** – 100-1000+ words per minute
5. **Progress Bar** – Visual progress through document/chapter

### Document Features

1. **Chapter Navigation** – Jump between chapters via TOC
2. **Position Memory** – Remember last reading position
3. **Bookmarks** – Save specific positions
4. **Search** – Find text within document

### UI Features

1. **Dark/Light Mode** – Eye comfort for extended reading
2. **Font Customization** – Size, family, weight
3. **Keyboard Shortcuts** – Play/pause (Space), speed (↑↓), chapters (←→)
4. **Full-screen Mode** – Distraction-free reading

---

## 6. Development Roadmap Suggestion

### Phase 1: Core MVP
- [ ] Tauri project setup with React frontend
- [ ] Python sidecar for ebook parsing
- [ ] PDF parsing with TOC extraction
- [ ] Basic RSVP display with speed control

### Phase 2: Format Expansion
- [ ] EPUB support with chapter navigation
- [ ] MOBI/AZW3 support
- [ ] TXT/HTML support

### Phase 3: Polish
- [ ] Settings persistence
- [ ] Reading position memory
- [ ] Keyboard shortcuts
- [ ] Dark mode

### Phase 4: Distribution
- [ ] GitHub releases with installers
- [ ] Windows (MSI) and macOS (DMG) packages
- [ ] Auto-update mechanism

---

## 7. Conclusion

**Recommended Stack:**
- **Framework:** Tauri v2
- **Frontend:** React + TypeScript
- **Backend:** Python (via sidecar)
- **Parsing:** PyMuPDF (PDF) + EbookLib (EPUB) + mobi (Kindle)

This combination offers the best balance of:
- ✅ Small app size (~10-20MB vs 200MB+ for Electron)
- ✅ Cross-platform (Windows + macOS)
- ✅ Rich ebook parsing capabilities via Python
- ✅ Modern, maintainable codebase
- ✅ Free and open-source friendly
