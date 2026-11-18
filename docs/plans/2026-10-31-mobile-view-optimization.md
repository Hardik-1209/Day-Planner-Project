# Mobile View Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Chronos Flow into an elite, touch-first, fully responsive mobile progressive web application without altering desktop functionality, ensuring 100% adherence to studio design aesthetics and safe-area guidelines.

**Architecture:** Implement a clean breakpoint architecture (`@media (max-width: 768px)` and `< 1024px`) that transitions the 3-column desktop shell (`left-rail main-canvas right-rail`) into a single-pane viewport with a native-feeling studio bottom navigation bar (`Timeline`, `Backlog`, `Habits`, `Focus`). Modals transition to smooth mobile bottom sheets with safe-area padding, touch targets are expanded to $\ge 44\text{px}$, and the 3D horizon mode acquires touch horizontal snap-scrolling.

**Tech Stack:** React 19, CSS Grid & Flexbox, Lucide React, Web Audio API, Playwright Mobile Emulation, Vite 6.

---

### Task 1: Viewport & Safe-Area Setup & CSS Responsive Foundation

**Files:**
- Modify: `index.html:1-25`
- Modify: `src/index.css:1-220`

**Step 1: Write viewport meta and CSS tokens**
Update `index.html` to add `viewport-fit=cover` and mobile web app capabilities:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**Step 2: Add responsive grid & safe area tokens to `src/index.css`**
Define mobile navigation height token, bottom safe-area inset, and responsive breakpoints:
```css
:root {
  --mobile-nav-height: 56px;
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-top: env(safe-area-inset-top, 0px);
}

@media (max-width: 768px) {
  .app-container {
    grid-template-columns: 100vw;
    grid-template-rows: var(--header-height) 1fr var(--mobile-nav-height);
    grid-template-areas:
      "header"
      "main-content"
      "mobile-nav";
    height: 100dvh;
    width: 100vw;
    overflow: hidden;
  }

  .left-rail,
  .right-rail {
    display: none;
    width: 100vw;
    height: 100%;
    grid-area: main-content;
  }

  .left-rail.is-mobile-active,
  .right-rail.is-mobile-active {
    display: flex;
    z-index: 10;
  }

  .main-canvas-area {
    display: none;
    grid-area: main-content;
    height: 100%;
    width: 100%;
  }

  .main-canvas-area.is-mobile-active {
    display: flex;
    flex-direction: column;
  }
}
```

**Step 3: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 2: Mobile Navigation Context & Bottom Navigation Bar

**Files:**
- Create: `src/components/layout/MobileBottomNav.jsx`
- Modify: `src/components/layout/AppShell.jsx`

**Step 1: Create `MobileBottomNav.jsx`**
Build a studio-grade bottom navigation bar with 4 tabs:
- 📅 **Timeline** (`timeline`)
- 📋 **Backlog** (`backlog`)
- ⚡ **Habits & Vitals** (`habits`)
- 🎯 **Focus** (Triggers `openFocusModal`)
Adhere to 44px minimum touch targets and highlight the active tab using monochrome high-contrast tokens.

