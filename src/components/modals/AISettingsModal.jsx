import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePlannerData } from '../../context/PlannerDataContext';
import { useToast } from '../ui/ToastManager';
import { Sliders, Key, Clock, ShieldCheck, Check } from 'lucide-react';
import { formatMinutesToTime } from '../../utils/timeHelpers';

export function AISettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = usePlannerData();
  const { showToast } = useToast();

  const [provider, setProvider] = useState(settings?.aiProvider || 'offline');
  const [groqKey, setGroqKey] = useState(settings?.groqApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings?.geminiApiKey || '');
  const [workStart, setWorkStart] = useState(settings?.workdayStartMinutes ?? 510);
  const [workEnd, setWorkEnd] = useState(settings?.workdayEndMinutes ?? 1080);
  const [autoDecompress, setAutoDecompress] = useState(settings?.autoDecompressionEnabled ?? true);

  const handleSave = () => {
    updateSettings({
      aiProvider: provider,
      groqApiKey: groqKey.trim(),
      geminiApiKey: geminiKey.trim(),
      workdayStartMinutes: parseInt(workStart, 10),
      workdayEndMinutes: parseInt(workEnd, 10),
      autoDecompressionEnabled: autoDecompress,
    });

    showToast({ message: 'Settings saved successfully' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chronos Settings & AI Configuration" maxWidth={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1. AI Provider Selection */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            AI Engine Provider
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { id: 'offline', name: 'Offline Local', sub: 'Zero setup / 100% private' },
              { id: 'groq', name: 'Groq Cloud', sub: 'Llama 3.3 70B (<300ms)' },
              { id: 'gemini', name: 'Google Gemini', sub: 'Gemini 2.5 Flash' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: provider === p.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  backgroundColor: provider === p.id ? 'var(--bg-active)' : 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key inputs */}
        {provider === 'groq' && (
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Groq API Key (gsk_...)
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        )}

        {provider === 'gemini' && (
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Gemini API Key (AIza...)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        )}

        {/* 2. Morgen Scheduling Windows */}
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 12 }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Workday Boundaries (Morgen Frames)
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                Work Start: {formatMinutesToTime(workStart)}
              </span>
              <input
                type="range"
                min="360"
                max="600"
                step="30"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                Work End: {formatMinutesToTime(workEnd)}
              </span>
              <input
                type="range"
                min="960"
                max="1320"
                step="30"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* 3. Auto-Decompression Buffer */}
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Auto-Decompression Buffers</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Automatically inserts 10m recovery buffers after heavy deep work & meetings
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoDecompress}
            onChange={(e) => setAutoDecompress(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" icon={Check} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

