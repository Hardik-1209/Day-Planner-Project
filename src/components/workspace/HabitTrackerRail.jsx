import React, { useRef } from 'react';
import {
  Activity,
  Droplet,
  BookOpen,
  Sun,
  Flame,
  Check,
  Layers,
  Sparkles,
  Download,
  Upload,
  Calendar,
  Clock,
  BatteryCharging,
} from 'lucide-react';
import { usePlannerData } from '../../context/PlannerDataContext';
import { formatMinutesToTime, formatDuration } from '../../utils/timeHelpers';
import { Button } from '../ui/Button';

const HABIT_ICONS = {
  Droplet: Droplet,
  BookOpen: BookOpen,
  Sun: Sun,
  Activity: Activity,
};

export function HabitTrackerRail({ onOpenAnalytics, onOpenBlueprints }) {
  const {
    tasks,
    habits,
    toggleHabit,
    blueprints,
    applyBlueprint,
    activeDate,
    exportBackup,
    importBackup,
  } = usePlannerData();
  const fileInputRef = useRef(null);

  // Scheduled tasks for activeDate
  const todayTasks = tasks.filter((t) => t.date === activeDate && t.scheduledStartMinutes !== null);
  const totalPlannedMinutes = todayTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const totalActualMinutes = todayTasks.reduce((acc, t) => acc + Math.floor((t.actualSecondsSpent || 0) / 60), 0);
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const accuracyPct = totalPlannedMinutes > 0 ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100) : 100;

  // Circadian state helper
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let circadianTitle = 'Rest & Recovery';
  let circadianDesc = 'Low cognitive load recommended';
  if (nowMinutes >= 390 && nowMinutes < 510) {
    circadianTitle = 'Morning Routine';
    circadianDesc = 'Hydration & sunlight exposure';
  } else if (nowMinutes >= 540 && nowMinutes < 720) {
    circadianTitle = 'Morning Peak Focus';
    circadianDesc = 'Optimal window for Deep Work';
  } else if (nowMinutes >= 780 && nowMinutes < 930) {
    circadianTitle = 'Post-Lunch Dip';
    circadianDesc = 'Administrative tasks & meetings';
  } else if (nowMinutes >= 960 && nowMinutes < 1110) {
    circadianTitle = 'Second Wind';
    circadianDesc = 'Tactical execution & problem solving';
  } else if (nowMinutes >= 1110 && nowMinutes < 1320) {
    circadianTitle = 'Evening Wind Down';
    circadianDesc = 'Shutdown ritual & family time';
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importBackup(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <aside className="right-rail">
      {/* 1. Daily Metrics Ledger Strip */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Daily Ledger
          </span>
          <Button variant="ghost" size="xs" onClick={onOpenAnalytics} title="Detailed Analytics">
            Ledger Details
          </Button>
        </div>

        <div className="ledger-strip">
          <div className="ledger-item">
            <span className="ledger-label">Planned</span>
            <span className="ledger-val tabular-nums">{(totalPlannedMinutes / 60).toFixed(1)}h</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-label">Actual</span>
            <span className="ledger-val tabular-nums">{(totalActualMinutes / 60).toFixed(1)}h</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-label">Done</span>
            <span className="ledger-val tabular-nums">
              {completedCount}/{todayTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Circadian Energy Status */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <BatteryCharging size={13} style={{ color: 'var(--signal-now)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Circadian Rhythm</span>
        </div>
        <div style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '6px 8px' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
            {circadianTitle}
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            {circadianDesc}
          </div>
        </div>
      </div>

      {/* 3. Micro-Habit Streaks */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Daily Habits</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {habits.map((habit) => {
            const Icon = HABIT_ICONS[habit.icon] || Activity;
            const isCompleted = (habit.completedDates || []).includes(activeDate);

            return (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id, activeDate)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: isCompleted ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                      backgroundColor: isCompleted ? 'var(--accent-primary)' : 'transparent',
                      color: 'var(--accent-contrast-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCompleted && <Check size={10} strokeWidth={3} />}
                  </div>
                  <Icon size={12} style={{ color: 'var(--text-secondary)' }} />
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                    }}
                  >
                    {habit.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-2xs)', color: 'var(--signal-now)' }}>
                  <Flame size={11} />
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>{habit.streak}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Day Blueprints (Templates) */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Day Blueprints</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {blueprints.map((bp) => (
            <div
              key={bp.id}
              style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{bp.name}</span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => applyBlueprint(bp.id, activeDate)}
                >
                  Apply
                </Button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 3 }}>
                {bp.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Offline Data Backup & Restore */}
      <div style={{ padding: '10px 12px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="ghost"
            size="xs"
            icon={Download}
            onClick={exportBackup}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Backup JSON
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Restore
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </aside>
  );
}

