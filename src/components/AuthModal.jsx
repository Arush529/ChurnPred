import React, { useState } from 'react';
import { loginUser, registerUser } from '../lib/authDb';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', targetViewName = '' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const targetLabel = targetViewName === 'single' 
    ? 'Single Account Analyzer' 
    : targetViewName === 'batch' 
    ? 'Batch CSV Scoring' 
    : 'Predictive Intelligence Tools';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify.');
        }
        const user = await registerUser({ name, email, password, company });
        onSuccess(user);
      } else {
        const user = await loginUser({ email, password });
        onSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(5, 8, 12, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-[480px] rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 24, 33, 0.95), rgba(11, 14, 20, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 242, 152, 0.15)'
        }}
      >
        {/* Top Glow Accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--fx-green), transparent)'
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors p-2 rounded-lg"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{
                background: 'rgba(0, 242, 152, 0.1)',
                border: '1px solid rgba(0, 242, 152, 0.3)',
                color: 'var(--fx-green)',
                boxShadow: '0 0 20px rgba(0, 242, 152, 0.2)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
              {mode === 'login' ? 'Sign In to ChurnPred' : 'Create Enterprise Account'}
            </h2>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              {targetViewName ? (
                <>Sign in or register to access <strong>{targetLabel}</strong>. User records are stored in external MongoDB backend database.</>
              ) : (
                <>Secure access to real-time ML retention intelligence via external MongoDB backend.</>
              )}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div 
            className="flex p-1 rounded-xl mb-6"
            style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-[#00f298] text-[#080b10] shadow-[0_0_15px_rgba(0,242,152,0.4)]' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' 
                  ? 'bg-[#00f298] text-[#080b10] shadow-[0_0_15px_rgba(0,242,152,0.4)]' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2"
              style={{
                background: 'rgba(255, 51, 102, 0.12)',
                border: '1px solid rgba(255, 51, 102, 0.3)',
                color: '#ff6b8b'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Quick Demo Sign-In */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const user = await loginUser({ email: 'demo@churnpred.io', password: 'password123' });
                  onSuccess(user);
                } catch (err) {
                  setError(err.message || 'Demo login failed');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-2.5 px-3 mb-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-white/5"
              style={{
                background: 'rgba(0, 242, 152, 0.08)',
                border: '1px dashed rgba(0, 242, 152, 0.45)',
                color: 'var(--fx-green)'
              }}
            >
              <span>⚡ 1-Click Demo Analyst Access (demo@churnpred.io)</span>
            </button>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">Full Name</label>
                  <div className="css-specular-wrapper">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sarah Connor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">Company / Organization</label>
                  <div className="css-specular-wrapper">
                    <input 
                      type="text" 
                      placeholder="e.g. Telco Prime Inc."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">Work Email</label>
              <div className="css-specular-wrapper">
                <input 
                  type="email" 
                  required
                  placeholder="analyst@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">Password</label>
              <div className="css-specular-wrapper">
                <input 
                  type="password" 
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">Confirm Password</label>
                <div className="css-specular-wrapper">
                  <input 
                    type="password" 
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #00f298 0%, #00bf77 100%)',
                color: '#080b10',
                boxShadow: '0 4px 20px rgba(0, 242, 152, 0.4)'
              }}
            >
              {loading ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to Workspace</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              ) : (
                <>
                  <span>Register &amp; Save to Database</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
