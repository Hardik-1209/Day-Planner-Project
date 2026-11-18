/**
 * Dual-Engine AI Copilot Service (Groq + Gemini + Local Heuristic Fallback)
 * Sub-300ms speed with Groq Llama 3.3 70B, Google Gemini structured output,
 * and 100% offline deterministic fallback.
 */

import { parseQuickTaskInput } from '../utils/parser';

// Deterministic offline heuristic parser for chaotic text or voice transcripts
function offlineBrainDumpExtraction(transcript) {
  const lines = transcript
    .split(/(?:\r\n|\n|\. |; |\band then\b|\balso\b)/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const tasks = [];
  let baseStart = 540; // 09:00 AM default cursor

  for (const line of lines) {
    const parsed = parseQuickTaskInput(line);
    let duration = parsed.durationMinutes || 30;
    let category = parsed.category || 'deep_work';

    // Heuristics based on common words
    const lower = line.toLowerCase();
    if (lower.includes('meet') || lower.includes('sync') || lower.includes('call') || lower.includes('1:1')) {
      category = 'meetings';
      duration = 30;
    } else if (lower.includes('email') || lower.includes('slack') || lower.includes('inbox') || lower.includes('jira') || lower.includes('pr review')) {
      category = 'admin';
      duration = 25;
    } else if (lower.includes('lunch') || lower.includes('break') || lower.includes('walk') || lower.includes('coffee')) {
      category = 'break';
      duration = 30;
    } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('read') || lower.includes('family')) {
      category = 'personal';
      duration = 45;
    }

    tasks.push({
      id: `task-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: parsed.title,
      durationMinutes: duration,
      category,
      priority: parsed.priority || 'q2_schedule',
      energyType: category === 'deep_work' ? 'deep' : category === 'break' ? 'break' : 'shallow',
      scheduledStartMinutes: parsed.scheduledStartMinutes,
      isBigRock: parsed.isBigRock || tasks.length === 0, // Default first task as big rock
      subtasks: [],
      notes: 'Extracted via Voice Ramble Mode',
      isSplittable: duration >= 60,
      rolloverCount: 0,
      createdAt: Date.now(),
    });

    baseStart += duration;
  }

  return tasks.length > 0
    ? tasks
    : [
        {
          id: `task-ai-${Date.now()}`,
          title: transcript.slice(0, 50),
          durationMinutes: 45,
          category: 'deep_work',
          priority: 'q1_do',
          energyType: 'deep',
          scheduledStartMinutes: null,
          isBigRock: true,
          subtasks: [],
          notes: transcript,
          isSplittable: false,
          rolloverCount: 0,
          createdAt: Date.now(),
        },
      ];
}

export async function parseBrainDumpWithAI({ transcript, provider = 'offline', apiKey = '' }) {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  // 1. Offline deterministic fallback
  if (provider === 'offline' || !apiKey) {
    return offlineBrainDumpExtraction(transcript);
  }

  const systemPrompt = `You are Chronos AI, an elite schedule extraction engine.
Analyze the user's voice ramble or chaotic notes and extract structured tasks.
Return ONLY valid JSON matching this schema:
{
  "tasks": [
    {
      "title": "string (concise, active verb)",
      "durationMinutes": number (15, 30, 45, 60, 90),
      "category": "deep_work" | "meetings" | "admin" | "personal" | "break",
      "priority": "q1_do" | "q2_schedule" | "q3_delegate" | "q4_eliminate",
      "energyType": "deep" | "shallow" | "break",
      "isBigRock": boolean (max 2 across list),
      "scheduledStartMinutes": number or null (e.g. 540 for 09:00),
      "subtasks": ["string subtask 1", "string subtask 2"]
    }
  ]
}`;

  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return formatExtractedTasks(parsed.tasks);
    } else if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${systemPrompt}\n\nUser input: "${transcript}"` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(content);
      return formatExtractedTasks(parsed.tasks);
    }
  } catch (err) {
    console.warn('[aiService] Online AI failed, using deterministic offline parser:', err);
    return offlineBrainDumpExtraction(transcript);
  }

  return offlineBrainDumpExtraction(transcript);
}

function formatExtractedTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) return [];
  return rawTasks.map((t, idx) => ({
    id: `task-ai-${Date.now()}-${idx}`,
    title: t.title || 'Untitled Action Item',
    durationMinutes: t.durationMinutes || 30,
    actualSecondsSpent: 0,
    scheduledStartMinutes: t.scheduledStartMinutes ?? null,
    isPinned: t.category === 'meetings',
    isBigRock: !!t.isBigRock,
    isSplittable: (t.durationMinutes || 30) >= 60,
    priority: t.priority || 'q2_schedule',
    category: t.category || 'deep_work',
    energyType: t.energyType || 'deep',
    status: 'todo',
    subtasks: (t.subtasks || []).map((st, sIdx) => ({
      id: `st-${idx}-${sIdx}`,
      title: typeof st === 'string' ? st : st.title || 'Step',
      completed: false,
    })),
    notes: 'Generated by Chronos AI',
    rolloverCount: 0,
    createdAt: Date.now(),
  }));
}

/**
 * Mindful decomposition for chronic rollover or large tasks
 */
export async function decomposeTaskWithAI({ taskTitle, provider = 'offline', apiKey = '' }) {
  if (provider === 'offline' || !apiKey) {
    return [
      { id: `step-1`, title: `Outline requirements & initial setup for ${taskTitle}`, durationMinutes: 15 },
      { id: `step-2`, title: `Execute core implementation block`, durationMinutes: 20 },
      { id: `step-3`, title: `Review, test edge cases, and finalize`, durationMinutes: 15 },
    ];
  }

  const prompt = `Break this intimidating task into 3 to 4 actionable, bite-sized steps (15-20m each):
Task: "${taskTitle}"
Return JSON:
{
  "steps": [
    { "title": "string", "durationMinutes": 15 }
  ]
}`;

  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed.steps.map((s, idx) => ({ id: `step-${idx}`, ...s }));
    }
  } catch (e) {
    console.warn('[aiService] decompose fallback', e);
  }

  return [
    { id: `step-1`, title: `Outline first 15m step for ${taskTitle}`, durationMinutes: 15 },
    { id: `step-2`, title: `Execute core deliverable`, durationMinutes: 20 },
    { id: `step-3`, title: `Review and ship`, durationMinutes: 15 },
  ];
}

