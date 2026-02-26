# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for RSVP Reader Python Backend
Builds a single executable with all dependencies bundled
"""

import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect all submodules for the libraries we use
hiddenimports = [
    'ebooklib',
    'ebooklib.epub',
    'mobi',
    'lxml',
    'lxml.etree',
    'bs4',
    'fitz',  # PyMuPDF
]
hiddenimports += collect_submodules('ebooklib')
hiddenimports += collect_submodules('lxml')

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='python-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # CLI app, needs console
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
