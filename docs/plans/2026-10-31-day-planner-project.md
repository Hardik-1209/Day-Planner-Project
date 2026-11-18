# Chronos Flow — Flagship Studio Engineering Specification & Implementation Plan (v3.5)

> **For Claude / Antigravity:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build a studio-grade, high-aesthetic Day Planner web application in React 19 that synthesizes the finest workflows from **Linear**, **Notion Calendar (Cron)**, **Vercel Geist**, **Sunsama**, **Motion**, **Akiflow**, **FlowSavvy**, **Reclaim.ai**, and **Rise Science** into an offline-first system with deterministic timeline geometry, auto-chunking task splitting, live mid-session elasticity (`+15m Extend` & `Finish Early Pull Up`), voice "Ramble Mode" brain dumping, zero-backend `.ics` calendar sync, task aging anti-procrastination, Picture-in-Picture (PiP) focus timers, procedural ambient audio with live waveform visualizer, and a dual-engine AI Copilot (Groq + Gemini with local offline fallback).

**Architecture:**
- **Split Context Engine:** `PlannerDataContext` (debounced local storage persistence + 20-step undo/redo ring buffer) + `FocusSessionContext` (isolated high-frequency timer state & delta timestamp math).
- **Studio-Grade Design System & Universal Neutrals:** 4 universal neutral themes (`paper`, `daylight`, `obsidian`, `graphite`), 3-tuple category color tokens (`bg`, `spine`, `text`), 1px hairline split-pane desktop shell (`100dvh`), monochrome primary CTA contrast, strict Geist typography rules (ban bold 700/800, mandatory `tabular-nums`), and 3 adaptive density tiers for time blocks.
- **Deterministic Coordinate Canvas:** Integer-minute timeline math (`DAY_START_MINUTES = 360`, `PIXELS_PER_MINUTE = 1.5`, 15-minute snap) with native Pointer Events API (`setPointerCapture`), click-and-drag lasso time creation, ghost drop previews, drag-and-drop `.ics` calendar file drop-in, and interval graph greedy coloring for overlap partitioning.
- **Cascading Auto-Scheduler with Auto-Chunking & Decompression:** Intelligent bin-packing engine that splits tasks $\ge 60\text{m}$ across fragmented gaps, enforces category-specific work vs. personal scheduling windows (Morgen Frames), respects sequential `dependsOnTaskId` constraints, and automatically inserts 5–15m decompression buffers.
- **Voice "Ramble Mode" & Dual-Engine AI Copilot (`src/services/aiService.js`):** Native Web Speech API streaming speech-to-text paired with sub-300ms Groq (`llama-3.3-70b-versatile`) + Google Gemini (`gemini-2.5-flash`) structured JSON mode, with a deterministic local fallback for 100% offline functionality.
- **Focus & Audio Engine:** Native Document Picture-in-Picture API always-on-top mini timer with mid-session `+15m Extend & Push` and `Finish Early → Pull Up` cascades, lazy singleton `AudioContext` with exponential gain ramping (Rain, White Noise, Lo-Fi Drone), and `<canvas>` frequency waveform analyzer.

**Tech Stack:**
- **Framework:** React 19 + Vite
- **Styling:** Modern Vanilla CSS with CSS Custom Properties, hardware-accelerated composite layers (reserving `backdrop-filter` for fixed overlays), and fluid spring transitions
- **Icons:** `lucide-react` (strictly monochrome, `14px` and `16px` at `strokeWidth={1.75}`)
- **Voice & Media:** Web Speech API (`SpeechRecognition`), Web Audio API (`AudioContext`, `AnalyserNode`), Document Picture-in-Picture API
- **Effects & Utilities:** `canvas-confetti` (for ritual celebrations), zero-backend `.ics` iCalendar parser/serializer
- **Storage:** Schema-validated, versioned `localStorage` with 300ms debouncing and JSON backup/restore

---

## 1. Competitive Research & Market Benchmark Synthesis (v3.5)

