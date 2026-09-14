import React, { useState, useMemo } from 'react';

export default function BatchRiskDistribution({ 
  customers = [], 
  activeFilterTier = 'All', 
  onSelectTier 
}) {
  const [hoveredBucket, setHoveredBucket] = useState(null);

  const stats = useMemo(() => {
    const total = customers.length;
    if (total === 0) {
      return {
        total: 0,
        high: { count: 0, pct: 0, loss: 0 },
        medium: { count: 0, pct: 0, loss: 0 },
        low: { count: 0, pct: 0, loss: 0 },
        buckets: []
      };
    }

    const highCust = customers.filter(c => c.riskTier === 'High Risk');
    const medCust = customers.filter(c => c.riskTier === 'Medium Risk');
    const lowCust = customers.filter(c => c.riskTier === 'Low Risk');

    const highLoss = highCust.reduce((acc, c) => acc + (c.annualLoss || 0), 0);
    const medLoss = medCust.reduce((acc, c) => acc + (c.annualLoss || 0), 0);
    const lowLoss = lowCust.reduce((acc, c) => acc + (c.annualLoss || 0), 0);

    // 10 Decile Buckets (0-10% up to 90-100%)
    const buckets = Array.from({ length: 10 }, (_, i) => {
      const min = i * 10;
      const max = (i + 1) * 10;
      const inBucket = customers.filter(c => {
        const p = c.prob * 100;
        return i === 9 ? (p >= min && p <= max) : (p >= min && p < max);
      });
      const bucketLoss = inBucket.reduce((acc, c) => acc + (c.annualLoss || 0), 0);
      const tier = max <= 35 ? 'Low' : min >= 60 ? 'High' : 'Medium';
      const color = tier === 'High' ? '#ff3366' : tier === 'Medium' ? '#ffac52' : '#00f298';

      return {
        label: `${min}-${max}%`,
        range: [min, max],
        count: inBucket.length,
        pct: Math.round((inBucket.length / total) * 100),
        loss: bucketLoss,
        tier,
        color
      };
    });

    return {
      total,
      high: { count: highCust.length, pct: Math.round((highCust.length / total) * 100), loss: highLoss },
      medium: { count: medCust.length, pct: Math.round((medCust.length / total) * 100), loss: medLoss },
      low: { count: lowCust.length, pct: Math.round((lowCust.length / total) * 100), loss: lowLoss },
      buckets
    };
  }, [customers]);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Upload a CSV or generate a sample cohort to visualize risk distribution.</p>
      </div>
    );
  }

  // SVG Donut Calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const highDash = (stats.high.pct / 100) * circumference;
  const medDash = (stats.medium.pct / 100) * circumference;
  const lowDash = (stats.low.pct / 100) * circumference;

  // Max bucket height scale
  const maxBucketCount = Math.max(1, ...stats.buckets.map(b => b.count));
  const chartHeight = 160;

  return (
    <div className="w-full">
      {/* Clean Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">CHURN RISK DECILES (N = {stats.total})</span>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <span className="text-[11px] text-text-muted mr-1">Filter Table:</span>
          {['All', 'High Risk', 'Medium Risk', 'Low Risk'].map(tier => (
            <button
              key={tier}
              type="button"
              onClick={() => onSelectTier && onSelectTier(tier)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                activeFilterTier === tier
                  ? tier === 'High Risk'
                    ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(255,51,102,0.3)]'
                    : tier === 'Medium Risk'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(255,172,82,0.3)]'
                    : tier === 'Low Risk'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(0,242,152,0.3)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'bg-white/5 text-text-muted hover:text-white border-white/5'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Histogram on Left (8 cols), Donut on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT: 10-DECILE FREQUENCY HISTOGRAM */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-black/25 border border-white/5 relative">

          {/* Bars Container */}
          <div className="relative flex items-end justify-between gap-1.5 sm:gap-2 h-44 pt-6 pb-2 px-1 border-b border-white/10">
            {/* Grid line at 50% */}
            <div className="absolute inset-x-0 top-1/2 border-b border-white/5 border-dashed pointer-events-none" />

            {stats.buckets.map((b, idx) => {
              const barHeightPct = Math.max(8, (b.count / maxBucketCount) * 100);
              const isHovered = hoveredBucket === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  onMouseEnter={() => setHoveredBucket(idx)}
                  onMouseLeave={() => setHoveredBucket(null)}
                  onClick={() => {
                    const mappedTier = b.tier === 'High' ? 'High Risk' : b.tier === 'Medium' ? 'Medium Risk' : 'Low Risk';
                    onSelectTier && onSelectTier(mappedTier);
                  }}
                >
                  {/* Floating Count Label above bar */}
                  <span 
                    className={`text-[10px] font-mono font-bold transition-all mb-1 ${
                      isHovered ? 'text-white scale-110' : 'text-text-muted opacity-80'
                    }`}
                  >
                    {b.count}
                  </span>

                  {/* The Bar */}
                  <div
                    className="w-full rounded-t-md transition-all duration-300 relative"
                    style={{
                      height: `${barHeightPct}%`,
                      backgroundColor: b.color,
                      opacity: isHovered ? 1 : 0.82,
                      boxShadow: isHovered ? `0 0 16px ${b.color}` : 'none',
                      transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)'
                    }}
                  />

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div 
                      className="absolute -top-24 left-1/2 -translate-x-1/2 z-30 px-3 py-2 rounded-lg text-left shadow-2xl pointer-events-none whitespace-nowrap animate-fade-in"
                      style={{
                        background: 'rgba(10, 14, 22, 0.95)',
                        border: `1px solid ${b.color}`,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.7), 0 0 14px ${b.color}40`
                      }}
                    >
                      <div className="text-[11px] font-bold text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }}></span>
                        {b.label} Churn Range
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 space-y-0.5">
                        <div>Subscribers: <strong className="text-white">{b.count}</strong> ({b.pct}% of cohort)</div>
                        {b.loss > 0 && (
                          <div>ARR Impact: <strong className="text-red-400">${b.loss.toFixed(2)}/yr</strong></div>
                        )}
                        <div className="text-cyan-400 text-[9px] mt-1 pt-1 border-t border-white/10">
                          Click to filter table to this tier &rarr;
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between text-[9px] sm:text-[10px] text-text-muted font-mono mt-2 px-1">
            {stats.buckets.map((b, i) => (
              <span key={i} className="text-center w-8 truncate">
                {i * 10}%
              </span>
            ))}
          </div>

          {/* Decile Legend */}
          <div className="flex items-center justify-between mt-4 text-[11px] text-text-muted pt-3 border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00f298]"></span>
                <span>Low Risk (&lt;35%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffac52]"></span>
                <span>Medium Risk (35-60%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ff3366]"></span>
                <span>High Risk (≥60%)</span>
              </span>
            </div>
            <span className="text-[10px] text-cyan-400/80">Interactive: Click any bar to isolate tier</span>
          </div>
        </div>

        {/* RIGHT: PORTFOLIO RISK DONUT BREAKDOWN */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 font-mono">
            PORTFOLIO RISK SHARES
          </div>

          {/* SVG Donut */}
          <div className="relative w-40 h-40 my-2 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="16"
              />
              {/* Low Risk Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#00f298"
                strokeWidth="16"
                strokeDasharray={`${lowDash} ${circumference}`}
                strokeDashoffset="0"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              {/* Medium Risk Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#ffac52"
                strokeWidth="16"
                strokeDasharray={`${medDash} ${circumference}`}
                strokeDashoffset={-lowDash}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              {/* High Risk Segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#ff3366"
                strokeWidth="16"
                strokeDasharray={`${highDash} ${circumference}`}
                strokeDashoffset={-(lowDash + medDash)}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-white">
                {stats.high.pct}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold">
                HIGH RISK
              </span>
            </div>
          </div>

          {/* Tier Stats Breakdown Cards */}
          <div className="w-full space-y-2 mt-2">
            {/* High */}
            <div 
              onClick={() => onSelectTier && onSelectTier('High Risk')}
              className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs cursor-pointer hover:border-red-500/40 transition-all"
            >
              <span className="flex items-center gap-1.5 text-red-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#ff3366]"></span>
                High Flight-Risk
              </span>
              <span className="font-mono font-bold text-white">
                {stats.high.count} <span className="text-[10px] text-text-muted">({stats.high.pct}%)</span>
              </span>
            </div>

            {/* Medium */}
            <div 
              onClick={() => onSelectTier && onSelectTier('Medium Risk')}
              className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs cursor-pointer hover:border-amber-500/40 transition-all"
            >
              <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#ffac52]"></span>
                Medium Exposure
              </span>
              <span className="font-mono font-bold text-white">
                {stats.medium.count} <span className="text-[10px] text-text-muted">({stats.medium.pct}%)</span>
              </span>
            </div>

            {/* Low */}
            <div 
              onClick={() => onSelectTier && onSelectTier('Low Risk')}
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs cursor-pointer hover:border-emerald-500/40 transition-all"
            >
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00f298]"></span>
                Retained Core
              </span>
              <span className="font-mono font-bold text-white">
                {stats.low.count} <span className="text-[10px] text-text-muted">({stats.low.pct}%)</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
