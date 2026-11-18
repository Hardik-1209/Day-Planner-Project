import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { BacklogDrawer } from '../workspace/BacklogDrawer';
import { TimelineCanvas } from '../timeline/TimelineCanvas';
import { HabitTrackerRail } from '../workspace/HabitTrackerRail';
import { WeekRibbon } from '../timeline/WeekRibbon';

// Modals
import { MorningKickoffModal } from '../modals/MorningKickoffModal';
import { EveningShutdownModal } from '../modals/EveningShutdownModal';
import { AIBrainDumpModal } from '../modals/AIBrainDumpModal';
import { FocusModeModal } from '../modals/FocusModeModal';
import { AISettingsModal } from '../modals/AISettingsModal';
import { CommandPalette } from '../modals/CommandPalette';
import { AnalyticsModal } from '../modals/AnalyticsModal';
import { TaskEditModal } from '../modals/TaskEditModal';

export function AppShell() {
  const [isMorningKickoffOpen, setIsMorningKickoffOpen] = useState(false);
  const [isEveningShutdownOpen, setIsEveningShutdownOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+J / Ctrl+J, Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsBrainDumpOpen((v) => !v);
      } else if (cmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenMorningKickoff={() => setIsMorningKickoffOpen(true)}
        onOpenEveningShutdown={() => setIsEveningShutdownOpen(true)}
        onOpenBrainDump={() => setIsBrainDumpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* Left Backlog Drawer */}
      <BacklogDrawer onOpenBrainDump={() => setIsBrainDumpOpen(true)} />

      {/* Main Timeline View with Week Ribbon */}
      <main style={{ gridArea: 'main-canvas', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <WeekRibbon />
        <TimelineCanvas />
      </main>

      {/* Right Habit & Metric Rail */}
      <HabitTrackerRail
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* Modals & Dialogs */}
      <MorningKickoffModal
        isOpen={isMorningKickoffOpen}
        onClose={() => setIsMorningKickoffOpen(false)}
      />

      <EveningShutdownModal
        isOpen={isEveningShutdownOpen}
        onClose={() => setIsEveningShutdownOpen(false)}
      />

      <AIBrainDumpModal
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
      />

      <FocusModeModal />

      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenMorningKickoff={() => setIsMorningKickoffOpen(true)}
        onOpenEveningShutdown={() => setIsEveningShutdownOpen(true)}
        onOpenBrainDump={() => setIsBrainDumpOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <TaskEditModal />
    </div>
  );
}

