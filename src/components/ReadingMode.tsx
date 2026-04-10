import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import './ReadingMode.css';

interface ReadingModeProps {
  children: ReactNode;
  controls: ReactNode;
  isActive: boolean;
  onExit: () => void;
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

export function ReadingMode({
  children,
  controls,
  isActive,
  onExit,
}: ReadingModeProps) {
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef<number>(0);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const hideControls = useCallback(() => {
    setShowControls(false);
  }, []);

  const resetHideTimer = useCallback(() => {
    // Clear existing timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    // Set new timer to hide after 3 seconds
    hideTimerRef.current = setTimeout(hideControls, 3000);
  }, [hideControls]);

  const handleMouseMove = useCallback(() => {
    const now = Date.now();
    // Debounce: ignore movements within 100ms of each other
    if (now - lastMoveRef.current < 100) {
      return;
    }
    lastMoveRef.current = now;

    // Only update state if currently hidden (prevents re-renders)
    if (!showControls) {
      setShowControls(true);
    }
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  // Show controls on any key press
  const handleKeyDown = useCallback(() => {
    if (!showControls) {
      setShowControls(true);
    }
    resetHideTimer();
  }, [showControls, resetHideTimer]);

  // Setup event listeners
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    // Initial timer
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isActive, handleMouseMove, handleKeyDown, resetHideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <div className="reading-mode">
      {/* Main reading area - always visible */}
      <div className="reading-content">{children}</div>

      {/* Controls overlay - hides after inactivity */}
      <div
        className={`reading-controls ${showControls ? 'visible' : 'hidden'}`}
      >
        {/* Top bar with exit and fullscreen buttons */}
        <div className="reading-top-bar">
          <button className="btn-exit" onClick={onExit}>
            ← Back to Library
          </button>
          <button
            className="btn-fullscreen"
            onClick={toggleFullscreen}
            title={
              isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'
            }
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="reading-bottom-bar">{controls}</div>
      </div>

      {/* Cursor hide when controls hidden */}
      <style>{`
        .reading-mode {
          cursor: ${showControls ? 'default' : 'none'};
        }
      `}</style>
    </div>
  );
}
