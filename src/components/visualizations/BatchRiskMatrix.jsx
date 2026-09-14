import React, { useState, useMemo } from 'react';

export default function BatchRiskMatrix({ 
  customers = [], 
  onInspectCustomer 
}) {
  const [hoveredCustomer, setHoveredCustomer] = useState(null);
  const [filterQuadrant, setFilterQuadrant] = useState('all'); // 'all' | 'danger' | 'vip' | 'onboard' | 'stable'

  // Dimensions & bounds
  const svgWidth = 720;
  const svgHeight = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Domain ranges
  const minTenure = 0;
  const maxTenure = 72;
  const minCharge = 18;
  const maxCharge = 120;

  // Coordinate scales
  const scaleX = (tenure) => {
    const clamped = Math.max(minTenure, Math.min(maxTenure, Number(tenure) || 0));
    return padding.left + (clamped / maxTenure) * chartW;
  };

  const scaleY = (charge) => {
    const clamped = Math.max(minCharge, Math.min(maxCharge, Number(charge) || 0));
    return padding.top + chartH - ((clamped - minCharge) / (maxCharge - minCharge)) * chartH;
  };

  // Quadrant Split Point: Tenure = 24 mo, Monthly Charge = $70
  const splitX = scaleX(24);
  const splitY = scaleY(70);

  // Classify customers into quadrants
  const { dangerZone, vipZone, onboardZone, stableZone } = useMemo(() => {
    const danger = [];
    const vip = [];
    const onboard = [];
    const stable = [];

    customers.forEach(c => {
      const ten = Number(c.tenure) || 0;
      const chg = Number(c.MonthlyCharges) || 0;
      if (ten <= 24 && chg > 70) danger.push(c);
      else if (ten > 24 && chg > 70) vip.push(c);
      else if (ten <= 24 && chg <= 70) onboard.push(c);
      else stable.push(c);
    });

    return { dangerZone: danger, vipZone: vip, onboardZone: onboard, stableZone: stable };
  }, [customers]);

  const displayedCustomers = useMemo(() => {
    if (filterQuadrant === 'danger') return dangerZone;
    if (filterQuadrant === 'vip') return vipZone;
    if (filterQuadrant === 'onboard') return onboardZone;
    if (filterQuadrant === 'stable') return stableZone;
    return customers;
  }, [customers, filterQuadrant, dangerZone, vipZone, onboardZone, stableZone]);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">🗺️</span>
        <p className="text-sm">Upload a CSV or generate a sample cohort to visualize the portfolio risk scatter matrix.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Clean Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">PORTFOLIO MATRIX (TENURE VS MONTHLY BILL)</span>

        {/* Quadrant Quick Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setFilterQuadrant('all')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              filterQuadrant === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-white/5 text-text-muted hover:text-white border-white/5'
            }`}
          >
            All Accounts ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterQuadrant('danger')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              filterQuadrant === 'danger'
                ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(255,51,102,0.3)]'
                : 'bg-white/5 text-text-muted hover:text-red-300 border-white/5'
            }`}
          >
            🚨 Danger Zone ({dangerZone.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterQuadrant('vip')}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              filterQuadrant === 'vip'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-white/5 text-text-muted hover:text-amber-300 border-white/5'
            }`}
          >
            👑 VIPs ({vipZone.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Scatter SVG on Left, Quadrant Intelligence on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SCATTER CANVAS (8 cols) */}
        <div className="lg:col-span-8 p-3 rounded-xl bg-black/30 border border-white/5 relative overflow-hidden">
          
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            <defs>
              {/* Radial glow filter */}
              <filter id="glow-danger" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Quadrant Background Shading */}
            {/* Q1: Danger Zone (Top-Left) */}
            <rect
              x={padding.left}
              y={padding.top}
              width={splitX - padding.left}
              height={splitY - padding.top}
              fill="rgba(255, 51, 102, 0.04)"
              stroke="none"
            />
            {/* Q2: VIPs (Top-Right) */}
            <rect
              x={splitX}
              y={padding.top}
              width={padding.left + chartW - splitX}
              height={splitY - padding.top}
              fill="rgba(255, 172, 82, 0.03)"
              stroke="none"
            />
            {/* Q3: Early Onboard (Bottom-Left) */}
            <rect
              x={padding.left}
              y={splitY}
              width={splitX - padding.left}
              height={padding.top + chartH - splitY}
              fill="rgba(56, 189, 248, 0.02)"
              stroke="none"
            />
            {/* Q4: Stable Core (Bottom-Right) */}
            <rect
              x={splitX}
              y={splitY}
              width={padding.left + chartW - splitX}
              height={padding.top + chartH - splitY}
              fill="rgba(0, 242, 152, 0.03)"
              stroke="none"
            />

            {/* Quadrant Partition Grid Lines */}
            <line
              x1={splitX}
              y1={padding.top}
              x2={splitX}
              y2={padding.top + chartH}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeDasharray="4,4"
              strokeWidth="1.2"
            />
            <line
              x1={padding.left}
              y1={splitY}
              x2={padding.left + chartW}
              y2={splitY}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeDasharray="4,4"
              strokeWidth="1.2"
            />

            {/* Quadrant Label Watermarks */}
            <text x={padding.left + 12} y={padding.top + 20} fill="#ff3366" fontSize="11" fontWeight="600" opacity="0.6">
              🚨 CRITICAL DANGER ZONE
            </text>
            <text x={padding.left + chartW - 12} y={padding.top + 20} textAnchor="end" fill="#ffac52" fontSize="11" fontWeight="600" opacity="0.6">
              👑 HIGH-VALUE VIP ACCOUNTS
            </text>
            <text x={padding.left + 12} y={padding.top + chartH - 10} fill="#38bdf8" fontSize="10" fontWeight="500" opacity="0.5">
              🌱 ONBOARDING PHASE
            </text>
            <text x={padding.left + chartW - 12} y={padding.top + chartH - 10} textAnchor="end" fill="#00f298" fontSize="10" fontWeight="500" opacity="0.5">
              🛡️ STABLE UTILITY CORE
            </text>

            {/* Axes Lines */}
            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={padding.left + chartW}
              y2={padding.top + chartH}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartH}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
            />

            {/* X-Axis Ticks & Labels (Tenure) */}
            {[0, 12, 24, 36, 48, 60, 72].map(t => (
              <g key={`x-${t}`}>
                <line
                  x1={scaleX(t)}
                  y1={padding.top + chartH}
                  x2={scaleX(t)}
                  y2={padding.top + chartH + 5}
                  stroke="rgba(255, 255, 255, 0.3)"
                />
                <text
                  x={scaleX(t)}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {t}m
                </text>
              </g>
            ))}
            <text
              x={padding.left + chartW / 2}
              y={padding.top + chartH + 36}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="500"
            >
              Customer Tenure (Months) &rarr;
            </text>

            {/* Y-Axis Ticks & Labels (Monthly Charges) */}
            {[20, 45, 70, 95, 120].map(c => (
              <g key={`y-${c}`}>
                <line
                  x1={padding.left - 5}
                  y1={scaleY(c)}
                  x2={padding.left}
                  y2={scaleY(c)}
                  stroke="rgba(255, 255, 255, 0.3)"
                />
                <text
                  x={padding.left - 10}
                  y={scaleY(c) + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${c}
                </text>
              </g>
            ))}
            <text
              x={- (padding.top + chartH / 2)}
              y="18"
              transform="rotate(-90)"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="500"
            >
              Monthly Bill ($) &rarr;
            </text>

            {/* Customer Data Nodes */}
            {displayedCustomers.map((c) => {
              const cx = scaleX(c.tenure);
              const cy = scaleY(c.MonthlyCharges);
              const isHigh = c.riskTier === 'High Risk';
              const isMed = c.riskTier === 'Medium Risk';
              const color = isHigh ? '#ff3366' : isMed ? '#ffac52' : '#00f298';
              const radius = isHigh ? 5.5 : 4.5;
              const isHovered = hoveredCustomer && hoveredCustomer.id === c.id;

              return (
                <circle
                  key={c.id}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? radius + 4 : radius}
                  fill={color}
                  opacity={isHovered ? 1 : 0.78}
                  stroke={isHovered ? '#ffffff' : isHigh ? 'rgba(255, 51, 102, 0.5)' : 'none'}
                  strokeWidth={isHovered ? 2 : 1}
                  filter={isHigh || isHovered ? 'url(#glow-danger)' : undefined}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredCustomer(c)}
                  onClick={() => onInspectCustomer && onInspectCustomer(c)}
                />
              );
            })}
          </svg>

          {/* Floating Tooltip Card */}
          {hoveredCustomer && (
            <div 
              className="absolute top-4 right-4 z-30 p-3 rounded-xl shadow-2xl animate-fade-in max-w-xs"
              style={{
                background: 'rgba(10, 14, 22, 0.95)',
                border: `1px solid ${hoveredCustomer.riskTier === 'High Risk' ? '#ff3366' : '#38bdf8'}`,
                boxShadow: '0 12px 36px rgba(0,0,0,0.8)'
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
                <span className="font-mono font-bold text-white text-xs">
                  {hoveredCustomer.id}
                </span>
                <span 
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: hoveredCustomer.riskTier === 'High Risk' ? 'rgba(255,51,102,0.15)' : 'rgba(0,242,152,0.15)',
                    color: hoveredCustomer.riskTier === 'High Risk' ? '#ff3366' : '#00f298'
                  }}
                >
                  {hoveredCustomer.pct}% Churn Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-text-muted mb-2.5">
                <div>Tenure: <strong className="text-white">{hoveredCustomer.tenure} mo</strong></div>
                <div>Monthly: <strong className="text-white">${Number(hoveredCustomer.MonthlyCharges).toFixed(2)}</strong></div>
                <div>Contract: <strong className="text-white">{hoveredCustomer.Contract}</strong></div>
                <div>Loss: <strong className="text-red-400">${hoveredCustomer.annualLoss.toFixed(2)}/yr</strong></div>
              </div>

              <div className="text-[10px] text-slate-300 bg-white/5 p-1.5 rounded mb-2.5">
                <span className="text-cyan-400 font-semibold">Action: </span>
                {hoveredCustomer.topAction || 'Review retention terms.'}
              </div>

              <button
                type="button"
                onClick={() => onInspectCustomer && onInspectCustomer(hoveredCustomer)}
                className="w-full py-1.5 text-center text-[11px] font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all cursor-pointer"
              >
                Inspect in Single Analyzer &rarr;
              </button>
            </div>
          )}

          {/* Bottom helper note */}
          <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 px-2">
            <span>🔴 High Risk (≥60%) &bull; 🟠 Medium Risk (35-60%) &bull; 🟢 Low Risk (&lt;35%)</span>
            <span>Hover node for details &bull; Click to inspect in Single Profile</span>
          </div>
        </div>

        {/* RIGHT: STRATEGIC QUADRANT BREAKDOWN (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Danger Zone Card */}
          <div 
            onClick={() => setFilterQuadrant(filterQuadrant === 'danger' ? 'all' : 'danger')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterQuadrant === 'danger'
                ? 'bg-red-500/15 border-red-500/50 shadow-[0_0_15px_rgba(255,51,102,0.25)]'
                : 'bg-black/25 border-white/5 hover:border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span>🚨</span> Critical Danger Zone
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {dangerZone.length} Accts
              </span>
            </div>
            <div className="text-[11px] text-red-400 font-mono font-semibold">
              ARR at Risk: ${dangerZone.reduce((s, c) => s + (c.annualLoss || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} / yr
            </div>
          </div>

          {/* High-Value VIPs */}
          <div 
            onClick={() => setFilterQuadrant(filterQuadrant === 'vip' ? 'all' : 'vip')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterQuadrant === 'vip'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(255,172,82,0.25)]'
                : 'bg-black/25 border-white/5 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>👑</span> High-Value VIPs
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {vipZone.length} Accts
              </span>
            </div>
            <div className="text-[11px] text-text-muted">
              Tenure &gt; 24m &bull; Bill &gt; $70 &bull; High Lifetime Value
            </div>
          </div>

          {/* Stable Core */}
          <div 
            onClick={() => setFilterQuadrant(filterQuadrant === 'stable' ? 'all' : 'stable')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterQuadrant === 'stable'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_15px_rgba(0,242,152,0.25)]'
                : 'bg-black/25 border-white/5 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🛡️</span> Stable Utility Core
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {stableZone.length} Accts
              </span>
            </div>
            <div className="text-[11px] text-text-muted">
              Tenure &gt; 24m &bull; Bill &le; $70 &bull; Low Flight Exposure
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
