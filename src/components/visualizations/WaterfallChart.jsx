import React, { useState } from 'react';

export default function WaterfallChart({ factors = [], currentProb = 0, isConfigured = false }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!isConfigured || factors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Configure customer features or choose a preset above to generate waterfall attribution.</p>
      </div>
    );
  }

  // Base cohort baseline rate (26.5% standard Telco baseline)
  const BASE_RATE = 26.5;
  const finalProbPct = Math.round(currentProb * 100);

  // Normalize factor weights so the step sum lands precisely on the calculated final probability
  const rawSum = factors.reduce((acc, f) => acc + f.weight, 0);
  const targetTotalDelta = finalProbPct - BASE_RATE;
  const scalingFactor = rawSum !== 0 ? targetTotalDelta / rawSum : 1;

  // Build steps: [Base Rate, ...Factors, Final Prediction]
  let currentVal = BASE_RATE;
  const steps = [
    {
      label: 'Base Rate',
      value: 'Cohort Mean',
      delta: BASE_RATE,
      start: 0,
      end: BASE_RATE,
      isTotal: true,
      color: '#38bdf8',
      desc: 'Average expected churn probability across the general subscriber population.'
    }
  ];

  factors.slice(0, 5).forEach((f) => {
    const scaledDelta = Math.round(f.weight * scalingFactor * 10) / 10;
    const nextVal = Math.max(0, Math.min(100, currentVal + scaledDelta));
    const isRisk = scaledDelta >= 0;

    steps.push({
      label: f.feature,
      value: f.value,
      delta: scaledDelta,
      start: isRisk ? currentVal : nextVal,
      end: isRisk ? nextVal : currentVal,
      isRisk,
      color: isRisk ? '#ff3366' : '#00f298',
      desc: isRisk 
        ? `"${f.value}" increases flight risk by +${Math.abs(scaledDelta).toFixed(1)}%`
        : `"${f.value}" protects this account by -${Math.abs(scaledDelta).toFixed(1)}%`
    });

    currentVal = nextVal;
  });

  // Final prediction total bar
  steps.push({
    label: 'Predicted Risk',
    value: `${finalProbPct}%`,
    delta: finalProbPct,
    start: 0,
    end: finalProbPct,
    isFinal: true,
    color: finalProbPct >= 60 ? '#ff3366' : finalProbPct >= 35 ? '#ffac52' : '#00f298',
    desc: `Final composite XGBoost churn probability for this subscriber profile.`
  });

  // SVG Chart Dimensions
  const width = 760;
  const height = 280;
  const padding = { top: 35, right: 30, bottom: 50, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const colWidth = chartW / steps.length;
  const barWidth = Math.min(54, colWidth * 0.62);

  const scaleY = (val) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + chartH - (clamped / 100) * chartH;
  };

  return (
    <div className="w-full relative">
      {/* Clean Compact Legend */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-text-muted font-mono text-[11px]">POPULATION BASELINE (27%) &rarr; FINAL SCORE ({finalProbPct}%)</span>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-risk-high inline-block shadow-[0_0_6px_rgba(255,51,102,0.4)]"></span>
            <span className="text-gray-300">Risk Driver (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-fx-green inline-block shadow-[0_0_6px_rgba(0,242,152,0.4)]"></span>
            <span className="text-gray-300">Protective Factor (&minus;)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block"></span>
            <span className="text-gray-300">Anchor Base</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto min-w-[640px] select-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="waterfall-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3366" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="waterfall-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f298" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="waterfall-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="waterfall-amber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffac52" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = scaleY(tick);
            return (
              <g key={tick}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.08)" 
                  strokeDasharray={tick === 0 ? "none" : "3 3"} 
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fontSize="11" 
                  fill="#71717a" 
                  fontFamily="Space Grotesk, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Step Connectors & Bars */}
          {steps.map((step, idx) => {
            const x = padding.left + idx * colWidth + (colWidth - barWidth) / 2;
            const topY = scaleY(Math.max(step.start, step.end));
            const bottomY = scaleY(Math.min(step.start, step.end));
            const bHeight = Math.max(4, bottomY - topY);

            // Dashed connector line to next step
            const nextStep = steps[idx + 1];
            let connectorY = null;
            if (nextStep) {
              connectorY = scaleY(step.isTotal ? step.end : (step.isRisk ? step.end : step.start));
            }

            const isHovered = hoveredIndex === idx;

            return (
              <g 
                key={idx} 
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`${step.label} (${step.value}): ${step.desc}`}</title>
                {/* Connector line to next bar */}
                {connectorY !== null && nextStep && (
                  <line 
                    x1={x + barWidth} 
                    y1={connectorY} 
                    x2={x + colWidth} 
                    y2={connectorY} 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    strokeDasharray="2 2"
                  />
                )}

                {/* Floating Waterfall Bar */}
                <rect 
                  x={x} 
                  y={topY} 
                  width={barWidth} 
                  height={bHeight} 
                  rx="6" 
                  fill={
                    step.isTotal 
                      ? 'url(#waterfall-blue)' 
                      : step.isFinal 
                        ? (step.color === '#ff3366' ? 'url(#waterfall-red)' : step.color === '#ffac52' ? 'url(#waterfall-amber)' : 'url(#waterfall-green)')
                        : (step.isRisk ? 'url(#waterfall-red)' : 'url(#waterfall-green)')
                  }
                  stroke={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth={isHovered ? 2 : 1}
                  filter={isHovered ? `drop-shadow(0 0 12px ${step.color})` : undefined}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />

                {/* Value Label above/below bar */}
                <text 
                  x={x + barWidth / 2} 
                  y={topY - 8} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fontWeight="700"
                  fontFamily="Space Grotesk, monospace"
                  fill={step.color}
                >
                  {step.isTotal || step.isFinal ? `${Math.round(step.end)}%` : `${step.delta >= 0 ? '+' : ''}${step.delta.toFixed(1)}%`}
                </text>

                {/* Bottom Column Label */}
                <text 
                  x={x + barWidth / 2} 
                  y={height - 24} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fontWeight="600"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                >
                  {step.label}
                </text>
                <text 
                  x={x + barWidth / 2} 
                  y={height - 10} 
                  textAnchor="middle" 
                  fontSize="9" 
                  fill="#64748b"
                >
                  {step.value.length > 14 ? step.value.substring(0, 12) + '...' : step.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
