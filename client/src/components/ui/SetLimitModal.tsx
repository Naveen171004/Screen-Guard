import React, { useState, useEffect } from 'react';
import { App } from '../../types';
import { formatDuration } from '../../utils/time';

interface SetLimitModalProps {
  app: App | null;
  onClose: () => void;
  onSave: (appId: string, seconds: number) => Promise<void>;
}

// Preset limit options in seconds
const PRESETS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '1 hour', seconds: 60 * 60 },
  { label: '2 hours', seconds: 2 * 60 * 60 },
  { label: '3 hours', seconds: 3 * 60 * 60 },
  { label: 'No limit', seconds: 0 },
];

export default function SetLimitModal({ app, onClose, onSave }: SetLimitModalProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      const h = Math.floor(app.dailyLimit / 3600);
      const m = Math.floor((app.dailyLimit % 3600) / 60);
      setHours(h);
      setMinutes(m);
    }
  }, [app]);

  if (!app) return null;

  const totalSeconds = hours * 3600 + minutes * 60;

  const handlePreset = (seconds: number) => {
    setHours(Math.floor(seconds / 3600));
    setMinutes(Math.floor((seconds % 3600) / 60));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(app._id, totalSeconds);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${app.color}20` }}
          >
            {app.icon}
          </div>
          <div>
            <h2 className="font-display font-bold text-white">Set Daily Limit</h2>
            <p className="text-sm text-gray-400">{app.name}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">Quick presets</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => handlePreset(preset.seconds)}
                className={`
                  py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 border
                  ${totalSeconds === preset.seconds
                    ? 'bg-brand-600/30 text-brand-400 border-brand-500/40'
                    : 'bg-surface-700 text-gray-400 hover:text-white border-white/5 hover:border-white/10'
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">Custom time</p>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Hours</label>
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                className="input-field text-center font-mono text-lg"
              />
            </div>
            <span className="text-gray-400 text-xl font-bold mt-4">:</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="input-field text-center font-mono text-lg"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-surface-700 rounded-xl p-4 mb-6 text-center">
          {totalSeconds > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-1">Daily limit will be set to</p>
              <p className="font-display text-2xl font-bold text-brand-400">{formatDuration(totalSeconds)}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-1">No limit</p>
              <p className="font-display text-2xl font-bold text-gray-400">Unlimited</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Limit'}
          </button>
        </div>
      </div>
    </div>
  );
}
