import React, { useState, useMemo } from 'react';
import { calcProbability } from '../../lib/mlEngine';

export default function WhatIfSimulator({ 
  profile, 
  currentProb = 0, 
  isConfigured = false, 
  onApplyInterventions 
}) {
  // Local intervention states
  const [contractChoice, setContractChoice] = useState('keep'); // 'keep' | 'One year' | 'Two year'
  const [bundleSecurity, setBundleSecurity] = useState(false);
  const [bundleCloud, setBundleCloud] = useState(false);
  const [autoPay, setAutoPay] = useState(false);
  const [discountVal, setDiscountVal] = useState(0); // 0, 5, 10, 15
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Fallback empty state
  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">⚡</span>
        <p className="text-sm">Configure customer features or choose a preset above to test countermeasure interventions.</p>
      </div>
    );
  }

  // Construct hypothetical profile
  const simulatedProfile = useMemo(() => {
    const sim = { ...profile };

    if (contractChoice !== 'keep') {
      sim.Contract = contractChoice;
    }
    if (bundleSecurity) {
      sim.OnlineSecurity = 'Yes';
      sim.TechSupport = 'Yes';
    }
    if (bundleCloud) {
      sim.OnlineBackup = 'Yes';
      sim.DeviceProtection = 'Yes';
    }
    if (autoPay) {
      sim.PaymentMethod = 'Bank transfer (automatic)';
    }
    const baseMonthly = Number(profile.MonthlyCharges) || 0;
    const newMonthly = Math.max(15, baseMonthly - discountVal);
    sim.MonthlyCharges = newMonthly;

    const tenure = Number(profile.tenure) || 0;
    sim.TotalCharges = Math.max(0, Math.round(tenure * newMonthly * 100) / 100);

    return sim;
  }, [profile, contractChoice, bundleSecurity, bundleCloud, autoPay, discountVal]);

  // Recalculate hypothetical risk
  const simProb = useMemo(() => {
    try {
      return calcProbability(simulatedProfile);
    } catch {
      return currentProb;
    }
  }, [simulatedProfile, currentProb]);

  // Metrics comparison
  const currentPct = Math.round(currentProb * 100);
  const simPct = Math.round(simProb * 100);
  const deltaPct = simPct - currentPct; // Negative is good

  const baseMonthly = Number(profile.MonthlyCharges) || 0;
  const currentAnnualLoss = currentProb >= 0.35 ? currentProb * baseMonthly * 12 : 0;
  const simAnnualLoss = simProb >= 0.35 ? simProb * (baseMonthly - discountVal) * 12 : 0;
  const arrPreserved = Math.max(0, currentAnnualLoss - simAnnualLoss);

  // Preset packages
  const handleApplyPreset = (tier) => {
    setAppliedSuccess(false);
    if (tier === 'quick') {
      setContractChoice(profile.Contract === 'Two year' ? 'Two year' : 'One year');
      setBundleSecurity(true);
      setAutoPay(true);
      setDiscountVal(5);
    } else if (tier === 'max') {
      setContractChoice('Two year');
      setBundleSecurity(true);
      setBundleCloud(true);
      setAutoPay(true);
      setDiscountVal(10);
    } else {
      // Reset
      setContractChoice('keep');
      setBundleSecurity(false);
      setBundleCloud(false);
      setAutoPay(false);
      setDiscountVal(0);
    }
  };

  const handleApplyToProfile = () => {
    if (onApplyInterventions) {
      onApplyInterventions(simulatedProfile);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    }
  };

  const hasChanges = contractChoice !== 'keep' || bundleSecurity || bundleCloud || autoPay || discountVal > 0;

  return (
    <div className="w-full relative">
      {/* Clean Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">RETENTION INTERVENTIONS & ROI PROJECTION</span>

        {/* Quick Strategy Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleApplyPreset('quick')}
            className="text-[11px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer font-medium"
          >
            ⚡ Quick Fix
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('max')}
            className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer font-medium"
          >
            🛡️ Max Lock
          </button>
          {hasChanges && (
            <button
              type="button"
              onClick={() => handleApplyPreset('reset')}
              className="text-[11px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Levers on Left, Impact Cockpit on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERVENTION LEVERS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Lever 1: Contract Upgrade */}
          <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/15 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>📄</span> Contract Commitment
              </label>
              <span className="text-[11px] text-text-muted">
                Current: <span className="text-white font-medium">{profile.Contract || 'Month-to-month'}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContractChoice('keep')}
                className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center cursor-pointer ${
                  contractChoice === 'keep'
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                    : 'bg-white/5 border-white/10 text-text-muted hover:text-slate-200'
                }`}
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={() => setContractChoice('One year')}
                className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center cursor-pointer ${
                  contractChoice === 'One year'
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(0,242,152,0.2)]'
                    : 'bg-white/5 border-white/10 text-text-muted hover:text-slate-200'
                }`}
              >
                1-Year Term
              </button>
              <button
                type="button"
                onClick={() => setContractChoice('Two year')}
                className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center cursor-pointer ${
                  contractChoice === 'Two year'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(0,242,152,0.25)]'
                    : 'bg-white/5 border-white/10 text-text-muted hover:text-slate-200'
                }`}
              >
                2-Year Lock
              </button>
            </div>
          </div>

          {/* Lever 2: Value-Add Services Bundles */}
          <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/15 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>🛡️</span> Stickiness Ecosystem Bundles
              </label>
              <span className="text-[11px] text-text-muted">Proactive Attachment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Bundle A: Cyber Security & Tech Support */}
              <div 
                onClick={() => setBundleSecurity(!bundleSecurity)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  bundleSecurity 
                    ? 'bg-emerald-500/10 border-emerald-500/40' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={bundleSecurity} 
                  onChange={() => {}} 
                  className="mt-0.5 accent-emerald-400 cursor-pointer" 
                />
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    Security & Tech Support
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Resolves technical friction and closes vulnerability churn.
                  </p>
                </div>
              </div>

              {/* Bundle B: Cloud Backup & Device Care */}
              <div 
                onClick={() => setBundleCloud(!bundleCloud)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  bundleCloud 
                    ? 'bg-emerald-500/10 border-emerald-500/40' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={bundleCloud} 
                  onChange={() => {}} 
                  className="mt-0.5 accent-emerald-400 cursor-pointer" 
                />
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    Cloud Backup & Care
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Deepens digital asset storage dependency.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lever 3: Payment Hygiene & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Auto Pay Switch */}
            <div 
              onClick={() => setAutoPay(!autoPay)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                autoPay 
                  ? 'bg-emerald-500/10 border-emerald-500/40' 
                  : 'bg-black/25 border-white/5 hover:border-white/15'
              }`}
            >
              <input 
                type="checkbox" 
                checked={autoPay} 
                onChange={() => {}} 
                className="mt-1 accent-emerald-400 cursor-pointer" 
              />
              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <span>💳</span> Auto-Pay Direct Debit
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Eliminate monthly manual electronic check friction.
                </p>
              </div>
            </div>

            {/* Retention Credit Discount */}
            <div className="p-3.5 rounded-xl bg-black/25 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <span>🎁</span> Retention Credit
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {discountVal > 0 ? `-$${discountVal}.00/mo` : '$0.00/mo'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 5, 10, 15].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountVal(amt)}
                    className={`py-1 text-[11px] rounded font-medium transition-all text-center cursor-pointer ${
                      discountVal === amt
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                        : 'bg-white/5 text-text-muted hover:text-white border border-white/5'
                    }`}
                  >
                    {amt === 0 ? '$0' : `-$${amt}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME COMPARISON COCKPIT (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden">
          
          {/* Glow backdrop */}
          <div 
            className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: deltaPct < 0 ? '#00f298' : '#38bdf8' }}
          />

          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted font-mono mb-4 flex items-center justify-between">
              <span>PROJECTED RISK OUTCOME</span>
              <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                deltaPct < 0 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-white/10 text-white'
              }`}>
                {deltaPct < 0 ? `${deltaPct}% Risk Reduction` : 'No Interventions'}
              </span>
            </div>

            {/* Before vs After Dual Gauges */}
            <div className="grid grid-cols-2 gap-4 items-center mb-6">
              {/* Current */}
              <div className="flex flex-col items-center p-3 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[11px] text-text-muted font-medium mb-1">CURRENT</span>
                <span 
                  className="text-2xl font-bold font-mono"
                  style={{ color: currentPct >= 60 ? '#ff3366' : currentPct >= 35 ? '#ffac52' : '#00f298' }}
                >
                  {currentPct}%
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                  {currentPct >= 60 ? 'High Risk' : currentPct >= 35 ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>

              {/* Projected */}
              <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/30 relative">
                <span className="text-[11px] text-emerald-400 font-medium mb-1 flex items-center gap-1">
                  <span>PROJECTED</span>
                  {deltaPct < 0 && <span className="animate-pulse">↓</span>}
                </span>
                <span 
                  className="text-2xl font-bold font-mono text-emerald-400"
                  style={{ textShadow: '0 0 15px rgba(0,242,152,0.4)' }}
                >
                  {simPct}%
                </span>
                <span className="text-[10px] text-emerald-300/80 uppercase tracking-wider mt-0.5">
                  {simPct >= 60 ? 'High Risk' : simPct >= 35 ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>
            </div>

            {/* Financial Impact Card: Preserved ARR */}
            <div className="p-3.5 rounded-lg bg-black/40 border border-emerald-500/20 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <span>💰</span> Projected ARR Saved:
                </span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  +${arrPreserved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / yr
                </span>
              </div>
              <div className="text-[11px] text-text-muted mt-1.5 pt-1.5 border-t border-white/5 flex justify-between">
                <span>Revised Monthly Spend:</span>
                <span className="text-slate-300 font-mono">${(baseMonthly - discountVal).toFixed(2)}/mo</span>
              </div>
            </div>
          </div>

          {/* Action Button: Apply to Profile */}
          <div className="mt-2">
            <button
              type="button"
              disabled={!hasChanges}
              onClick={handleApplyToProfile}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasChanges
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold shadow-[0_0_20px_rgba(0,242,152,0.3)] hover:brightness-110 active:scale-[0.98]'
                  : 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
              }`}
            >
              {appliedSuccess ? (
                <>
                  <span>✓</span> Applied to Profile!
                </>
              ) : (
                <>
                  <span>🚀</span> Apply Interventions to Profile
                </>
              )}
            </button>
            {appliedSuccess && (
              <p className="text-[11px] text-emerald-400 text-center mt-1.5 animate-fade-in">
                Customer attributes updated in main form and real-time engine!
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
