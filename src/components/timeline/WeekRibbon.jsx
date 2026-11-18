import React from 'react';
import { usePlannerData } from '../../context/PlannerDataContext';

export function WeekRibbon() {
  const { activeDate, setActiveDate, tasks, horizonMode } = usePlannerData();

  // Compute 7 days surrounding or starting from activeDate's week
  const curr = new Date(activeDate + 'T00:00:00');
  const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(curr);
  monday.setDate(curr.getDate() + mondayOffset);

  // Compute active dates in the horizon window
  const activeWindowEnd = new Date(activeDate + 'T00:00:00');
  activeWindowEnd.setDate(activeWindowEnd.getDate() + (horizonMode === '3D' ? 2 : 0));
  const activeWindowEndDateStr = activeWindowEnd.toISOString().slice(0, 10);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayTasks = tasks.filter((t) => t.date === dateStr && t.scheduledStartMinutes !== null);
    const isSelected = dateStr === activeDate;
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    const isInHorizon = horizonMode === '3D'
      ? dateStr >= activeDate && dateStr <= activeWindowEndDateStr
      : isSelected;

    days.push({
      dateStr,
      weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayNumber: d.getDate(),
      taskCount: dayTasks.length,
      isSelected,
      isToday,
      isInHorizon,
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px 6px 64px',
        borderBottom: '1px solid var(--border-hairline)',
        backgroundColor: 'var(--bg-panel)',
        gap: 8,
      }}
    >
      {days.map((day) => (
        <button
          key={day.dateStr}
          type="button"
          onClick={() => setActiveDate(day.dateStr)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4px 2px',
            borderRadius: 'var(--radius-xs)',
            border: day.isSelected
              ? '1px solid var(--accent-primary)'
              : day.isInHorizon
              ? '1px dashed var(--border-strong)'
              : '1px solid transparent',
            backgroundColor: day.isSelected
              ? 'var(--bg-elevated)'
              : day.isInHorizon
              ? 'var(--bg-active)'
              : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 120ms ease',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: day.isSelected || day.isInHorizon ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {day.weekday}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: day.isToday || day.isSelected || day.isInHorizon ? 600 : 400,
              color: day.isToday ? 'var(--signal-now)' : 'var(--text-primary)',
              marginTop: 1,
            }}
          >
            {day.dayNumber}
          </span>

          {/* Tiny Task Load Dot / Bar */}
          <div
            style={{
              width: 14,
              height: 2,
              borderRadius: 1,
              marginTop: 3,
              backgroundColor:
                day.taskCount > 0
                  ? day.isSelected
                    ? 'var(--accent-primary)'
                    : 'var(--border-strong)'
                  : 'transparent',
            }}
          />
        </button>
      ))}
    </div>
  );
}
