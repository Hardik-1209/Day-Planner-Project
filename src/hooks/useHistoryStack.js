import { useState, useCallback, useEffect, useRef } from 'react';

const MAX_HISTORY_STEPS = 20;

export function useHistoryStack(initialPresent, onUndoRedoToast) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPresent);
  const [future, setFuture] = useState([]);

  // Keep a ref to the latest state so keyboard listeners don't have stale closures
  const stateRef = useRef({ past, present, future });
  stateRef.current = { past, present, future };

  const pushState = useCallback((newPresent, actionLabel = 'Action') => {
    setPast((prevPast) => {
      const nextPast = [...prevPast, { state: stateRef.current.present, label: actionLabel }];
      if (nextPast.length > MAX_HISTORY_STEPS) {
        return nextPast.slice(nextPast.length - MAX_HISTORY_STEPS);
      }
      return nextPast;
    });
    setPresent(newPresent);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    const { past: p, present: current, future: f } = stateRef.current;
    if (p.length === 0) return null;

    const previousEntry = p[p.length - 1];
    const newPast = p.slice(0, p.length - 1);

    setPast(newPast);
    setPresent(previousEntry.state);
    setFuture([{ state: current, label: previousEntry.label }, ...f]);

    if (onUndoRedoToast) {
      onUndoRedoToast(`Undid: ${previousEntry.label}`);
    }

    return previousEntry.state;
  }, [onUndoRedoToast]);

  const redo = useCallback(() => {
    const { past: p, present: current, future: f } = stateRef.current;
    if (f.length === 0) return null;

    const nextEntry = f[0];
    const newFuture = f.slice(1);

    setPast([...p, { state: current, label: nextEntry.label }]);
    setPresent(nextEntry.state);
    setFuture(newFuture);

    if (onUndoRedoToast) {
      onUndoRedoToast(`Redid: ${nextEntry.label}`);
    }

    return nextEntry.state;
  }, [onUndoRedoToast]);

  // Global keyboard shortcut listener for Ctrl+Z / Cmd+Z and Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing inside an input/textarea/contenteditable
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          redo();
        } else {
          // Undo
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        // Redo on Windows
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: present,
    setState: setPresent,
    pushState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pastCount: past.length,
    futureCount: future.length,
  };
}

