import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useToast } from '../ui/ToastManager';
import {
  Clock,
  Calendar,
  Tag,
  Star,
  Pin,
  Trash2,
  Plus,
  Check,
  X,
  Layers,
  Zap,
} from 'lucide-react';
import { formatMinutesToTime } from '../../utils/timeHelpers';

const CATEGORIES = [
  { key: 'deep_work', label: 'Deep Work' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'admin', label: 'Admin' },
  { key: 'personal', label: 'Personal' },
  { key: 'break', label: 'Break' },
];

const PRIORITIES = [
  { key: 'q1_do_first', label: 'Q1 · Do First' },
  { key: 'q2_schedule', label: 'Q2 · Schedule' },
  { key: 'q3_delegate', label: 'Q3 · Delegate' },
  { key: 'q4_eliminate', label: 'Q4 · Eliminate' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function TaskEditModal() {
  const { editingTask, closeEditTaskModal, updateTask, deleteTask, unscheduleTask } = usePlannerData();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('deep_work');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [date, setDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledStartMinutes, setScheduledStartMinutes] = useState(540);
  const [priority, setPriority] = useState('q2_schedule');
  const [energyType, setEnergyType] = useState('deep');
  const [isBigRock, setIsBigRock] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Sync internal state when editingTask opens
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setCategory(editingTask.category || 'deep_work');
      setDurationMinutes(editingTask.durationMinutes || 30);
      setDate(editingTask.date || new Date().toISOString().slice(0, 10));
      setIsScheduled(editingTask.scheduledStartMinutes !== null && editingTask.scheduledStartMinutes !== undefined);
      setScheduledStartMinutes(editingTask.scheduledStartMinutes ?? 540);
      setPriority(editingTask.priority || 'q2_schedule');
      setEnergyType(editingTask.energyType || 'deep');
      setIsBigRock(!!editingTask.isBigRock);
      setIsPinned(!!editingTask.isPinned);
      setSubtasks(editingTask.subtasks ? [...editingTask.subtasks] : []);
      setNotes(editingTask.notes || '');
      setNewSubtaskTitle('');
    }
  }, [editingTask]);

  if (!editingTask) return null;

  // Convert minutes to HH:MM string for input
  const minutesToTimeString = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert HH:MM string back to minutes
  const timeStringToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({ message: 'Task title cannot be empty' });
      return;
    }

    updateTask(
      editingTask.id,
      {
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes) || 30,
        date,
        scheduledStartMinutes: isScheduled ? Number(scheduledStartMinutes) : null,
        priority,
        energyType,
        isBigRock,
        isPinned,
        subtasks,
        notes,
      },
      `Edit "${title.trim()}"`
    );

    showToast({ message: `Updated "${title.trim()}"` });
    closeEditTaskModal();
  };

  const handleDelete = () => {
    deleteTask(editingTask.id);
    closeEditTaskModal();
  };

  const handleUnschedule = () => {
    unscheduleTask(editingTask.id);
    closeEditTaskModal();
    showToast({ message: `Moved "${title}" to backlog` });
  };

  const endMinutes = scheduledStartMinutes + (Number(durationMinutes) || 30);

  return (
    <Modal isOpen={!!editingTask} onClose={closeEditTaskModal} title="Edit Task Details" maxWidth={560}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title Input */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architect state layer"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Selection */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Category
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xs)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span className={`cat-dot cat-dot-${cat.key}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Selection */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Duration (Minutes)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setDurationMinutes(dur)}
                className="tabular-nums"
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: durationMinutes === dur ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  backgroundColor: durationMinutes === dur ? 'var(--bg-active)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  fontWeight: durationMinutes === dur ? 600 : 400,
                }}
              >
                {dur}m
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="tabular-nums"
                style={{
                  width: '60px',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-hairline)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  textAlign: 'right',
                }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>min</span>
            </div>
          </div>
        </div>

        {/* Scheduling & Date Settings */}
        <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: 10, backgroundColor: 'var(--bg-canvas)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Schedule on Timeline Canvas
            </label>
            {!isScheduled && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Will sit in Backlog
              </span>
            )}
          </div>

          {isScheduled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Start Time</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="time"
                    step="900"
                    value={minutesToTimeString(scheduledStartMinutes)}
                    onChange={(e) => setScheduledStartMinutes(timeStringToMinutes(e.target.value))}
                    className="tabular-nums"
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-xs)',
                    }}
                  />
                  <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    to {formatMinutesToTime(endMinutes)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Priority & Attributes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Priority Matrix
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsBigRock(!isBigRock)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                border: isBigRock ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                backgroundColor: isBigRock ? 'var(--bg-active)' : 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: isBigRock ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Star size={12} fill={isBigRock ? 'currentColor' : 'none'} />
              ★ Big Rock
            </button>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                border: isPinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                backgroundColor: isPinned ? 'var(--bg-active)' : 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: isPinned ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
              📌 Pinned
            </button>
          </div>
        </div>

        {/* Subtasks Checklist */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {subtasks.map((st) => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => handleToggleSubtask(st.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-primary)',
                    textDecoration: st.completed ? 'line-through' : 'none',
                    opacity: st.completed ? 0.6 : 1,
                  }}
                >
                  {st.title}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(st.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Add subtask and press Enter..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubtask(e);
                }
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
              }}
            />
            <Button variant="ghost" size="xs" icon={Plus} onClick={handleAddSubtask}>
              Add
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Notes & Context
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, URLs, or requirements..."
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-hairline)',
            paddingTop: 12,
            marginTop: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={handleDelete}
              style={{ color: 'var(--signal-now)' }}
            >
              Delete Task
            </Button>
            {isScheduled && (
              <Button type="button" variant="ghost" size="sm" onClick={handleUnschedule}>
                Unschedule
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Button type="button" variant="ghost" size="sm" onClick={closeEditTaskModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

