import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { usePlannerData } from '../../context/PlannerDataContext';
import { parseBrainDumpWithAI } from '../../services/aiService';
import { useToast } from '../ui/ToastManager';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  Plus,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wand2,
} from 'lucide-react';

const SAMPLE_RAMBLE =
  'Need to architect the state machine for 2 hours in the morning starting at 9am, sync with Sarah at 11:30 for 30m, review PRs around 2pm, and hit the gym at 6pm for 45m.';

export function AIBrainDumpModal({ isOpen, onClose }) {
  const { tasks, setTasks, activeDate, settings, undo } = usePlannerData();
  const { showToast } = useToast();

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState(null);
  const recognitionRef = useRef(null);

  // Clean up recognition when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = async () => {
    setVoiceError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. Please type directly or use the sample ramble.');
      return;
    }

    // Try to ensure microphone permission is granted
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediately once permission is verified
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      setVoiceError(
        'Microphone access was denied. Please allow microphone permissions in your browser address bar, or use typing / sample ramble.'
      );
      return;
    }

    try {
      // Create fresh recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
        }
        setTranscript(fullText);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone blocked. Please grant microphone access in Chrome settings.');
        } else if (event.error === 'network') {
          setVoiceError('Network error reaching speech recognition service. Please type directly.');
        } else if (event.error !== 'no-speech') {
          setVoiceError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
      setVoiceError(`Could not start speech recognition: ${err.message}`);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleUseSample = () => {
    setTranscript(SAMPLE_RAMBLE);
    setVoiceError(null);
  };

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    stopListening();
    setIsExtracting(true);

    try {
      const results = await parseBrainDumpWithAI({
        transcript,
        provider: settings?.aiProvider,
        apiKey: settings?.groqApiKey || settings?.geminiApiKey,
      });

      setExtractedTasks(results.map((t) => ({ ...t, selected: true })));
    } catch (err) {
      showToast({ message: 'Error extracting tasks: ' + err.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleSelectTask = (index) => {
    setExtractedTasks((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleImportSelected = () => {
    if (!extractedTasks) return;
    const selectedToImport = extractedTasks
      .filter((t) => t.selected)
      .map((t) => ({
        ...t,
        date: activeDate,
      }));

    if (selectedToImport.length > 0) {
      const next = [...selectedToImport, ...tasks];
      setTasks(next, `Import ${selectedToImport.length} AI Tasks`);
      showToast({
        message: `Imported ${selectedToImport.length} tasks from Brain Dump`,
        actionLabel: 'Undo',
        onAction: undo,
      });
      onClose();
      setExtractedTasks(null);
      setTranscript('');
      setVoiceError(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Magic Capture — Voice & AI Brain Dump" maxWidth={580}>
      {!extractedTasks ? (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Stream your raw thoughts freely. Chronos AI parses chaotic ramble into structured action items with optimal Circadian categories.
          </p>

          {/* Voice Error Banner */}
          {voiceError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(229, 77, 46, 0.1)',
                border: '1px solid rgba(229, 77, 46, 0.3)',
                color: 'var(--signal-now)',
                fontSize: 'var(--text-xs)',
                marginBottom: 10,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>{voiceError}</div>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <textarea
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Need to architect the state machine for 2 hours in the morning, sync with Sarah at 11:30 for 30m, review Github PRs around 2pm, and hit the gym at 6pm..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-canvas)',
                border: isListening ? '1.5px solid var(--signal-now)' : '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                transition: 'border-color 120ms ease',
              }}
            />

            {isListening && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  backgroundColor: 'rgba(229, 77, 46, 0.15)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '10px',
                  color: 'var(--signal-now)',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--signal-now)',
                  }}
                />
                Listening...
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Button
                variant={isListening ? 'primary' : 'secondary'}
                size="sm"
                icon={isListening ? MicOff : Mic}
                onClick={toggleRecording}
                style={isListening ? { backgroundColor: 'var(--signal-now)', color: '#FFFFFF' } : {}}
              >
                {isListening ? 'Stop Listening' : 'Voice Ramble'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={Wand2}
                onClick={handleUseSample}
                title="Paste a sample ramble to quickly test AI extraction"
              >
                Try Sample Ramble
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={isExtracting ? Loader2 : Sparkles}
              disabled={!transcript.trim() || isExtracting}
              onClick={handleExtract}
            >
              {isExtracting ? 'Extracting Schedule...' : 'Extract Schedule via AI'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Review Extracted Items ({extractedTasks.filter((t) => t.selected).length}/{extractedTasks.length})
            </span>
            <Button variant="ghost" size="xs" onClick={() => setExtractedTasks(null)}>
              Edit Ramble
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            {extractedTasks.map((t, idx) => (
              <div
                key={t.id || idx}
                onClick={() => handleToggleSelectTask(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: t.selected ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  backgroundColor: t.selected ? 'var(--bg-active)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 120ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: '1px solid var(--border-strong)',
                      backgroundColor: t.selected ? 'var(--accent-primary)' : 'transparent',
                      color: 'var(--bg-canvas)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {t.selected && <Check size={10} strokeWidth={3} />}
                  </div>

                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {t.title}
                    </span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{t.durationMinutes}m</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{t.category.replace('_', ' ')}</span>
                      {t.scheduledStartMinutes !== null && t.scheduledStartMinutes !== undefined && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">
                            Start: {Math.floor(t.scheduledStartMinutes / 60)}:
                            {String(t.scheduledStartMinutes % 60).padStart(2, '0')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Badge variant={t.category === 'deep_work' ? 'deep' : t.category === 'meetings' ? 'meeting' : 'neutral'}>
                  {t.category.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <Button variant="ghost" size="sm" onClick={() => setExtractedTasks(null)}>
              Back
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleImportSelected}>
              Import Selected to Plan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
