import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/ToastManager';
import { PlannerDataProvider } from './context/PlannerDataContext';
import { FocusSessionProvider } from './context/FocusSessionContext';
import { AppShell } from './components/layout/AppShell';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PlannerDataProvider>
          <FocusSessionProvider>
            <AppShell />
          </FocusSessionProvider>
        </PlannerDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
