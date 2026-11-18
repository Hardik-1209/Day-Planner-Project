export const DAY_START_MINUTES = 360;   // 06:00 AM
export const DAY_END_MINUTES = 1380;    // 11:00 PM
export const PIXELS_PER_MINUTE = 1.5;   // 90px per hour, 22.5px per 15 minutes
export const SNAP_MINUTES = 15;

/**
 * Snap minutes to nearest step (default 15 minutes)
 */
export function snapToGrid(minutes, snap = SNAP_MINUTES) {
  return Math.round(minutes / snap) * snap;
}

/**
 * Convert minute-of-day (e.g. 540 = 09:00) to pixel offset from top
 */
export function minutesToPixels(minutes, dayStart = DAY_START_MINUTES) {
  return Math.max(0, (minutes - dayStart) * PIXELS_PER_MINUTE);
}

/**
 * Convert pixel offset to minute-of-day
 */
export function pixelsToMinutes(pixels, dayStart = DAY_START_MINUTES) {
  const rawMinutes = dayStart + pixels / PIXELS_PER_MINUTE;
  return snapToGrid(rawMinutes, SNAP_MINUTES);
}

/**
 * Format minute of day (0..1440) to "HH:MM" (24h or 12h display)
 */
export function formatMinutesToTime(minutes, use24Hour = true) {
  if (minutes === null || minutes === undefined) return '';
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (use24Hour) {
    return `${pad(h)}:${pad(m)}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${pad(displayH)}:${pad(m)} ${period}`;
}

/**
 * Format duration in minutes to readable string: "15m", "45m", "1h 30m"
 */
export function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Interval Graph Overlap Partitioning (Greedy Coloring)
 * Computes side-by-side column positioning for tasks that overlap on the timeline canvas.
 */
export function computeTimelineOverlapGeometry(scheduledTasks) {
  if (!scheduledTasks || scheduledTasks.length === 0) return [];

  // Sort tasks by start time, and then by longer duration first
  const sorted = [...scheduledTasks].sort((a, b) => {
    if (a.scheduledStartMinutes !== b.scheduledStartMinutes) {
      return a.scheduledStartMinutes - b.scheduledStartMinutes;
    }
    return b.durationMinutes - a.durationMinutes;
  });

  // Find overlapping clusters
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const task of sorted) {
    const taskStart = task.scheduledStartMinutes;
    const taskEnd = taskStart + task.durationMinutes;

    if (currentCluster.length === 0) {
      currentCluster.push(task);
      clusterEnd = taskEnd;
    } else {
      if (taskStart < clusterEnd) {
        // Overlaps with current cluster
        currentCluster.push(task);
        clusterEnd = Math.max(clusterEnd, taskEnd);
      } else {
        // Starts a new cluster
        clusters.push(currentCluster);
        currentCluster = [task];
        clusterEnd = taskEnd;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Within each cluster, greedily assign columns
  const results = [];

  for (const cluster of clusters) {
    const columns = []; // Array of end times for each column

    const clusterTasks = cluster.map((task) => {
      const taskStart = task.scheduledStartMinutes;
      const taskEnd = taskStart + task.durationMinutes;

      // Find first column where task doesn't collide
      let assignedCol = -1;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= taskStart) {
          assignedCol = c;
          columns[c] = taskEnd;
          break;
        }
      }

      if (assignedCol === -1) {
        assignedCol = columns.length;
        columns.push(taskEnd);
      }

      return {
        ...task,
        colIndex: assignedCol,
      };
    });

    const totalCols = columns.length;
    for (const t of clusterTasks) {
      results.push({
        ...t,
        totalCols,
        leftPercent: (t.colIndex / totalCols) * 100,
        widthPercent: 100 / totalCols,
      });
    }
  }

  return results;
}