| Competitive Benchmark | Signature Workflow / Feature | How Chronos Flow Implements & Elevates It |
| :--- | :--- | :--- |
| **FlowSavvy & Motion** | Auto-chunking large tasks across calendar gaps | **Algorithmic Auto-Chunking:** Tasks $\ge 60\text{m}$ that cannot fit in a single gap automatically split into linked sub-blocks (`Part 1/2`, `Part 2/2`, min `30m`) across optimal Circadian slots. Right-click 1-click manual split. |
| **ClickUp HourStack & FlowSavvy** | Live mid-session elasticity | **`+15m Extend & Push`:** 1-click in Focus Mode or Card adds 15m to duration and active timer, cascading afternoon unpinned tasks down. **`Finish Early → Pull Up`:** Checking off $\ge 15\text{m}$ early triggers an interactive toast to trim the block and compact subsequent tasks forward. |
| **Todoist & Structured** | Voice stream-of-consciousness entry | **Voice "Ramble Mode":** Zero-dependency browser `SpeechRecognition` API in `AIBrainDumpModal.jsx` and `QuickTaskInput.jsx`. Hold `V` or click mic to dictate chaotic thoughts; pipes live transcript straight into Groq Llama 3.3 70B for instant schedule extraction. |
| **Sunsama** | Anti-procrastination & mindful pacing | **Task Aging Detector:** `rolloverCount` tracks deferrals. Shows a warm dot at $2\times$ and amber badge at $\ge 3\times$. Step 1 of `MorningKickoffModal` intercepts chronic rollovers with 3 choices: `[AI Break Into 15m Steps]`, `[Shrink to 15m Starter Block]`, or `[Drop to Someday]`. |
| **Morgen 4 & Reclaim.ai** | Work vs. Personal Frames & Blueprints | **Category-Bound Windows:** Work categories (`deep_work`, `meetings`, `admin`) strictly scheduled within `workdayStartMinutes` (`08:30`) – `workdayEndMinutes` (`18:00`). Personal tasks route to pre-work (`06:30–08:30`) or evening (`18:00–21:30`). **Day Blueprints:** Save & load recurring day templates (Maker Day, Meeting Sprint, Weekend Reset). |
| **Notion Calendar (Cron)** | Frictionless calendar sync | **Zero-Backend `.ics` Drop-In & Export:** Drag-and-drop any `.ics` file (Google, Outlook, Apple Calendar) onto `TimelineCanvas` to create pinned meeting blocks. 1-click "Export Day to `.ics`" to push finalized schedules to smartwatch/phone. |
| **Reclaim.ai & Clockwise** | Decompression buffers & dependencies | **Auto-Decompression:** Automatically inserts 5–15m buffers after heavy blocks (`deep_work` $\ge 60\text{m}$ or `meetings` $\ge 45\text{m}$). **Sequential `dependsOnTaskId`:** Guarantees prerequisite tasks are scheduled before dependents. |

---

## 2. Studio-Grade UI Design System, Universal Neutral Themes & Anti-"AI-Slop" Guardrails

### A. Universal Neutral Theme System (`src/index.css`)
Instead of novelty sci-fi or purple themes, Chronos Flow ships with **4 universally appealing architectural neutral themes** (2 Light + 2 Dark) modeled on **Vercel Geist**, **Radix UI Neutral Scales (Sand, Slate, Gray)**, and **Notion Calendar**.

Primary interactive elements (primary buttons, active view toggles, selected states) use **high-contrast monochrome** (`--accent-primary` with `--accent-contrast-text`) rather than generic indigo/purple fills. Color appears strictly on semantic data (timeline blocks, 8px category dots, and the live current-time indicator).

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Strict Desktop-App Typography Scale (Scan-First Density) */
  --text-2xs: 0.6875rem; /* 11px - Timestamps, keyboard shortcut kbd tags, badges */
  --text-xs:  0.75rem;   /* 12px - Compact timeline cards, metadata, column headers */
  --text-sm:  0.8125rem; /* 13px - Default UI body, backlog items, buttons, inputs */
  --text-base: 0.875rem; /* 14px - Section titles, modal body text */
  --text-lg:  1rem;      /* 16px - Modal headers, active date title */
  --text-xl:  1.25rem;   /* 20px - Ritual step headers */
  --text-timer: 3.5rem;  /* 56px - Focus mode tabular countdown */

  /* Architectural Radii */
  --radius-xs: 4px;      /* Timeline time-blocks, kbd tags */
  --radius-sm: 6px;      /* Buttons, inputs, dropdown items */
  --radius-md: 8px;      /* Backlog cards, popover menus */
  --radius-lg: 12px;     /* Modals, command palette */

  /* 4px Spatial Grid System */
  --header-height: 48px;
  --left-rail-width: 300px;
  --right-rail-width: 272px;

  /* Live Indicator Signal (Cron / Braun International Orange) */
  --signal-now: #E54D2E;
}

/* ==========================================================================
   1. WARM PAPER (Default Light — Radix Sand / Notion Warm Daylight)
   Zero-glare warm alabaster designed for comfortable 8-hour daytime planning
   ========================================================================== */
:root[data-theme='paper'] {
  --bg-canvas: #F9F8F6;
  --bg-panel: #F3F1ED;
  --bg-elevated: #FFFFFF;
  --bg-hover: #EAE7E1;
  --bg-active: #E2DFD7;
  --border-hairline: #E4E2DC;
  --border-strong: #D0CDC4;

  --text-primary: #161615;
  --text-secondary: #575652;
  --text-muted: #8C8A84;

  --accent-primary: #161615;
  --accent-contrast-text: #FAF9F6;
  --focus-ring: 0 0 0 2px #F9F8F6, 0 0 0 4px #161615;

  --timeline-hour-line: #E9E7E0;
  --timeline-half-line: #F2F0EA;
  --shadow-float: 0 12px 32px -4px rgba(22, 22, 21, 0.08), 0 2px 6px -1px rgba(22, 22, 21, 0.04);

  /* 3-Tuple Semantic Category Palette (Bg Tint, 3px Spine, Hue-Matched Text) */
  --cat-deep-bg: #EEF2FF;     --cat-deep-spine: #3B5CCC;     --cat-deep-text: #1E3A8A;
  --cat-meeting-bg: #FEF3C7;  --cat-meeting-spine: #D97706;  --cat-meeting-text: #78350F;
  --cat-admin-bg: #ECFDF5;    --cat-admin-spine: #059669;    --cat-admin-text: #064E3B;
  --cat-personal-bg: #FCE7F3; --cat-personal-spine: #DB2777; --cat-personal-text: #831843;
  --cat-break-bg: #F1F5F9;    --cat-break-spine: #64748B;    --cat-break-text: #334155;
}

