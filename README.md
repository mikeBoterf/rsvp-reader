<h1 align="center">⚡ RSVP Reader</h1>

<p align="center">
  <strong>A free, open-source desktop speed reading app using RSVP (Rapid Serial Visual Presentation).</strong><br/>
  Import local books, keep your library on your machine, and read 2–5× faster with ORP (Optimal Recognition Point) highlighting.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#supported-formats">Formats</a> •
  <a href="#running-with-nix">Nix</a> •
  <a href="#building-without-nix">Manual Build</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

- 📚 **Desktop-first workflow** — open the app, add books, and keep your reading library local
- 🚀 **RSVP Speed Reading** — words displayed one at a time at your chosen speed (100–1500+ WPM)
- 🎯 **ORP Highlighting** — the optimal recognition point of each word is highlighted for faster processing
- 📦 **Phrase Grouping** — optionally display 2–5 words at a time with smart boundary detection
- 📚 **Library Management** — organize and track your reading progress across multiple books
- 🔖 **Bookmarks** — save and jump to any position in a book
- 📑 **Chapter Navigation** — browse and jump between chapters
- ⏸️ **Smart Pausing** — auto-pause on punctuation for natural reading rhythm
- 🌗 **Light & Dark Theme** — toggle between themes
- ⌨️ **Full Keyboard Control** — play, pause, skip, adjust speed — all from the keyboard
- 🖥️ **Native Desktop App** — fast, lightweight, runs offline (built with Tauri)

## 📖 Supported Formats

| Format | Extensions | Parser |
|--------|-----------|--------|
| PDF | `.pdf` | PyMuPDF |
| EPUB | `.epub` | ebooklib |
| Kindle | `.mobi`, `.azw`, `.azw3` | mobi |
| Plain Text | `.txt` | Built-in |

## 🧭 Product Model

- **Desktop app** — the primary product; full local file support including PDF
- **Web app** — useful for development and lighter browser-only use; PDF remains desktop-only
- In development, Tauri uses a local Vite server; in production, the frontend is bundled into the native app

## 🚀 Running with Nix

The flake is desktop-first:

```bash
nix build              # build the native desktop app
./result/bin/rsvp-reader

nix run                # run the packaged native desktop app
nix run .#dev-desktop  # Tauri + Vite development workflow
nix run .#dev-web      # browser-only Vite development workflow
nix develop            # toolchain shell
```

Notes:
- `nix build` and `nix run` target the packaged desktop app, not the dev server.
- Desktop mode supports PDF, EPUB, Kindle (`.mobi`, `.azw`, `.azw3`), and TXT.
- Web mode supports local `.txt`, `.epub`, and Kindle (`.mobi`, `.azw`, `.azw3`) imports in-browser.
- The flake can be imported from another repository via `packages.${system}.default`.

## 🛠️ Building without Nix

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Python](https://www.python.org/downloads/) ≥ 3.10
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) (Windows only — C++ workload)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/chislerr/rsvp-reader.git
cd rsvp-reader

# 2. Install frontend dependencies
npm install

# 3. Set up Python backend
cd backend
python -m venv venv
venv\Scripts\activate    # On Windows
# source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
cd ..

# 4. Run in development mode
npm run tauri dev

# 5. Or build the installer
build.bat   # Windows
```

The built installer will be at `src-tauri/target/release/bundle/nsis/`.

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Next word |
| `←` | Previous word |
| `↑` | Increase WPM (+25) |
| `↓` | Decrease WPM (-25) |
| `]` | Next chapter |
| `[` | Previous chapter |
| `R` | Reset to beginning |
| `Escape` | Return to library |

## 🏗️ Architecture

```
rsvp-reader/
├── src/                    # React frontend (Vite + TypeScript)
│   ├── components/         # UI components (RSVPDisplay, Controls, Library, etc.)
│   ├── hooks/              # Core logic (useRSVP, useSettings)
│   ├── contexts/           # Theme context
│   └── styles/             # Design tokens
├── src-tauri/              # Tauri (Rust) — native shell, file system, IPC
├── backend/                # Python — book parsing (bundled via PyInstaller)
│   ├── formats/            # Per-format parsers (PDF, EPUB, MOBI, TXT)
│   ├── parser.py           # Unified parser + word tokenizer
│   └── main.py             # CLI entry point for Tauri IPC
└── docs/                   # Documentation & screenshots
```

## 🤝 Contributing

Contributions are welcome! Here are some ways to help:

- 🐛 **Report bugs** — open an issue
- 💡 **Suggest features** — open an issue with the `enhancement` label
- 🔧 **Submit PRs** — fork, branch, and open a pull request

Please keep PRs focused and include a clear description of the changes.

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <strong>Built with ❤️ using <a href="https://v2.tauri.app/">Tauri</a>, <a href="https://react.dev/">React</a>, and <a href="https://www.python.org/">Python</a></strong>
</p>
