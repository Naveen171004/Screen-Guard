import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDuration } from '../../utils/time';

interface BlockOverlayProps {
  appId: string;
  appName: string;
  appIcon: string;
  totalSeconds: number;
  dailyLimit: number;
  onOverrideGranted: () => void;
}

export default function BlockOverlay({
  appId, appName, appIcon, totalSeconds, dailyLimit, onOverrideGranted
}: BlockOverlayProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [overrideCountdown, setOverrideCountdown] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);

  // Handle PIN digit input
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`pin-${index + 1}`);
      next?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (index === 3 && value) {
      const fullPin = [...newPin.slice(0, 3), value].join('');
      if (fullPin.length === 4) handleVerifyPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerifyPin = async (fullPin: string) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-pin', { pin: fullPin, appId });
      onOverrideGranted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect PIN');
      setPin(['', '', '', '']);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      document.getElementById('pin-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-900 animate-fade-in">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-orange-600/8 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative text-center px-6 max-w-sm w-full">
        {/* Lock icon */}
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 animate-pulse-slow">
          🔒
        </div>

        {/* App info */}
        <div className="mb-2">
          <span className="text-4xl">{appIcon}</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-white mb-2">Time's Up!</h2>
        <p className="text-gray-400 mb-1">
          Your daily limit for <span className="text-white font-medium">{appName}</span> has been reached.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Used: {formatDuration(totalSeconds)} / {formatDuration(dailyLimit)}
        </p>

        {/* Limit bar */}
        <div className="progress-bar mb-8">
          <div className="progress-fill bg-red-500 shadow-lg" style={{ width: '100%', boxShadow: '0 0 12px rgba(239,68,68,0.5)' }} />
        </div>

        {!showPinEntry ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Your limit resets at midnight. Come back tomorrow!
            </p>
            <button
              onClick={() => setShowPinEntry(true)}
              className="w-full py-3 px-6 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-xl font-medium transition-all duration-200 border border-white/5 text-sm"
            >
              🔑 Emergency Override (PIN required)
            </button>
          </div>
        ) : (
          <div className={`animate-scale-in ${shaking ? 'animate-shake' : ''}`}>
            <p className="text-sm text-gray-400 mb-6">
              Enter your 4-digit override PIN<br />
              <span className="text-xs text-gray-600">(Grants 10 minutes of access)</span>
            </p>

            {/* PIN inputs */}
            <div className="flex gap-3 justify-center mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`
                    w-14 h-14 text-center text-2xl font-mono font-bold rounded-xl border transition-all duration-200
                    bg-surface-700 text-white focus:outline-none
                    ${error ? 'border-red-500/50' : 'border-white/10 focus:border-brand-500'}
                  `}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            {loading && (
              <div className="flex justify-center mb-4">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <button
              onClick={() => { setShowPinEntry(false); setPin(['', '', '', '']); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
