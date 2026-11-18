import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage, SCHEMA_VERSION } from '../hooks/useLocalStorage';
import { useHistoryStack } from '../hooks/useHistoryStack';
import { useToast } from '../components/ui/ToastManager';
import { SEED_TASKS, SEED_HABITS, SEED_BLUEPRINTS, DEFAULT_SETTINGS } from '../utils/seedData';

const PlannerDataContext = createContext(null);

export function PlannerDataProvider({ children }) {
  const { showToast } = useToast();

  // Low frequency persistent storage
  const [storedData, setStoredData] = useLocalStorage('chronos_flow_data', () => ({
    tasks: SEED_TASKS,
    habits: SEED_HABITS,
    blueprints: SEED_BLUEPRINTS,
    dailyLogs: {},
    settings: DEFAULT_SETTINGS,
  }));

  // Non-persistent UI state: active date ("YYYY-MM-DD") and horizon mode ("1D" | "3D")
  const [activeDate, setActiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [horizonMode, setHorizonMode] = useState('1D');
  const [editingTask, setEditingTask] = useState(null);

  const openEditTaskModal = useCallback((task) => {
    setEditingTask(task);
  }, []);

  const closeEditTaskModal = useCallback(() => {
    setEditingTask(null);
  }, []);

  // History stack for undo/redo on tasks mutations
  const handleUndoRedoToast = useCallback((msg) => {
    showToast({ message: msg, duration: 3000 });
  }, [showToast]);

  const {
    state: tasks,
    setState: setTasksDirectly,
    pushState: pushTasksState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryStack(storedData.tasks || SEED_TASKS, handleUndoRedoToast);

  // Sync tasks changes back to persistent storage
  useEffect(() => {
    setStoredData((prev) => ({
      ...prev,
      tasks,
    }));
  }, [tasks, setStoredData]);

  // Tasks Mutations with Undo Support
  const setTasks = useCallback(
    (newTasksOrUpdater, actionLabel = 'Update schedule') => {
      if (typeof newTasksOrUpdater === 'function') {
        const next = newTasksOrUpdater(tasks);
        pushTasksState(next, actionLabel);
      } else {
        pushTasksState(newTasksOrUpdater, actionLabel);
      }
    },
    [tasks, pushTasksState]
  );

  const addTask = useCallback(
    (taskData, actionLabel = 'Add task') => {
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: taskData.title || 'Untitled Task',
        date: taskData.date || activeDate,
        durationMinutes: taskData.durationMinutes || 30,
        actualSecondsSpent: 0,
        scheduledStartMinutes: taskData.scheduledStartMinutes ?? null,
        isPinned: taskData.isPinned || false,
        isBigRock: taskData.isBigRock || false,
        isSplittable: taskData.isSplittable ?? true,
        priority: taskData.priority || 'q2_schedule',
        category: taskData.category || 'deep_work',
        energyType: taskData.energyType || 'deep',
        status: taskData.status || 'todo',
        subtasks: taskData.subtasks || [],
        notes: taskData.notes || '',
        rolloverCount: taskData.rolloverCount || 0,
        createdAt: Date.now(),
        ...taskData,
      };

      const next = [newTask, ...tasks];
      pushTasksState(next, actionLabel);
      showToast({
        message: `Added "${newTask.title}"`,
        actionLabel: 'Undo',
        onAction: undo,
      });
      return newTask;
    },
    [tasks, activeDate, pushTasksState, showToast, undo]
  );

  const updateTask = useCallback(
    (taskId, updates, actionLabel = 'Edit task') => {
      const next = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      pushTasksState(next, actionLabel);
    },
    [tasks, pushTasksState]
  );

  const deleteTask = useCallback(
    (taskId, actionLabel = 'Delete task') => {
      const target = tasks.find((t) => t.id === taskId);
      const next = tasks.filter((t) => t.id !== taskId);
      pushTasksState(next, actionLabel);
      if (target) {
        showToast({
          message: `Deleted "${target.title}"`,
          actionLabel: 'Undo',
          onAction: undo,
        });
      }
    },
    [tasks, pushTasksState, showToast, undo]
  );

  const scheduleTask = useCallback(
    (taskId, scheduledStartMinutes, durationMinutes, targetDate) => {
      const next = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            scheduledStartMinutes,
            durationMinutes: durationMinutes ?? t.durationMinutes,
            date: targetDate || activeDate,
          };
        }
        return t;
      });
      pushTasksState(next, 'Schedule task');
    },
    [tasks, activeDate, pushTasksState]
  );

  const unscheduleTask = useCallback(
    (taskId) => {
      const next = tasks.map((t) =>
        t.id === taskId ? { ...t, scheduledStartMinutes: null } : t
      );
      pushTasksState(next, 'Move to backlog');
    },
    [tasks, pushTasksState]
  );

  const toggleSubtask = useCallback(
    (taskId, subtaskId) => {
      const next = tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      });
      pushTasksState(next, 'Toggle subtask');
    },
    [tasks, pushTasksState]
  );

  const splitTask = useCallback(
    (taskId) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.durationMinutes < 30) return;

      const part1Duration = Math.round(target.durationMinutes / 2 / 15) * 15 || 15;
      const part2Duration = target.durationMinutes - part1Duration;
      const part2Id = `${target.id}-part-2`;

      const part1 = {
        ...target,
        durationMinutes: part1Duration,
        partLabel: '1/2',
      };

      const part2 = {
        ...target,
        id: part2Id,
        title: `${target.title} (Part 2)`,
        durationMinutes: part2Duration,
        scheduledStartMinutes: target.scheduledStartMinutes
          ? target.scheduledStartMinutes + part1Duration
          : null,
        parentTaskId: target.id,
        partLabel: '2/2',
        dependsOnTaskId: target.id,
        subtasks: [],
      };

      const next = tasks.map((t) => (t.id === taskId ? part1 : t)).concat(part2);
      pushTasksState(next, `Split "${target.title}"`);
      showToast({ message: `Split task into 2 parts (${part1Duration}m & ${part2Duration}m)` });
    },
    [tasks, pushTasksState, showToast]
  );

  // Extend active task by 15 mins and cascade subsequent unpinned tasks
  const extendTask = useCallback(
    (taskId, minutes = 15) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const targetStart = target.scheduledStartMinutes;
      const oldDuration = target.durationMinutes;
      const newDuration = oldDuration + minutes;

      const next = tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, durationMinutes: newDuration };
        }
        // Cascade unpinned tasks that were scheduled at or after the old end of this task
        if (
          targetStart !== null &&
          t.date === target.date &&
          t.scheduledStartMinutes !== null &&
          !t.isPinned &&
          t.scheduledStartMinutes >= targetStart + oldDuration
        ) {
          return {
            ...t,
            scheduledStartMinutes: t.scheduledStartMinutes + minutes,
          };
        }
        return t;
      });

      pushTasksState(next, `+${minutes}m Extend & Push`);
      showToast({
        message: `+${minutes}m added to task — afternoon schedule adjusted`,
        actionLabel: 'Undo',
        onAction: undo,
      });
    },
    [tasks, pushTasksState, showToast, undo]
  );

  // Settings
  const settings = storedData.settings || DEFAULT_SETTINGS;
  const updateSettings = useCallback(
    (newSettings) => {
      setStoredData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    [setStoredData]
  );

  // Habits
  const habits = storedData.habits || SEED_HABITS;
  const toggleHabit = useCallback(
    (habitId, dateStr) => {
      const targetDate = dateStr || activeDate;
      setStoredData((prev) => {
        const nextHabits = (prev.habits || SEED_HABITS).map((h) => {
          if (h.id === habitId) {
            const hasCompleted = (h.completedDates || []).includes(targetDate);
            const nextDates = hasCompleted
              ? h.completedDates.filter((d) => d !== targetDate)
              : [...(h.completedDates || []), targetDate];
            const nextStreak = hasCompleted ? Math.max(0, h.streak - 1) : h.streak + 1;
            return { ...h, completedDates: nextDates, streak: nextStreak };
          }
          return h;
        });
        return { ...prev, habits: nextHabits };
      });
    },
    [activeDate, setStoredData]
  );

  // Blueprints
  const blueprints = storedData.blueprints || SEED_BLUEPRINTS;
  const applyBlueprint = useCallback(
    (blueprintId, targetDate) => {
      const dateToApply = targetDate || activeDate;
      const bp = blueprints.find((b) => b.id === blueprintId);
      if (!bp) return;

      const newTasks = bp.templateBlocks.map((block, idx) => ({
        id: `bp-${blueprintId}-${Date.now()}-${idx}`,
        title: block.title,
        date: dateToApply,
        durationMinutes: block.durationMinutes,
        actualSecondsSpent: 0,
        scheduledStartMinutes: block.scheduledStartMinutes,
        isPinned: block.isPinned,
        isBigRock: false,
        isSplittable: false,
        rolloverCount: 0,
        priority: 'q2_schedule',
        category: block.category,
        energyType: block.energyType,
        status: 'todo',
        subtasks: [],
        notes: `Applied from blueprint: ${bp.name}`,
        createdAt: Date.now(),
      }));

      const next = [...tasks, ...newTasks];
      pushTasksState(next, `Apply "${bp.name}" Blueprint`);
      showToast({
        message: `Applied "${bp.name}" blueprint with ${newTasks.length} blocks`,
        actionLabel: 'Undo',
        onAction: undo,
      });
    },
    [blueprints, activeDate, tasks, pushTasksState, showToast, undo]
  );

  // Daily Logs (Morning intention, evening gratitude, scores)
  const dailyLogs = storedData.dailyLogs || {};
  const updateDailyLog = useCallback(
    (dateStr, logData) => {
      setStoredData((prev) => ({
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [dateStr]: {
            ...(prev.dailyLogs?.[dateStr] || {}),
            ...logData,
            updatedAt: Date.now(),
          },
        },
      }));
    },
    [setStoredData]
  );

  // Backup and restore
  const exportBackup = useCallback(() => {
    const backup = {
      _schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      habits,
      blueprints,
      dailyLogs,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Backup exported successfully' });
  }, [tasks, habits, blueprints, dailyLogs, settings, showToast]);

  const importBackup = useCallback(
    (jsonContent) => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          pushTasksState(parsed.tasks, 'Import backup');
          setStoredData((prev) => ({
            ...prev,
            habits: parsed.habits || prev.habits,
            blueprints: parsed.blueprints || prev.blueprints,
            dailyLogs: parsed.dailyLogs || prev.dailyLogs,
            settings: parsed.settings || prev.settings,
          }));
          showToast({ message: 'Backup restored successfully' });
          return true;
        }
      } catch (err) {
        showToast({ message: 'Failed to import backup: invalid JSON format' });
      }
      return false;
    },
    [pushTasksState, setStoredData, showToast]
  );

  const value = useMemo(
    () => ({
      tasks,
      activeDate,
      setActiveDate,
      horizonMode,
      setHorizonMode,
      settings,
      updateSettings,
      habits,
      toggleHabit,
      blueprints,
      applyBlueprint,
      dailyLogs,
      updateDailyLog,
      addTask,
      updateTask,
      deleteTask,
      setTasks,
      scheduleTask,
      unscheduleTask,
      splitTask,
      extendTask,
      toggleSubtask,
      editingTask,
      openEditTaskModal,
      closeEditTaskModal,
      undo,
      redo,
      canUndo,
      canRedo,
      exportBackup,
      importBackup,
    }),
    [
      tasks,
      activeDate,
      horizonMode,
      editingTask,
      openEditTaskModal,
      closeEditTaskModal,
      settings,
      updateSettings,
      habits,
      toggleHabit,
      blueprints,
      applyBlueprint,
      dailyLogs,
      updateDailyLog,
      addTask,
      updateTask,
      deleteTask,
      setTasks,
      scheduleTask,
      unscheduleTask,
      splitTask,
      extendTask,
      toggleSubtask,
      undo,
      redo,
      canUndo,
      canRedo,
      exportBackup,
      importBackup,
    ]
  );

  return <PlannerDataContext.Provider value={value}>{children}</PlannerDataContext.Provider>;
}

export function usePlannerData() {
  const context = useContext(PlannerDataContext);
  if (!context) {
    throw new Error('usePlannerData must be used within a PlannerDataProvider');
  }
  return context;
}

