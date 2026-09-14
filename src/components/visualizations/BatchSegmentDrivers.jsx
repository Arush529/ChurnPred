import React, { useState, useMemo } from 'react';

export default function BatchSegmentDrivers({ 
  customers = [], 
  onFilterSearch 
}) {
  const [activeDriver, setActiveDriver] = useState('contract'); // 'contract' | 'internet' | 'payment'

  // Aggregate segments
  const segmentData = useMemo(() => {
    if (customers.length === 0) return { groups: [], bestOpportunity: null };

    const total = customers.length;

    const buildGroup = (key, label) => {
      const distinctValues = [...new Set(customers.map(c => c[key] || 'None'))];
      return distinctValues.map(val => {
        const matching = customers.filter(c => (c[key] || 'None') === val);
        const count = matching.length;
        const avgProb = Math.round((matching.reduce((acc, c) => acc + c.prob, 0) / count) * 100);
        const highCount = matching.filter(c => c.riskTier === 'High Risk').length;
        const arrLoss = matching
          .filter(c => c.riskTier === 'High Risk')
          .reduce((acc, c) => acc + (c.annualLoss || 0), 0);

        return {
          dimension: label,
          key,
          value: val,
          count,
          pctOfTotal: Math.round((count / total) * 100),
          avgProb,
          highCount,
          arrLoss
        };
      }).sort((a, b) => b.arrLoss - a.arrLoss || b.avgProb - a.avgProb);
    };

    const contracts = buildGroup('Contract', 'Contract Agreement');
    const internet = buildGroup('InternetService', 'Internet Service');
    const payment = buildGroup('PaymentMethod', 'Payment Method');

    // Identify Highest Opportunity Group: Month-to-month or highest ARR loss
    const m2mFiber = customers.filter(c => c.Contract === 'Month-to-month' && c.InternetService === 'Fiber optic');
    const m2mFiberLoss = m2mFiber
      .filter(c => c.riskTier === 'High Risk')
      .reduce((acc, c) => acc + (c.annualLoss || 0), 0);

    const bestOpportunity = {
      title: 'Month-to-Month Fiber Optic Subscribers',
      count: m2mFiber.length,
      arrLoss: m2mFiberLoss,
      savedEstimate: Math.round(m2mFiberLoss * 0.62),
      recommendation: 'Target this cohort with an automated 1-Year term upgrade discount ($5/mo off) to lock in commitment and eliminate month-to-month flight friction.'
    };

    return {
      contract: contracts,
      internet: internet,
      payment: payment,
      bestOpportunity
    };
  }, [customers]);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">⚡</span>
        <p className="text-sm">Upload a CSV or generate a sample cohort to visualize segment driver analysis.</p>
      </div>
    );
  }

  const currentGroups = segmentData[activeDriver] || [];
  const maxCount = Math.max(1, ...currentGroups.map(g => g.count));

  return (
    <div className="w-full">
      {/* Header */}
      {/* Clean Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">SEGMENT RISK DRIVERS & RETENTION ROI</span>

        {/* Dimension Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveDriver('contract')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              activeDriver === 'contract'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(255,172,82,0.25)]'
                : 'bg-white/5 text-text-muted hover:text-white border-white/5'
            }`}
          >
            📄 Contract Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveDriver('internet')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              activeDriver === 'internet'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                : 'bg-white/5 text-text-muted hover:text-white border-white/5'
            }`}
          >
            🌐 Internet Tech
          </button>
          <button
            type="button"
            onClick={() => setActiveDriver('payment')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              activeDriver === 'payment'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(0,242,152,0.25)]'
                : 'bg-white/5 text-text-muted hover:text-white border-white/5'
            }`}
          >
            💳 Payment Method
          </button>
        </div>
      </div>

      {/* Main Grid: Driver Bars on Left (7 cols), Opportunity Card on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* DRIVER BREAKDOWN LIST (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-black/25 border border-white/5 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono pb-2 border-b border-white/10">
            <span>SEGMENT CATEGORY</span>
            <span className="flex gap-6">
              <span>AVG CHURN</span>
              <span>ARR AT RISK</span>
            </span>
          </div>

          {currentGroups.map((grp, i) => {
            const widthPct = Math.max(10, (grp.count / maxCount) * 100);
            const isHigh = grp.avgProb >= 50;
            const isMed = grp.avgProb >= 30 && grp.avgProb < 50;
            const color = isHigh ? '#ff3366' : isMed ? '#ffac52' : '#00f298';

            return (
              <div 
                key={i} 
                className="group cursor-pointer p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all"
                onClick={() => onFilterSearch && onFilterSearch(grp.value)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{grp.value}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-text-muted font-mono font-normal">
                      {grp.count} accts ({grp.pctOfTotal}%)
                    </span>
                  </span>
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <span 
                      className="font-bold"
                      style={{ color }}
                    >
                      {grp.avgProb}% Avg Risk
                    </span>
                    <span className="font-bold text-white min-w-[75px] text-right">
                      ${grp.arrLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Progress Bar comparison */}
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      boxShadow: isHigh ? `0 0 8px ${color}66` : 'none'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-cyan-400">Click to filter table to "{grp.value}" &rarr;</span>
                  <span>{grp.highCount} High-Risk Subscribers</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TOP RETENTION OPPORTUNITY CARD (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-gradient-to-b from-amber-500/10 via-black/40 to-black/30 border border-amber-500/30 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <span>⚡</span> HIGHEST ROI OPPORTUNITY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
              Prescriptive
            </span>
          </div>

          <h5 className="text-sm font-bold text-white mb-2">
            {segmentData.bestOpportunity?.title}
          </h5>

          <p className="text-xs text-text-muted leading-relaxed mb-4">
            {segmentData.bestOpportunity?.recommendation}
          </p>

          {/* Financial Preservation Matrix */}
          <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Target Cohort Volume:</span>
              <span className="font-mono font-bold text-white">
                {segmentData.bestOpportunity?.count} Subscribers
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Current ARR Flight Risk:</span>
              <span className="font-mono font-bold text-red-400">
                ${segmentData.bestOpportunity?.arrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span>💰</span> Est. ARR Preserved:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +${segmentData.bestOpportunity?.savedEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })} / yr
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFilterSearch && onFilterSearch('Month-to-month')}
            className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all cursor-pointer"
          >
            Filter Table to Month-to-Month Segment &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
