import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  calcProbability, 
  computeModelAttribution, 
  computeNextBestAction, 
  PERSONA_PRESETS 
} from '../lib/mlEngine';
import WaterfallChart from './visualizations/WaterfallChart';
import HealthRadar from './visualizations/HealthRadar';
import WhatIfSimulator from './visualizations/WhatIfSimulator';

// Authentic Custom Select Component matching original CSS architecture
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={containerRef}>
      <div className="css-specular-wrapper">
        <div 
          className="select-trigger" 
          tabIndex={0}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span className="value-text">{value}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
      <div className="select-content">
        {options.map((opt) => {
          const isSelected = opt === value;
          return (
            <div 
              key={opt}
              className={`select-item ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              <svg 
                className="check" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span>{opt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY_PROFILE = {
  gender: 'None',
  SeniorCitizen: 'None',
  Partner: 'None',
  Dependents: 'None',
  tenure: '',
  PhoneService: 'None',
  MultipleLines: 'None',
  InternetService: 'None',
  OnlineSecurity: 'None',
  OnlineBackup: 'None',
  DeviceProtection: 'None',
  TechSupport: 'None',
  StreamingTV: 'None',
  StreamingMovies: 'None',
  Contract: 'None',
  PaperlessBilling: 'None',
  PaymentMethod: 'None',
  MonthlyCharges: '',
  TotalCharges: ''
};

export default function SinglePredictor({ initialProfile = null, onNavigate, resetRef, onProfileUpdate }) {
  const [profile, setProfile] = useState(() => initialProfile || EMPTY_PROFILE);
  const [inspectedId, setInspectedId] = useState(() => initialProfile?.id || initialProfile?.customerID || null);

  useEffect(() => {
    if (initialProfile) {
      setProfile({
        gender: initialProfile.gender || 'None',
        SeniorCitizen: initialProfile.SeniorCitizen || 'None',
        Partner: initialProfile.Partner || 'None',
        Dependents: initialProfile.Dependents || 'None',
        tenure: initialProfile.tenure !== undefined ? String(initialProfile.tenure) : '',
        PhoneService: initialProfile.PhoneService || 'None',
        MultipleLines: initialProfile.MultipleLines || 'None',
        InternetService: initialProfile.InternetService || 'None',
        OnlineSecurity: initialProfile.OnlineSecurity || 'None',
        OnlineBackup: initialProfile.OnlineBackup || 'None',
        DeviceProtection: initialProfile.DeviceProtection || 'None',
        TechSupport: initialProfile.TechSupport || 'None',
        StreamingTV: initialProfile.StreamingTV || 'None',
        StreamingMovies: initialProfile.StreamingMovies || 'None',
        Contract: initialProfile.Contract || 'None',
        PaperlessBilling: initialProfile.PaperlessBilling || 'None',
        PaymentMethod: initialProfile.PaymentMethod || 'None',
        MonthlyCharges: initialProfile.MonthlyCharges !== undefined ? String(initialProfile.MonthlyCharges) : '',
        TotalCharges: initialProfile.TotalCharges !== undefined ? String(initialProfile.TotalCharges) : ''
      });
      setInspectedId(initialProfile.id || initialProfile.customerID || 'Cohort Subscriber');
    }
  }, [initialProfile]);

  const handleChange = (field, value) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'MonthlyCharges' || field === 'tenure') {
        const mc = field === 'MonthlyCharges' 
          ? (value === '' || value === 'None' ? 0 : parseFloat(value) || 0) 
          : (prev.MonthlyCharges === '' || prev.MonthlyCharges === 'None' ? 0 : parseFloat(prev.MonthlyCharges) || 0);
        const ten = field === 'tenure' 
          ? (value === '' || value === 'None' ? 0 : parseInt(value) || 0) 
          : (prev.tenure === '' || prev.tenure === 'None' ? 0 : parseInt(prev.tenure) || 0);
        if (mc > 0 || ten > 0) {
          updated.TotalCharges = +(mc * Math.max(1, ten)).toFixed(2);
        }
      }
      return updated;
    });
  };

  const applyPreset = (presetKey) => {
    setInspectedId(null);
    if (PERSONA_PRESETS[presetKey]) {
      setProfile({ ...PERSONA_PRESETS[presetKey] });
    }
  };

  const handleReset = () => {
    setInspectedId(null);
    setProfile({ ...EMPTY_PROFILE });
  };

  const [activeVizTab, setActiveVizTab] = useState('waterfall');

  const handleApplyInterventions = (updatedProfile) => {
    setProfile(prev => ({
      ...prev,
      ...updatedProfile
    }));
  };

  // Expose reset handler to Navbar
  useEffect(() => {
    if (resetRef) {
      resetRef.current = handleReset;
    }
  }, [resetRef]);

  // Detect whether the user has chosen any attributes
  const isConfigured = useMemo(() => {
    return Object.values(profile).some(v => v !== 'None' && v !== '' && v !== null && v !== undefined);
  }, [profile]);

  // Real-time live inference & sensitivity analysis
  const { prob, pct, riskLevel, strokeColor, glowColor, riskTierClass, riskStatusText, factors, nba, annualLoss } = useMemo(() => {
    if (!isConfigured) {
      return {
        prob: 0,
        pct: 0,
        riskLevel: "Awaiting Input",
        strokeColor: "rgba(255, 255, 255, 0.15)",
        glowColor: "transparent",
        riskTierClass: "muted",
        riskStatusText: "Select attributes or a preset to calculate churn risk",
        factors: [],
        nba: null,
        annualLoss: 0
      };
    }

    try {
      const p = calcProbability(profile);
      const percentage = Math.round(p * 100);
      let level = "Low Risk";
      let color = "#00f298";
      let glow = "rgba(0, 242, 152, 0.55)";
      let tierClass = "low";
      let statusText = "Likely to Retain Subscriber";

      if (p >= 0.60) {
        level = "High Risk";
        color = "#ff3366";
        glow = "rgba(255, 51, 102, 0.55)";
        tierClass = "high";
        statusText = "High Risk of Churning";
      } else if (p >= 0.35) {
        level = "Medium Risk";
        color = "#ffac52";
        glow = "rgba(255, 172, 82, 0.55)";
        tierClass = "medium";
        statusText = "Moderate Churn Probability";
      }

      const attrs = computeModelAttribution(profile, p);
      const action = computeNextBestAction(profile, p, level);
      const loss = level === 'High Risk' ? p * (Number(profile.MonthlyCharges) || 0) * 12 : 0;

      return {
        prob: p,
        pct: percentage,
        riskLevel: level,
        strokeColor: color,
        glowColor: glow,
        riskTierClass: tierClass,
        riskStatusText: statusText,
        factors: attrs,
        nba: action,
        annualLoss: loss
      };
    } catch (err) {
      console.error("Prediction error:", err);
      return { 
        prob: 0, 
        pct: 0, 
        riskLevel: "Low Risk", 
        strokeColor: "#00f298", 
        glowColor: "rgba(0, 242, 152, 0.55)", 
        riskTierClass: "low",
        riskStatusText: "Awaiting Input",
        factors: [], 
        nba: null, 
        annualLoss: 0 
      };
    }
  }, [profile, isConfigured]);

  // Report live profile & calibrated prob to parent/AI Assistant
  useEffect(() => {
    if (onProfileUpdate) {
      onProfileUpdate(profile, isConfigured ? prob : null, inspectedId);
    }
  }, [profile, prob, isConfigured, inspectedId, onProfileUpdate]);

  // SVG Gauge calculations
  const circumference = 439.82; // 2 * Math.PI * 70
  const strokeDashoffset = isConfigured ? circumference - (pct / 100) * circumference : circumference;

  return (
    <div id="workspace-view" style={{ width: '100%' }}>
      {/* Top Workspace Bar */}
      <div className="workspace-breadcrumb">
        <button 
          type="button" 
          className="back-home-btn" 
          onClick={() => onNavigate && onNavigate('landing')}
          style={{ textDecoration: 'none', border: 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Main Application Layout */}
      <div className="container">
        <div id="single-view" style={{ display: 'block', width: '100%', marginTop: '16px' }}>
          
          {/* Inspected Customer Notification Banner */}
          {inspectedId && (
            <div 
              className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between"
              style={{
                background: 'linear-gradient(90deg, rgba(0, 242, 152, 0.12), rgba(14, 116, 144, 0.08))',
                border: '1px solid rgba(0, 242, 152, 0.35)',
                boxShadow: '0 0 20px rgba(0, 242, 152, 0.1)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-base" style={{ color: 'var(--fx-green)' }}>✦</span>
                <div className="text-xs">
                  <span className="font-semibold text-white">Inspected Cohort Subscriber: </span>
                  <span className="font-mono text-white font-bold px-1.5 py-0.5 rounded bg-white/10">{inspectedId}</span>
                  <span className="text-text-muted ml-2">&bull; 19 features automatically imported from Batch Scoring</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-main)'
                }}
              >
                Clear Profile
              </button>
            </div>
          )}

          {/* Top Row: Input Form & Results Gauge */}
          <div className="main-panels">
            
            {/* LEFT PANEL: USER INPUT FORM */}
            <form className="panel" id="prediction-form" onSubmit={(e) => e.preventDefault()}>
              
              {/* Quick Persona Presets */}
              <div className="preset-container">
                <span className="preset-label">⚡ Quick Presets:</span>
                <div className="preset-chips">
                  <button type="button" className="preset-btn" onClick={() => applyPreset('risk')}>
                    🔥 High Flight-Risk
                  </button>
                  <button type="button" className="preset-btn" onClick={() => applyPreset('loyal')}>
                    🛡️ Loyal Veteran
                  </button>
                  <button type="button" className="preset-btn" onClick={() => applyPreset('borderline')}>
                    ⚖️ Borderline Case
                  </button>
                </div>
              </div>

              {/* Demographics Category */}
              <div className="section-title">Demographics</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gender</label>
                  <CustomSelect 
                    value={profile.gender} 
                    onChange={(v) => handleChange('gender', v)} 
                    options={['None', 'Female', 'Male']} 
                  />
                </div>
                <div className="form-group">
                  <label>Senior Citizen</label>
                  <CustomSelect 
                    value={profile.SeniorCitizen} 
                    onChange={(v) => handleChange('SeniorCitizen', v)} 
                    options={['None', 'No', 'Yes']} 
                  />
                </div>
                <div className="form-group">
                  <label>Partner</label>
                  <CustomSelect 
                    value={profile.Partner} 
                    onChange={(v) => handleChange('Partner', v)} 
                    options={['None', 'No', 'Yes']} 
                  />
                </div>
                <div className="form-group">
                  <label>Dependents</label>
                  <CustomSelect 
                    value={profile.Dependents} 
                    onChange={(v) => handleChange('Dependents', v)} 
                    options={['None', 'No', 'Yes']} 
                  />
                </div>
                <div className="form-group">
                  <label>Tenure (months)</label>
                  <div className="css-specular-wrapper">
                    <input 
                      type="number" 
                      value={profile.tenure === 'None' ? '' : profile.tenure} 
                      placeholder="None"
                      min="0" 
                      max="72" 
                      onChange={(e) => handleChange('tenure', e.target.value === '' ? '' : parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>
              </div>

              {/* Services Subscribed Category */}
              <div className="section-title">Services Subscribed</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Phone Service</label>
                  <CustomSelect 
                    value={profile.PhoneService} 
                    onChange={(v) => handleChange('PhoneService', v)} 
                    options={['None', 'Yes', 'No']} 
                  />
                </div>
                <div className="form-group">
                  <label>Multiple Lines</label>
                  <CustomSelect 
                    value={profile.MultipleLines} 
                    onChange={(v) => handleChange('MultipleLines', v)} 
                    options={['None', 'No', 'Yes', 'No phone service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Internet Service</label>
                  <CustomSelect 
                    value={profile.InternetService} 
                    onChange={(v) => handleChange('InternetService', v)} 
                    options={['None', 'Fiber optic', 'DSL', 'No']} 
                  />
                </div>
                <div className="form-group">
                  <label>Online Security</label>
                  <CustomSelect 
                    value={profile.OnlineSecurity} 
                    onChange={(v) => handleChange('OnlineSecurity', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Online Backup</label>
                  <CustomSelect 
                    value={profile.OnlineBackup} 
                    onChange={(v) => handleChange('OnlineBackup', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Device Protection</label>
                  <CustomSelect 
                    value={profile.DeviceProtection} 
                    onChange={(v) => handleChange('DeviceProtection', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Tech Support</label>
                  <CustomSelect 
                    value={profile.TechSupport} 
                    onChange={(v) => handleChange('TechSupport', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Streaming TV</label>
                  <CustomSelect 
                    value={profile.StreamingTV} 
                    onChange={(v) => handleChange('StreamingTV', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
                <div className="form-group">
                  <label>Streaming Movies</label>
                  <CustomSelect 
                    value={profile.StreamingMovies} 
                    onChange={(v) => handleChange('StreamingMovies', v)} 
                    options={['None', 'No', 'Yes', 'No internet service']} 
                  />
                </div>
              </div>

              {/* Contract & Billing Category */}
              <div className="section-title">Contract &amp; Billing</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Contract</label>
                  <CustomSelect 
                    value={profile.Contract} 
                    onChange={(v) => handleChange('Contract', v)} 
                    options={['None', 'Month-to-month', 'One year', 'Two year']} 
                  />
                </div>
                <div className="form-group">
                  <label>Paperless Billing</label>
                  <CustomSelect 
                    value={profile.PaperlessBilling} 
                    onChange={(v) => handleChange('PaperlessBilling', v)} 
                    options={['None', 'Yes', 'No']} 
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <CustomSelect 
                    value={profile.PaymentMethod} 
                    onChange={(v) => handleChange('PaymentMethod', v)} 
                    options={['None', 'Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)']} 
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Charges ($)</label>
                  <div className="css-specular-wrapper">
                    <input 
                      type="number" 
                      value={profile.MonthlyCharges === 'None' ? '' : profile.MonthlyCharges} 
                      placeholder="None"
                      step="0.01" 
                      min="0" 
                      onChange={(e) => handleChange('MonthlyCharges', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Total Charges ($)</label>
                  <div className="css-specular-wrapper">
                    <input 
                      type="number" 
                      value={profile.TotalCharges === 'None' ? '' : profile.TotalCharges} 
                      placeholder="None"
                      step="0.01" 
                      min="0" 
                      onChange={(e) => handleChange('TotalCharges', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--fx-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                  <span>Real-time engine &mdash; scores live on every input</span>
                </span>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={handleReset} 
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  Reset All Fields
                </button>
              </div>

            </form>

            {/* RIGHT PANEL: DYNAMIC RESULTS */}
            <div className="panel results-panel">
              <div id="result-state" style={{ display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* Circular Risk Gauge */}
                <div className="gauge-container circular-chart">
                  <svg className="svg-gauge" viewBox="0 0 160 160" width="180" height="180">
                    <circle className="gauge-bg" cx="80" cy="80" r="70"></circle>
                    <circle 
                      className="gauge-fill gauge-progress" 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      stroke={strokeColor}
                      strokeDasharray="439.82"
                      strokeDashoffset={strokeDashoffset}
                      style={{ 
                        stroke: strokeColor, 
                        strokeDasharray: '439.82',
                        strokeDashoffset: `${strokeDashoffset}`,
                        filter: `drop-shadow(0 0 10px ${glowColor})`,
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease, filter 0.3s ease'
                      }}
                    ></circle>
                  </svg>
                  <div className="gauge-text">
                    <div 
                      className="churn-percent" 
                      id="churn-percent" 
                      style={{ 
                        color: isConfigured ? strokeColor : 'var(--fx-muted)',
                        textShadow: isConfigured ? `0 0 20px ${glowColor}` : 'none'
                      }}
                    >
                      {isConfigured ? `${pct}%` : '--%'}
                    </div>
                    <div className="gauge-label churn-label">CHURN RISK</div>
                  </div>
                </div>

                {/* Risk Badge & Status Text */}
                <div className={`risk-badge ${riskTierClass}`}>
                  {isConfigured ? riskLevel.toUpperCase() : 'AWAITING INPUT'}
                </div>
                <div 
                  className="risk-status" 
                  style={{ 
                    textAlign: 'center', 
                    margin: '8px 0 14px', 
                    fontWeight: 600, 
                    fontFamily: 'var(--font-headline)', 
                    fontSize: '0.95rem', 
                    color: isConfigured ? strokeColor : 'var(--fx-muted)' 
                  }}
                >
                  {riskStatusText}
                </div>

                {/* Financial Impact Module: Live ARR at Risk */}
                <div className="revenue-risk-card" id="revenue-risk-card">
                  <div className="revenue-risk-header">
                    <span className="rev-icon">💰</span>
                    <span className="rev-title">ANNUAL VALUE AT RISK</span>
                  </div>
                  <div className="revenue-risk-val" id="revenue-loss">
                    ${annualLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / yr
                  </div>
                  <div className="revenue-risk-sub" id="revenue-calc">
                    {isConfigured && Number(profile.MonthlyCharges || 0) > 0
                      ? (riskLevel === 'High Risk'
                          ? `Based on monthly billing of $${Number(profile.MonthlyCharges || 0).toFixed(2)}`
                          : `Account is ${riskLevel} — High-risk revenue loss: $0.00`)
                      : 'Enter monthly charges to calculate revenue impact'}
                  </div>
                </div>

                {/* Top Factors Mini-list in Results Panel */}
                <div className="top-factors" id="top-factors-container" style={{ width: '100%', marginTop: '14px' }}>
                  <div className="top-factors-title">Top Risk Drivers:</div>
                  <div id="factors-list">
                    {isConfigured && factors.length > 0 ? (
                      factors.slice(0, 4).map((f, i) => {
                        const isRisk = f.weight > 0;
                        return (
                          <div key={i} className="factor-item">
                            <span>{f.feature} <span style={{ color: 'var(--fx-muted)', fontSize: '0.78rem' }}>({f.value})</span></span>
                            <span style={{ color: isRisk ? 'var(--risk-high)' : 'var(--fx-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              {isRisk ? '+' : ''}{f.weight.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: 'var(--fx-muted)', fontSize: '0.82rem', padding: '12px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--fx-line)' }}>
                        Select customer features above to identify risk drivers.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* BOTTOM ROW: ADVANCED VISUAL ANALYTICS SUITE */}
          <div className="panel dashboard-panel" id="dashboard-panel" style={{ display: 'block', marginTop: '24px', padding: '28px 32px' }}>
            {/* Visual Analytics Tab Switcher Header */}
            <div className="viz-tabs-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="section-title" style={{ margin: 0, fontSize: '1.05rem' }}>Visual Analytics</div>
              </div>

              {/* Tab Navigation Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveVizTab('waterfall')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeVizTab === 'waterfall'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold'
                      : 'text-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  <span>📊</span>
                  <span>Waterfall Attribution</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveVizTab('radar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeVizTab === 'radar'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(0,242,152,0.25)] font-semibold'
                      : 'text-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  <span>🕸️</span>
                  <span>Health Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveVizTab('whatif')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeVizTab === 'whatif'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(255,172,82,0.25)] font-semibold'
                      : 'text-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  <span>⚡</span>
                  <span>What-If Simulator</span>
                </button>
              </div>
            </div>

            {/* Tab Views */}
            <div className="viz-tab-body">
              {activeVizTab === 'waterfall' && (
                <WaterfallChart factors={factors} currentProb={prob} isConfigured={isConfigured} />
              )}
              {activeVizTab === 'radar' && (
                <HealthRadar profile={profile} isConfigured={isConfigured} />
              )}
              {activeVizTab === 'whatif' && (
                <WhatIfSimulator 
                  profile={profile} 
                  currentProb={prob} 
                  isConfigured={isConfigured} 
                  onApplyInterventions={handleApplyInterventions} 
                />
              )}
            </div>

            {/* Next Best Action (NBA) Recommendation Engine */}
            {isConfigured && nba && (
              <div id="nba-container" className="nba-container" style={{ display: 'block', marginTop: '24px' }}>
                <div className="nba-header">⚡ NEXT BEST ACTION</div>
                <div id="nba-text" className="nba-text">
                  <strong>{nba.header}:</strong> {nba.text}
                  {nba.reduction > 0 && (
                    <span className="nba-impact-badge">-{nba.reduction}% Risk</span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
