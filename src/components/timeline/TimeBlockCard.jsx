import React, { useState } from 'react';
import {
  Check,
  Pin,
  PinOff,
  Plus,
  Play,
  Scissors,
  Trash2,
  Clock,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { PIXELS_PER_MINUTE, formatMinutesToTime, formatDuration } from '../../utils/timeHelpers';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useFocusSession } from '../../context/FocusSessionContext';

export function TimeBlockCard({ task, style = {}, onDragStart }) {
  const { updateTask, deleteTask, extendTask, splitTask, toggleSubtask, openEditTaskModal } = usePlannerData();
  const { openFocusModal, activeTaskId, isRunning } = useFocusSession();

  const duration = task.durationMinutes || 30;
  const heightPx = Math.max(22, duration * PIXELS_PER_MINUTE - 2);
  const startMinutes = task.scheduledStartMinutes ?? 0;
  const endMinutes = startMinutes + duration;
  const isCompleted = task.status === 'completed';
  const isCurrentActive = activeTaskId === task.id && isRunning;

  // Category CSS variable naming
  let catKey = 'deep';
  if (task.category === 'meetings') catKey = 'meeting';
  else if (task.category === 'admin') catKey = 'admin';
  else if (task.category === 'personal') catKey = 'personal';
  else if (task.category === 'break') catKey = 'break';

  // Density tier: compact (<= 30m), standard (35m - 60m), deep (>= 75m)
  const isCompact = duration <= 30;
  const isStandard = duration > 30 && duration <= 60;
  const isDeep = duration >= 75;

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    updateTask(task.id, {
      status: isCompleted ? 'todo' : 'completed',
    });
  };

  const handleTogglePin = (e) => {
    e.stopPropagation();
    updateTask(task.id, {
      isPinned: !task.isPinned,
    });
  };

  const handleExtend = (e) => {
    e.stopPropagation();
    extendTask(task.id, 15);
  };

  const handleSplit = (e) => {
    e.stopPropagation();
    splitTask(task.id);
  };

  const handleFocus = (e) => {
    e.stopPropagation();
    openFocusModal(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    openEditTaskModal(task);
  };

  // Actual progress calculation
  const actualMinutes = Math.floor((task.actualSecondsSpent || 0) / 60);
  const progressRatio = Math.min(1, actualMinutes / duration);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  return (
    <div
      className={`time-block-card ${isCompleted ? 'is-completed' : ''} ${isCurrentActive ? 'is-active-session' : ''}`}
      draggable
      onDragStart={(e) => {
        if (onDragStart) onDragStart(e, task);
      }}
      onDoubleClick={handleEdit}
      style={{
        position: 'absolute',
        height: `${heightPx}px`,
        backgroundColor: `var(--cat-${catKey}-bg)`,
        borderLeft: `3px solid var(--cat-${catKey}-spine)`,
        color: `var(--cat-${catKey}-text)`,
        borderRadius: 'var(--radius-xs)',
        boxShadow: isCurrentActive
          ? '0 0 0 2px var(--signal-now), 0 4px 12px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        padding: isCompact ? '2px 6px' : '4px 8px',
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isCompleted ? 0.65 : 1,
        transition: 'opacity 120ms ease, box-shadow 120ms ease',
        ...style,
      }}
    >
      {/* 1. COMPACT MODE (duration <= 30m) */}
      {isCompact && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4, height: '100%' }}>
          <button
            type="button"
            onClick={handleToggleComplete}
            title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              border: `1px solid var(--cat-${catKey}-spine)`,
              backgroundColor: isCompleted ? `var(--cat-${catKey}-spine)` : 'transparent',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {isCompleted && <Check size={10} strokeWidth={3} />}
          </button>

          <span
            onClick={handleEdit}
            title={`${task.title} (Double-click to edit)`}
            style={{
              flex: 1,
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              textDecoration: isCompleted ? 'line-through' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {task.title}
          </span>

          <span
            className="tabular-nums"
            style={{
              fontSize: '10px',
              opacity: 0.85,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatMinutesToTime(startMinutes)}-{formatMinutesToTime(endMinutes)}
          </span>

          {/* Action buttons for compact cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 2 }}>
            <button
              type="button"
              onClick={handleExtend}
              title="+15m Extend"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 600,
                color: 'inherit',
                padding: '0 2px',
                lineHeight: 1,
              }}
            >
              +15m
            </button>
            <button
              type="button"
              onClick={handleTogglePin}
              title={task.isPinned ? 'Unpin' : 'Pin event'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: '1px',
                opacity: task.isPinned ? 1 : 0.6,
                display: 'flex',
              }}
            >
              {task.isPinned ? <Pin size={10} /> : <PinOff size={10} />}
            </button>
            <button
              type="button"
              onClick={handleFocus}
              title="Start Focus"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: '1px',
                display: 'flex',
              }}
            >
              <Play size={10} />
            </button>
            <button
              type="button"
              onClick={handleEdit}
              title="Edit Task"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: '1px',
                display: 'flex',
                opacity: 0.8,
              }}
            >
              <Pencil size={10} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title="Delete Task"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: '1px',
                display: 'flex',
                opacity: 0.7,
              }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}

      {/* 2. STANDARD MODE (duration 35m - 60m) */}
      {isStandard && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleToggleComplete}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: `1px solid var(--cat-${catKey}-spine)`,
                backgroundColor: isCompleted ? `var(--cat-${catKey}-spine)` : 'transparent',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            >
              {isCompleted && <Check size={10} strokeWidth={3} />}
            </button>

            <span
              onClick={handleEdit}
              title={`${task.title} (Click to edit)`}
              style={{
                flex: 1,
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: isCompleted ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {task.title}
            </span>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                onClick={handleExtend}
                title="+15m Extend"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 600,
                  color: 'inherit',
                  padding: '1px 3px',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                +15m
              </button>
              <button
                type="button"
                onClick={handleTogglePin}
                title={task.isPinned ? 'Unpin' : 'Pin event'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '1px 3px',
                  opacity: task.isPinned ? 1 : 0.6,
                }}
              >
                {task.isPinned ? <Pin size={11} /> : <PinOff size={11} />}
              </button>
              <button
                type="button"
                onClick={handleSplit}
                title="Split into 2 parts"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '1px 3px',
                }}
              >
                <Scissors size={11} />
              </button>
              <button
                type="button"
                onClick={handleFocus}
                title="Focus Mode"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '1px 3px',
                }}
              >
                <Play size={11} />
              </button>
              <button
                type="button"
                onClick={handleEdit}
                title="Edit Task"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '1px 3px',
                  opacity: 0.8,
                }}
              >
                <Pencil size={11} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Delete task"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '1px 3px',
                  opacity: 0.7,
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          {/* Bottom metadata row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-2xs)', opacity: 0.85 }}>
            <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatMinutesToTime(startMinutes)} - {formatMinutesToTime(endMinutes)} ({duration}m)
            </span>
            <span>·</span>
            <span style={{ textTransform: 'capitalize' }}>{task.category.replace('_', ' ')}</span>
            {task.isBigRock && <span style={{ fontWeight: 600 }}>· ★ Big Rock</span>}
            {subtasks.length > 0 && (
              <>
                <span>·</span>
                <span className="tabular-nums">
                  {completedSubtasks}/{subtasks.length} Subtasks
                </span>
              </>
            )}
            {task.rolloverCount >= 2 && (
              <span
                style={{
                  backgroundColor: 'rgba(229, 77, 46, 0.15)',
                  color: 'var(--signal-now)',
                  padding: '0 4px',
                  borderRadius: 2,
                  fontWeight: 600,
                  marginLeft: 'auto',
                }}
              >
                {task.rolloverCount}×
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. DEEP BLOCK MODE (duration >= 75m) */}
      {isDeep && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            {/* Row 1: Title and actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <button
                type="button"
                onClick={handleToggleComplete}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: `1px solid var(--cat-${catKey}-spine)`,
                  backgroundColor: isCompleted ? `var(--cat-${catKey}-spine)` : 'transparent',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {isCompleted && <Check size={10} strokeWidth={3} />}
              </button>

              <span
                onClick={handleEdit}
                title={`${task.title} (Click to edit)`}
                style={{
                  flex: 1,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  cursor: 'pointer',
                }}
              >
                {task.title}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  type="button"
                  onClick={handleExtend}
                  title="+15m Extend & Push"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 600,
                    color: 'inherit',
                    padding: '1px 3px',
                  }}
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={handleTogglePin}
                  title={task.isPinned ? 'Unpin' : 'Pin event'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '1px 3px',
                    opacity: task.isPinned ? 1 : 0.6,
                  }}
                >
                  {task.isPinned ? <Pin size={11} /> : <PinOff size={11} />}
                </button>
                <button
                  type="button"
                  onClick={handleSplit}
                  title="Split into 2 parts"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '1px 3px',
                  }}
                >
                  <Scissors size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleFocus}
                  title="Focus mode"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '1px 3px',
                  }}
                >
                  <Play size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  title="Edit task"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '1px 3px',
                    opacity: 0.8,
                  }}
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete block"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: '1px 3px',
                    opacity: 0.7,
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {/* Row 2: Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-2xs)', opacity: 0.85 }}>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatMinutesToTime(startMinutes)} - {formatMinutesToTime(endMinutes)} ({duration}m)
              </span>
              <span>·</span>
              <span style={{ textTransform: 'capitalize' }}>{task.category.replace('_', ' ')}</span>
              {task.partLabel && <span>· Part {task.partLabel}</span>}
              {task.isBigRock && (
                <span
                  style={{
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-canvas)',
                    padding: '0 4px',
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  ★ Big Rock
                </span>
              )}
            </div>

            {/* Row 3: Interactive subtask list */}
            {subtasks.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {subtasks.slice(0, 4).map((st) => (
                  <div
                    key={st.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtask(task.id, st.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 'var(--text-2xs)',
                      cursor: 'pointer',
                      opacity: st.completed ? 0.6 : 0.95,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        border: `1px solid var(--cat-${catKey}-spine)`,
                        backgroundColor: st.completed ? `var(--cat-${catKey}-spine)` : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                      }}
                    >
                      {st.completed && <Check size={8} strokeWidth={3} />}
                    </div>
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: Estimation calibration progress bar */}
          <div style={{ marginTop: 6, width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                opacity: 0.75,
                marginBottom: 2,
              }}
            >
              <span>{actualMinutes}m actual</span>
              <span>{duration}m planned</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 3,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressRatio * 100}%`,
                  backgroundColor: `var(--cat-${catKey}-spine)`,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