/* ==========================================================================
   2. CRISP DAYLIGHT (Pure Neutral Light — Vercel Geist / Apple macOS Light)
   High-clarity neutral white & cool slate for bright studio environments
   ========================================================================== */
:root[data-theme='daylight'] {
  --bg-canvas: #FFFFFF;
  --bg-panel: #FAFAFA;
  --bg-elevated: #FFFFFF;
  --bg-hover: #F2F2F2;
  --bg-active: #E6E6E6;
  --border-hairline: #EAEAEA;
  --border-strong: #D4D4D4;

  --text-primary: #171717;
  --text-secondary: #525252;
  --text-muted: #8E8E8E;

  --accent-primary: #171717;
  --accent-contrast-text: #FFFFFF;
  --focus-ring: 0 0 0 2px #FFFFFF, 0 0 0 4px #171717;

  --timeline-hour-line: #EFEFEF;
  --timeline-half-line: #F7F7F7;
  --shadow-float: 0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);

  --cat-deep-bg: #F0F4FF;     --cat-deep-spine: #2563EB;     --cat-deep-text: #1E3A8A;
  --cat-meeting-bg: #FFFBEB;  --cat-meeting-spine: #D97706;  --cat-meeting-text: #78350F;
  --cat-admin-bg: #F0FDF4;    --cat-admin-spine: #16A34A;    --cat-admin-text: #14532D;
  --cat-personal-bg: #FDF2F8; --cat-personal-spine: #E11D48; --cat-personal-text: #881337;
  --cat-break-bg: #F8FAFC;    --cat-break-spine: #64748B;    --cat-break-text: #334155;
}

/* ==========================================================================
   3. GEIST OBSIDIAN (Default Dark — Pure Achromatic Matte Carbon)
   Zero blue/purple cast; true neutral dark with crisp hairline separation
   ========================================================================== */
:root[data-theme='obsidian'] {
  --bg-canvas: #0A0A0A;
  --bg-panel: #111111;
  --bg-elevated: #171717;
  --bg-hover: #1F1F1F;
  --bg-active: #262626;
  --border-hairline: #222222;
  --border-strong: #333333;

  --text-primary: #EDEDEF;
  --text-secondary: #A1A1AA;
  --text-muted: #63636B;

  --accent-primary: #EDEDEF;
  --accent-contrast-text: #0A0A0A;
  --focus-ring: 0 0 0 2px #0A0A0A, 0 0 0 4px #EDEDEF;

  --timeline-hour-line: #1A1A1A;
  --timeline-half-line: #131313;
  --shadow-float: 0 16px 40px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.07);

  --cat-deep-bg: rgba(59, 130, 246, 0.13);   --cat-deep-spine: #3B82F6;     --cat-deep-text: #DBEAFE;
  --cat-meeting-bg: rgba(245, 158, 11, 0.13);--cat-meeting-spine: #F59E0B;  --cat-meeting-text: #FEF3C7;
  --cat-admin-bg: rgba(16, 185, 129, 0.13);  --cat-admin-spine: #10B981;    --cat-admin-text: #D1FAE5;
  --cat-personal-bg: rgba(236, 72, 153, 0.13);--cat-personal-spine: #EC4899;--cat-personal-text: #FCE7F3;
  --cat-break-bg: rgba(148, 163, 184, 0.11); --cat-break-spine: #64748B;    --cat-break-text: #E2E8F0;
}

/* ==========================================================================
   4. GRAPHITE SLATE (Soft Dark — Linear LCH / Eye-Care Low-Contrast Charcoal)
   Eliminates pure-black OLED halation for comfortable late-evening work
   ========================================================================== */
