/**
 * Cascading Auto-Scheduler with Auto-Chunking & Decompression Buffers
 * Synthesizes Morgen frames, Circadian energy matching, and sequential dependencies.
 */

export function scoreSlotForTask(slotStart, slotDuration, task, settings, taskMap) {
  const workStart = settings?.workdayStartMinutes ?? 510; // 08:30 AM
  const workEnd = settings?.workdayEndMinutes ?? 1080;    // 06:00 PM
  const taskEnd = slotStart + task.durationMinutes;

  // 1. Enforce sequential dependency constraint (dependsOnTaskId)
  if (task.dependsOnTaskId && taskMap?.has(task.dependsOnTaskId)) {
    const dep = taskMap.get(task.dependsOnTaskId);
    if (dep.scheduledStartMinutes === null) return -1000;
    const depEnd = dep.scheduledStartMinutes + dep.durationMinutes;
    if (slotStart < depEnd) return -1000;
  }

  // 2. Enforce Work vs. Personal Scheduling Windows (Morgen frames)
  if (task.category === 'personal') {
    const inMorningPersonal = slotStart >= 390 && taskEnd <= workStart; // 06:30 - 08:30 AM
    const inEveningPersonal = slotStart >= workEnd && taskEnd <= 1290;  // 18:00 - 21:30 PM
    if (!inMorningPersonal && !inEveningPersonal) return -100;
    return 80;
  } else if (task.category === 'break') {
    // Breaks can occur anytime between day start and day end
    return 60;
  } else {
    // Work tasks stay strictly inside workday bounds
    if (slotStart < workStart || taskEnd > workEnd) return -100;
  }

  let score = 50;

  // 3. Circadian Window Matching
  if (task.energyType === 'deep') {
    if (slotStart >= 540 && taskEnd <= 720) score += 45;       // 09:00 - 12:00 Morning Peak
    else if (slotStart >= 960 && taskEnd <= 1110) score += 25; // 16:00 - 18:30 Second Wind
    else if (slotStart >= 780 && slotStart <= 930) score -= 25;// Penalize Post-Lunch Dip
  } else if (task.energyType === 'admin' || task.energyType === 'shallow') {
    if (slotStart >= 780 && taskEnd <= 930) score += 40;       // 13:00 - 15:30 Post-Lunch Dip
    else if (slotStart >= 510 && taskEnd <= 540) score += 30;  // 08:30 - 09:00 Warmup
    else if (slotStart >= 540 && slotStart <= 720) score -= 35;// Protect Morning Peak
  }

  // Exact fit bonus
  if (slotDuration === task.durationMinutes) score += 15;

  return score;
}

/**
 * Auto-schedules backlog tasks, automatically splitting large tasks if needed.
 */
