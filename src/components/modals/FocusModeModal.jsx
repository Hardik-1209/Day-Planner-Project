import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  CloudRain,
  Radio,
  Music,
} from 'lucide-react';
import { useFocusSession } from '../../context/FocusSessionContext';
import { useAmbientSound } from '../../hooks/useAmbientSound';
import { Button } from '../ui/Button';

export function FocusModeModal() {
  const {
    isFocusModalOpen,
    closeFocusModal,
    activeTask,
    mode,
    setMode,
    isRunning,
    remainingMs,
    pauseFocus,
    resumeFocus,
    stopFocus,
    extendFocus,
    finishEarly,
    ambientSound,
    setAmbientSound,
    volume,
    setVolume,
    scratchpadNote,
    setScratchpadNote,
    isPiPActive,
    setIsPiPActive,
  } = useFocusSession();

  const { getWaveformData } = useAmbientSound(ambientSound, volume);
  const canvasRef = useRef(null);
  const pipWindowRef = useRef(null);

  // Remaining time math
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const formattedTime = `${pad(minutes)}:${pad(seconds)}`;

  // 60fps Canvas Waveform Visualizer
  useEffect(() => {
    if (!isFocusModalOpen || ambientSound === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(32);
    let animationFrameId;

    const renderWaveform = () => {
      animationFrameId = requestAnimationFrame(renderWaveform);
      const hasData = getWaveformData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!hasData || !isRunning) {
        // Draw flat line
        ctx.strokeStyle = 'var(--border-hairline)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      const barWidth = (canvas.width / 32) * 1.5;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        ctx.fillStyle = ambientSound === 'rain' ? '#3B5CCC' : 'var(--text-secondary)';
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };

    renderWaveform();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isFocusModalOpen, ambientSound, isRunning, getWaveformData]);

  // Document Picture-in-Picture API
  const handleTogglePiP = async () => {
    if ('documentPictureInPicture' in window) {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
        setIsPiPActive(false);
      } else {
        try {
          const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 260,
            height: 140,
          });

          pipWindow.document.body.style.margin = '0';
          pipWindow.document.body.style.backgroundColor = '#161615';
          pipWindow.document.body.style.color = '#FAF9F6';
          pipWindow.document.body.style.fontFamily = 'Inter, sans-serif';
          pipWindow.document.body.style.display = 'flex';
          pipWindow.document.body.style.flexDirection = 'column';
          pipWindow.document.body.style.alignItems = 'center';
          pipWindow.document.body.style.justifyContent = 'center';

          const titleEl = pipWindow.document.createElement('div');
          titleEl.style.fontSize = '12px';
          titleEl.style.color = '#8C8A84';
          titleEl.style.marginBottom = '6px';
          titleEl.textContent = activeTask?.title || 'Focus Session';
          pipWindow.document.body.appendChild(titleEl);

          const timeEl = pipWindow.document.createElement('div');
          timeEl.style.fontSize = '32px';
          timeEl.style.fontWeight = '600';
          timeEl.style.fontVariantNumeric = 'tabular-nums';
          timeEl.textContent = formattedTime;
          pipWindow.document.body.appendChild(timeEl);

          pipWindow.addEventListener('pagehide', () => {
            pipWindowRef.current = null;
            setIsPiPActive(false);
          });

          pipWindowRef.current = pipWindow;
          setIsPiPActive(true);
        } catch (err) {
          console.warn('[PiP] Error launching document Picture-in-Picture:', err);
        }
      }
    } else {
      alert('Document Picture-in-Picture API is supported in Chromium browsers (Chrome/Edge 116+).');
    }
  };

  if (!isFocusModalOpen) return null;

  return (
    <div
      className="modal-overlay focus-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="modal-dialog focus-chamber"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 120ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isRunning ? 'var(--signal-now)' : 'var(--text-muted)',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Focus Chamber
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {'documentPictureInPicture' in window && (
              <Button
                variant="ghost"
                size="xs"
                icon={ExternalLink}
                onClick={handleTogglePiP}
                title="Always-on-top Picture-in-Picture"
              >
                PiP
              </Button>
            )}
            <button
              type="button"
              onClick={closeFocusModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Center Countdown Display */}
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>
            {activeTask ? activeTask.title : 'Deep Work Session'}
          </div>

          <div
            className="tabular-nums tight-tracking"
            style={{
              fontSize: 'var(--text-timer)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              margin: '8px 0 16px',
            }}
          >
            {formattedTime}
          </div>

          {/* Controls: Play/Pause, +15m Extend, Finish Early */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            {isRunning ? (
              <Button variant="secondary" size="md" icon={Pause} onClick={pauseFocus}>
                Pause
              </Button>
            ) : (
              <Button variant="primary" size="md" icon={Play} onClick={resumeFocus}>
                Start Focus
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              icon={Plus}
              onClick={() => extendFocus(15)}
              title="+15m Extend & Push afternoon tasks"
            >
              +15m Extend
            </Button>

            <Button
              variant="ghost"
              size="md"
              icon={CheckCircle2}
              onClick={finishEarly}
              title="Finish early and trigger Pull Up prompt"
            >
              Finish Early
            </Button>
          </div>

          {/* Mode Selector */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              marginBottom: 16,
            }}
          >
            {[
              { id: 'pomodoro', label: '25m Pomodoro' },
              { id: 'flow', label: '50m Flow' },
              { id: 'short_break', label: '5m Break' },
              { id: 'long_break', label: '15m Rest' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--text-2xs)',
                  backgroundColor: mode === m.id ? 'var(--bg-elevated)' : 'transparent',
                  color: mode === m.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: mode === m.id ? 600 : 400,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Ambient Procedural Audio Selector & Waveform */}
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              textAlign: 'left',
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Procedural Audio</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Volume2 size={12} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{ width: 64 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[
                { id: 'off', label: 'Mute', icon: VolumeX },
                { id: 'rain', label: 'Rain (Pink)', icon: CloudRain },
                { id: 'whitenoise', label: 'White Noise', icon: Radio },
                { id: 'lofi', label: 'Lo-Fi Drone', icon: Music },
              ].map((sound) => {
                const Icon = sound.icon;
                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => setAmbientSound(sound.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-xs)',
                      border: ambientSound === sound.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                      backgroundColor: ambientSound === sound.id ? 'var(--bg-active)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-2xs)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={11} />
                    <span>{sound.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 60fps Waveform Visualizer Canvas */}
            <canvas
              ref={canvasRef}
              width={420}
              height={32}
              style={{
                width: '100%',
                height: 32,
                backgroundColor: 'var(--bg-panel)',
                borderRadius: 'var(--radius-xs)',
                display: 'block',
              }}
            />
          </div>

          {/* Ephemeral Scratchpad */}
          <div style={{ marginTop: 12, textAlign: 'left' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Ephemeral Scratchpad (Capture thoughts without switching apps)
            </span>
            <input
              type="text"
              value={scratchpadNote}
              onChange={(e) => setScratchpadNote(e.target.value)}
              placeholder="Jot down tangent thoughts..."
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

