import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Mic,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Download,
  Share2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useFocusSession } from '../../context/FocusSessionContext';
import { autoScheduleDay, smartReshuffleDay } from '../../utils/autoScheduler';
import { downloadIcsFile } from '../../utils/icsHelper';
import { useToast } from '../ui/ToastManager';

export function Header({
  onOpenMorningKickoff,
  onOpenEveningShutdown,
  onOpenBrainDump,
  onOpenSettings,
  onOpenCommandPalette,
  onOpenAnalytics,
}) {
  const { theme, setTheme, cycleTheme, currentThemeMeta } = useTheme();
  const {
    tasks,
    setTasks,
    activeDate,
    setActiveDate,
    horizonMode,
    setHorizonMode,
    settings,
    undo,
    canUndo,
  } = usePlannerData();
  const { openFocusModal, isRunning } = useFocusSession();
  const { showToast } = useToast();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  // Date navigation
  const handlePrevDay = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() - 1);
    setActiveDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + 1);
    setActiveDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setActiveDate(new Date().toISOString().slice(0, 10));
  };

  const formattedDate = new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isToday = activeDate === new Date().toISOString().slice(0, 10);

  // Auto-schedule action
  const handleAutoSchedule = () => {
    const scheduled = autoScheduleDay(tasks, settings, activeDate);
    setTasks(scheduled, 'Auto-Schedule Day');
    showToast({
      message: 'Backlog tasks automatically packed into optimal Circadian windows',
      actionLabel: 'Undo',
      onAction: undo,
    });
  };

  const handleReshuffle = () => {
    const reshuffled = smartReshuffleDay(tasks, settings, activeDate);
    setTasks(reshuffled, 'Reshuffle Day');
    showToast({
      message: 'Day reshuffled around pinned events',
      actionLabel: 'Undo',
      onAction: undo,
    });
  };

  const handleExportIcs = () => {
    downloadIcsFile(tasks, activeDate);
    showToast({ message: `Exported ${activeDate} schedule to .ics` });
  };

  return (
    <header className="app-header">
      {/* Left section: App Brand & Date Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: 'var(--signal-now)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', letterSpacing: '-0.02em' }}>
            Chronos Flow
          </span>
        </div>

        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-hairline)' }} />

        {/* Date Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Button variant="ghost" size="xs" onClick={handleToday} disabled={isToday}>
            Today
          </Button>
          <Button variant="ghost" size="xs" icon={ChevronLeft} onClick={handlePrevDay} title="Previous day" />
          <span
            className="tabular-nums"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: '0 4px',
              minWidth: 100,
              textAlign: 'center',
            }}
          >
            {formattedDate}
          </span>
          <Button variant="ghost" size="xs" icon={ChevronRight} onClick={handleNextDay} title="Next day" />
        </div>

        {/* Horizon switcher (1D / 3D) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: 1,
          }}
        >
          <button
            type="button"
            className="btn btn-xs"
            style={{
              border: 'none',
              backgroundColor: horizonMode === '1D' ? 'var(--bg-elevated)' : 'transparent',
              color: horizonMode === '1D' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: horizonMode === '1D' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              fontWeight: 500,
            }}
            onClick={() => setHorizonMode('1D')}
          >
            1D
          </button>
          <button
            type="button"
            className="btn btn-xs"
            style={{
              border: 'none',
              backgroundColor: horizonMode === '3D' ? 'var(--bg-elevated)' : 'transparent',
              color: horizonMode === '3D' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: horizonMode === '3D' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              fontWeight: 500,
            }}
            onClick={() => setHorizonMode('3D')}
          >
            3D
          </button>
        </div>
      </div>

      {/* Center section: Daily Ritual Quick Triggers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button
          variant="ghost"
          size="sm"
          icon={Sun}
          onClick={onOpenMorningKickoff}
          title="Morning Kickoff Ritual"
        >
          Kickoff
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={Moon}
          onClick={onOpenEveningShutdown}
          title="Evening Shutdown Ritual"
        >
          Shutdown
        </Button>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-hairline)' }} />
        <Button
          variant="ghost"
          size="sm"
          icon={Mic}
          onClick={onOpenBrainDump}
          title="Voice Ramble Mode / Magic Capture (Cmd+J)"
        >
          Ramble <kbd style={{ marginLeft: 4 }}>⌘J</kbd>
        </Button>
      </div>

      {/* Right section: Primary Actions, Focus, Themes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={handleReshuffle}
          title="Smart Reshuffle around pinned blocks"
        >
          Reshuffle
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={handleAutoSchedule}
          title="Intelligent Circadian bin-packing"
        >
          Auto-Schedule
        </Button>

        <Button
          variant={isRunning ? 'primary' : 'secondary'}
          size="sm"
          icon={Play}
          onClick={() => {
            const firstTask = tasks.find((t) => t.date === activeDate && t.status !== 'completed');
            openFocusModal(firstTask);
          }}
          title="Open Focus Mode & Ambient Audio"
        >
          Focus
        </Button>

        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-hairline)' }} />

        {/* 1-Click .ics Export */}
        <Button
          variant="ghost"
          size="sm"
          icon={Download}
          onClick={handleExportIcs}
          title="Export schedule as standard RFC 5545 .ics"
        />

        {/* Theme Selector Popover */}
        <div style={{ position: 'relative' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setThemeDropdownOpen((v) => !v)}
            title={`Current Theme: ${currentThemeMeta.label}`}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: currentThemeMeta.mode === 'dark' ? '#EDEDEF' : '#161615',
                border: '1px solid var(--border-hairline)',
                display: 'inline-block',
                marginRight: 4,
              }}
            />
            {currentThemeMeta.label}
          </Button>

          {themeDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-menu)',
                padding: 4,
                width: 170,
                zIndex: 100,
              }}
            >
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setThemeDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: theme === t.id ? 'var(--bg-active)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: t.mode === 'dark' ? '#EDEDEF' : '#161615',
                      }}
                    />
                    <span>{t.label}</span>
                  </div>
                  {theme === t.id && <span style={{ fontSize: 10 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings button */}
        <Button variant="ghost" size="sm" icon={Sliders} onClick={onOpenSettings} title="Settings" />
      </div>
    </header>
  );
}

