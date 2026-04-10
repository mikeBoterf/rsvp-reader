import { ReactNode, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  showSidebars?: boolean;
}

export function Layout({
  children,
  leftSidebar,
  rightSidebar,
  showSidebars = true,
}: LayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="layout">
      {/* Left Sidebar - Library */}
      {showSidebars && (
        <aside
          className={`sidebar sidebar-left ${leftCollapsed ? 'collapsed' : ''}`}
        >
          <div className="sidebar-header">
            <h1 className="app-logo">RSVP Reader</h1>
            <button
              className="sidebar-toggle"
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              aria-label={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {leftCollapsed ? '→' : '←'}
            </button>
          </div>
          <div className="sidebar-content">{leftSidebar}</div>
        </aside>
      )}

      {/* Main Content */}
      <main className="main-content">{children}</main>

      {/* Right Sidebar - Settings/Controls */}
      {showSidebars && (
        <aside
          className={`sidebar sidebar-right ${rightCollapsed ? 'collapsed' : ''}`}
        >
          <div className="sidebar-header">
            <ThemeToggle />
            <button
              className="sidebar-toggle"
              onClick={() => setRightCollapsed(!rightCollapsed)}
              aria-label={
                rightCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              {rightCollapsed ? '←' : '→'}
            </button>
          </div>
          <div className="sidebar-content">{rightSidebar}</div>
        </aside>
      )}
    </div>
  );
}
