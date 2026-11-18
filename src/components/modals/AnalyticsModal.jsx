import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePlannerData } from '../../context/PlannerDataContext';
import { BarChart2, CheckCircle2, Clock, Flame, PieChart } from 'lucide-react';

export function AnalyticsModal({ isOpen, onClose }) {
  const { tasks, habits, dailyLogs, activeDate } = usePlannerData();

  const activeDateTasks = tasks.filter((t) => t.date === activeDate);
  const totalPlannedMins = activeDateTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const totalActualMins = activeDateTasks.reduce((acc, t) => acc + Math.floor((t.actualSecondsSpent || 0) / 60), 0);
  const completedTasks = activeDateTasks.filter((t) => t.status === 'completed');

  // Category distributions
  const categories = ['deep_work', 'meetings', 'admin', 'personal', 'break'];
  const catMinutes = {};
  for (const c of categories) {
    catMinutes[c] = activeDateTasks
      .filter((t) => t.category === c)
      .reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  }

  // Calibration ratio: actual vs planned (1.0 = perfect prediction)
  const calibration = totalPlannedMins > 0 ? (totalActualMins / totalPlannedMins).toFixed(2) : '1.00';

  // Average focus score from logs
  const logKeys = Object.keys(dailyLogs);
  const scoreLogs = logKeys.map((k) => dailyLogs[k]?.focusScore).filter(Boolean);
  const avgScore = scoreLogs.length > 0 ? (scoreLogs.reduce((a, b) => a + b, 0) / scoreLogs.length).toFixed(1) : '4.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Executive Productivity & Calibration Ledger" maxWidth={540}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Metric Ledger 1: Time & Velocity */}
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Daily Execution Ledger ({activeDate})
          </span>
          <div className="ledger-strip">
            <div className="ledger-item">
              <span className="ledger-label">Planned Time</span>
              <span className="ledger-val tabular-nums">{(totalPlannedMins / 60).toFixed(1)}h</span>
            </div>
            <div className="ledger-item">
              <span className="ledger-label">Actual Focused</span>
              <span className="ledger-val tabular-nums">{(totalActualMins / 60).toFixed(1)}h</span>
            </div>
            <div className="ledger-item">
              <span className="ledger-label">Calibration Ratio</span>
              <span className="ledger-val tabular-nums" style={{ color: calibration > 1.2 ? 'var(--signal-now)' : 'var(--cat-admin-spine)' }}>
                {calibration}×
              </span>
            </div>
            <div className="ledger-item">
              <span className="ledger-label">Completed</span>
              <span className="ledger-val tabular-nums">
                {completedTasks.length}/{activeDateTasks.length}
              </span>
            </div>
          </div>
        </div>

        {/* Category Allocation Ledger */}
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Circadian Time Allocation by Category
          </span>
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {categories.map((c) => {
              const mins = catMinutes[c];
              const pct = totalPlannedMins > 0 ? Math.round((mins / totalPlannedMins) * 100) : 0;

              return (
                <div key={c}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`cat-dot cat-dot-${c}`} />
                      <span style={{ textTransform: 'capitalize' }}>{c.replace('_', ' ')}</span>
                    </div>
                    <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {(mins / 60).toFixed(1)}h ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      backgroundColor: 'var(--bg-panel)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: `var(--cat-${c === 'deep_work' ? 'deep' : c === 'meetings' ? 'meeting' : c}-spine)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habits & Scores Strip */}
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Longitudinal Stamina
          </span>
          <div className="ledger-strip">
            <div className="ledger-item">
              <span className="ledger-label">Active Habits</span>
              <span className="ledger-val tabular-nums">{habits.length}</span>
            </div>
            <div className="ledger-item">
              <span className="ledger-label">Longest Streak</span>
              <span className="ledger-val tabular-nums" style={{ color: 'var(--signal-now)' }}>
                {Math.max(0, ...habits.map((h) => h.streak))} days
              </span>
            </div>
            <div className="ledger-item">
              <span className="ledger-label">Avg Focus Rating</span>
              <span className="ledger-val tabular-nums">{avgScore} / 5.0</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

