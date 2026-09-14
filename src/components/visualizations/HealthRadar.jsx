import React, { useState } from 'react';

export default function HealthRadar({ profile, isConfigured = false }) {
  const [hoveredAxis, setHoveredAxis] = useState(null);

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <span className="text-3xl mb-2">🕸️</span>
        <p className="text-sm">Configure customer features or choose a preset above to generate the account health radar.</p>
      </div>
    );
  }

  // 1. Calculate 6 Holistic Dimensional Health Scores (0 to 100)
  // Dimension 1: Contract Stability
  let contractScore = 20;
  if (profile.Contract === 'Two year') contractScore = 100;
  else if (profile.Contract === 'One year') contractScore = 65;
  else if (profile.Contract === 'Month-to-month') contractScore = 20;

  // Dimension 2: Tenure & Loyalty (0 - 72 months)
  const tenureMonths = Number(profile.tenure) || 0;
  const tenureScore = Math.min(100, Math.round((tenureMonths / 60) * 100));

  // Dimension 3: Cyber Security & Support Attachment
  let secScore = 0;
  if (profile.OnlineSecurity === 'Yes') secScore += 50;
  if (profile.TechSupport === 'Yes') secScore += 50;

  // Dimension 4: Cloud & Device Protection
  let cloudScore = 0;
  if (profile.OnlineBackup === 'Yes') cloudScore += 50;
  if (profile.DeviceProtection === 'Yes') cloudScore += 50;

  // Dimension 5: Media & Streaming Attachment
  let mediaScore = 0;
  if (profile.StreamingTV === 'Yes') mediaScore += 50;
  if (profile.StreamingMovies === 'Yes') mediaScore += 50;

  // Dimension 6: Payment Hygiene & Friction
  let payScore = 25;
  if (profile.PaymentMethod?.includes('automatic')) payScore = 100;
  else if (profile.PaymentMethod === 'Mailed check') payScore = 55;
  else if (profile.PaymentMethod === 'Electronic check') payScore = 25;

  const axes = [
    {
      key: 'contract',
      name: 'Contract Stability',
      score: contractScore,
      value: profile.Contract || 'None',
      benchmark: 85,
      tip: contractScore >= 65 ? 'Stable multi-year term minimizes flight risk' : 'Month-to-month status presents immediate churn exposure'
    },
    {
      key: 'tenure',
      name: 'Tenure & Loyalty',
      score: tenureScore,
      value: `${tenureMonths} months`,
      benchmark: 70,
      tip: tenureMonths >= 24 ? 'Seasoned subscriber with established retention equity' : 'Early-lifecycle account vulnerable to onboarding friction'
    },
    {
      key: 'security',
      name: 'Security & Support',
      score: secScore,
      value: `${(profile.OnlineSecurity === 'Yes' ? 1 : 0) + (profile.TechSupport === 'Yes' ? 1 : 0)}/2 Services`,
      benchmark: 80,
      tip: secScore >= 50 ? 'Strong technical support attachment reduces churn' : 'Missing Tech Support or Security leads to unresolved service friction'
    },
    {
      key: 'cloud',
      name: 'Cloud & Device Care',
      score: cloudScore,
      value: `${(profile.OnlineBackup === 'Yes' ? 1 : 0) + (profile.DeviceProtection === 'Yes' ? 1 : 0)}/2 Services`,
      benchmark: 75,
      tip: cloudScore >= 50 ? 'High ecosystem stickiness protects account value' : 'Low ecosystem service adoption increases vulnerability to competitor offers'
    },
    {
      key: 'media',
      name: 'Media Engagement',
      score: mediaScore,
      value: `${(profile.StreamingTV === 'Yes' ? 1 : 0) + (profile.StreamingMovies === 'Yes' ? 1 : 0)}/2 Services`,
      benchmark: 65,
      tip: mediaScore >= 50 ? 'High consumption of digital streaming services' : 'Standard utility usage without entertainment bundle stickiness'
    },
    {
      key: 'billing',
      name: 'Payment Hygiene',
      score: payScore,
      value: profile.PaymentMethod || 'None',
      benchmark: 90,
      tip: payScore >= 75 ? 'Hands-free automatic debit prevents involuntary billing lapse' : 'Manual electronic check causes recurring monthly friction'
    }
  ];

  // Composite Health Index (0-100)
  const compositeHealth = Math.round(axes.reduce((sum, a) => sum + a.score, 0) / axes.length);
  const healthColor = compositeHealth >= 70 ? '#00f298' : compositeHealth >= 45 ? '#ffac52' : '#ff3366';

  // Radar SVG Math
  const size = 360;
  const center = size / 2;
  const maxRadius = 120;
  const numAxes = axes.length;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Generate Customer Polygon Points
  const customerPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.score);
      return `${x},${y}`;
    })
    .join(' ');

  // Generate Benchmark Polygon Points
  const benchmarkPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.benchmark);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Radar SVG Area */}
      <div className="relative flex-1 flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          width={size} 
          height={size} 
          className="max-w-full h-auto select-none"
        >
          <defs>
            {/* Customer Area Fill Gradient */}
            <radialGradient id="radar-customer-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={healthColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={healthColor} stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Web concentric polygon rings (20%, 40%, 60%, 80%, 100%) */}
          {[20, 40, 60, 80, 100].map((level) => {
            const ringPoints = axes
              .map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <polygon 
                key={level} 
                points={ringPoints} 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.08)" 
                strokeWidth="1"
              />
            );
          })}

          {/* Axis Spokes from center to edge */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line 
                key={i} 
                x1={center} 
                y1={center} 
                x2={x} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.12)" 
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Benchmark Target Polygon (Cyan Dashed) */}
          <polygon 
            points={benchmarkPoints} 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="1.5" 
            strokeDasharray="4 3" 
            opacity="0.65"
          />

          {/* Customer Polygon Area */}
          <polygon 
            points={customerPoints} 
            fill="url(#radar-customer-grad)" 
            stroke={healthColor} 
            strokeWidth="2.5"
            style={{
              filter: `drop-shadow(0 0 10px ${healthColor}44)`,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* Axis Vertex Nodes & Interactive Anchors */}
          {axes.map((axis, i) => {
            const pt = getCoordinates(i, axis.score);
            const labelPt = getCoordinates(i, 122);
            const isHovered = hoveredAxis === i;

            return (
              <g 
                key={i} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <title>{axis.name}: {axis.tip}</title>
                {/* Vertex node circle */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={isHovered ? 6 : 4} 
                  fill={healthColor} 
                  stroke="#ffffff" 
                  strokeWidth={isHovered ? 2 : 1}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${healthColor})` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />

                {/* Outer Axis Text Label */}
                <text 
                  x={labelPt.x} 
                  y={labelPt.y + 4} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  className="transition-colors"
                >
                  {axis.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Composite Health Gauge Badge */}
        <div 
          className="absolute flex flex-col items-center pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="text-xl font-mono font-bold" style={{ color: healthColor, textShadow: `0 0 12px ${healthColor}` }}>
            {compositeHealth}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-text-muted">HEALTH</span>
        </div>
      </div>

      {/* Right Column: Dimension Breakdown & Diagnostic Cards */}
      <div className="flex-1 w-full flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">PILLAR HEALTH BREAKDOWN</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: healthColor }}></span>
              Subscriber
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-1 border-b-2 border-cyan-400 border-dashed inline-block"></span>
              Benchmark Target
            </span>
          </div>
        </div>

        {/* 6 Dimension Status Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {axes.map((axis, i) => {
            const isHovered = hoveredAxis === i;
            const barColor = axis.score >= 70 ? '#00f298' : axis.score >= 45 ? '#ffac52' : '#ff3366';

            return (
              <div 
                key={axis.key}
                title={axis.tip}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isHovered ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/5'}`}
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-white">{axis.name}</span>
                  <span className="font-mono font-bold" style={{ color: barColor }}>
                    {axis.score}/100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${axis.score}%`, 
                      backgroundColor: barColor,
                      boxShadow: `0 0 6px ${barColor}`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-muted mt-1">
                  <span>{axis.value}</span>
                  <span>Target: {axis.benchmark}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
