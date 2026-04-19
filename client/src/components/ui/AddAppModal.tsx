import React, { useState } from 'react';

interface AddAppModalProps {
  onClose: () => void;
  onAdd: (data: { name: string; icon: string; category: string; color: string }) => Promise<void>;
}

const EMOJI_OPTIONS = ['📱', '🎮', '🎵', '📚', '💼', '🏃', '🎨', '🍕', '✈️', '🎯', '🔧', '💡'];
const COLOR_OPTIONS = ['#6366f1', '#ec4899', '#22c55e', '#f97316', '#06b6d4', '#a855f7', '#eab308', '#ef4444'];
const CATEGORY_OPTIONS = ['Social Media', 'Entertainment', 'Gaming', 'Productivity', 'News', 'Shopping', 'Health', 'Other'];

export default function AddAppModal({ onClose, onAdd }: AddAppModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📱');
  const [category, setCategory] = useState('Other');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('App name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onAdd({ name: name.trim(), icon, category, color });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-white text-lg">Add Custom App</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: `${color}20`, borderColor: `${color}40` }}
            >
              {icon}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">App Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., LinkedIn, Pinterest..."
              maxLength={30}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`py-2 rounded-lg text-xl transition-all duration-200 ${icon === e ? 'bg-brand-600/30 border border-brand-500/40' : 'bg-surface-700 hover:bg-surface-600 border border-white/5'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-800 scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-surface-800">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
