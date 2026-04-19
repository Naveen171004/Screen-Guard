import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApps } from '../context/AppContext';
import AppCard from '../components/ui/AppCard';
import SetLimitModal from '../components/ui/SetLimitModal';
import AddAppModal from '../components/ui/AddAppModal';
import { App } from '../types';
import { formatDuration } from '../utils/time';

export default function DashboardPage() {
  const { user } = useAuth();
  const { apps, todayUsage, fetchApps, fetchTodayUsage, updateApp, addApp, deleteApp } = useApps();
  const [limitApp, setLimitApp] = useState<App | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'limited' | 'blocked'>('all');

  useEffect(() => {
    fetchApps();
    fetchTodayUsage();
    // Refresh usage every 30 seconds
    const interval = setInterval(fetchTodayUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSetLimit = async (appId: string, seconds: number) => {
    await updateApp(appId, { dailyLimit: seconds, isBlocked: false });
  };

  const handleAddApp = async (data: any) => {
    await addApp(data);
  };

  const handleDeleteApp = async (id: string) => {
    if (window.confirm('Remove this app from tracking?')) {
      await deleteApp(id);
    }
  };

  // Summary stats
  const totalUsageToday = todayUsage.reduce((sum, u) => sum + u.totalSeconds, 0);
  const limitedApps = apps.filter((a) => a.dailyLimit > 0);
  const blockedApps = apps.filter((a) => a.isBlocked && (!a.overrideUntil || new Date(a.overrideUntil) < new Date()));

  const filteredApps = apps.filter((app) => {
    if (filter === 'limited') return app.dailyLimit > 0;
    if (filter === 'blocked') return app.isBlocked;
    return true;
  });

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm font-medium mb-1">{greeting} 👋</p>
        <h1 className="font-display text-3xl font-bold text-white">{user?.name?.split(' ')[0]}'s Dashboard</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Total Today</p>
          <p className="font-display text-2xl font-bold text-white">{formatDuration(totalUsageToday)}</p>
          <p className="text-xs text-gray-600 mt-1">across all apps</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Apps Tracked</p>
          <p className="font-display text-2xl font-bold text-white">{apps.length}</p>
          <p className="text-xs text-gray-600 mt-1">in your list</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">With Limits</p>
          <p className="font-display text-2xl font-bold text-brand-400">{limitedApps.length}</p>
          <p className="text-xs text-gray-600 mt-1">apps restricted</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Blocked Now</p>
          <p className={`font-display text-2xl font-bold ${blockedApps.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {blockedApps.length}
          </p>
          <p className="text-xs text-gray-600 mt-1">{blockedApps.length === 0 ? 'all clear' : 'limit reached'}</p>
        </div>
      </div>

      {/* Apps section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Your Apps</h2>
          <p className="text-sm text-gray-500">Click an app to open its mock screen and start tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex bg-surface-800 rounded-xl p-1 gap-1 border border-white/5">
            {(['all', 'limited', 'blocked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                  filter === f ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2"
          >
            <span className="text-lg">+</span> Add App
          </button>
        </div>
      </div>

      {/* App grid */}
      {filteredApps.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📱</div>
          <p className="text-gray-400 font-medium">No apps found</p>
          <p className="text-gray-600 text-sm mt-1">
            {filter === 'all' ? 'Add apps to start tracking your usage' : `No ${filter} apps`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app._id}
              app={app}
              usage={todayUsage.find((u) => u.appId === app._id)}
              onSetLimit={setLimitApp}
              onDelete={handleDeleteApp}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {limitApp && (
        <SetLimitModal
          app={limitApp}
          onClose={() => setLimitApp(null)}
          onSave={handleSetLimit}
        />
      )}

      {showAddModal && (
        <AddAppModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddApp}
        />
      )}
    </div>
  );
}
