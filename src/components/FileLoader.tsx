import { useCallback, useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import './FileLoader.css';

interface FileLoaderProps {
  onFileSelect: (filePath: string) => void;
  isLoading: boolean;
  supportedFormats: string[];
  isTauri?: boolean;
}

export function FileLoader({
  onFileSelect,
  isLoading,
  supportedFormats,
  isTauri,
}: FileLoaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Handle native file dialog using Tauri
  const handleBrowseClick = useCallback(async () => {
    console.log('=== Browse Click Debug ===');
    console.log('isTauri:', isTauri);
    console.log('isLoading:', isLoading);
    console.log('open function type:', typeof open);
    console.log('window.__TAURI__:', (window as any).__TAURI__);
    console.log(
      'window.__TAURI_INTERNALS__:',
      (window as any).__TAURI_INTERNALS__
    );

    if (!isTauri) {
      console.warn('Not in Tauri environment');
      alert('This feature requires the Tauri desktop app.');
      return;
    }
    if (isLoading) {
      console.log('Already loading, skipping');
      return;
    }

    try {
      console.log('Calling open() with filters:', supportedFormats);
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Ebooks',
            extensions: supportedFormats.map((f) => f.replace('.', '')),
          },
        ],
      });

      console.log('Dialog result:', selected, 'type:', typeof selected);
      if (selected && typeof selected === 'string') {
        console.log('Valid file selected, calling onFileSelect');
        onFileSelect(selected);
      } else if (selected === null) {
        console.log('User cancelled file selection');
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
      console.error(
        'Error stack:',
        err instanceof Error ? err.stack : 'no stack'
      );
      alert(`Failed to open file dialog: ${err}`);
    }
  }, [isTauri, isLoading, supportedFormats, onFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isTauri && !isLoading) {
        setIsDragging(true);
      }
    },
    [isTauri, isLoading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!isTauri || isLoading) return;

      // In Tauri v2, dropped files have a path property added by Tauri
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0] as File & { path?: string };
        const filePath = file.path;

        if (filePath) {
          onFileSelect(filePath);
        } else {
          console.warn(
            'Drag-drop: No file path available. Use Browse Files instead.'
          );
        }
      }
    },
    [isTauri, isLoading, onFileSelect]
  );

  // Global drop prevention to avoid browser opening files
  useEffect(() => {
    const preventDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDrop);
    window.addEventListener('drop', preventDrop);
    return () => {
      window.removeEventListener('dragover', preventDrop);
      window.removeEventListener('drop', preventDrop);
    };
  }, []);

  return (
    <div
      className={`file-loader ${isLoading ? 'loading' : ''} ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleBrowseClick}
    >
      <div className="file-loader-content">
        <div className="file-loader-icon">📚</div>
        <h3 className="file-loader-title">
          {isLoading
            ? 'Loading...'
            : isDragging
              ? 'Drop your book here!'
              : 'Open an Ebook'}
        </h3>
        <p className="file-loader-subtitle">
          {isTauri
            ? 'Click to browse or drag & drop a file'
            : 'Please use the desktop app to open files'}
        </p>
        <p className="file-loader-formats">
          Supports: {supportedFormats.join(', ')}
        </p>

        <button
          className="file-loader-button"
          disabled={isLoading || !isTauri}
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
        >
          Browse Files
        </button>
      </div>

      {isLoading && (
        <div className="file-loader-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
