import React, { useState, useEffect, useRef } from 'react';
import { Plus, Mic, MicOff, Sparkles, Clock, Tag, AlertTriangle, Star } from 'lucide-react';
import { parseQuickTaskInput } from '../../utils/parser';
import { usePlannerData } from '../../context/PlannerDataContext';
import { formatMinutesToTime } from '../../utils/timeHelpers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastManager';

export function QuickTaskInput({ onOpenBrainDump }) {
  const { addTask, activeDate } = usePlannerData();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Live parsed preview
  const parsed = parseQuickTaskInput(text);
  const hasTokens = text.trim().length > 0;

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast({ message: 'Speech Recognition not supported in this browser. Opening Magic Capture...' });
      if (onOpenBrainDump) onOpenBrainDump();
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    // Check microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      showToast({ message: 'Microphone permission denied. Please allow microphone in browser.' });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast({ message: 'Listening... Speak task name' });
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('QuickInput voice error:', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          showToast({ message: 'Microphone blocked in browser settings' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      showToast({ message: 'Voice recognition failed: ' + err.message });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    addTask(
      {
        title: parsed.title,
        category: parsed.category,
        priority: parsed.priority,
        durationMinutes: parsed.durationMinutes,
        scheduledStartMinutes: parsed.scheduledStartMinutes,
        isBigRock: parsed.isBigRock,
        energyType: parsed.energyType,
        date: activeDate,
      },
      'Quick add task'
    );

    setText('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated)',
            border: isListening ? '1px solid var(--signal-now)' : '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px',
            boxShadow: isListening ? '0 0 0 2px var(--signal-now-pulse)' : 'none',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add task... #deep !high ~45m @10:30 *"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '6px 4px',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />

          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Voice Ramble Mode'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: isListening ? 'var(--signal-now)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isListening ? (
              <MicOff size={13} style={{ animation: 'pulse 1s infinite' }} />
            ) : (
              <Mic size={13} />
            )}
          </button>

          <Button
            type="submit"
            variant="ghost"
            size="xs"
            disabled={!text.trim()}
            style={{ padding: '2px 4px' }}
          >
            <Plus size={13} />
          </Button>
        </div>

        {/* Live parsed token preview pill strip */}
        {hasTokens && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              flexWrap: 'wrap',
              fontSize: '10px',
            }}
          >
            <Badge variant={parsed.category} size="xs">
              {parsed.category.replace('_', ' ')}
            </Badge>

            <span className="badge" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)' }}>
              {parsed.priority.replace('_', ' ').toUpperCase()}
            </span>

            <span className="badge tabular-nums" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)' }}>
              {parsed.durationMinutes}m
            </span>

            {parsed.scheduledStartMinutes !== null && (
              <span className="badge tabular-nums" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', color: 'var(--signal-now)' }}>
                @{formatMinutesToTime(parsed.scheduledStartMinutes)}
              </span>
            )}

            {parsed.isBigRock && (
              <span className="badge" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-contrast-text)' }}>
                ★ Big Rock
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

