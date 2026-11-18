import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useToast } from '../ui/ToastManager';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Star,
  RotateCcw,
} from 'lucide-react';

export function EveningShutdownModal({ isOpen, onClose }) {
  const {
    tasks,
    updateTask,
    activeDate,
    dailyLogs,
    updateDailyLog,
  } = usePlannerData();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Review -> 2: Rollover -> 3: Gratitude -> 4: Score
  const [gratitudeText, setGratitudeText] = useState(
    dailyLogs[activeDate]?.gratitude || ''
  );
  const [focusScore, setFocusScore] = useState(
    dailyLogs[activeDate]?.focusScore || 4
  );

  const todayTasks = tasks.filter((t) => t.date === activeDate && t.status !== 'deferred');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const incompleteTasks = todayTasks.filter((t) => t.status !== 'completed');

  // Trigger celebration confetti on modal open
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#E54D2E', '#3B5CCC', '#161615'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  const handleRolloverIncomplete = () => {
    // Tomorrow's date string
    const d = new Date(activeDate);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().slice(0, 10);

    for (const t of incompleteTasks) {
      updateTask(t.id, {
        date: tomorrowStr,
        scheduledStartMinutes: null,
        rolloverCount: (t.rolloverCount || 0) + 1,
      });
    }

    showToast({
      message: `Rolled over ${incompleteTasks.length} unfinished tasks to tomorrow`,
    });
    setStep(3);
  };

  const handleFinish = () => {
    updateDailyLog(activeDate, {
      gratitude: gratitudeText,
      focusScore,
      shutdownCompletedAt: Date.now(),
    });
    showToast({ message: 'Evening Shutdown recorded. Great work today!' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evening Shutdown Ritual" maxWidth={540}>
      {/* Wizard Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {['1. Review', '2. Rollover', '3. Gratitude', '4. Score'].map((label, idx) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '4px 0',
              textAlign: 'center',
              fontSize: 'var(--text-2xs)',
              fontWeight: step === idx + 1 ? 600 : 400,
              color: step === idx + 1 ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: step === idx + 1 ? '2px solid var(--accent-primary)' : '2px solid var(--border-hairline)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* STEP 1: Celebration & Review */}
      {step === 1 && (
        <div>
          <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Well Done! Day Completed.
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              You completed {completedTasks.length} out of {todayTasks.length} commitments today.
            </p>
          </div>

          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {todayTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  padding: '3px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2
                    size={13}
                    style={{
                      color: t.status === 'completed' ? 'var(--cat-admin-spine)' : 'var(--text-muted)',
                    }}
                  />
                  <span
                    style={{
                      textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                      color: t.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
                    }}
                  >
                    {t.title}
                  </span>
                </div>
                <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {t.durationMinutes}m
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep(2)}>
              Next: Clear & Rollover
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Clear & Rollover */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 2: Clear Loose Ends
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Roll unfinished tasks forward to tomorrow so your canvas is clean for tomorrow morning.
          </p>

          {incompleteTasks.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              ✓ Every single task was completed today! Nothing to roll over.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {incompleteTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span>{t.title}</span>
                  <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--signal-now)' }}>
                    Rollover #{ (t.rolloverCount || 0) + 1 }
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={handleRolloverIncomplete}>
              Rollover {incompleteTasks.length} Tasks to Tomorrow
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Daily Gratitude & Win */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 3: Daily Reflection & Win
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            What is one win, breakthrough, or moment of gratitude from today?
          </p>

          <textarea
            rows={4}
            value={gratitudeText}
            onChange={(e) => setGratitudeText(e.target.value)}
            placeholder="e.g. Unlocked the streaming audio pipeline without clicks. Smooth collaboration with the team."
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              marginBottom: 16,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep(4)}>
              Next: Rate Today
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Focus Score */}
      {step === 4 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 4: Energy & Focus Score
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 16 }}>
            How would you rate today's execution and deep work stamina?
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setFocusScore(score)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  border: focusScore === score ? '2px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  backgroundColor: focusScore === score ? 'var(--bg-active)' : 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {score}★
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(3)}>
              Back
            </Button>
            <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handleFinish}>
              Complete Evening Shutdown
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

