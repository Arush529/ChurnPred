import React from 'react';
import LiquidWarpTitle from './LiquidWarpTitle';

export default function LandingView({ onSelectView, currentUser, onRequireAuth }) {
  const handleAction = (targetView) => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth(targetView);
    } else {
      onSelectView(targetView);
    }
  };

  return (
    <div id="landing-view" style={{ width: '100%' }}>
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="tag">
          <span className="pulse-dot"></span>
          <span>Predictive Intelligence Engine &bull; Zero Server Latency</span>
        </div>
        
        {/* Interactive 3D WebGL Liquid Warp Title */}
        <LiquidWarpTitle 
          id="landing-warp-title-container"
          text={"Stop Customer Churn\nBefore It Happens"}
        />
        
        <p className="landing-subhead">
          Quantify subscriber flight risk, uncover root-cause drivers with mathematical XGBoost tree attribution, and safeguard high-value recurring revenue in real time.
        </p>

        {/* Feature Pills */}
        <div className="landing-stat-pills">
          <div className="stat-pill">
            <span>⚡</span>
            <span>In-Browser <strong>0ms Inference</strong></span>
          </div>
          <div className="stat-pill">
            <span>🎯</span>
            <span>Model Accuracy: <strong>84.2% ROC-AUC</strong></span>
          </div>
          <div className="stat-pill">
            <span>💰</span>
            <span>Financial Impact: <strong>Live ARR at Risk</strong></span>
          </div>
          <div className="stat-pill">
            <span>🛡️</span>
            <span>Strategy: <strong>Prescriptive Interventions</strong></span>
          </div>
        </div>
      </section>

      {/* Pathway Selection Cards */}
      <section className="landing-pathways">
        <div className="pathways-header">
          <h2 className="section-heading">Choose Your Predictive Mode</h2>
          <p className="section-sub">
            {currentUser 
              ? 'Select an intelligence tool below to begin evaluating customer risk'
              : 'Sign in to your account to unlock real-time single and batch prediction tools'}
          </p>
        </div>

        <div className="pathway-cards-grid">
          {/* Single Profile Card */}
          <div 
            className="pathway-card card-single cursor-pointer relative" 
            onClick={() => handleAction('single')}
          >
            {!currentUser && (
              <div 
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
                style={{
                  background: 'rgba(255, 172, 82, 0.15)',
                  border: '1px solid rgba(255, 172, 82, 0.4)',
                  color: '#ffac52'
                }}
              >
                <span>🔒</span>
                <span>Sign In Required</span>
              </div>
            )}
            <div className="card-top">
              <div className="card-icon-wrap mint">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="card-kicker">Interactive Diagnosis</span>
            </div>
            <h3 className="card-title">Single Account Analyzer</h3>
            <p className="card-desc">
              Evaluate individual subscribers in real-time. Tweak 19 behavioral parameters, view live risk gauges, and uncover specific drivers pushing the account toward churn.
            </p>
            <div className="card-features">
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fx-green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Instant 0ms Scoring:</strong> Live updates on every slider adjustment</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fx-green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Waterfall Attribution:</strong> Root-cause positive/negative driver breakdown</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fx-green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Prescriptive NBA:</strong> Actionable retention countermeasures with % impact</span>
              </div>
            </div>
            <div className="card-action">
              <button 
                type="button" 
                className="landing-cta-btn btn-mint"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('single');
                }}
              >
                {currentUser ? (
                  <>
                    <span>Launch Single Account Analyzer</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                ) : (
                  <>
                    <span>Sign In to Access Analyzer &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Batch CSV Card */}
          <div 
            className="pathway-card card-batch cursor-pointer relative" 
            onClick={() => handleAction('batch')}
          >
            {!currentUser && (
              <div 
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
                style={{
                  background: 'rgba(255, 172, 82, 0.15)',
                  border: '1px solid rgba(255, 172, 82, 0.4)',
                  color: '#ffac52'
                }}
              >
                <span>🔒</span>
                <span>Sign In Required</span>
              </div>
            )}
            <div className="card-top">
              <div className="card-icon-wrap crimson">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span className="card-kicker">Cohort Intelligence</span>
            </div>
            <h3 className="card-title">Batch CSV Scoring</h3>
            <p className="card-desc">
              Score entire customer portfolios simultaneously. Upload raw CSV datasets or generate test cohorts to segment accounts by risk tier and quantify aggregate revenue at risk.
            </p>
            <div className="card-features">
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Portfolio Metrics:</strong> Total ARR loss and risk distribution breakdown</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Search &amp; Filter:</strong> Paginated table with 1-click single profile inspection</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>Export Enriched CSV:</strong> Download predictions, risk tiers &amp; actions</span>
              </div>
            </div>
            <div className="card-action">
              <button 
                type="button" 
                className="landing-cta-btn btn-crimson"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('batch');
                }}
              >
                {currentUser ? (
                  <>
                    <span>Launch Batch CSV Analyzer</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                ) : (
                  <>
                    <span>Sign In to Access Batch Analyzer &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="landing-features">
        <div className="features-grid-3">
          <div className="feature-card">
            <div className="feature-card-icon">⚡</div>
            <h4>Zero Server Roundtrips</h4>
            <p>Entire XGBoost ensemble model is compiled directly into browser memory for true 0ms realtime interactive predictions without latency.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">🔒</div>
            <h4>Complete Data Privacy</h4>
            <p>Customer PII and confidential billing data never leaves your device. All scoring runs 100% locally on client hardware.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">🎯</div>
            <h4>Actionable Countermeasures</h4>
            <p>Every prediction pairs mathematical root-cause feature attribution with prescriptive Next Best Actions to actively retain customers.</p>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-icon" style={{ width: '28px', height: '28px', fontSize: '0.9rem', borderRadius: '8px' }}>✦</div>
            <span>ChurnPred &bull; Telco Intelligence Engine</span>
          </div>
          <div>Built for enterprise customer retention teams &bull; Production ML</div>
        </div>
      </footer>
    </div>
  );
}