:root[data-theme='graphite'] {
  --bg-canvas: #121316;
  --bg-panel: #17181C;
  --bg-elevated: #1E2025;
  --bg-hover: #25272D;
  --bg-active: #2C2F36;
  --border-hairline: #262930;
  --border-strong: #363A44;

  --text-primary: #E4E5E9;
  --text-secondary: #989CA6;
  --text-muted: #5F636E;

  --accent-primary: #E4E5E9;
  --accent-contrast-text: #121316;
  --focus-ring: 0 0 0 2px #121316, 0 0 0 4px #E4E5E9;

  --timeline-hour-line: #1D1F24;
  --timeline-half-line: #17191D;
  --shadow-float: 0 16px 36px -4px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06);

  --cat-deep-bg: rgba(96, 165, 250, 0.14);   --cat-deep-spine: #60A5FA;     --cat-deep-text: #E0F2FE;
  --cat-meeting-bg: rgba(251, 191, 36, 0.13);--cat-meeting-spine: #FBBF24;  --cat-meeting-text: #FEF3C7;
  --cat-admin-bg: rgba(52, 211, 153, 0.13);  --cat-admin-spine: #34D399;    --cat-admin-text: #D1FAE5;
  --cat-personal-bg: rgba(244, 114, 182, 0.13);--cat-personal-spine: #F472B6;--cat-personal-text: #FCE7F3;
  --cat-break-bg: rgba(148, 163, 184, 0.12); --cat-break-spine: #94A3B8;    --cat-break-text: #E2E8F0;
}
```

### B. Strict "Anti-AI-Slop" Visual & Structural Rules (Mandatory for All Components)

1. **Typography Discipline (Geist Rules):**
   - **Ban `font-weight: 700` (Bold) and `800` (ExtraBold):** Use only `400` (Regular) for body/metadata, `500` (Medium) for task titles and buttons, and `600` (SemiBold) for modal headers and the active date.
   - **Mandatory Tabular Numerals:** Every clock, timestamp (`09:00`), duration badge (`45m`), streak counter, and Pomodoro countdown must apply `font-variant-numeric: tabular-nums` so numbers never jitter horizontally.
   - **Tight Negative Tracking on Headers:** Modal titles and date headers (`>= 16px`) must use `letter-spacing: -0.02em`.
   - **No ALL-CAPS Tracking Bloat:** Section labels in the sidebar (`Backlog`, `Habits`, `Schedule`) use `12px` sentence-case `font-weight: 500` in `--text-muted`, not screaming `10px` uppercase tracked-out text.

2. **Single-Border Split-Pane App Shell (`100dvh`, Zero Page Scroll):**
   - The application is a fixed desktop-class viewport (`height: 100dvh; overflow: hidden; display: grid`). Only the internal `<BacklogDrawer>` list and `<TimelineCanvas>` scroll vertically.
   - **Draw Each Border Once:** Never place two bordered boxes next to each other. `<Header>` has `border-bottom: 1px solid var(--border-hairline)`. `<Sidebar>` has `border-right: 1px solid var(--border-hairline)`. `<RightWidgetBar>` has `border-left: 1px solid var(--border-hairline)`.

3. **Ghost-First Button Architecture & Zero Bounce Animations:**
   - **Ban Hover Scaling/Bouncing:** Never use `transform: translateY(-2px)` or `transform: scale(1.03)` on buttons or cards. Interactions are strictly instantaneous `120ms ease` background/text color transitions.
   - **3 Button Variants Only:**
     - `primary`: Solid `--accent-primary` background with `--accent-contrast-text` (used *only* for 1 primary CTA per view, e.g., `"Auto-Schedule"` or `"Start Ritual"`).
     - `secondary`: `--bg-elevated` with `1px solid var(--border-hairline)` and `--text-primary`.
     - `ghost` (Default for 80% of toolbar/header/card actions): `transparent` background, `--text-secondary`, filling with `--bg-hover` and promoting text to `--text-primary` on hover.

4. **Subtle Circadian Gutter Indicator (No Rainbow Canvas Gradients):**
   - **Do NOT paint a giant rainbow gradient across the entire timeline background.** Instead, render the Circadian Energy Curve as a **subtle `3px` vertical indicator bar inside the `56px` left time-label gutter** alongside the hour numbers (`09:00`, `10:00`), with a tiny monochrome icon tooltip on hover (`09:00–12:00 · Peak Focus Window`). This keeps the timeline canvas clean and architectural.

5. **Inline Metric Strips Instead of "AI Dashboard Stat Boxes":**
   - In `<RightWidgetBar>` and `<AnalyticsModal>`, never render a grid of 4 rounded stat cards with big colorful icons in circles. Render metrics as a **clean horizontal or vertical tabular ledger** separated by `1px solid var(--border-hairline)` dividers (e.g., `Planned: 6.5h  |  Completed: 4.0h  |  Accuracy: 94%`).

### C. Cron-Style Card Architecture with 3 Adaptive Density Tiers
Timeline cards use a flat, low-opacity semantic tint with a razor-sharp **`3px` solid left-accent spine**, a top specular highlight, and a `2px` vertical margin gap (`height: calc(duration * 1.5px - 2px)`).

Cards dynamically switch DOM layout based on `durationMinutes`:

```
1. Compact Mode (duration <= 30m / 22.5px - 45px tall):
   ┌──┬────────────────────────────────────────────────────────┐
   │▌ │ [ ] Truncated Task Title                    09:00 - 09:30│
   └──┴────────────────────────────────────────────────────────┘
   * Single flex row, 13px custom checkbox, 12px title, tabular time.

2. Standard Mode (duration 45m - 60m / 67.5px - 90px tall):
   ┌──┬────────────────────────────────────────────────────────┐
   │▌ │ [ ] Task Title Goes Here          [+15m] [Pin] [Focus] │
   │▌ │ 09:00 - 10:00 · ● Deep Work · 2/4 Subtasks             │
   └──┴────────────────────────────────────────────────────────┘
   * Two rows. Row 1: Checkbox, title, quick action icons (+15m, Pin, Focus).
   * Row 2: Time span, category dot, subtask counter.

