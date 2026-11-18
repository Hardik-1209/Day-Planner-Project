import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useToast } from '../ui/ToastManager';
import { decomposeTaskWithAI } from '../../services/aiService';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Flame,
  AlertTriangle,
  Scissors,
  Bookmark,
} from 'lucide-react';

export function MorningKickoffModal({ isOpen, onClose }) {
  const {
    tasks,
    updateTask,
    activeDate,
    settings,
    dailyLogs,
    updateDailyLog,
  } = usePlannerData();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Triage/Aging -> 2: Big Rocks -> 3: Capacity -> 4: Intention
  const [intentionText, setIntentionText] = useState(
    dailyLogs[activeDate]?.intention || ''
  );
  const [isDecomposing, setIsDecomposing] = useState(false);

  // Tasks with chronic rollover >= 3
  const chronicRolloverTasks = tasks.filter(
    (t) => t.rolloverCount >= 3 && t.status !== 'completed' && t.status !== 'deferred'
  );

  // Today's scheduled or active tasks
  const todayTasks = tasks.filter((t) => t.date === activeDate && t.status !== 'deferred');
  const bigRocks = todayTasks.filter((t) => t.isBigRock);

  // Workload Barometer math
  const plannedMinutes = todayTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const workHoursAvailable = ((settings?.workdayEndMinutes ?? 1080) - (settings?.workdayStartMinutes ?? 510)) / 60;
  const plannedHours = (plannedMinutes / 60).toFixed(1);
  const isOvercapacity = plannedMinutes > workHoursAvailable * 60;

  // Interventions for chronic rollovers
  const handleAiDecompose = async (task) => {
    setIsDecomposing(true);
    try {
      const steps = await decomposeTaskWithAI({
        taskTitle: task.title,
        provider: settings?.aiProvider,
        apiKey: settings?.groqApiKey || settings?.geminiApiKey,
      });

      updateTask(task.id, {
        subtasks: steps.map((s) => ({ id: s.id, title: s.title, completed: false })),
        durationMinutes: 45,
        rolloverCount: 0,
      });

      showToast({ message: `Broke "${task.title}" into ${steps.length} manageable steps!` });
    } catch (e) {
      showToast({ message: 'Failed to decompose task' });
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleShrinkStarter = (task) => {
    updateTask(task.id, {
      durationMinutes: 15,
      rolloverCount: 0,
    });
    showToast({ message: `Shrunk "${task.title}" to a 15m starter block!` });
  };

  const handleDropToSomeday = (task) => {
    updateTask(task.id, {
      priority: 'q4_eliminate',
      scheduledStartMinutes: null,
      rolloverCount: 0,
    });
    showToast({ message: `Moved "${task.title}" to Someday Backlog.` });
  };

  const handleToggleBigRock = (task) => {
    if (!task.isBigRock && bigRocks.length >= 3) {
      showToast({ message: 'Maximum 3 Big Rocks recommended per day.' });
      return;
    }
    updateTask(task.id, { isBigRock: !task.isBigRock });
  };

  const handleFinish = () => {
    updateDailyLog(activeDate, { intention: intentionText });
    showToast({ message: 'Morning Kickoff complete. You are ready to execute!' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Morning Kickoff Ritual" maxWidth={560}>
      {/* Wizard Progress Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {['1. Triage', '2. Big Rocks', '3. Capacity', '4. Intention'].map((label, idx) => (
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

      {/* STEP 1: Anti-Procrastination Triage */}
      {step === 1 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 1: Confront Chronic Rollovers
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Tasks rolled over 3+ times create silent cognitive baggage. Let's make them frictionless.
          </p>

          {chronicRolloverTasks.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              ✓ No chronic rollover tasks! Your backlog is fresh and clean.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chronicRolloverTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} style={{ color: 'var(--signal-now)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{t.title}</span>
                    </div>
                    <span
                      className="badge tabular-nums"
                      style={{ backgroundColor: 'rgba(229, 77, 46, 0.12)', color: 'var(--signal-now)' }}
                    >
                      Rolled {t.rolloverCount}×
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Sparkles}
                      disabled={isDecomposing}
                      onClick={() => handleAiDecompose(t)}
                    >
                      AI Break Into 15m Steps
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Scissors}
                      onClick={() => handleShrinkStarter(t)}
                    >
                      Shrink to 15m Starter Block
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Bookmark}
                      onClick={() => handleDropToSomeday(t)}
                    >
                      Drop to Someday
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep(2)}>
              Next: Big Rocks
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose 3 Big Rocks */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 2: Choose Up to 3 Big Rocks
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            If you could only accomplish 3 meaningful things today, what must get done?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
            {todayTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleToggleBigRock(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: t.isBigRock ? 'var(--bg-active)' : 'var(--bg-canvas)',
                  border: t.isBigRock ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '14px', color: t.isBigRock ? 'var(--signal-now)' : 'var(--text-muted)' }}>
                    ★
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: t.isBigRock ? 600 : 400 }}>
                    {t.title}
                  </span>
                </div>
                <span className="tabular-nums" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                  {t.durationMinutes}m
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep(3)}>
              Next: Workload Barometer
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Workload Barometer */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 3: Workload Capacity Barometer
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Compare planned commitments against available daytime bandwidth.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
              <span>Planned Hours: <strong>{plannedHours}h</strong></span>
              <span>Available Workday: <strong>{workHoursAvailable}h</strong></span>
            </div>

            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: 'var(--bg-panel)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (plannedMinutes / (workHoursAvailable * 60)) * 100)}%`,
                  backgroundColor: isOvercapacity ? 'var(--signal-now)' : 'var(--cat-admin-spine)',
                  borderRadius: 4,
                }}
              />
            </div>

            {isOvercapacity && (
              <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--signal-now)' }}>
                ⚠ You have planned {plannedHours}h for an {workHoursAvailable}h workday window. Consider deferring lower-priority items.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => setStep(4)}>
              Next: Set Daily Intention
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Daily Intention */}
      {step === 4 && (
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>
            Step 4: Prime Your Daily Intention
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            What is the mindset or single north star guiding today's focus?
          </p>

          <textarea
            rows={4}
            value={intentionText}
            onChange={(e) => setIntentionText(e.target.value)}
            placeholder="e.g. Protect deep work blocks, ship the core auth architecture, leave on time for a run."
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
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(3)}>
              Back
            </Button>
            <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handleFinish}>
              Lock In Day & Start
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

