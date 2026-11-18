import React from 'react';
import { Coffee, Wind } from 'lucide-react';
import { PIXELS_PER_MINUTE, formatMinutesToTime } from '../../utils/timeHelpers';

export function QuickBufferBar({ startMinutes, durationMinutes = 10 }) {
  const topPx = (startMinutes - 360) * PIXELS_PER_MINUTE;
  const heightPx = Math.max(14, durationMinutes * PIXELS_PER_MINUTE - 2);

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        left: '56px',
        right: '12px',
        height: `${heightPx}px`,
        backgroundColor: 'var(--bg-panel)',
        border: '1px dashed var(--border-hairline)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 6,
        fontSize: 'var(--text-2xs)',
        color: 'var(--text-muted)',
        zIndex: 2,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <Wind size={11} strokeWidth={1.5} />
      <span>{durationMinutes}m Decompression Buffer</span>
      <span className="tabular-nums" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
        {formatMinutesToTime(startMinutes)} - {formatMinutesToTime(startMinutes + durationMinutes)}
      </span>
    </div>
  );
}