export function autoScheduleDay(tasks, settings, targetDate) {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  let updatedTasks = [...tasks];

  // 1. Identify occupied intervals from currently scheduled tasks on target date
  const occupied = updatedTasks
    .filter((t) => t.date === dateStr && t.scheduledStartMinutes !== null && t.status !== 'deferred')
    .map((t) => {
      const buffer =
        settings?.autoDecompressionEnabled &&
        (t.category === 'deep_work' || t.category === 'meetings') &&
        t.durationMinutes >= 45
          ? 10
          : 0;
      return {
        id: t.id,
        start: t.scheduledStartMinutes,
        end: t.scheduledStartMinutes + t.durationMinutes + buffer,
        isPinned: t.isPinned,
      };
    })
    .sort((a, b) => a.start - b.start);

  // 2. Compute free slots
  const freeSlots = [];
  let cursor = settings?.dayStartMinutes ?? 360;
  const dayEnd = settings?.dayEndMinutes ?? 1380;

  for (const interval of occupied) {
    if (interval.start > cursor) {
      freeSlots.push({ start: cursor, end: interval.start, duration: interval.start - cursor });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < dayEnd) {
    freeSlots.push({ start: cursor, end: dayEnd, duration: dayEnd - cursor });
  }

  // 3. Sort unscheduled backlog tasks: Big Rocks first, then Eisenhowers (q1..q4), then duration
  const unscheduled = updatedTasks
    .filter((t) => t.scheduledStartMinutes === null && t.status !== 'completed' && t.status !== 'deferred')
    .sort((a, b) => {
      if (a.isBigRock && !b.isBigRock) return -1;
      if (!a.isBigRock && b.isBigRock) return 1;
      const rank = { q1_do: 1, q2_schedule: 2, q3_delegate: 3, q4_eliminate: 4 };
      if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
      return b.durationMinutes - a.durationMinutes;
    });

  // 4. Slot allocation with auto-chunking
  for (const task of unscheduled) {
    let placed = false;

    // Score all available slots
    const scoredSlots = freeSlots
      .map((slot, index) => ({
        slot,
        index,
        score: scoreSlotForTask(slot.start, slot.duration, task, settings, taskMap),
      }))
      .filter((s) => s.score > 0 && s.slot.duration >= 15)
      .sort((a, b) => b.score - a.score);

    // Try placing as a monolithic block first
    for (const { slot } of scoredSlots) {
      if (slot.duration >= task.durationMinutes) {
        const idx = updatedTasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          updatedTasks[idx] = {
            ...updatedTasks[idx],
            date: dateStr,
            scheduledStartMinutes: slot.start,
          };
          taskMap.set(task.id, updatedTasks[idx]);
          slot.start += task.durationMinutes;
          slot.duration -= task.durationMinutes;
          placed = true;
          break;
        }
      }
    }

    // Auto-chunking: If task >= 60m cannot fit in a single gap, split into 2 chunks
    if (!placed && (task.isSplittable ?? true) && task.durationMinutes >= 60) {
      const part1Duration = Math.round(task.durationMinutes / 2 / 15) * 15;
      const part2Duration = task.durationMinutes - part1Duration;

      // Find first slot for Part 1
      const slot1 = freeSlots.find(
        (s) => s.duration >= part1Duration && scoreSlotForTask(s.start, part1Duration, task, settings, taskMap) > 0
      );

      if (slot1) {
        const originalIdx = updatedTasks.findIndex((t) => t.id === task.id);
        const part2Id = `${task.id}-part-2`;

        // Update Part 1
        updatedTasks[originalIdx] = {
          ...updatedTasks[originalIdx],
          date: dateStr,
          durationMinutes: part1Duration,
          scheduledStartMinutes: slot1.start,
          partLabel: '1/2',
        };
        taskMap.set(task.id, updatedTasks[originalIdx]);
        slot1.start += part1Duration;
        slot1.duration -= part1Duration;

        // Find second slot for Part 2 after Part 1
        const slot2 = freeSlots.find(
          (s) =>
            s.duration >= part2Duration &&
            s.start >= updatedTasks[originalIdx].scheduledStartMinutes + part1Duration
        );

        if (slot2) {
          const part2Task = {
            ...task,
            id: part2Id,
            title: `${task.title} (Part 2)`,
            date: dateStr,
            durationMinutes: part2Duration,
            scheduledStartMinutes: slot2.start,
            parentTaskId: task.id,
            partLabel: '2/2',
            dependsOnTaskId: task.id,
            subtasks: [],
            createdAt: Date.now(),
          };
          slot2.start += part2Duration;
          slot2.duration -= part2Duration;
          updatedTasks.push(part2Task);
          taskMap.set(part2Id, part2Task);
          placed = true;
        }
      }
    }
  }

  return updatedTasks;
}

/**
 * Smart Reshuffle:
 * Keeps pinned items immovable, clears unpinned scheduled items, and auto-schedules everything optimally.
 */
export function smartReshuffleDay(tasks, settings, targetDate) {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10);

  // Unschedule unpinned items on target date
  const resetTasks = tasks.map((t) => {
    if (t.date === dateStr && !t.isPinned && t.scheduledStartMinutes !== null && t.status !== 'completed') {
      return { ...t, scheduledStartMinutes: null };
    }
    return t;
  });

  return autoScheduleDay(resetTasks, settings, targetDate);
}

