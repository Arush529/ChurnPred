import React from 'react';
import { RISK_STYLES } from '../lib/mlEngine';

export default function CircularGauge({ percentage = 0, riskLevel = "Low Risk" }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // 439.82
  const offset = circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  const style = RISK_STYLES[riskLevel] || RISK_STYLES["Low Risk"];

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px] my-2">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* Background track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="11"
        />
        {/* Animated colored progress stroke */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={style.hex}
          strokeWidth="11"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
            filter: `drop-shadow(0 0 10px ${style.glow})`
          }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span 
          className="text-4xl font-extrabold font-headline tracking-tight transition-colors duration-300"
          style={{ color: style.hex, textShadow: `0 0 18px ${style.glow}` }}
        >
          {percentage}%
        </span>
        <span className="text-[11px] font-mono tracking-widest text-fx-muted mt-1 uppercase">
          Churn Risk
        </span>
      </div>
    </div>
  );
}