3. Deep Block Mode (duration >= 75m / 112.5px+ tall):
   ┌──┬────────────────────────────────────────────────────────┐
   │▌ │ [ ] Deep Architectural Refactoring     [+15m] [Split]  │
   │▌ │ 10:00 - 11:30 (90m) · ● Deep Work · Part 1/2           │
   │▌ │ ├─ [x] Subtask A: Schema definitions                   │
   │▌ │ └─ [ ] Subtask B: Migration tests                      │
   │▌ │ [=========================--------] 45m / 90m actual   │
   └──┴────────────────────────────────────────────────────────┘
   * Multi-row layout. Interactive subtask checkboxes right on the canvas.
   * Estimation calibration progress bar pinned to bottom edge.
```

---

## 3. Data Schema & State Architecture (v3.5)

### A. Split Context Architecture with Undo/Redo History Stack

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                       <AppProvider>                                       │
│                                                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │                      PlannerDataProvider (Low Frequency Data)                     │   │
│   │  - tasks: Task[] (Normalized array of all backlog & scheduled items)             │   │
│   │  - habits: Habit[] (Micro-habits with date-streak tracking)                       │   │
│   │  - blueprints: Blueprint[] (Reusable day templates: Maker Day, Sprint...)         │   │
│   │  - dailyLogs: Record<string, DailyLog> (Reflections, gratitude, scores)          │   │
│   │  - activeDate: string ("YYYY-MM-DD")                                              │   │
│   │  - horizonMode: '1D' | '3D' (Rolling 3-day view support)                          │   │
│   │  - settings: AppSettings (Workday hours, theme, AI provider & keys)               │   │
│   │  - history: 20-step ring buffer for Ctrl+Z / Cmd+Z undo & redo                    │   │
│   │                                                                                   │   │
│   │  * Debounced 300ms persistence to localStorage (schemaVersion: 3)                  │   │
│   │  * Dispatches Toast notification on bulk mutations with [Undo] action             │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                              │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │                      FocusSessionProvider (High Frequency State)                  │   │
│   │  - activeTaskId: string | null                                                    │   │
│   │  - targetEndTimestamp: number | null (Epoch ms)                                   │   │
│   │  - pausedRemainingMs: number                                                      │   │
│   │  - isRunning: boolean                                                             │   │
│   │  - mode: 'pomodoro' | 'short_break' | 'long_break' | 'flow'                       │   │
│   │  - isPiPActive: boolean (Picture-in-Picture window state)                         │   │
│   │  - ambientSound: 'rain' | 'whitenoise' | 'lofi' | 'off'                           │   │
│   │  - volume: number (0.0 to 1.0)                                                    │   │
│   │  - scratchpadNote: string                                                         │   │
│   │                                                                                   │   │
│   │  * Re-renders: Isolated to <FocusModeModal> and PiP mini window                   │   │
│   │  * Drift-free delta timestamp calculation + visibilitychange listener             │   │
│   └───────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Upgraded Normalized `Task` Entity
```typescript
interface Task {
  id: string;                          // UUID v4
  title: string;                       // Clean task label
  date: string;                        // "YYYY-MM-DD"
  durationMinutes: number;             // 15, 30, 45, 60, 90, 120...
  actualSecondsSpent: number;          // Cumulative seconds accumulated during focus sessions
  scheduledStartMinutes: number | null;// null = Unscheduled Backlog; 360 to 1380 = Timeline (06:00 to 23:00)
  isPinned: boolean;                   // If true, immovable wall during Smart Reshuffle (e.g. meetings)
  isBigRock: boolean;                  // Max 3 per day, chosen in Morning Kickoff
  priority: 'q1_do' | 'q2_schedule' | 'q3_delegate' | 'q4_eliminate'; // Eisenhower Quadrants
  category: 'deep_work' | 'meetings' | 'admin' | 'personal' | 'break';
  energyType: 'deep' | 'shallow' | 'admin' | 'break'; // Circadian rhythm matching
  status: 'todo' | 'in_progress' | 'completed' | 'deferred';
  subtasks: Array<{ id: string; title: string; completed: boolean; estimatedMinutes?: number }>;
  notes: string;
  createdAt: number;
  
