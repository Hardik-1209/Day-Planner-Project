import React from 'react';
import { usePlannerData } from '../../context/PlannerDataContext';
import { Trash2, MoveRight } from 'lucide-react';
import { Button } from '../ui/Button';

const QUADRANTS = [
  { id: 'q1_do', label: 'Q1: Do First', sublabel: 'Urgent & Important', color: 'var(--cat-deep-spine)' },
  { id: 'q2_schedule', label: 'Q2: Schedule', sublabel: 'Important, Not Urgent', color: 'var(--cat-meeting-spine)' },
  { id: 'q3_delegate', label: 'Q3: Delegate', sublabel: 'Urgent, Not Important', color: 'var(--cat-admin-spine)' },
  { id: 'q4_eliminate', label: 'Q4: Eliminate', sublabel: 'Neither', color: 'var(--cat-break-spine)' },
];

export function EisenhowerMatrix() {
  const { tasks, updateTask, scheduleTask, deleteTask, openEditTaskModal } = usePlannerData();

  const unscheduledTasks = tasks.filter(
    (t) => t.scheduledStartMinutes === null && t.status !== 'completed' && t.status !== 'deferred'
  );

  const handleDropOnQuadrant = (e, targetQuadrantId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { priority: targetQuadrantId }, `Move to ${targetQuadrantId}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 6,
        padding: '8px 10px',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      {QUADRANTS.map((quad) => {
        const quadrantTasks = unscheduledTasks.filter((t) => (t.priority || 'q2_schedule') === quad.id);

        return (
          <div
            key={quad.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnQuadrant(e, quad.id)}
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Quadrant Header */}
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {quad.label}
                </span>
                <span
                  className="badge tabular-nums"
                  style={{
                    marginLeft: 4,
                    fontSize: '9px',
                    backgroundColor: 'var(--bg-hover)',
                  }}
                >
                  {quadrantTasks.length}
                </span>
              </div>
            </div>

            {/* Quadrant Task List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {quadrantTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                  onClick={() => openEditTaskModal(task)}
                  title={`${task.title} (Click to edit)`}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '4px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {task.title}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    {task.durationMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

