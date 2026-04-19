import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApps } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import BlockOverlay from '../components/ui/BlockOverlay';
import api from '../utils/api';
import { formatTimer, formatDuration, getUsagePercent, getUsageColor } from '../utils/time';
import { App } from '../types';

// Mock content generators per app category
const MOCK_CONTENT: Record<string, { posts: string[]; bg: string }> = {
  Instagram: {
    bg: 'from-purple-900/20 to-pink-900/20',
    posts: ['Just posted a new photo! 🌅', 'Loving this view 😍', 'Check out my latest reel 🎬', 'Brunch vibes ☕', 'Summer goals 🌊'],
  },
  YouTube: {
    bg: 'from-red-900/20 to-orange-900/20',
    posts: ['Watch: Top 10 Coding Tips 2024', 'NEW VIDEO: React 19 Features!', 'Viral: Cat learns to code 🐱', 'Tutorial: Build an AI App', 'Vlog: Day in my life as a dev'],
  },
  'Twitter / X': {
    bg: 'from-blue-900/20 to-sky-900/20',
    posts: ['Just shipped a new feature! 🚀', 'Hot take: tabs > spaces', 'The AI bubble is real', 'Thread: How I grew my startup', 'This is peak internet'],
  },
  WhatsApp: {
    bg: 'from-green-900/20 to-emerald-900/20',
    posts: ['Mom: Are you eating properly? 😅', 'Dev group: anyone free for standup?', 'Friend: Dude watch this video', 'Work: Can you review my PR?', 'Birthday reminder: John tomorrow 🎂'],
  },
  TikTok: {
    bg: 'from-pink-900/20 to-rose-900/20',
    posts: ['POV: You just discovered ScreenGuard 😂', 'This productivity hack changed my life', 'Day in the life of a software engineer', 'Cooking a 5-minute meal 🍳', 'Life hack you NEED to know'],
  },
  Netflix: {
    bg: 'from-red-900/20 to-gray-900/20',
    posts: ['Stranger Things S5 - New Episode', 'Top 10 in your country', 'Because you watched Breaking Bad', 'New: The AI Series', 'Trending Now: Dark Season 4'],
  },
  Facebook: {
    bg: 'from-blue-900/20 to-indigo-900/20',
    posts: ['Your friend tagged you in a photo', 'Marketplace: iPhone 15 near you', 'Memory from 3 years ago', 'Event: Tech Meetup this Friday', 'Group notification: 47 new posts'],
  },
  Reddit: {
    bg: 'from-orange-900/20 to-red-900/20',
    posts: ['r/programming: ELI5 - How does React work?', 'r/todayilearned: TIL about ScreenGuard', 'r/AskReddit: What\'s your morning routine?', 'r/webdev: Show HN - My new project', 'r/memes: Developers at 3am 💀'],
  },
  Gaming: {
    bg: 'from-violet-900/20 to-purple-900/20',
    posts: ['New quest unlocked: Digital Detox 🎮', 'Achievement: 100 hours played', 'Your friend is online - join game?', 'Daily challenge: Play for 30 mins', 'Tournament starts in 2 hours!'],
  },
  Snapchat: {
    bg: 'from-yellow-900/20 to-amber-900/20',
    posts: ['3 new snaps from friends 👻', 'Your streak is at risk! 🔥', 'Spotlight: Trending near you', 'New filter: Try it now', 'Friend added you back!'],
  },
};

const DEFAULT_CONTENT = {
  bg: 'from-surface-700/50 to-surface-800/50',
  posts: ['Custom app content 1', 'Custom app content 2', 'Custom app content 3', 'Custom app content 4', 'Custom app content 5'],
};