  // v3.5 Additions
  rolloverCount: number;               // Increments each Evening Shutdown rollover; triggers AI intervention at >= 3
  isSplittable: boolean;               // Allows auto-scheduler to split tasks >= 60m across smaller gaps
  parentTaskId?: string;               // Links split chunks ("Part 1/2", "Part 2/2")
  partLabel?: string;                  // e.g. "1/2", "2/2"
  dependsOnTaskId?: string;            // Ensures task is never scheduled before its prerequisite
  bufferMinutesAfter?: number;         // 5m-15m decompression buffer automatically allocated after block
}
```

### C. Day Blueprint Entity (Reusable Day Templates)
```typescript
interface Blueprint {
  id: string;
  name: string;                        // e.g., "Maker Day", "Meeting Sprint", "Weekend Reset"
  description: string;
  templateBlocks: Array<{
    title: string;
    durationMinutes: number;
    scheduledStartMinutes: number;
    category: 'deep_work' | 'meetings' | 'admin' | 'personal' | 'break';
    energyType: 'deep' | 'shallow' | 'admin' | 'break';
    isPinned: boolean;
  }>;
}
```

### D. App Settings Entity
```typescript
interface AppSettings {
  theme: 'paper' | 'daylight' | 'obsidian' | 'graphite';
  dayStartMinutes: number;             // Default 360 (06:00 AM)
  dayEndMinutes: number;               // Default 1380 (11:00 PM)
  workdayStartMinutes: number;         // Default 510 (08:30 AM - auto-schedule boundary)
  workdayEndMinutes: number;           // Default 1080 (06:00 PM)
  pomodoroWorkMinutes: number;         // Default 25
  pomodoroBreakMinutes: number;        // Default 5
  autoDecompressionEnabled: boolean;   // Inserts 10m buffer after heavy tasks
  soundMuted: boolean;
  masterVolume: number;                // 0.0 to 1.0
  aiProvider: 'groq' | 'gemini' | 'offline';
  groqApiKey?: string;
  geminiApiKey?: string;
}
```

---

## 4. Algorithmic Scheduling Engine with Auto-Chunking & Decompression

### A. Slot Fitness Scoring with Morgen Frames & Dependencies
```javascript
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

  // 2. Enforce Work vs. Personal Scheduling Windows (Morgen / FlowSavvy Profiles)
  if (task.category === 'personal') {
    const inMorningPersonal = slotStart >= 390 && taskEnd <= workStart; // 06:30 - 08:30 AM
    const inEveningPersonal = slotStart >= workEnd && taskEnd <= 1290;  // 18:00 - 21:30 PM
    if (!inMorningPersonal && !inEveningPersonal) return -100;
    return 80;
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

  if (slotDuration === task.durationMinutes) score += 15;
  return score;
}
```

### B. Auto-Chunking & Task Splitting Algorithm
When a task $\ge 60\text{m}$ cannot fit into any single free gap, `autoScheduleDay` splits it into linked chunks across available gaps:

```javascript
/**
 * Auto-schedules backlog tasks, automatically splitting large tasks if needed.
 */
