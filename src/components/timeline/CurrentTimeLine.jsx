import React, { useState, useEffect } from 'react';
import { DAY_START_MINUTES, PIXELS_PER_MINUTE, formatMinutesToTime } from '../../utils/timeHelpers';

export function CurrentTimeLine({ dayStartMinutes = DAY_START_MINUTES, colIdx = 0, numCols = 1 }) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const topPx = (currentMinutes - dayStartMinutes) * PIXELS_PER_MINUTE;
  if (topPx < 0) return null;

  const colLeft = numCols > 1
    ? `calc(56px + ${colIdx} * (100% - 56px) / ${numCols})`
    : '56px';

  const colWidth = numCols > 1
    ? `calc((100% - 56px) / ${numCols})`
    : 'calc(100% - 56px)';

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        left: colLeft,
        width: colWidth,
        height: '2px',
        backgroundColor: 'var(--signal-now)',
        zIndex: 15,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Beacon circle with pulse */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--signal-now)',
          boxShadow: '0 0 0 4px var(--signal-now-pulse)',
          transform: 'translate(-50%, 0)',
        }}
      />
      {/* Time label badge */}
      <div
        className="tabular-nums"
        style={{
          position: 'absolute',
          left: '6px',
          backgroundColor: 'var(--signal-now)',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 600,
          padding: '1px 4px',
          borderRadius: 'var(--radius-xs)',
          transform: 'translateY(-50%)',
          letterSpacing: '0.02em',
        }}
      >
        {formatMinutesToTime(currentMinutes)}
      </div>
    </div>
  );
}
