import { Chapter } from '../hooks/useRSVP';
import './Controls.css';

interface ControlsProps {
  isPlaying: boolean;
  wpm: number;
  progress: number;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  totalChapters: number;
  wordCount: number;
  currentWordIndex: number;
  // Settings
  fontSize: number;
  pauseOnPunctuation: boolean;
  isBookmarked: boolean;
  phraseSize: number;
  // Callbacks
  onToggle: () => void;
  onWpmChange: (wpm: number) => void;
  onProgressChange: (progress: number) => void;
  onNextWord: () => void;
  onPrevWord: () => void;
  onFontSizeChange: (size: number) => void;
  onPauseToggle: () => void;
  onBookmarkToggle: () => void;
  onShowBookmarks: () => void;
  onShowChapters: () => void;
  onPhraseSizeCycle: () => void;
}

export function Controls({
  isPlaying,
  wpm,
  progress,
  currentChapter,
  currentChapterIndex,
  totalChapters,
  wordCount,
  currentWordIndex,
  fontSize,
  pauseOnPunctuation,
  isBookmarked,
  phraseSize,
  onToggle,
  onWpmChange,
  onProgressChange,
  onNextWord,
  onPrevWord,
  onFontSizeChange,
  onPauseToggle,
  onBookmarkToggle,
  onShowBookmarks,
  onShowChapters,
  onPhraseSizeCycle,
}: ControlsProps) {
  const phraseSizeLabel = phraseSize === 1 ? 'W' : `${phraseSize}W`;

  return (
    <div className="controls">
      {/* Full-width progress bar */}
      <div className="controls-progress-row">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            const newProgress = parseFloat(e.target.value);
            const newIndex = Math.floor((newProgress / 100) * wordCount);
            onProgressChange(newIndex);
          }}
          className="progress-slider"
        />
        <span className="progress-text">
          {currentWordIndex.toLocaleString()} / {wordCount.toLocaleString()}{' '}
          words
        </span>
      </div>

      {/* Main row with three sections */}
      <div className="controls-main-row">
        {/* Left section: WPM and settings */}
        <div className="controls-section controls-left">
          {/* WPM control */}
          <div className="controls-group">
            <button
              className="btn btn-speed"
              onClick={() => onWpmChange(wpm - 1)}
              title="Decrease Speed (↓)"
            >
              −
            </button>

            <div className="speed-display">
              <input
                type="number"
                value={wpm}
                onChange={(e) => onWpmChange(parseInt(e.target.value) || 300)}
                className="speed-input"
                min="50"
                max="1500"
              />
              <span className="speed-label">WPM</span>
            </div>

            <button
              className="btn btn-speed"
              onClick={() => onWpmChange(wpm + 1)}
              title="Increase Speed (↑)"
            >
              +
            </button>
          </div>

          {/* Pause on punctuation toggle */}
          <button
            className={`btn btn-toggle ${pauseOnPunctuation ? 'active' : ''}`}
            onClick={onPauseToggle}
            title={`Pause on punctuation: ${pauseOnPunctuation ? 'ON' : 'OFF'}`}
          >
            ⏱
          </button>

          {/* Phrase mode toggle */}
          <button
            className={`btn btn-toggle ${phraseSize > 1 ? 'active' : ''}`}
            onClick={onPhraseSizeCycle}
            title={`Phrase mode: ${phraseSize === 1 ? 'Single word' : phraseSize + ' words'} (click to cycle)`}
          >
            {phraseSizeLabel}
          </button>

          {/* Font size control */}
          <div className="font-size-control">
            <span className="font-label font-small">Aa</span>
            <input
              type="range"
              min="1"
              max="7"
              value={fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
              className="font-slider"
              title={`Font size: ${fontSize}/7`}
            />
            <span className="font-label font-large">Aa</span>
          </div>
        </div>

        {/* Center section: Playback controls */}
        <div className="controls-section controls-center">
          <button
            className="btn btn-prev"
            onClick={onPrevWord}
            disabled={currentWordIndex <= 0}
            title="Previous Word (←)"
          >
            ⏮
          </button>

          <button
            className="btn btn-play"
            onClick={onToggle}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            className="btn btn-next"
            onClick={onNextWord}
            disabled={currentWordIndex >= wordCount - 1}
            title="Next Word (→)"
          >
            ⏭
          </button>
        </div>

        {/* Right section: Bookmarks and chapter info */}
        <div className="controls-section controls-right">
          {/* Bookmark controls */}
          <button
            className={`btn btn-bookmark ${isBookmarked ? 'active' : ''}`}
            onClick={onBookmarkToggle}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '🔖' : '📑'}
          </button>

          <button
            className="btn btn-bookmarks-list"
            onClick={onShowBookmarks}
            title="View all bookmarks"
          >
            📚
          </button>

          {/* Chapter navigation */}
          <button
            className="btn btn-chapters"
            onClick={onShowChapters}
            title="Browse chapters"
          >
            📖
          </button>

          {currentChapter && (
            <button
              className="chapter-info-btn"
              onClick={onShowChapters}
              title="Browse chapters"
            >
              Ch. {currentChapterIndex + 1}/{totalChapters}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
