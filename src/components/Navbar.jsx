import React from 'react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  onReset,
  currentUser,
  onOpenAuth,
  onLogout 
}) {
  const handleTabClick = (viewName) => {
    if (!currentUser) {
      onOpenAuth(viewName);
    } else {
      setCurrentView(viewName);
    }
  };

  return (
    <nav>
      {/* Brand Logo */}
      <button 
        onClick={() => setCurrentView('landing')}
        className="nav-brand"
        style={{ textDecoration: 'none', background: 'transparent', border: 'none', cursor: 'pointer' }}
        title="Back to Overview"
      >
        <div className="nav-icon">✦</div>
        <span>
          <span style={{ color: '#ffffff' }}>Churn</span>
          <span style={{ color: 'var(--fx-green)' }}>Pred</span>
        </span>
      </button>

      {/* Mode View Switcher */}
      {currentView !== 'landing' && (
        <div className="view-switcher" id="main-view-switcher">
          <button 
            type="button" 
            className={`view-tab ${currentView === 'single' ? 'active' : ''}`}
            onClick={() => handleTabClick('single')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Single Profile</span>
          </button>
          <button 
            type="button" 
            className={`view-tab ${currentView === 'batch' ? 'active' : ''}`}
            onClick={() => handleTabClick('batch')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Batch CSV Scoring</span>
          </button>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="nav-actions flex items-center gap-3">
        {currentView === 'landing' ? (
          <>
            <button 
              type="button" 
              onClick={() => handleTabClick('single')} 
              className="btn-outline"
            >
              Single Profile
            </button>
            <button 
              type="button" 
              onClick={() => handleTabClick('batch')} 
              className="btn-primary-sm"
            >
              Batch CSV Scoring &rarr;
            </button>
          </>
        ) : (
          <>
            {onReset && (
              <button 
                type="button" 
                className="btn-outline" 
                onClick={onReset}
              >
                Reset
              </button>
            )}
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => setCurrentView('landing')}
            >
              Overview
            </button>
          </>
        )}

        {/* User Account / Authentication Pill */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
              title={`Logged in as ${currentUser.name} (${currentUser.email})`}
            >
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: 'var(--fx-green)',
                  color: '#080b10'
                }}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-medium text-white max-w-[120px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn-outline"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth()}
            className="btn-primary-sm"
            title="Sign In"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