export default function MockAppPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { apps, todayUsage, fetchTodayUsage, setApps } = useApps();
  const { startTimer, stopTimer, onTimerTick, onAppBlocked, offTimerTick, offAppBlocked } = useSocket();

  const [app, setApp] = useState<App | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0); // total today including current session
  const [elapsedThisSession, setElapsedThisSession] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedData, setBlockedData] = useState<{ totalSeconds: number; dailyLimit: number } | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideCountdown, setOverrideCountdown] = useState(0);
  const [mockScrollY, setMockScrollY] = useState(0);
  const overrideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartedRef = useRef(false);

  // Find the app from context
  useEffect(() => {
    if (apps.length > 0 && appId) {
      const found = apps.find((a) => a._id === appId);
      if (found) {
        setApp(found);

        // Check if already blocked
        const now = new Date();
        const overrideStillActive = found.overrideUntil && new Date(found.overrideUntil) > now;
        if (found.isBlocked && !overrideStillActive) {
          // Get today's usage for this app
          const usage = todayUsage.find((u) => u.appId === appId);
          setLiveSeconds(usage?.totalSeconds || 0);
          setIsBlocked(true);
          setBlockedData({
            totalSeconds: usage?.totalSeconds || found.dailyLimit,
            dailyLimit: found.dailyLimit,
          });
          return;
        }

        if (overrideStillActive && found.overrideUntil) {
          setOverrideActive(true);
          const remaining = Math.max(0, Math.floor((new Date(found.overrideUntil).getTime() - now.getTime()) / 1000));
          setOverrideCountdown(remaining);
        }
      } else {
        navigate('/dashboard');
      }
    }
  }, [apps, appId, todayUsage]);

  // Start session when app is loaded and not blocked
  useEffect(() => {
    if (!app || isBlocked || sessionStartedRef.current) return;

    const startSession = async () => {
      try {
        const res = await api.post('/usage/start', { appId: app._id });
        const newSessionId = res.data.sessionId;
        setSessionId(newSessionId);
        sessionStartedRef.current = true;

        // Set initial usage seconds from today's data
        const usage = todayUsage.find((u) => u.appId === app._id);
        setLiveSeconds(usage?.totalSeconds || 0);

        // Start socket timer for real-time ticks
        startTimer(app._id, newSessionId);
      } catch (err: any) {
        if (err.response?.data?.blocked) {
          setIsBlocked(true);
          const usage = todayUsage.find((u) => u.appId === app._id);
          setBlockedData({
            totalSeconds: usage?.totalSeconds || app.dailyLimit,
            dailyLimit: app.dailyLimit,
          });
        }
      }
    };

    startSession();

    return () => {
      // Cleanup: end session when navigating away
      if (sessionStartedRef.current && sessionId) {
        api.put(`/usage/end/${sessionId}`).catch(() => {});
        stopTimer(app._id);
        sessionStartedRef.current = false;
      }
    };
  }, [app, isBlocked]);

  // Listen to socket timer ticks
  useEffect(() => {
    onTimerTick((data) => {
      if (data.appId === appId) {
        setLiveSeconds(data.totalSeconds);
        setElapsedThisSession(data.elapsedThisSession);
      }
    });

    onAppBlocked((data) => {
      if (data.appId === appId) {
        setIsBlocked(true);
        setBlockedData({ totalSeconds: data.totalSeconds, dailyLimit: data.dailyLimit });
        // Update app state in context
        setApps((prev) => prev.map((a) => a._id === appId ? { ...a, isBlocked: true } : a));
      }
    });

    return () => {
      offTimerTick();
      offAppBlocked();
    };
  }, [appId]);

  // Override countdown timer
  useEffect(() => {
    if (overrideActive && overrideCountdown > 0) {
      overrideTimerRef.current = setInterval(() => {
        setOverrideCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(overrideTimerRef.current!);
            setOverrideActive(false);
            // Re-check if still blocked after override expires
            fetchTodayUsage();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (overrideTimerRef.current) clearInterval(overrideTimerRef.current); };
  }, [overrideActive]);

  const handleOverrideGranted = useCallback(async () => {
    setIsBlocked(false);
    setOverrideActive(true);
    setOverrideCountdown(600); // 10 minutes

    // Update app state
    setApps((prev) =>
      prev.map((a) =>
        a._id === appId
          ? { ...a, isBlocked: false, overrideUntil: new Date(Date.now() + 600000).toISOString() }
          : a
      )
    );

    // Restart the session
    sessionStartedRef.current = false;
    const usage = todayUsage.find((u) => u.appId === appId);
    setLiveSeconds(usage?.totalSeconds || 0);
  }, [appId, todayUsage]);

  const handleBack = async () => {
    if (sessionId) {
      await api.put(`/usage/end/${sessionId}`).catch(() => {});
      stopTimer(app?._id || '');
    }
    navigate('/dashboard');
  };

  if (!app) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const content = MOCK_CONTENT[app.name] || DEFAULT_CONTENT;
  const percent = getUsagePercent(liveSeconds, app.dailyLimit);
  const progressColor = getUsageColor(percent);
  const timeLeft = app.dailyLimit > 0 ? Math.max(0, app.dailyLimit - liveSeconds) : null;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Block overlay */}
      {isBlocked && blockedData && (
        <BlockOverlay
          appId={app._id}
          appName={app.name}
          appIcon={app.icon}
          totalSeconds={blockedData.totalSeconds}
          dailyLimit={blockedData.dailyLimit}
          onOverrideGranted={handleOverrideGranted}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/5 text-gray-400 hover:text-white transition-all"
        >
          ←
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${app.color}20`, border: `1px solid ${app.color}30` }}
          >
            {app.icon}
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">{app.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{app.category}</p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Usage tracker card */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Today's Usage</p>
            <p className="font-mono text-4xl font-bold text-white">{formatTimer(liveSeconds)}</p>
          </div>
          <div className="text-right">
            {app.dailyLimit > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-1">Daily Limit</p>
                <p className="font-mono text-lg font-medium" style={{ color: progressColor }}>
                  {formatDuration(app.dailyLimit)}
                </p>
                {timeLeft !== null && (
                  <p className="text-xs text-gray-600 mt-1">
                    {timeLeft > 0 ? `${formatDuration(timeLeft)} left` : 'Limit reached'}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-1">No Limit Set</p>
                <p className="text-sm text-gray-600">Unlimited</p>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {app.dailyLimit > 0 && (
          <div>
            <div className="progress-bar mb-2">
              <div
                className="progress-fill transition-all duration-1000"
                style={{
                  width: `${percent}%`,
                  background: progressColor,
                  boxShadow: percent >= 80 ? `0 0 10px ${progressColor}60` : 'none',
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">0</span>
              <span style={{ color: progressColor }} className="font-medium">{percent}% used</span>
              <span className="text-gray-600">{formatDuration(app.dailyLimit)}</span>
            </div>
          </div>
        )}

        {/* Override badge */}
        {overrideActive && (
          <div className="mt-4 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
            <span className="text-yellow-400">⚠️</span>
            <div>
              <p className="text-yellow-400 text-sm font-medium">Override Active</p>
              <p className="text-yellow-400/60 text-xs">Expires in {formatTimer(overrideCountdown)}</p>
            </div>
          </div>
        )}

        {/* This session */}
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-600">
          <span>This session: <span className="font-mono text-gray-400">{formatTimer(elapsedThisSession)}</span></span>
          <span>Started tracking</span>
        </div>
      </div>

      {/* Mock App Content */}
      <div className={`card overflow-hidden bg-gradient-to-b ${content.bg}`}>
        {/* Mock app header */}
        <div
          className="px-5 py-4 border-b border-white/5 flex items-center gap-3"
          style={{ background: `${app.color}15` }}
        >
          <span className="text-2xl">{app.icon}</span>
          <span className="font-semibold text-white">{app.name}</span>
          <div className="ml-auto flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Mock feed */}
        <div className="p-4 space-y-3">
          {content.posts.map((post, i) => (
            <div
              key={i}
              className="bg-surface-800/60 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: `${app.color}30` }}
                >
                  {app.icon}
                </div>
                <div>
                  <div className="w-20 h-2 bg-white/10 rounded" />
                  <div className="w-12 h-1.5 bg-white/5 rounded mt-1" />
                </div>
              </div>
              <p className="text-sm text-gray-300">{post}</p>
              <div className="flex gap-4 mt-3">
                <button className="text-xs text-gray-600 hover:text-gray-400 transition-colors">❤️ Like</button>
                <button className="text-xs text-gray-600 hover:text-gray-400 transition-colors">💬 Comment</button>
                <button className="text-xs text-gray-600 hover:text-gray-400 transition-colors">↗️ Share</button>
              </div>
            </div>
          ))}

          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-600">Loading more content...</p>
          </div>
        </div>
      </div>

      {/* Warning when near limit */}
      {app.dailyLimit > 0 && percent >= 80 && percent < 100 && (
        <div className="mt-4 card p-4 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-orange-400 font-medium text-sm">Approaching your limit</p>
              <p className="text-orange-400/60 text-xs">
                Only {formatDuration(timeLeft || 0)} remaining for {app.name} today
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
