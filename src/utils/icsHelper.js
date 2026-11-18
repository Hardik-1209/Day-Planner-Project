/**
 * RFC 5545 iCalendar (.ics) Parser and Exporter
 * Zero-backend client-side implementation.
 */

function parseIcsDate(dateStr) {
  // Handles formats like 20261031T090000Z or 20261031T090000 or TZID format
  if (!dateStr) return null;
  const cleanStr = dateStr.includes(':') ? dateStr.split(':').pop() : dateStr;
  const match = cleanStr.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
  if (!match) return null;

  const [_, year, month, day, hour = '00', min = '00', sec = '00'] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +min, +sec));
  const dateFormatted = `${year}-${month}-${day}`;
  const startMinutes = +hour * 60 + +min;

  return { date, dateFormatted, startMinutes };
}

/**
 * Parse an .ics text file into an array of Task objects
 */
export function parseIcsContent(icsContent, targetDate) {
  const lines = icsContent.split(/\r\n|\n|\r/);
  const events = [];
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Handle line folding (lines starting with space or tab continue previous line)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      line += lines[i + 1].slice(1).trim();
      i++;
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.summary && currentEvent.dtstart) {
        const parsedStart = parseIcsDate(currentEvent.dtstart);
        const parsedEnd = currentEvent.dtend ? parseIcsDate(currentEvent.dtend) : null;

        if (parsedStart) {
          const duration = parsedEnd
            ? Math.max(15, parsedEnd.startMinutes - parsedStart.startMinutes)
            : 30;

          const eventDate = targetDate || parsedStart.dateFormatted;

          events.push({
            id: `ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: currentEvent.summary || 'Imported Calendar Event',
            date: eventDate,
            durationMinutes: duration,
            actualSecondsSpent: 0,
            scheduledStartMinutes: parsedStart.startMinutes,
            isPinned: true, // Calendar imports are pinned as immovable meetings
            isBigRock: false,
            isSplittable: false,
            rolloverCount: 0,
            priority: 'q2_schedule',
            category: 'meetings',
            energyType: 'shallow',
            status: 'todo',
            subtasks: [],
            notes: [currentEvent.location ? `Location: ${currentEvent.location}` : '', currentEvent.description || '']
              .filter(Boolean)
              .join('\n'),
            createdAt: Date.now(),
          });
        }
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.slice(8).trim();
      } else if (line.startsWith('DTSTART')) {
        currentEvent.dtstart = line;
      } else if (line.startsWith('DTEND')) {
        currentEvent.dtend = line;
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.slice(9).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.slice(12).trim();
      }
    }
  }

  return events;
}

/**
 * Generate standard RFC 5545 .ics text for scheduled tasks on a date
 */
export function generateIcsForDate(tasks, dateStr) {
  const scheduled = tasks.filter(
    (t) => t.date === dateStr && t.scheduledStartMinutes !== null && t.status !== 'deferred'
  );

  const cleanDate = dateStr.replace(/-/g, ''); // "20261031"
  const pad = (n) => String(n).padStart(2, '0');

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chronos Flow//Studio Day Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const task of scheduled) {
    const startH = Math.floor(task.scheduledStartMinutes / 60);
    const startM = task.scheduledStartMinutes % 60;
    const endMinutes = task.scheduledStartMinutes + task.durationMinutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const dtStart = `${cleanDate}T${pad(startH)}${pad(startM)}00`;
    const dtEnd = `${cleanDate}T${pad(endH)}${pad(endM)}00`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${task.id}@chronosflow.internal`);
    ics.push(`DTSTAMP:${dtStamp}`);
    ics.push(`DTSTART:${dtStart}`);
    ics.push(`DTEND:${dtEnd}`);
    ics.push(`SUMMARY:${task.title.replace(/[,;]/g, ' ')}`);
    if (task.notes) {
      ics.push(`DESCRIPTION:${task.notes.replace(/\n/g, '\\n')}`);
    }
    ics.push(`STATUS:${task.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Trigger browser file download of .ics
 */
export function downloadIcsFile(tasks, dateStr) {
  const content = generateIcsForDate(tasks, dateStr);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chronos-schedule-${dateStr}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

