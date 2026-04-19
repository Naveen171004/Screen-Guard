import React from 'react';
import { useNavigate } from 'react-router-dom';
import { App, DailyUsage } from '../../types';
import { formatDuration, getUsagePercent, getUsageColor } from '../../utils/time';

interface AppCardProps {
  app: App;
  usage?: DailyUsage;
  onSetLimit: (app: App) => void;
  onDelete: (id: string) => void;
}

export default function AppCard({ app, usage, onSetLimit, onDelete }: AppCardProps) {
  const navigate = useNavigate();
  const usedSeconds = usage?.totalSeconds || 0;
  const percent = getUsagePercent(usedSeconds, app.dailyLimit);
  const progressColor = getUsageColor(percent);

  const isOverrideActive = app.overrideUntil && new Date(app.overrideUntil) > new Date();
  const isActuallyBlocked = app.isBlocked && !isOverrideActive;

  const handleOpenApp = () => {
    navigate(`/app/${app._id}`);
  };

  return (
    <div className={`
      card p-5 transition-all duration-300 hover:border-white/10 group relative overflow-hidden
      ${isActuallyBlocked ? 'border-red-500/20' : ''}
    `}>
      {/* Subtle color accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60"
        style={{ background: app.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${app.color}20`, border: `1px solid ${app.color}30` }}
          >
            {app.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{app.name}</h3>
            <span className="text-xs text-gray-500">{app.category}</span>
          </div>
        </div>

        {/* Status badge */}
        {isActuallyBlocked ? (
          <span className="badge bg-red-500/15 text-red-400 border border-red-500/20">Blocked</span>
        ) : isOverrideActive ? (
          <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">Override</span>
        ) : app.dailyLimit > 0 ? (
          <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20">Limited</span>
        ) : (
          <span className="badge bg-white/5 text-gray-500">No limit</span>
        )}
      </div>

      {/* Usage info */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">Today's usage</span>
          <span className="text-xs font-mono font-medium text-gray-300">
            {formatDuration(usedSeconds)}
            {app.dailyLimit > 0 && (
              <span className="text-gray-600"> / {formatDuration(app.dailyLimit)}</span>
            )}
          </span>
        </div>

        {app.dailyLimit > 0 ? (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${percent}%`,
                background: progressColor,
                boxShadow: percent >= 80 ? `0 0 8px ${progressColor}60` : 'none',
              }}
            />
          </div>
        ) : (
          <div className="progress-bar">
            <div className="progress-fill bg-gray-600/50" style={{ width: '100%' }} />
          </div>
        )}

        {app.dailyLimit > 0 && (
          <p className="text-right text-xs mt-1" style={{ color: progressColor }}>
            {percent}%
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleOpenApp}
          disabled={isActuallyBlocked}
          className={`
            flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95
            ${isActuallyBlocked
              ? 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
              : 'bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 border border-brand-500/20'
            }
          `}
        >
          {isActuallyBlocked ? '🔒 Blocked' : '▶ Open'}
        </button>

        <button
          onClick={() => onSetLimit(app)}
          className="py-2 px-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-white/5"
          title="Set limit"
        >
          ⏱
        </button>

        <button
          onClick={() => onDelete(app._id)}
          className="py-2 px-3 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-white/5"
          title="Remove app"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
