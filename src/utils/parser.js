/**
 * Natural Language Quick Task Token Parser
 * Extracts category (#), priority (!), duration (~), time (@), and big-rock (*) flags.
 *
 * Example input:
 * "Refactor auth layer #deepwork !high ~45m @10:30 *"
 */

export function parseQuickTaskInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      title: '',
      category: 'deep_work',
      priority: 'q2_schedule',
      durationMinutes: 30,
      scheduledStartMinutes: null,
      isBigRock: false,
    };
  }

  let text = rawInput.trim();
  let category = 'deep_work';
  let priority = 'q2_schedule';
  let durationMinutes = 30;
  let scheduledStartMinutes = null;
  let isBigRock = false;

  // 1. Big Rock: * or !star or !bigrock
  if (/(?:^|\s)\*(?:\s|$)/.test(text) || /(?:^|\s)!(?:star|bigrock)(?:\s|$)/i.test(text)) {
    isBigRock = true;
    text = text
      .replace(/(?:^|\s)\*(?:\s|$)/g, ' ')
      .replace(/(?:^|\s)!(?:star|bigrock)(?:\s|$)/gi, ' ');
  }

  // 2. Category: #deepwork, #deep, #meetings, #meeting, #admin, #personal, #break
  const catMatch = text.match(/(?:^|\s)#([a-zA-Z_-]+)/);
  if (catMatch) {
    const rawCat = catMatch[1].toLowerCase().replace(/[-_]/g, '');
    if (['deep', 'deepwork', 'focus', 'code'].includes(rawCat)) {
      category = 'deep_work';
    } else if (['meeting', 'meetings', 'sync', 'call'].includes(rawCat)) {
      category = 'meetings';
    } else if (['admin', 'ops', 'email', 'inbox'].includes(rawCat)) {
      category = 'admin';
    } else if (['personal', 'life', 'health', 'home'].includes(rawCat)) {
      category = 'personal';
    } else if (['break', 'rest', 'lunch', 'walk'].includes(rawCat)) {
      category = 'break';
    }
    text = text.replace(catMatch[0], ' ');
  }

  // 3. Priority: !high, !q1, !medium, !q2, !low, !q3, !eliminate, !q4
  const prioMatch = text.match(/(?:^|\s)!([a-zA-Z0-9_-]+)/);
  if (prioMatch) {
    const rawPrio = prioMatch[1].toLowerCase();
    if (['high', 'urgent', 'q1', 'critical', 'do'].includes(rawPrio)) {
      priority = 'q1_do';
    } else if (['med', 'medium', 'q2', 'schedule', 'plan'].includes(rawPrio)) {
      priority = 'q2_schedule';
    } else if (['low', 'q3', 'delegate'].includes(rawPrio)) {
      priority = 'q3_delegate';
    } else if (['eliminate', 'someday', 'q4', 'none'].includes(rawPrio)) {
      priority = 'q4_eliminate';
    }
    text = text.replace(prioMatch[0], ' ');
  }

  // 4. Duration: ~45m, ~1h, ~90m, ~1.5h, ~2h, ~30
  const durMatch = text.match(/(?:^|\s)~([0-9.]+)([a-zA-Z]*)/);
  if (durMatch) {
    const num = parseFloat(durMatch[1]);
    const unit = (durMatch[2] || 'm').toLowerCase();
    if (unit.startsWith('h')) {
      durationMinutes = Math.round(num * 60);
    } else {
      durationMinutes = Math.round(num);
    }
    durationMinutes = Math.max(15, Math.min(480, durationMinutes));
    text = text.replace(durMatch[0], ' ');
  }

  // 5. Time: @10:30, @9:00, @14:00, @2pm, @10am, @14h
  const timeMatch = text.match(/(?:^|\s)@(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      scheduledStartMinutes = hour * 60 + minute;
    }
    text = text.replace(timeMatch[0], ' ');
  }

  // Clean remaining whitespace
  const cleanTitle = text.replace(/\s+/g, ' ').trim() || 'Untitled Task';

  // Energy type heuristic derived from category
  let energyType = 'deep';
  if (category === 'meetings' || category === 'admin') energyType = 'shallow';
  if (category === 'break' || category === 'personal') energyType = 'break';

  return {
    title: cleanTitle,
    category,
    priority,
    durationMinutes,
    scheduledStartMinutes,
    isBigRock,
    energyType,
  };
}

