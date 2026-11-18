import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePlannerData } from './PlannerDataContext';
import { useToast } from '../components/ui/ToastManager';

const FocusSessionContext = createContext(null);

export function FocusSessionProvider({ children }) {
  const { tasks, updateTask, extendTask } = usePlannerData();
  const { showToast } = useToast();

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'short_break' | 'long_break' | 'flow'
  const [isRunning, setIsRunning] = useState(false);
  const [targetEndTimestamp, setTargetEndTimestamp] = useState(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(25 * 60 * 1000);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [ambientSound, setAmbientSound] = useState('off'); // 'rain' | 'whitenoise' | 'lofi' | 'off'
  const [volume, setVolume] = useState(0.6);
  const [scratchpadNote, setScratchpadNote] = useState('');

  // Active task object
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  // Drift-free remaining time calculation
  const [remainingMs, setRemainingMs] = useState(pausedRemainingMs);
  const timerIntervalRef = useRef(null);

  // Sync remainingMs with timer
  useEffect(() => {
    if (isRunning && targetEndTimestamp) {
      const updateClock = () => {
        const now = Date.now();
        const diff = targetEndTimestamp - now;
        if (diff <= 0) {
          setRemainingMs(0);
          setIsRunning(false);
          clearInterval(timerIntervalRef.current);
          showToast({ message: 'Focus interval completed! Time for a breath.' });
        } else {
          setRemainingMs(diff);
        }
      };

      updateClock();
      timerIntervalRef.current = setInterval(updateClock, 250);

      return () => clearInterval(timerIntervalRef.current);
    } else {
      setRemainingMs(pausedRemainingMs);
    }
  }, [isRunning, targetEndTimestamp, pausedRemainingMs, showToast]);

  // Handle visibility change (tab switching) to recalculate drift-free
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && isRunning && targetEndTimestamp) {
        const diff = targetEndTimestamp - Date.now();
        setRemainingMs(Math.max(0, diff));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, targetEndTimestamp]);

  // Track actual seconds spent on active task (accumulate in background)
  useEffect(() => {
    if (!isRunning || !activeTaskId) return;

    const interval = setInterval(() => {
      updateTask(
        activeTaskId,
        {
          actualSecondsSpent: (activeTask?.actualSecondsSpent || 0) + 1,
        },
        'Focus time tick'
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeTaskId, activeTask?.actualSecondsSpent, updateTask]);

  // Control actions
  const startFocus = useCallback(
    (task, durationMinutes = 25, newMode = 'pomodoro') => {
      setActiveTaskId(task.id);
      setMode(newMode);
      const ms = durationMinutes * 60 * 1000;
      const target = Date.now() + ms;
      setPausedRemainingMs(ms);
      setTargetEndTimestamp(target);
      setIsRunning(true);
      setIsFocusModalOpen(true);
      showToast({ message: `Started focus session: ${task.title}` });
    },
    [showToast]
  );

  const pauseFocus = useCallback(() => {
    if (isRunning && targetEndTimestamp) {
      const remaining = Math.max(0, targetEndTimestamp - Date.now());
      setPausedRemainingMs(remaining);
      setRemainingMs(remaining);
      setIsRunning(false);
      setTargetEndTimestamp(null);
    }
  }, [isRunning, targetEndTimestamp]);

  const resumeFocus = useCallback(() => {
    if (!isRunning && pausedRemainingMs > 0) {
      setTargetEndTimestamp(Date.now() + pausedRemainingMs);
      setIsRunning(true);
    }
  }, [isRunning, pausedRemainingMs]);

  const stopFocus = useCallback(() => {
    setIsRunning(false);
    setTargetEndTimestamp(null);
    setPausedRemainingMs(25 * 60 * 1000);
    setRemainingMs(25 * 60 * 1000);
    setActiveTaskId(null);
  }, []);

  const extendFocus = useCallback(
    (minutes = 15) => {
      const addMs = minutes * 60 * 1000;
      if (isRunning && targetEndTimestamp) {
        const nextTarget = targetEndTimestamp + addMs;
        setTargetEndTimestamp(nextTarget);
        setRemainingMs(nextTarget - Date.now());
      } else {
        const nextPaused = pausedRemainingMs + addMs;
        setPausedRemainingMs(nextPaused);
        setRemainingMs(nextPaused);
      }

      if (activeTaskId) {
        extendTask(activeTaskId, minutes);
      }
    },
    [isRunning, targetEndTimestamp, pausedRemainingMs, activeTaskId, extendTask]
  );

  const finishEarly = useCallback(() => {
    if (!activeTaskId || !activeTask) return;

    const actualMins = Math.max(5, Math.ceil((activeTask.actualSecondsSpent || 0) / 60));
    const savedMins = Math.max(0, activeTask.durationMinutes - actualMins);

    updateTask(activeTaskId, {
      status: 'completed',
      durationMinutes: actualMins,
    });

    stopFocus();
    setIsFocusModalOpen(false);

    if (savedMins >= 15) {
      showToast({
        message: `Finished ${savedMins}m early! Compact schedule and pull up?`,
        actionLabel: 'Pull Forward',
        onAction: () => {
          showToast({ message: 'Afternoon schedule compacted forward.' });
        },
      });
    } else {
      showToast({ message: `Task completed! Great focus session.` });
    }
  }, [activeTaskId, activeTask, updateTask, stopFocus, showToast]);

  const openFocusModal = useCallback(
    (task) => {
      if (task) {
        setActiveTaskId(task.id);
        const ms = (task.durationMinutes || 25) * 60 * 1000;
        setPausedRemainingMs(ms);
        setRemainingMs(ms);
      }
      setIsFocusModalOpen(true);
    },
    []
  );

  const closeFocusModal = useCallback(() => {
    setIsFocusModalOpen(false);
  }, []);

  return (
    <FocusSessionContext.Provider
      value={{
        activeTaskId,
        activeTask,
        mode,
        setMode,
        isRunning,
        remainingMs,
        targetEndTimestamp,
        startFocus,
        pauseFocus,
        resumeFocus,
        stopFocus,
        extendFocus,
        finishEarly,
        isPiPActive,
        setIsPiPActive,
        ambientSound,
        setAmbientSound,
        volume,
        setVolume,
        scratchpadNote,
        setScratchpadNote,
        isFocusModalOpen,
        openFocusModal,
        closeFocusModal,
      }}
    >
      {children}
    </FocusSessionContext.Provider>
  );
}

export function useFocusSession() {
  const context = useContext(FocusSessionContext);
  if (!context) {
    throw new Error('useFocusSession must be used within a FocusSessionProvider');
  }
  return context;
}

