export const SEED_TASKS = [
  {
    id: 'seed-1',
    title: 'Architect React 19 State Layer & Coordinate Geometry',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 90,
    actualSecondsSpent: 5400,
    scheduledStartMinutes: 540, // 09:00 AM (Morning Peak)
    isPinned: false,
    isBigRock: true,
    isSplittable: true,
    rolloverCount: 0,
    priority: 'q1_do',
    category: 'deep_work',
    energyType: 'deep',
    status: 'completed',
    subtasks: [
      { id: 'st-1', title: 'Decouple FocusSession from PlannerData', completed: true },
      { id: 'st-2', title: 'Define interval graph coloring geometry', completed: true },
    ],
    notes: 'Prioritized zero-drift timers and Web Audio API lazy loading.',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'seed-2',
    title: 'Product Sync & Engineering Roadmap Review',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 45,
    actualSecondsSpent: 2700,
    scheduledStartMinutes: 645, // 10:45 AM
    isPinned: true, // Immovable meeting
    isBigRock: false,
    isSplittable: false,
    rolloverCount: 0,
    priority: 'q2_schedule',
    category: 'meetings',
    energyType: 'shallow',
    status: 'in_progress',
    subtasks: [{ id: 'st-3', title: 'Present auto-scheduling benchmark', completed: false }],
    notes: 'Meeting link: https://meet.chronos.internal',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'seed-3',
    title: 'Espresso & Movement Break',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 15,
    actualSecondsSpent: 0,
    scheduledStartMinutes: 690, // 11:30 AM
    isPinned: false,
    isBigRock: false,
    isSplittable: false,
    rolloverCount: 0,
    priority: 'q4_eliminate',
    category: 'break',
    energyType: 'break',
    status: 'todo',
    subtasks: [],
    notes: '',
    createdAt: Date.now(),
  },
  {
    id: 'seed-4',
    title: 'Procedural Web Audio Engine & Rain Synthesizer',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 60,
    actualSecondsSpent: 0,
    scheduledStartMinutes: 720, // 12:00 PM
    isPinned: false,
    isBigRock: true,
    isSplittable: true,
    rolloverCount: 0,
    priority: 'q1_do',
    category: 'deep_work',
    energyType: 'deep',
    status: 'todo',
    subtasks: [
      { id: 'st-4', title: 'Implement Paul Kellet pink noise', completed: false },
      { id: 'st-5', title: 'Add exponential gain ramps to eliminate clicks', completed: false },
    ],
    notes: '',
    createdAt: Date.now(),
  },
  {
    id: 'seed-5',
    title: 'Healthy Lunch & Outdoor Walk',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 45,
    actualSecondsSpent: 0,
    scheduledStartMinutes: 780, // 01:00 PM
    isPinned: true,
    isBigRock: false,
    isSplittable: false,
    rolloverCount: 0,
    priority: 'q2_schedule',
    category: 'personal',
    energyType: 'break',
    status: 'todo',
    subtasks: [],
    notes: 'Sunlight exposure for Circadian alignment.',
    createdAt: Date.now(),
  },
  {
    id: 'seed-6',
    title: 'Audit and triage GitHub pull requests',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 30,
    actualSecondsSpent: 0,
    scheduledStartMinutes: null,
    isPinned: false,
    isBigRock: false,
    isSplittable: false,
    rolloverCount: 3, // Chronic rollover example
    priority: 'q3_delegate',
    category: 'admin',
    energyType: 'shallow',
    status: 'todo',
    subtasks: [],
    notes: '',
    createdAt: Date.now(),
  },
  {
    id: 'seed-7',
    title: 'Draft weekly engineering standup summary',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 30,
    actualSecondsSpent: 0,
    scheduledStartMinutes: null,
    isPinned: false,
    isBigRock: false,
    isSplittable: false,
    rolloverCount: 0,
    priority: 'q2_schedule',
    category: 'admin',
    energyType: 'shallow',
    status: 'todo',
    subtasks: [],
    notes: '',
    createdAt: Date.now(),
  },
];

export const SEED_HABITS = [
  { id: 'h-1', title: 'Hydration Target (2.5L)', icon: 'Droplet', streak: 12, completedDates: [], frequency: 'daily' },
  { id: 'h-2', title: 'Deep Reading (20m)', icon: 'BookOpen', streak: 5, completedDates: [], frequency: 'daily' },
  { id: 'h-3', title: 'Mindfulness & Breathing', icon: 'Sun', streak: 8, completedDates: [], frequency: 'daily' },
  { id: 'h-4', title: 'Mobility & Posture Workout', icon: 'Activity', streak: 14, completedDates: [], frequency: 'daily' },
];

export const SEED_BLUEPRINTS = [
  {
    id: 'bp-maker',
    name: 'Maker Day',
    description: 'Uninterrupted morning deep work blocks with afternoon admin and recovery.',
    templateBlocks: [
      { title: 'Morning Deep Work Sprint', durationMinutes: 120, scheduledStartMinutes: 540, category: 'deep_work', energyType: 'deep', isPinned: false },
      { title: 'Decompression & Walk', durationMinutes: 30, scheduledStartMinutes: 660, category: 'break', energyType: 'break', isPinned: false },
      { title: 'Deep Work Sprint 2', durationMinutes: 90, scheduledStartMinutes: 690, category: 'deep_work', energyType: 'deep', isPinned: false },
      { title: 'Lunch Break', durationMinutes: 45, scheduledStartMinutes: 780, category: 'personal', energyType: 'break', isPinned: true },
      { title: 'Admin & Async Catchup', durationMinutes: 60, scheduledStartMinutes: 840, category: 'admin', energyType: 'shallow', isPinned: false },
    ],
  },
  {
    id: 'bp-sprint',
    name: 'Meeting Sprint',
    description: 'Consolidated back-to-back collaborative slots with focused follow-ups.',
    templateBlocks: [
      { title: 'Daily Standup & Alignment', durationMinutes: 30, scheduledStartMinutes: 540, category: 'meetings', energyType: 'shallow', isPinned: true },
      { title: 'Architecture Review', durationMinutes: 60, scheduledStartMinutes: 570, category: 'meetings', energyType: 'deep', isPinned: true },
      { title: 'Buffer & Notes', durationMinutes: 30, scheduledStartMinutes: 630, category: 'admin', energyType: 'shallow', isPinned: false },
      { title: 'Sprint Planning', durationMinutes: 60, scheduledStartMinutes: 660, category: 'meetings', energyType: 'shallow', isPinned: true },
    ],
  },
];

export const DEFAULT_SETTINGS = {
  theme: 'paper',
  dayStartMinutes: 360,           // 06:00 AM
  dayEndMinutes: 1380,            // 11:00 PM
  workdayStartMinutes: 510,       // 08:30 AM
  workdayEndMinutes: 1080,        // 06:00 PM
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  autoDecompressionEnabled: true, // Inserts 10m buffer after heavy tasks
  soundMuted: false,
  masterVolume: 0.6,
  aiProvider: 'offline',          // 'groq' | 'gemini' | 'offline'
  groqApiKey: '',
  geminiApiKey: '',
};

