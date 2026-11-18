import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Mic,
  Play,
  Download,
  BarChart2,
  Calendar,
  Layers,
  Palette,
} from 'lucide-react';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useFocusSession } from '../../context/FocusSessionContext';
import { useTheme } from '../../context/ThemeContext';
import { autoScheduleDay, smartReshuffleDay } from '../../utils/autoScheduler';
import { downloadIcsFile } from '../../utils/icsHelper';
import { useToast } from '../ui/ToastManager';

export function CommandPalette({
  isOpen,
  onClose,
  onOpenMorningKickoff,
  onOpenEveningShutdown,
  onOpenBrainDump,
  onOpenAnalytics,
  onOpenSettings,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { tasks, setTasks, activeDate, setActiveDate, settings, undo } = usePlannerData();
  const { openFocusModal } = useFocusSession();
  const { setTheme, cycleTheme } = useTheme();
  const { showToast } = useToast();

  const commands = [
    {
      id: 'auto-schedule',
      title: 'Auto-Schedule Day',
      subtitle: 'Intelligent Circadian bin-packing with Morgen frames',
      icon: Sparkles,
      action: () => {
        const scheduled = autoScheduleDay(tasks, settings, activeDate);
        setTasks(scheduled, 'Auto-Schedule');
        showToast({ message: 'Auto-scheduled tasks into optimal slots' });
      },
    },
    {
      id: 'reshuffle',
      title: 'Reshuffle Flexible Tasks',
      subtitle: 'Re-align unpinned tasks around meetings',
      icon: RotateCcw,
      action: () => {
        const reshuffled = smartReshuffleDay(tasks, settings, activeDate);
        setTasks(reshuffled, 'Reshuffle');
        showToast({ message: 'Flexible schedule reshuffled' });
      },
    },
    {
      id: 'morning-kickoff',
      title: 'Start Morning Kickoff Ritual',
      subtitle: 'Backlog triage, Big Rocks, and intention setting',
      icon: Sun,
      action: onOpenMorningKickoff,
    },
    {
      id: 'evening-shutdown',
      title: 'Start Evening Shutdown Ritual',
      subtitle: 'Confetti review, rollovers, and gratitude score',
      icon: Moon,
      action: onOpenEveningShutdown,
    },
    {
      id: 'ramble',
      title: 'Voice Ramble Mode / Magic Capture',
      subtitle: 'Stream-of-consciousness speech-to-text task extraction',
      icon: Mic,
      shortcut: '⌘J',
      action: onOpenBrainDump,
    },
    {
      id: 'focus',
      title: 'Start Focus Mode Chamber',
      subtitle: 'Drift-free timer with ambient sound and PiP',
      icon: Play,
      action: () => {
        const first = tasks.find((t) => t.date === activeDate && t.status !== 'completed');
        openFocusModal(first);
      },
    },
    {
      id: 'export-ics',
      title: 'Export Day to .ics Calendar',
      subtitle: 'Download standard RFC 5545 calendar file',
      icon: Download,
      action: () => downloadIcsFile(tasks, activeDate),
    },
    {
      id: 'cycle-theme',
      title: 'Cycle Neutral Theme',
      subtitle: 'Switch between Warm Paper, Daylight, Obsidian, Graphite',
      icon: Palette,
      action: cycleTheme,
    },
    {
      id: 'theme-paper',
      title: 'Set Theme: Warm Paper',
      subtitle: 'Default Light (Radix Sand / Notion warm daylight)',
      icon: Palette,
      action: () => setTheme('paper'),
    },
    {
      id: 'theme-obsidian',
      title: 'Set Theme: Geist Obsidian',
      subtitle: 'Default Dark (Pure achromatic matte carbon)',
      icon: Palette,
      action: () => setTheme('obsidian'),
    },
    {
      id: 'today',
      title: 'Go to Today',
      subtitle: 'Reset timeline view to current calendar date',
      icon: Calendar,
      action: () => setActiveDate(new Date().toISOString().slice(0, 10)),
    },
    {
      id: 'analytics',
      title: 'Open Detailed Analytics Ledger',
      subtitle: 'Estimation calibration and Circadian stats',
      icon: BarChart2,
      action: onOpenAnalytics,
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden',
          animation: 'modalIn 100ms ease-out',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <kbd style={{ fontSize: '10px' }}>ESC</kbd>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={14} style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {cmd.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 1 }}>
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>

                  {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

