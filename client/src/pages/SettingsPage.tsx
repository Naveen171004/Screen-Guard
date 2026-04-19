import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // PIN state
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d?$/.test(value)) return;
    const setter = isConfirm ? setConfirmPin : setPin;
    const current = isConfirm ? [...confirmPin] : [...pin];
    current[index] = value;
    setter(current);

    if (value && index < 3) {
      const nextId = isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`;
      document.getElementById(nextId)?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const current = isConfirm ? [...confirmPin] : [...pin];
      if (!current[index] && index > 0) {
        const prevId = isConfirm ? `confirm-pin-${index - 1}` : `pin-${index - 1}`;
        document.getElementById(prevId)?.focus();
      }
    }
  };

  const handleSavePin = async () => {
    const fullPin = pin.join('');
    const fullConfirm = confirmPin.join('');

    if (fullPin.length !== 4) { setPinError('Enter all 4 digits'); return; }
    if (fullPin !== fullConfirm) { setPinError('PINs do not match'); return; }

    setPinLoading(true);
    setPinError('');
    setPinSuccess('');
    try {
      await api.put('/auth/pin', { pin: fullPin });
      setPinSuccess('Override PIN saved successfully!');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
    } catch (err: any) {
      setPinError(err.response?.data?.message || 'Failed to save PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const PinInput = ({ values, onChange, onKeyDown, prefix }: {
    values: string[];
    onChange: (i: number, v: string) => void;
    onKeyDown: (i: number, e: React.KeyboardEvent) => void;
    prefix: string;
  }) => (
    <div className="flex gap-3">
      {values.map((digit, i) => (
        <input
          key={i}
          id={`${prefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="w-12 h-12 text-center text-xl font-mono font-bold rounded-xl border bg-surface-700 text-white focus:outline-none border-white/10 focus:border-brand-500 transition-all duration-200"
        />
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and security preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👤</span> Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-xs text-gray-600 mt-1">User ID: {user?.id?.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Override PIN card */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
            <span className="text-xl">🔑</span> Override PIN
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Set a 4-digit PIN to temporarily bypass a blocked app for 10 minutes.
            Keep this PIN secure — it's your emergency access key.
          </p>

          {pinSuccess && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
              ✅ {pinSuccess}
            </div>
          )}
          {pinError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {pinError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">New PIN</label>
              <PinInput
                values={pin}
                onChange={(i, v) => handlePinChange(i, v, false)}
                onKeyDown={(i, e) => handlePinKeyDown(i, e, false)}
                prefix="pin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Confirm PIN</label>
              <PinInput
                values={confirmPin}
                onChange={(i, v) => handlePinChange(i, v, true)}
                onKeyDown={(i, e) => handlePinKeyDown(i, e, true)}
                prefix="confirm-pin"
              />
            </div>

            <button
              onClick={handleSavePin}
              disabled={pinLoading}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {pinLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : '🔒 Save PIN'}
            </button>
          </div>
        </div>

        {/* Privacy info */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
            <span className="text-xl">🔒</span> Privacy
          </h2>
          <p className="text-sm text-gray-400 mb-4">Your data stays on your machine.</p>

          <div className="space-y-3">
            {[
              { icon: '🗄️', text: 'All data stored in your local MongoDB instance' },
              { icon: '🚫', text: 'No cloud sync, no telemetry, no ads' },
              { icon: '👤', text: 'Data is isolated per user account' },
              { icon: '🔐', text: 'Passwords hashed with bcrypt (12 rounds)' },
              { icon: '🔑', text: 'PINs hashed separately, never stored in plaintext' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 text-sm">
                <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-gray-400">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">ℹ️</span> About ScreenGuard
          </h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>A web-based digital wellbeing tool that lets you set daily time limits for apps.</p>
            <p>Built with React, Node.js, MongoDB, and Socket.io for real-time tracking.</p>
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-surface-700 rounded-lg p-3">
                <p className="text-gray-500 mb-1">Frontend</p>
                <p className="text-gray-300">React 18 + TypeScript + Tailwind</p>
              </div>
              <div className="bg-surface-700 rounded-lg p-3">
                <p className="text-gray-500 mb-1">Backend</p>
                <p className="text-gray-300">Node.js + Express + Socket.io</p>
              </div>
              <div className="bg-surface-700 rounded-lg p-3">
                <p className="text-gray-500 mb-1">Database</p>
                <p className="text-gray-300">MongoDB (local)</p>
              </div>
              <div className="bg-surface-700 rounded-lg p-3">
                <p className="text-gray-500 mb-1">Auth</p>
                <p className="text-gray-300">JWT + bcrypt</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Team: Dhilip Kumar S, Mohammed Mustaq Mubeen J, Naveen M<br />
              Guide: Dr. A. Rajeswari, Associate Professor
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-500/10">
          <h2 className="font-display font-semibold text-red-400 mb-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span> Danger Zone
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-all duration-200 border border-red-500/20 text-sm"
          >
            ↩ Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
