import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import api from '../utils/api';
import { useApps } from '../context/AppContext';
import { DailyUsage } from '../types';
import { formatDuration, formatDate, getUsageColor } from '../utils/time';

type Period = 'weekly' | 'monthly';

interface ChartEntry {
  date: string;
  label: string;
  [appName: string]: string | number;
}

const CHART_COLORS = ['#5b7fff', '#ec4899', '#22c55e', '#f97316', '#a855f7', '#06b6d4', '#eab308', '#ef4444'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-mono">{formatDuration(entry.value as number)}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { apps, todayUsage, fetchTodayUsage } = useApps();
  const [period, setPeriod] = useState<Period>('weekly');
  const [usageData, setUsageData] = useState<DailyUsage[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayUsage();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/usage/${period}`);
        setUsageData(res.data.usage);
        setDates(res.data.dates);
      } catch (err) {
        console.error('Failed to fetch usage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Build chart data: one row per date, columns per app
  const buildBarData = (): ChartEntry[] => {
    return dates.map((date) => {
      const entry: ChartEntry = { date, label: formatDate(date) };
      usageData
        .filter((u) => u.date === date)
        .forEach((u) => { entry[u.appName] = u.totalSeconds; });
      return entry;
    });
  };

  // Get unique app names in data
  const appNamesInData = [...new Set(usageData.map((u) => u.appName))];

  // Build pie data for today
  const pieData = todayUsage
    .filter((u) => u.totalSeconds > 0)
    .map((u) => ({ name: u.appName, value: u.totalSeconds }))
    .sort((a, b) => b.value - a.value);

  const totalToday = todayUsage.reduce((sum, u) => sum + u.totalSeconds, 0);
  const totalPeriod = usageData.reduce((sum, u) => sum + u.totalSeconds, 0);

  // Top apps for the period
  const topApps = appNamesInData
    .map((name) => ({
      name,
      total: usageData.filter((u) => u.appName === name).reduce((s, u) => s + u.totalSeconds, 0),
      app: apps.find((a) => a.name === name),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const barData = buildBarData();

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Your screen time insights</p>
        </div>

        {/* Period toggle */}
        <div className="flex bg-surface-800 rounded-xl p-1 border border-white/5">
          {(['weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                period === p ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Today</p>
          <p className="font-display text-2xl font-bold text-white">{formatDuration(totalToday)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{period === 'weekly' ? '7-Day' : '30-Day'} Total</p>
          <p className="font-display text-2xl font-bold text-brand-400">{formatDuration(totalPeriod)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Daily Avg</p>
          <p className="font-display text-2xl font-bold text-white">
            {formatDuration(Math.floor(totalPeriod / (period === 'weekly' ? 7 : 30)))}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Apps Used</p>
          <p className="font-display text-2xl font-bold text-white">{appNamesInData.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stacked bar chart */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-white mb-1">Daily Usage Breakdown</h2>
            <p className="text-sm text-gray-500 mb-6">Time spent per app per day</p>

            {barData.length === 0 || appNamesInData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                No usage data for this period yet. Start using apps to see data here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatDuration(v as number)}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 16, fontSize: 12, color: '#9ca3af' }}
                  />
                  {appNamesInData.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="a"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={i === appNamesInData.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart - today */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-1">Today's Split</h2>
              <p className="text-sm text-gray-500 mb-4">Time distribution across apps</p>

              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  No app usage today yet.
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => formatDuration(v)}
                        contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                        labelStyle={{ color: '#9ca3af' }}
                        itemStyle={{ color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex-1 space-y-2 min-w-0">
                    {pieData.slice(0, 5).map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs text-gray-400 truncate flex-1">{entry.name}</span>
                        <span className="text-xs font-mono text-gray-300 shrink-0">{formatDuration(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top apps ranking */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-1">Top Apps</h2>
              <p className="text-sm text-gray-500 mb-4">Most used this {period === 'weekly' ? 'week' : 'month'}</p>

              {topApps.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  No usage data yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topApps.map((item, i) => {
                    const maxTotal = topApps[0]?.total || 1;
                    const pct = Math.round((item.total / maxTotal) * 100);
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-mono w-4">#{i + 1}</span>
                            <span className="text-sm">{item.app?.icon || '📱'}</span>
                            <span className="text-sm text-gray-300">{item.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-400">{formatDuration(item.total)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* App-by-app breakdown table */}
          {appNamesInData.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-1">Detailed Breakdown</h2>
              <p className="text-sm text-gray-500 mb-5">Per-app usage for the selected period</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium uppercase tracking-wide">App</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Total</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Daily Avg</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topApps.map((item, i) => {
                      const days = period === 'weekly' ? 7 : 30;
                      const limit = item.app?.dailyLimit || 0;
                      return (
                        <tr key={item.name} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span>{item.app?.icon}</span>
                              <span className="text-gray-300">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-300">{formatDuration(item.total)}</td>
                          <td className="py-3 px-3 text-right font-mono text-gray-400">{formatDuration(Math.floor(item.total / days))}</td>
                          <td className="py-3 px-3 text-right">
                            {limit > 0 ? (
                              <span className="text-brand-400 font-mono text-xs">{formatDuration(limit)}/day</span>
                            ) : (
                              <span className="text-gray-600 text-xs">No limit</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
