import React, { useState } from 'react';
import {
  ListFilter,
  Grid,
  CheckCircle2,
  Trash2,
  Clock,
  Pin,
  Play,
  Flame,
  AlertTriangle,
  MoveRight,
  Pencil,
} from 'lucide-react';
import { QuickTaskInput } from './QuickTaskInput';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useFocusSession } from '../../context/FocusSessionContext';
import { formatDuration } from '../../utils/timeHelpers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

import { useToast } from '../ui/ToastManager';

export function BacklogDrawer({ onOpenBrainDump }) {
  const { tasks, updateTask, deleteTask, scheduleTask, openEditTaskModal } = usePlannerData();
  const { openFocusModal } = useFocusSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'matrix'
  const [filterCategory, setFilterCategory] = useState('all');

  // Unscheduled tasks
  const unscheduledTasks = tasks.filter(
    (t) => t.scheduledStartMinutes === null && t.status !== 'completed' && t.status !== 'deferred'
  );

  const filteredTasks = unscheduledTasks.filter((t) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'big_rock') return t.isBigRock;
    return t.category === filterCategory;
  });

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleQuickSchedule = (task) => {
    // Schedule at 09:00 default or current hour
    scheduleTask(task.id, 540);
    showToast({ message: `Scheduled at 09:00` });
  };

  return (
    <aside className="left-rail">
      {/* Drawer Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Backlog
          </span>
          <span
            className="badge tabular-nums"
            style={{
              backgroundColor: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              fontSize: '10px',
            }}
          >
            {unscheduledTasks.length}
          </span>
        </div>

        {/* View mode toggle (List vs Eisenhower Matrix) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xs)',
            padding: 1,
          }}
        >
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => setActiveTab('list')}
            style={{
              padding: '2px 5px',
              border: 'none',
              backgroundColor: activeTab === 'list' ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            title="List View"
          >
            <ListFilter size={11} />
          </button>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '2px 5px',
              border: 'none',
              backgroundColor: activeTab === 'matrix' ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === 'matrix' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            title="Eisenhower Matrix"
          >
            <Grid size={11} />
          </button>
        </div>
      </div>

      {/* Quick Task Input with Voice */}
      <QuickTaskInput onOpenBrainDump={onOpenBrainDump} />

      {activeTab === 'matrix' ? (
        <EisenhowerMatrix />
      ) : (
        <>
          {/* Category Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '6px 12px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            {['all', 'big_rock', 'deep_work', 'meetings', 'admin', 'personal'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                style={{
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--text-2xs)',
                  cursor: 'pointer',
                  backgroundColor: filterCategory === cat ? 'var(--bg-active)' : 'transparent',
                  color: filterCategory === cat ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: filterCategory === cat ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {cat === 'all'
                  ? 'All'
                  : cat === 'big_rock'
                  ? '★ Big Rocks'
                  : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredTasks.length === 0 ? (
              <div
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                No unscheduled tasks. All clear!
              </div>
            ) : (
              filteredTasks.map((task) => {
                let catKey = 'deep';
                if (task.category === 'meetings') catKey = 'meeting';
                else if (task.category === 'admin') catKey = 'admin';
                else if (task.category === 'personal') catKey = 'personal';
                else if (task.category === 'break') catKey = 'break';

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      cursor: 'grab',
                      userSelect: 'none',
                      transition: 'background-color 120ms ease, border-color 120ms ease',
                    }}
                  >
                    <div
                      onDoubleClick={() => openEditTaskModal(task)}
                      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <span className={`cat-dot cat-dot-${task.category}`} />
                        <span
                          onClick={() => openEditTaskModal(task)}
                          title={`${task.title} (Click to edit)`}
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                          }}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Rollover badge */}
                      {task.rolloverCount >= 3 ? (
                        <span
                          className="badge tabular-nums"
                          style={{
                            backgroundColor: 'rgba(229, 77, 46, 0.12)',
                            color: 'var(--signal-now)',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          Rolled {task.rolloverCount}×
                        </span>
                      ) : task.rolloverCount === 2 ? (
                        <div
                          title="Rolled over 2×"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'var(--signal-now)',
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Metadata & Quick Action row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        fontSize: 'var(--text-2xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="tabular-nums">{task.durationMinutes}m</span>
                        {task.isBigRock && (
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>★ Rock</span>
                        )}
                        <span style={{ textTransform: 'uppercase', fontSize: '9px' }}>
                          {task.priority.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Pencil}
                          onClick={() => openEditTaskModal(task)}
                          title="Edit task details"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Play}
                          onClick={() => openFocusModal(task)}
                          title="Start Focus Session"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={MoveRight}
                          onClick={() => handleQuickSchedule(task)}
                          title="Schedule on timeline (09:00)"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Trash2}
                          onClick={() => deleteTask(task.id)}
                          title="Delete"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </aside>
  );
}
