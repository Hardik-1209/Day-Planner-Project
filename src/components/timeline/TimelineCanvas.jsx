import React, { useState, useRef, useMemo } from 'react';
import {
  DAY_START_MINUTES,
  DAY_END_MINUTES,
  PIXELS_PER_MINUTE,
  minutesToPixels,
  pixelsToMinutes,
  formatMinutesToTime,
  computeTimelineOverlapGeometry,
} from '../../utils/timeHelpers';
import { TimeBlockCard } from './TimeBlockCard';
import { CurrentTimeLine } from './CurrentTimeLine';
import { QuickBufferBar } from './QuickBufferBar';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useToast } from '../ui/ToastManager';
import { parseIcsContent } from '../../utils/icsHelper';
import { Button } from '../ui/Button';
import { Clock } from 'lucide-react';

export function TimelineCanvas() {
  const {
    tasks,
    setTasks,
    addTask,
    activeDate,
    horizonMode,
    settings,
    scheduleTask,
    undo,
  } = usePlannerData();
  const { showToast } = useToast();

  const containerRef = useRef(null);

  // Calculate displayed dates based on horizonMode ('1D' or '3D')
  const displayedDates = useMemo(() => {
    if (horizonMode !== '3D') return [activeDate];
    const dates = [];
    const base = new Date(activeDate + 'T00:00:00');
    for (let i = 0; i < 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, [activeDate, horizonMode]);

  const numCols = displayedDates.length;

  // Compute tasks layout and metrics per displayed date column
  const dayColumns = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    return displayedDates.map((dateStr, colIdx) => {
      const d = new Date(dateStr + 'T00:00:00');
      const isToday = dateStr === todayStr;
      const isTomorrow = dateStr === tomorrowStr;

      let dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (isToday) dateLabel = `Today · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
      else if (isTomorrow) dateLabel = `Tomorrow · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;

      const dayTasks = tasks.filter(
        (t) => t.date === dateStr && t.scheduledStartMinutes !== null && t.status !== 'deferred'
      );
      const layoutTasks = computeTimelineOverlapGeometry(dayTasks);
      const totalPlannedMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

      return {
        dateStr,
        colIdx,
        label: dateLabel,
        isToday,
        tasks: layoutTasks,
        rawTasks: dayTasks,
        plannedHours: (totalPlannedMinutes / 60).toFixed(1),
      };
    });
  }, [tasks, displayedDates]);

  // Check which column contains today's date for CurrentTimeLine
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayColIdx = displayedDates.indexOf(todayStr);

  // Lasso Time Creation State
  const [lasso, setLasso] = useState(null); // { startY, currentY, startMinutes, endMinutes, colIdx, date }
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoPopover, setLassoPopover] = useState(null); // { startMinutes, endMinutes, topPx, colIdx, date }
  const [popoverTitle, setPopoverTitle] = useState('');
  const [popoverCategory, setPopoverCategory] = useState('deep_work');

  // Drag and Drop (from backlog or move)
  const [dragOverState, setDragOverState] = useState(null); // { minutes, colIdx }

  // Canvas height calculations (06:00 to 24:00)
  const totalMinutes = DAY_END_MINUTES - DAY_START_MINUTES;
  const totalHeightPx = totalMinutes * PIXELS_PER_MINUTE;

  // Generate hourly markers
  const hours = [];
  for (let m = DAY_START_MINUTES; m <= DAY_END_MINUTES; m += 60) {
    hours.push(m);
  }

  // Helper to compute column index from click/drag X coordinate
  const getColIdxFromClientX = (clientX) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left - 56;
    if (relX < 0) return 0;
    const colWidth = (rect.width - 56) / numCols;
    return Math.max(0, Math.min(numCols - 1, Math.floor(relX / colWidth)));
  };

  // Pointer events for Lasso Drag-Creation
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const isGridCell = e.target.classList.contains('timeline-grid-cell') || e.target === containerRef.current;
    if (!isGridCell) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top + containerRef.current.scrollTop - 32; // subtract sticky header height
    if (offsetY < 0) return;

    const snappedStart = pixelsToMinutes(offsetY, DAY_START_MINUTES);
    const colIdx = getColIdxFromClientX(e.clientX);
    const targetDate = displayedDates[colIdx];

    setIsLassoing(true);
    setLasso({
      startY: offsetY,
      currentY: offsetY,
      startMinutes: snappedStart,
      endMinutes: snappedStart + 30,
      colIdx,
      date: targetDate,
    });
    setLassoPopover(null);
  };

  const handlePointerMove = (e) => {
    if (!isLassoing || !lasso) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = Math.max(0, e.clientY - rect.top + containerRef.current.scrollTop - 32);
    const rawEnd = pixelsToMinutes(offsetY, DAY_START_MINUTES);

    let start = Math.min(lasso.startMinutes, rawEnd);
    let end = Math.max(lasso.startMinutes, rawEnd);
    if (end - start < 15) end = start + 15;

    setLasso((prev) => ({
      ...prev,
      currentY: offsetY,
      startMinutes: start,
      endMinutes: end,
    }));
  };

  const handlePointerUp = () => {
    if (!isLassoing || !lasso) return;
    setIsLassoing(false);

    const duration = lasso.endMinutes - lasso.startMinutes;
    if (duration >= 15) {
      const topPx = minutesToPixels(lasso.startMinutes, DAY_START_MINUTES);
      setLassoPopover({
        startMinutes: lasso.startMinutes,
        endMinutes: lasso.endMinutes,
        topPx,
        colIdx: lasso.colIdx,
        date: lasso.date,
      });
      setPopoverTitle('');
    } else {
      setLasso(null);
    }
  };

  const handleCreateLassoTask = (e) => {
    e.preventDefault();
    if (!lassoPopover) return;

    const duration = lassoPopover.endMinutes - lassoPopover.startMinutes;
    addTask(
      {
        title: popoverTitle.trim() || 'New Time Block',
        category: popoverCategory,
        scheduledStartMinutes: lassoPopover.startMinutes,
        durationMinutes: duration,
        date: lassoPopover.date || activeDate,
        energyType: popoverCategory === 'deep_work' ? 'deep' : popoverCategory === 'break' ? 'break' : 'shallow',
      },
      'Lasso create task'
    );

    setLasso(null);
    setLassoPopover(null);
  };

  // Drag and drop from backlog or desktop files
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top + containerRef.current.scrollTop - 32;
    const snapped = pixelsToMinutes(offsetY, DAY_START_MINUTES);
    const colIdx = getColIdxFromClientX(e.clientX);
    setDragOverState({ minutes: snapped, colIdx });
  };

  const handleDragLeave = () => {
    setDragOverState(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const colIdx = getColIdxFromClientX(e.clientX);
    const targetDate = displayedDates[colIdx];
    setDragOverState(null);

    // 1. Check for .ics calendar file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.ics')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const parsedEvents = parseIcsContent(content, targetDate);
          if (parsedEvents.length > 0) {
            setTasks([...tasks, ...parsedEvents], `Import ${file.name}`);
            showToast({
              message: `Imported ${parsedEvents.length} calendar meetings into ${targetDate}`,
              actionLabel: 'Undo',
              onAction: undo,
            });
          } else {
            showToast({ message: 'No valid events found in .ics file' });
          }
        };
        reader.readAsText(file);
        return;
      }
    }

    // 2. Check for backlog task item drag-and-drop
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top + containerRef.current.scrollTop - 32;
      const snapped = pixelsToMinutes(offsetY, DAY_START_MINUTES);
      scheduleTask(taskId, snapped, null, targetDate);
      showToast({ message: `Scheduled at ${formatMinutesToTime(snapped)} on ${targetDate}` });
    }
  };

  // Circadian window helper for gutter tooltip
  const getCircadianInfo = (minutes) => {
    if (minutes >= 390 && minutes < 510) return { label: 'Morning Ritual & Personal', color: 'var(--cat-personal-spine)' };
    if (minutes >= 540 && minutes < 720) return { label: 'Peak Focus Window (Deep Work)', color: 'var(--cat-deep-spine)' };
    if (minutes >= 780 && minutes < 930) return { label: 'Post-Lunch Dip (Admin / Low Energy)', color: 'var(--cat-admin-spine)' };
    if (minutes >= 960 && minutes < 1110) return { label: 'Second Wind Window', color: 'var(--cat-deep-spine)' };
    if (minutes >= 1110 && minutes < 1290) return { label: 'Evening Recovery & Personal', color: 'var(--cat-personal-spine)' };
    return null;
  };

  return (
    <div
      ref={containerRef}
      className="main-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 1. Day Column Headers Bar (Sticky Top) */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '32px',
          backgroundColor: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-hairline)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Left gutter blank spacer */}
        <div
          style={{
            width: '56px',
            height: '100%',
            borderRight: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Time
        </div>

        {/* Day Column Headers */}
        {dayColumns.map((col, idx) => (
          <div
            key={col.dateStr}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderRight: idx < numCols - 1 ? '1px solid var(--border-hairline)' : 'none',
              backgroundColor: col.isToday ? 'var(--bg-elevated)' : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: col.isToday ? 600 : 500,
                color: col.isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {col.label}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {col.plannedHours}h planned
            </span>
          </div>
        ))}
      </div>

      {/* 2. Timeline Grid Canvas */}
      <div style={{ position: 'relative', height: `${totalHeightPx}px`, minWidth: '100%' }}>
        {/* Hourly grid lines and labels */}
        {hours.map((hourMinutes) => {
          const topPx = minutesToPixels(hourMinutes, DAY_START_MINUTES);
          const circ = getCircadianInfo(hourMinutes);

          return (
            <React.Fragment key={hourMinutes}>
              {/* Hour Line across entire canvas */}
              <div
                className="timeline-grid-cell"
                style={{
                  position: 'absolute',
                  top: `${topPx}px`,
                  left: 0,
                  right: 0,
                  height: `${60 * PIXELS_PER_MINUTE}px`,
                  borderTop: '1px solid var(--timeline-hour-line)',
                  pointerEvents: 'auto',
                }}
              />

              {/* Half-Hour Line */}
              <div
                style={{
                  position: 'absolute',
                  top: `${topPx + 30 * PIXELS_PER_MINUTE}px`,
                  left: '56px',
                  right: 0,
                  borderTop: '1px dashed var(--timeline-half-line)',
                  pointerEvents: 'none',
                }}
              />

              {/* Time Label & Circadian Indicator Bar in Left Gutter */}
              <div
                style={{
                  position: 'absolute',
                  top: `${topPx - 8}px`,
                  left: 0,
                  width: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingRight: 6,
                  paddingLeft: 6,
                  pointerEvents: 'none',
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 'var(--text-2xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {formatMinutesToTime(hourMinutes)}
                </span>

                {circ && (
                  <div
                    title={circ.label}
                    style={{
                      width: '3px',
                      height: '14px',
                      borderRadius: '2px',
                      backgroundColor: circ.color,
                      opacity: 0.8,
                    }}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Vertical Column Separator Lines in 3D Mode */}
        {numCols > 1 &&
          [1, 2].map((colIdx) => (
            <div
              key={`col-line-${colIdx}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `calc(56px + ${colIdx} * (100% - 56px) / ${numCols})`,
                width: '1px',
                backgroundColor: 'var(--border-hairline)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          ))}

        {/* Current Time Indicator Line (Only on today's column) */}
        {todayColIdx !== -1 && (
          <CurrentTimeLine
            dayStartMinutes={DAY_START_MINUTES}
            colIdx={todayColIdx}
            numCols={numCols}
          />
        )}

        {/* Decompression Buffers after heavy blocks */}
        {settings?.autoDecompressionEnabled &&
          dayColumns.map(({ colIdx, rawTasks }) =>
            rawTasks
              .filter((t) => (t.category === 'deep_work' || t.category === 'meetings') && t.durationMinutes >= 45)
              .map((t) => {
                const topPx = minutesToPixels(t.scheduledStartMinutes + t.durationMinutes, DAY_START_MINUTES);
                const colWidthStyle = numCols > 1 ? `calc((100% - 56px) / ${numCols} - 8px)` : 'calc(100% - 68px)';
                const colLeftStyle = numCols > 1
                  ? `calc(56px + ${colIdx} * (100% - 56px) / ${numCols} + 4px)`
                  : '60px';

                return (
                  <div
                    key={`buffer-${t.id}`}
                    style={{
                      position: 'absolute',
                      top: `${topPx}px`,
                      left: colLeftStyle,
                      width: colWidthStyle,
                      height: `${10 * PIXELS_PER_MINUTE - 2}px`,
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderTop: '1px dashed var(--border-hairline)',
                      borderBottom: '1px dashed var(--border-hairline)',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      fontSize: '9px',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  >
                    10m Decompression Buffer
                  </div>
                );
              })
          )}

        {/* Ghost Drop Target Preview */}
        {dragOverState && (
          <div
            style={{
              position: 'absolute',
              top: `${minutesToPixels(dragOverState.minutes, DAY_START_MINUTES)}px`,
              left: `calc(56px + ${dragOverState.colIdx} * (100% - 56px) / ${numCols} + 4px)`,
              width: `calc((100% - 56px) / ${numCols} - 8px)`,
              height: `${30 * PIXELS_PER_MINUTE - 2}px`,
              border: '2px dashed var(--signal-now)',
              backgroundColor: 'var(--signal-now-pulse)',
              borderRadius: 'var(--radius-xs)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
              fontSize: 'var(--text-2xs)',
              fontWeight: 600,
              color: 'var(--signal-now)',
            }}
          >
            Drop to schedule at {formatMinutesToTime(dragOverState.minutes)}
          </div>
        )}

        {/* Lasso Drag-Creation Outline Box */}
        {lasso && (
          <div
            style={{
              position: 'absolute',
              top: `${minutesToPixels(lasso.startMinutes, DAY_START_MINUTES)}px`,
              left: `calc(56px + ${lasso.colIdx} * (100% - 56px) / ${numCols} + 4px)`,
              width: `calc((100% - 56px) / ${numCols} - 8px)`,
              height: `${(lasso.endMinutes - lasso.startMinutes) * PIXELS_PER_MINUTE}px`,
              backgroundColor: 'var(--bg-active)',
              border: '1.5px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-xs)',
              zIndex: 12,
              pointerEvents: 'none',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontWeight: 500 }}>Create New Block</span>
            <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)' }}>
              {formatMinutesToTime(lasso.startMinutes)} - {formatMinutesToTime(lasso.endMinutes)} (
              {lasso.endMinutes - lasso.startMinutes}m)
            </span>
          </div>
        )}

        {/* Lasso Inline Creation Popover */}
        {lassoPopover && (
          <div
            style={{
              position: 'absolute',
              top: `${Math.min(lassoPopover.topPx, totalHeightPx - 160)}px`,
              left: `calc(56px + ${lassoPopover.colIdx} * (100% - 56px) / ${numCols} + 8px)`,
              width: numCols === 1 ? '280px' : 'calc((100% - 56px) / 3 - 16px)',
              minWidth: '220px',
              maxWidth: '320px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-float)',
              padding: '10px 12px',
              zIndex: 30,
              animation: 'toastIn 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <Clock size={12} />
                <span className="tabular-nums">
                  {formatMinutesToTime(lassoPopover.startMinutes)} - {formatMinutesToTime(lassoPopover.endMinutes)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLassoPopover(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLassoTask}>
              <input
                type="text"
                autoFocus
                placeholder="Task title..."
                value={popoverTitle}
                onChange={(e) => setPopoverTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 8,
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {['deep_work', 'meetings', 'admin', 'personal', 'break'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPopoverCategory(cat)}
                    style={{
                      flex: 1,
                      padding: '3px 0',
                      border: popoverCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: popoverCategory === cat ? 'var(--bg-active)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '9px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Button variant="ghost" size="xs" onClick={() => setLassoPopover(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="xs" type="submit">
                  Save Block
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Scheduled Tasks Render with Side-by-Side Geometry per Column */}
        {dayColumns.map(({ colIdx, tasks: colTasks }) =>
          colTasks.map((t) => {
            const topPx = minutesToPixels(t.scheduledStartMinutes, DAY_START_MINUTES);
            const leftPercent = t.leftPercent ?? 0;
            const widthPercent = t.widthPercent ?? 100;

            const cardLeft = numCols > 1
              ? `calc(56px + ${colIdx} * ((100% - 56px) / ${numCols}) + (${leftPercent}% / ${numCols}) * 0.94 + 2px)`
              : `calc(56px + ${leftPercent}% * 0.92)`;

            const cardWidth = numCols > 1
              ? `calc((${widthPercent}% / ${numCols}) * 0.94 - 4px)`
              : `calc(${widthPercent}% * 0.92 - 4px)`;

            return (
              <TimeBlockCard
                key={t.id}
                task={t}
                onDragStart={(e, item) => {
                  e.dataTransfer.setData('text/plain', item.id);
                }}
                style={{
                  top: `${topPx}px`,
                  left: cardLeft,
                  width: cardWidth,
                  zIndex: 4,
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