export function autoScheduleDay(tasks, settings) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  let updatedTasks = [...tasks];

  // 1. Identify occupied intervals from ALL currently scheduled tasks
  const occupied = updatedTasks
    .filter((t) => t.scheduledStartMinutes !== null && t.status !== 'deferred')
    .map((t) => {
      const buffer = (settings?.autoDecompressionEnabled && (t.category === 'deep_work' || t.category === 'meetings')) ? 10 : 0;
      return {
        start: t.scheduledStartMinutes,
        end: t.scheduledStartMinutes + t.durationMinutes + buffer,
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

  // 3. Sort backlog tasks by Priority, Big Rock status, and Duration
  const unscheduled = updatedTasks
    .filter((t) => t.scheduledStartMinutes === null && t.status !== 'completed')
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
        updatedTasks[idx] = {
          ...updatedTasks[idx],
          scheduledStartMinutes: slot.start,
        };
        slot.start += task.durationMinutes;
        slot.duration -= task.durationMinutes;
        placed = true;
        break;
      }
    }

    // Auto-chunking: If task >= 60m cannot fit, split into 2 chunks
    if (!placed && (task.isSplittable ?? true) && task.durationMinutes >= 60) {
      const part1Duration = Math.round((task.durationMinutes / 2) / 15) * 15;
      const part2Duration = task.durationMinutes - part1Duration;

      // Find first slot for Part 1
      const slot1 = freeSlots.find((s) => s.duration >= part1Duration && scoreSlotForTask(s.start, part1Duration, task, settings, taskMap) > 0);
      if (slot1) {
        const originalIdx = updatedTasks.findIndex((t) => t.id === task.id);
        const part2Id = `${task.id}-part-2`;

        // Update Part 1
        updatedTasks[originalIdx] = {
          ...updatedTasks[originalIdx],
          durationMinutes: part1Duration,
          scheduledStartMinutes: slot1.start,
          partLabel: '1/2',
        };
        slot1.start += part1Duration;
        slot1.duration -= part1Duration;

        // Find second slot for Part 2
        const slot2 = freeSlots.find((s) => s.duration >= part2Duration && s.start >= updatedTasks[originalIdx].scheduledStartMinutes + part1Duration);
        if (slot2) {
          const part2Task = {
            ...task,
            id: part2Id,
            title: `${task.title} (Part 2)`,
            durationMinutes: part2Duration,
            scheduledStartMinutes: slot2.start,
            parentTaskId: task.id,
            partLabel: '2/2',
            dependsOnTaskId: task.id,
            subtasks: [],
          };
          slot2.start += part2Duration;
          slot2.duration -= part2Duration;
          updatedTasks.push(part2Task);
          placed = true;
        }
      }
    }
  }

  return updatedTasks;
}
```

---

## 5. Live Mid-Session Elasticity & Timeline Interactions

### A. `+15m Extend & Push` (Inside Focus Mode & Task Cards)
- Clicking `+15m Extend`:
  1. Increments `durationMinutes` by 15.
  2. Extends `targetEndTimestamp` in `FocusSessionContext` by `15 * 60 * 1000ms`.
  3. Cascades any immediately adjacent unpinned tasks forward by 15 minutes, jumping over pinned meetings.
  4. Dispatches an action toast: `"+15m added to active task — afternoon schedule adjusted"`.

### B. `Finish Early → Compact & Pull Up`
- When a user marks a task completed $\ge 15\text{m}$ before its scheduled end:
  1. Truncates `durationMinutes` to the actual minutes spent (`actualSecondsSpent / 60`).
  2. Triggers an interactive bottom toast:
     ```
     [Celebration] Finished 30m early! Compact block and pull forward?   [Pull Forward]
     ```
  3. Clicking `[Pull Forward]` slides all flexible afternoon tasks up into the newly created gap.

### C. Zero-Backend `.ics` Calendar File Drop-In (`src/utils/icsHelper.js`)
- **Drag-and-Drop `.ics` on Timeline:**
  - Dropping an `.ics` export from Google Calendar, Apple Calendar, or Outlook directly onto `TimelineCanvas` parses `VEVENT` blocks.
  - Automatically generates `isPinned: true, category: 'meetings'` tasks for the matching date with titles, times, and meeting locations.
- **1-Click "Export Day to `.ics`":**
  - Generates a valid standard RFC 5545 `.ics` file containing all scheduled blocks for the active day.
  - Downloads directly with 1 click so users can sync their schedule to their phone or smartwatch.

---

## 6. Voice "Ramble Mode" & Dual-Engine AI Copilot

### A. Web Speech API Voice "Ramble Mode"
- Built into `AIBrainDumpModal.jsx` (`Cmd+J`) and `QuickTaskInput.jsx`.
- **Interaction:**
  - Hold key `V` or click the microphone icon.
  - Uses native `window.webkitSpeechRecognition || window.SpeechRecognition` with continuous listening and interim results.
  - Displays a live animated recording pulse.
  - As the user speaks, text streams live into the prompt container.
  - On stop, immediately sends transcript to Groq `llama-3.3-70b-versatile` (or Gemini 2.5 Flash).

### B. Dual-Engine AI Copilot Service (`src/services/aiService.js`)
- Supports **Groq (`llama-3.3-70b-versatile`)** for sub-300ms speed, **Google Gemini (`gemini-2.5-flash`)** for structured JSON mode, and a **Deterministic Local Heuristic Fallback** for 100% offline functionality without API keys.

---

## 7. Daily Rituals & Task Aging Anti-Procrastination Intervention

### A. Task Aging Memory (`rolloverCount`)
- Every time a task is rolled over to the next day in `EveningShutdownModal`, its `rolloverCount` increments by 1.
- **Card Badges:**
  - `rolloverCount === 2`: Small warm orange dot.
  - `rolloverCount >= 3`: Distinctive amber badge `"Rolled over 3×"`.

### B. Morning Kickoff Anti-Procrastination Intervention
- In Step 1 of `MorningKickoffModal.jsx`:
  - Tasks with `rolloverCount >= 3` are flagged with an **Anti-Procrastination Alert Card**.
  - Provides 3 guided resolution actions:
    1. **`[Sparkles: AI Break Into 15m Steps]`**: Automatically decomposes the intimidating block into small wins.
    2. **`[Shrink to 15m Starter Block]`**: Trims duration to 15m just to overcome starting inertia.
    3. **`[Drop to Someday Backlog]`**: Relieves psychological guilt by unscheduling the item without deleting it.

---

## 8. Strict Monochrome Seed Dataset (`src/utils/seedData.js`)

All inline emojis stripped. Clean monochrome icons:

```javascript
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
  // Unscheduled Backlog items
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
];
```

---

## 9. Granular 8-Task Implementation Specification

### Task 1: Scaffolding, Universal Neutral Tokens & Anti-Slop App Shell
- **Files to create:**
  - `src/index.css` (Tokens for `paper`, `daylight`, `obsidian`, `graphite`, 3-tuple category colors, tabular numerals, 1px split-pane layout grid)
  - `src/context/ThemeContext.jsx` (Defaults to `'paper'` during daytime 07:00–19:00 or respects `prefers-color-scheme`, with instant 1-click switcher for all 4 neutral themes)
  - `src/components/ui/Button.jsx` (Ghost-first, secondary hairline, and monochrome primary variants — zero bounce transforms)
  - `src/components/ui/Badge.jsx` (Subtle semantic tint pills with `tabular-nums`)
- **Verification:** Vite runs cleanly; switching between `Warm Paper`, `Crisp Daylight`, `Geist Obsidian`, and `Graphite Slate` updates all surfaces, 3-part category tokens, and 1px hairlines with zero indigo/purple AI clichés.

### Task 2: High-Performance Storage, Split Contexts & Undo Stack
- **Files to create:**
  - `src/hooks/useLocalStorage.js` (with 300ms debounce & schema v3 validation)
  - `src/hooks/useHistoryStack.js` (20-step undo/redo buffer with `Ctrl+Z` / `Cmd+Z`)
  - `src/components/ui/ToastManager.jsx`
  - `src/context/PlannerDataContext.jsx`
  - `src/context/FocusSessionContext.jsx`
  - `src/utils/seedData.js`
- **Verification:** Seed tasks and blueprints load; modifying a task creates an undo checkpoint; toast notification appears with working `Undo` trigger.

### Task 3: Timeline Geometry, Lasso Creation, 3 Adaptive Densities & `.ics` Drop-In
- **Files to create:**
  - `src/utils/timeHelpers.js` (`computeTimelineOverlapGeometry`, coordinate formulas)
  - `src/utils/icsHelper.js` (RFC 5545 `.ics` drag-and-drop parser & exporter)
  - `src/components/timeline/TimelineCanvas.jsx` (click-and-drag lasso time-creation & `.ics` drop target)
  - `src/components/timeline/TimeBlockCard.jsx` (3 density tiers: Compact, Standard, Deep with `+15m Extend` and `Split` actions)
  - `src/components/timeline/CurrentTimeLine.jsx` (International Orange line `#E54D2E` with pulsating beacon)
  - `src/components/timeline/QuickBufferBar.jsx`