```jsx
import React from 'react';
import { Calendar, CheckSquare, Zap, Target } from 'lucide-react';
import { useFocusSession } from '../../context/FocusSessionContext';

export function MobileBottomNav({ activeTab, onChangeTab }) {
  const { openFocusModal, isRunning } = useFocusSession();

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'backlog', label: 'Backlog', icon: CheckSquare },
    { id: 'habits', label: 'Habits', icon: Zap },
    { id: 'focus', label: 'Focus', icon: Target, isAction: true },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => {
              if (tab.isAction) {
                openFocusModal();
              } else {
                onChangeTab(tab.id);
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={18} />
              {tab.id === 'focus' && isRunning && (
                <span className="mobile-nav-pulse-dot" />
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

**Step 2: Update `AppShell.jsx` to coordinate mobile tab state**
Manage `activeMobileTab` (`'timeline' | 'backlog' | 'habits'`) and mount `<MobileBottomNav />`. Toggle class names `.is-mobile-active` on the left rail, main canvas, and right rail according to active tab on `< 768px` viewports.

**Step 3: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 3: Responsive Header & Overflow Action Menu

**Files:**
- Modify: `src/components/layout/Header.jsx`

**Step 1: Add mobile layout and mobile action drawer/sheet**
On small screens (`< 768px`):
1. Condense App title to a minimalist dot + "Chronos".
2. Show compact date navigation: `< Oct 31 >` with Today button.
3. Keep the 1D/3D switcher compact.
4. Replace cluttered header buttons (`Kickoff`, `Shutdown`, `Ramble`, `Auto-Schedule`, `Settings`, `Theme`) with:
   - Quick "Auto-Schedule" magic icon button
   - "Ramble" voice icon button
   - More `···` overflow menu button opening a clean mobile action sheet containing:
     - Morning Kickoff Ritual
     - Evening Shutdown Ritual
     - Analytics & Ledger
     - AI Provider Settings
     - Theme Cycler (`paper`, `daylight`, `obsidian`, `graphite`)
     - Export / Import `.ics`

**Step 2: Verify desktop layout is completely unaffected**
Ensure `@media (min-width: 769px)` retains full desktop header with all direct buttons.

**Step 3: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 4: Touch-First Timeline Canvas & 1D/3D Mobile Scrolling

**Files:**
- Modify: `src/components/timeline/TimelineCanvas.jsx`
- Modify: `src/components/timeline/TimeBlockCard.jsx`
- Modify: `src/components/timeline/WeekRibbon.jsx`

**Step 1: Mobile Timeline Touch Optimizations**
1. Ensure the left time gutter is compact (44px) on mobile with readable monospace timestamps.
2. Add tap-to-create: On mobile touchscreens where click-and-drag lasso interferes with vertical scrolling, tapping an empty hour slot opens the inline block creation popover at that hour.
3. Ensure `touch-action: pan-y` is applied so scrolling down the 24-hour timeline feels instantaneous and native.

**Step 2: Mobile 3D Horizon Snap-Scroll**
In 3D mode on small screens (`< 768px`):
Instead of crushing 3 columns into 33vw each, enable horizontal swipe with CSS scroll snap:
- Container has `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;`
- Each day column has `min-width: 84vw; scroll-snap-align: start;`
- Allows the user to swipe cleanly between Today, Tomorrow, and Day 3 with silky 60fps native momentum.

**Step 3: Card Touch Targets**
In `TimeBlockCard.jsx`, ensure the checkbox, `+15m` button, and card edit area meet WCAG 44×44px touch target guidelines on mobile screens.

**Step 4: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 5: Mobile Backlog Drawer & Eisenhower Matrix

**Files:**
- Modify: `src/components/workspace/BacklogDrawer.jsx`
- Modify: `src/components/workspace/QuickTaskInput.jsx`
- Modify: `src/components/workspace/EisenhowerMatrix.jsx`

**Step 1: Mobile Backlog Drawer layout**
When `activeMobileTab === 'backlog'`, the backlog fills 100% of the mobile content area.
- Add quick filter pills with horizontal momentum scrolling.
- Optimize card padding and touch buttons (Edit, Start Focus, Schedule at 09:00, Delete).

**Step 2: QuickTaskInput Mobile Keyboard Handling**
Ensure the input does not zoom on iOS (`font-size: 16px` prevents iOS Safari auto-zoom). Keep the mic button and add task CTA easily tappable with the thumb.

**Step 3: Mobile Eisenhower Matrix 2x2 Touch Layout**
Stack quadrants or render as a 2x2 responsive touch grid with tap-to-move and tap-to-edit capabilities.

**Step 4: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 6: Mobile Habits, Circadian Vitals & Blueprints View

**Files:**
- Modify: `src/components/workspace/HabitTrackerRail.jsx`

**Step 1: Mobile Habits & Vitals tab**
When `activeMobileTab === 'habits'`, render the Habit Tracker Rail across the full mobile viewport:
- Daily Ledger metrics (Planned vs Actual vs Completed) in clean, high-contrast tabular cards.
- Circadian window card highlighting current energy level.
- Habit checklist with $\ge 44\text{px}$ touch targets and celebration burst.
- 1-click Day Blueprints application (`Maker Day`, `Meeting Sprint`).

**Step 2: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 7: Mobile Bottom Sheets & Modal Adaptations

**Files:**
- Modify: `src/components/ui/Modal.jsx`
- Modify: `src/components/modals/FocusModeModal.jsx`
- Modify: `src/components/modals/TaskEditModal.jsx`
- Modify: `src/components/modals/AIBrainDumpModal.jsx`

**Step 1: Convert Modals to Mobile Bottom Sheets on `< 768px`**
In `Modal.jsx`, add a mobile media query:
- Position at the bottom of the screen (`align-items: flex-end; padding: 0`).
- Rounded top corners: `border-radius: 16px 16px 0 0`.
- Safe area bottom padding: `padding-bottom: calc(16px + env(safe-area-inset-bottom))`.
- Swipe-down grab handle bar at the top of the sheet.
- Max height: `88dvh` with smooth vertical scrolling inside the body.

**Step 2: Focus Mode Chamber Mobile View**
Ensure the large timer countdown (`64px`), Play/Pause, `+15m`, and procedural ambient sound selector wrap cleanly and fit within portrait mobile viewports without vertical overflow.

**Step 3: Verify build**
Run: `node .\node_modules\vite\bin\vite.js build`
Expected: PASS

---

### Task 8: Playwright Mobile Viewport E2E Testing & Vercel Redeployment

**Files:**
- Create: `e2e/mobile-view.spec.js`
- Test run: `node .\node_modules\@playwright\test\cli.js test`

**Step 1: Write mobile E2E test suite in `e2e/mobile-view.spec.js`**
Configure mobile viewport (`390x844` iPhone 14 / `375x667` iPhone SE):
1. **Mobile Shell & Nav:** Verify mobile bottom nav bar renders 4 tabs (`Timeline`, `Backlog`, `Habits`, `Focus`).
2. **Tab Switching:** Click `Backlog`, verify Backlog rail is visible and main canvas is hidden. Click `Habits`, verify Habit Tracker rail is visible. Click `Timeline`, verify canvas returns.
3. **Mobile Task Creation & Edit Sheet:** Create task via quick input, open edit modal, verify it displays as a responsive bottom sheet, edit title, save, and delete.
4. **Mobile 3D Horizon:** Switch to 3D, verify multi-day columns are swipeable without breaking layout.
5. **Mobile Focus Chamber:** Tap Focus tab, verify Focus Chamber timer starts, pauses, and extends by 15m.

**Step 2: Run all Playwright tests**
Execute: `node .\node_modules\@playwright\test\cli.js test`
Expected: 100% PASS across both desktop (`chronos-flow.spec.js`) and mobile (`mobile-view.spec.js`).

**Step 3: Deploy to Vercel Production**
Execute: `vercel --prod --yes`
Verify live deployment at `https://chronos-flow-pearl.vercel.app` with `HTTP 200 OK`.

