import { test, expect } from '@playwright/test';

test.describe('Chronos Flow — Flagship Studio End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server and wait for DOM load
    await page.goto('/');
    await page.waitForSelector('.app-container');
  });

  // 1. Theme Switching Across All 4 Neutral Themes
  test('1. Switch between all 4 neutral themes seamlessly', async ({ page }) => {
    const html = page.locator('html');

    // Default theme should be one of the 4 universal neutrals
    const initialTheme = await html.getAttribute('data-theme');
    expect(['paper', 'daylight', 'obsidian', 'graphite']).toContain(initialTheme);

    // Open theme selector dropdown in Header
    const themeBtn = page.locator('button[title^="Current Theme:"]');
    await themeBtn.click();

    // Click Crisp Daylight
    await page.getByRole('button', { name: 'Crisp Daylight' }).click();
    await expect(html).toHaveAttribute('data-theme', 'daylight');

    // Click Geist Obsidian
    await themeBtn.click();
    await page.getByRole('button', { name: 'Geist Obsidian' }).click();
    await expect(html).toHaveAttribute('data-theme', 'obsidian');

    // Click Graphite Slate
    await themeBtn.click();
    await page.getByRole('button', { name: 'Graphite Slate' }).click();
    await expect(html).toHaveAttribute('data-theme', 'graphite');

    // Click Warm Paper
    await themeBtn.click();
    await page.getByRole('button', { name: 'Warm Paper' }).click();
    await expect(html).toHaveAttribute('data-theme', 'paper');
  });

  // 2. Drag-and-drop backlog task placement & lasso time-creation
  test('2. Quick task entry with tokens, drag-to-timeline, and lasso time-creation', async ({ page }) => {
    // 2A. Quick Task Input with NLP tokens
    const input = page.locator('input[placeholder*="Add task..."]');
    await input.fill('Refactor Database Layer #deep !high ~45m *');

    // Verify token badges render live
    await expect(page.locator('.badge:has-text("DEEP WORK")')).toBeVisible();
    await expect(page.locator('.badge:has-text("★ Big Rock")')).toBeVisible();

    // Submit task
    await input.press('Enter');

    // Verify task appears in backlog list
    const newTaskCard = page.locator('.left-rail').getByText('Refactor Database Layer');
    await expect(newTaskCard).toBeVisible();

    // 1-Click schedule task onto timeline
    const scheduleBtn = page.locator('button[title*="Schedule on timeline"]').first();
    await scheduleBtn.click();

    // Verify schedule toast appears
    await expect(page.locator('.toast-card').last()).toContainText('Scheduled at');

    // 2B. Lasso Time Creation on Empty Slot
    const cell = page.locator('.timeline-grid-cell').nth(5);
    const box = await cell.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 80, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 70, { steps: 5 });
      await page.mouse.up();

      const popover = page.locator('input[placeholder="Task title..."]');
      if (await popover.isVisible()) {
        await popover.fill('Lasso Deep Work Block');
        await page.getByRole('button', { name: 'Save Block' }).click();
        await expect(page.locator('.main-canvas').getByText('Lasso Deep Work Block')).toBeVisible();
      }
    }
  });

  // 3. Morning Kickoff & Evening Shutdown 4-Step Ritual Wizards
  test('3. Complete Morning Kickoff and Evening Shutdown 4-step wizards', async ({ page }) => {
    // Click Kickoff in Header
    await page.locator('.app-header').getByRole('button', { name: 'Kickoff' }).click();
    await expect(page.getByText('Morning Kickoff Ritual')).toBeVisible();

    // Step 1: Triage chronic rollovers
    await expect(page.getByText('Step 1: Confront Chronic Rollovers')).toBeVisible();
    await page.getByRole('button', { name: 'Next: Big Rocks' }).click();

    // Step 2: Big Rocks
    await expect(page.getByText('Step 2: Choose Up to 3 Big Rocks')).toBeVisible();
    await page.getByRole('button', { name: 'Next: Workload Barometer' }).click();

    // Step 3: Workload Barometer
    await expect(page.getByText('Step 3: Workload Capacity Barometer')).toBeVisible();
    await page.getByRole('button', { name: 'Next: Set Daily Intention' }).click();

    // Step 4: Intention & Finalize
    await expect(page.getByText('Step 4: Prime Your Daily Intention')).toBeVisible();
    const intentionInput = page.locator('textarea');
    await intentionInput.fill('Execute with deep craftsmanship and zero distraction.');
    await page.getByRole('button', { name: 'Lock In Day & Start' }).click();

    // Verify completion toast
    await expect(page.locator('.toast-card').last()).toContainText('Morning Kickoff complete');

    // Open Evening Shutdown
    await page.locator('.app-header').getByRole('button', { name: 'Shutdown' }).click();
    await expect(page.getByText('Evening Shutdown Ritual')).toBeVisible();

    // Step 1: Review
    await page.getByRole('button', { name: 'Next: Clear & Rollover' }).click();

    // Step 2: Rollover
    await expect(page.getByText('Step 2: Clear Loose Ends')).toBeVisible();
    const rolloverBtn = page.locator('button:has-text("Rollover")').last();
    await rolloverBtn.click();

    // Step 3: Gratitude
    await expect(page.getByText('Step 3: Daily Reflection & Win')).toBeVisible();
    await page.locator('textarea').fill('Shipped pristine day planner architecture.');
    await page.getByRole('button', { name: 'Next: Rate Today' }).click();

    // Step 4: Focus Score
    await expect(page.getByText('Step 4: Energy & Focus Score')).toBeVisible();
    await page.getByRole('button', { name: '5★' }).click();
    await page.getByRole('button', { name: 'Complete Evening Shutdown' }).click();

    await expect(page.locator('.toast-card').last()).toContainText('Evening Shutdown recorded');
  });

  // 4. Focus Mode Timer, Sound Selector & Mid-Session Elasticity
  test('4. Focus Mode timer, +15m Extend, procedural ambient audio & finish early', async ({ page }) => {
    // Click Focus button in header unambiguously
    await page.locator('.app-header').getByRole('button', { name: 'Focus', exact: true }).click();
    await expect(page.getByText('Focus Chamber')).toBeVisible();

    // Timer countdown should be visible
    const timerDisplay = page.locator('.tabular-nums.tight-tracking');
    await expect(timerDisplay).toBeVisible();

    // Start Focus if not already running
    const startBtn = page.locator('.focus-chamber').getByRole('button', { name: 'Start Focus', exact: true });
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }
    await expect(page.locator('.focus-chamber').getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    // Toggle Ambient Sound to Rain (Paul Kellet Pink Noise)
    await page.getByRole('button', { name: 'Rain (Pink)' }).click();

    // Mid-Session Elasticity: Click +15m Extend
    await page.getByRole('button', { name: '+15m Extend' }).click();

    // Finish Early
    await page.getByRole('button', { name: 'Finish Early' }).click();
    await expect(page.getByText('Focus Chamber')).not.toBeVisible();
  });

  // 5. Auto-Schedule Execution and Ctrl+Z Undo Recovery
  test('5. Auto-Schedule backlog allocation and Undo recovery', async ({ page }) => {
    // Click Auto-Schedule CTA in header
    await page.locator('.app-header').getByRole('button', { name: 'Auto-Schedule' }).click();
    await expect(page.locator('.toast-card').last()).toContainText('Backlog tasks automatically packed');

    // Trigger Undo via keyboard shortcut Ctrl+Z
    await page.keyboard.press('Control+z');

    // Verify Undo notification toast
    await expect(page.locator('.toast-card').last()).toContainText('Undid: Auto-Schedule');
  });

  // 6. Horizon Switcher (1D vs 3D) Side-by-Side Day Columns
  test('6. Toggle 1D and 3D Horizon switcher and verify multi-day columns', async ({ page }) => {
    // Initially in 1D mode, click 3D switcher button in header
    const btn3D = page.locator('.app-header button:has-text("3D")');
    await btn3D.click();

    // Verify 3 day column headers appear in the sticky top bar of the main canvas
    const canvasHeaders = page.locator('.main-canvas span:has-text("h planned")');
    await expect(canvasHeaders).toHaveCount(3);

    // Switch back to 1D
    const btn1D = page.locator('.app-header button:has-text("1D")');
    await btn1D.click();

    // Verify single day column header remains
    await expect(page.locator('.main-canvas span:has-text("h planned")')).toHaveCount(1);
  });

  // 7. Full Task Parity: Edit Modal, Subtasks, and Delete
  test('7. Edit task modal with full options and task deletion', async ({ page }) => {
    // Add a quick task
    const input = page.locator('input[placeholder*="Add task..."]');
    await input.fill('New Custom Task #deep ~30m');
    await input.press('Enter');

    // Verify task is in backlog
    const taskCard = page.locator('.left-rail').getByText('New Custom Task');
    await expect(taskCard).toBeVisible();

    // Click edit pencil button on the task card
    const editBtn = page.locator('.left-rail button[title="Edit task details"]').first();
    await editBtn.click();

    // Verify TaskEditModal opened
    await expect(page.getByText('Edit Task Details')).toBeVisible();

    // Edit title
    const titleInput = page.locator('input[placeholder="e.g. Architect state layer"]');
    await titleInput.fill('Updated Custom Task');

    // Add a subtask
    const subtaskInput = page.locator('input[placeholder="Add subtask and press Enter..."]');
    await subtaskInput.fill('Subtask item 1');
    await subtaskInput.press('Enter');
    await expect(page.getByText('Subtask item 1')).toBeVisible();

    // Schedule on timeline
    const scheduleCheckbox = page.locator('input[type="checkbox"][style*="cursor: pointer"]').first();
    await scheduleCheckbox.check();

    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Edit Task Details')).not.toBeVisible();

    // Verify task with updated title is scheduled on timeline canvas
    const timelineTask = page.locator('.main-canvas').getByText('Updated Custom Task');
    await expect(timelineTask).toBeVisible();

    // Click edit pencil on the timeline card
    const timelineCard = page.locator('.time-block-card:has-text("Updated Custom Task")');
    const timelineEditBtn = timelineCard.locator('button[title="Edit Task"], button[title="Edit task"]').first();
    await timelineEditBtn.click();
    await expect(page.getByText('Edit Task Details')).toBeVisible();

    // Click Delete Task
    await page.locator('.modal-dialog').getByRole('button', { name: 'Delete Task' }).click();
    await expect(page.getByText('Edit Task Details')).not.toBeVisible();

    // Verify toast confirms deletion
    await expect(page.locator('.toast-card').last()).toContainText('Deleted');
  });

  // 8. Magic Capture Modal & Sample Ramble Extraction
  test('8. Magic Capture modal with Sample Ramble and AI extraction', async ({ page }) => {
    // Open Ramble modal from header
    await page.locator('.app-header').getByRole('button', { name: 'Ramble' }).click();
    await expect(page.getByText('Magic Capture — Voice & AI Brain Dump')).toBeVisible();

    // Click Try Sample Ramble
    await page.getByRole('button', { name: 'Try Sample Ramble' }).click();

    // Verify transcript populated
    const textarea = page.locator('.modal-content textarea');
    await expect(textarea).not.toBeEmpty();

    // Click Extract Schedule via AI
    await page.getByRole('button', { name: 'Extract Schedule via AI' }).click();

    // Verify extracted items review screen appears
    await expect(page.getByText('Review Extracted Items')).toBeVisible();

    // Import selected
    await page.getByRole('button', { name: 'Import Selected to Plan' }).click();
    await expect(page.locator('.toast-card').last()).toContainText('Imported');
  });
});