- **Verification:** Dragging on empty timeline draws lasso box and opens inline creation popover. Overlapping tasks render side-by-side with 3px accent spines. Dropping an `.ics` file creates pinned meeting blocks instantly.

### Task 4: Natural Language Parser, Backlog Drawer & Eisenhower Matrix
- **Files to create:**
  - `src/utils/parser.js`
  - `src/components/workspace/QuickTaskInput.jsx` (with voice mic button)
  - `src/components/workspace/BacklogDrawer.jsx` (with task aging badges)
  - `src/components/workspace/EisenhowerMatrix.jsx`
- **Verification:** Typing `Refactor auth #deepwork !high ~45m @10:30 *` parses tokens dynamically. Dragging task from Backlog onto timeline shows dashed ghost indicator and collision warnings.

### Task 5: Guided 4-Step Daily Rituals & Task Aging Interventions
- **Files to create:**
  - `src/components/ui/Modal.jsx`
  - `src/components/modals/MorningKickoffModal.jsx` (Backlog triage with rollover $\ge 3\times$ intervention $\to$ Big rocks $\to$ Workload barometer $\to$ Intention & Blueprints)
  - `src/components/modals/EveningShutdownModal.jsx` (Confetti celebration $\to$ Rollover counter increment $\to$ Gratitude $\to$ Score)
- **Verification:** 4 steps operate sequentially. Chronic rollover tasks trigger mindful intervention options. Evening shutdown increments `rolloverCount` on deferred tasks.

### Task 6: Picture-in-Picture Focus Timer, Mid-Session Elasticity & Procedural Audio
- **Files to create:**
  - `src/utils/audioSynthesizer.js` (Paul Kellet pink noise, lo-fi drone, AnalyserNode)
  - `src/hooks/useAmbientSound.js`
  - `src/components/modals/FocusModeModal.jsx` (with native `documentPictureInPicture`, `+15m Extend & Push`, `Finish Early` toast, and `<canvas>` waveform)
- **Verification:** Audio transitions smoothly with exponential ramping. PiP button opens mini floating countdown window. `+15m Extend` pushes subsequent tasks forward gracefully.

### Task 7: Auto-Scheduler with Auto-Chunking, Circadian Windows & Decompression
- **Files to create:**
  - `src/utils/autoScheduler.js` (with auto-chunking, Morgen frames, decompression buffers, and overflow protection)
  - Wire actions into `<Header>` and `<BacklogDrawer>`
- **Verification:** Tasks $\ge 60\text{m}$ split into Part 1/2 across fragmented slots. Work tasks never schedule outside workday bounds. Pinned meetings act as immovable boundaries.

### Task 8: Voice "Ramble Mode", Dual-Engine AI Copilot & 7-Day Ribbon
- **Files to create:**
  - `src/services/aiService.js` (Groq Llama 3.3 70B + Gemini 2.5 Flash + offline fallback)
  - `src/components/modals/AIBrainDumpModal.jsx` (`Cmd+J` Magic Capture with SpeechRecognition Ramble Mode)
  - `src/components/modals/AISettingsModal.jsx`
  - `src/components/workspace/HabitTrackerRail.jsx`
  - `src/components/modals/CommandPalette.jsx` (`Ctrl+K`)
  - `src/components/modals/AnalyticsModal.jsx`
- **Verification:** Speaking into Ramble Mode streams live transcript and extracts structured tasks via AI. `Ctrl+K` opens fuzzy action search. 7-Day week ribbon navigates between days with task load indicators.

---
