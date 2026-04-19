/** Format seconds to "Xh Ym" or "Ym Zs" */
export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/** Format seconds to "H:MM:SS" */
export const formatTimer = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

/** Get percentage used */
export const getUsagePercent = (used: number, limit: number): number => {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

/** Get color based on usage percentage */
export const getUsageColor = (percent: number): string => {
  if (percent >= 100) return '#ef4444'; // red
  if (percent >= 80) return '#f97316';  // orange
  if (percent >= 60) return '#eab308';  // yellow
  return '#22c55e';                     // green
};

/** Get today's date as YYYY-MM-DD */
export const getTodayStr = (): string => new Date().toISOString().split('T')[0];

/** Format date string to "Mon DD" */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
