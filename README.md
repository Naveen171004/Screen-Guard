# 🛡️ ScreenGuard – Digital Wellbeing & App Time Restriction

A full-stack MERN web application that lets you set daily time limits for apps, track usage in real-time via Socket.io, and block access with a secure PIN-protected overlay when limits are reached.

> **Project:** Time-Based Restriction of Mobile App Usage (adapted as a web app)  
> **Team:** Dhilip Kumar S, Mohammed Mustaq Mubeen J, Naveen M  
> **Guide:** Dr. A. Rajeswari, Associate Professor

---

## ✨ Features

- **User Authentication** – JWT + bcrypt email/password login
- **App Dashboard** – 10 pre-seeded apps (Instagram, YouTube, WhatsApp, etc.) + add custom apps
- **Daily Time Limits** – Set per-app limits (15 min presets or custom hours:minutes)
- **Real-Time Tracking** – Live timer via Socket.io updates every second while you're on an app screen
- **Automatic Blocking** – Full-screen overlay appears exactly when the daily limit is hit
- **Secure PIN Override** – 4-digit PIN grants 10-minute emergency access; hashed with bcrypt
- **Analytics** – Weekly/monthly bar charts, pie chart, and top-apps ranking (Recharts)
- **Privacy-First** – Everything runs locally; no cloud, no ads, no telemetry

---

## 📁 Project Structure

```
screenguard/
├── server/                    # Node.js + Express backend
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, PIN
│   │   ├── appsController.js  # CRUD for apps
│   │   └── usageController.js # Session tracking + analytics
│   ├── middleware/
│   │   └── auth.js            # JWT protect middleware
│   ├── models/
│   │   ├── User.js            # User schema (password + PIN hashing)
│   │   ├── App.js             # App schema + default apps list
│   │   └── Usage.js           # UsageSession + DailyUsage schemas
│   ├── routes/
│   │   ├── auth.js
│   │   ├── apps.js
│   │   └── usage.js
│   ├── index.js               # Express + Socket.io server entry
│   ├── package.json
│   └── .env.example
│
├── client/                    # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.tsx          # Sidebar + navigation
│   │   │   └── ui/
│   │   │       ├── AppCard.tsx         # App tile with usage bar
│   │   │       ├── SetLimitModal.tsx   # Time limit picker
│   │   │       ├── AddAppModal.tsx     # Custom app creator
│   │   │       └── BlockOverlay.tsx    # Full-screen block + PIN entry
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # JWT auth state
│   │   │   ├── AppContext.tsx          # Apps + usage state
│   │   │   └── SocketContext.tsx       # Socket.io connection + events
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx       # Main app grid
│   │   │   ├── MockAppPage.tsx         # Real-time tracking screen
│   │   │   ├── AnalyticsPage.tsx       # Charts and insights
│   │   │   └── SettingsPage.tsx        # PIN management + profile
│   │   ├── utils/
│   │   │   ├── api.ts                  # Axios instance with JWT
│   │   │   └── time.ts                 # Duration formatting helpers
│   │   ├── types/index.ts
│   │   ├── App.tsx                     # Router
│   │   ├── main.tsx
│   │   └── index.css                   # Tailwind + global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── package.json               # Root scripts (install all, dev, etc.)
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

Make sure you have installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB | 7+ (local) | https://www.mongodb.com/try/download/community |
| MongoDB Compass | Latest | https://www.mongodb.com/products/compass |
| npm | 9+ | Comes with Node.js |

### Step 1 – Install MongoDB Locally

1. Download MongoDB Community Server from the link above
2. Run the installer (Windows: `.msi`, Mac: use Homebrew `brew install mongodb-community`)
3. Start MongoDB service:
   - **Windows:** `net start MongoDB` (or it starts automatically)
   - **Mac:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`
4. Verify it's running: open a terminal and run `mongosh` — you should see a MongoDB shell

### Step 2 – Clone and Configure

```bash
# Navigate to the project folder
cd screenguard

# Install all dependencies (both server and client)
npm run setup
```

### Step 3 – Set Up Environment Variables

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Open `server/.env` and update if needed (defaults work for local setup):

```env
MONGO_URI=mongodb://localhost:27017/screenguard
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Change `JWT_SECRET`** to a long random string before using. Never commit `.env` to git.

### Step 4 – Start the Backend Server

```bash
# In Terminal 1 – start the API + Socket.io server
npm run dev:server
```

You should see:
```
✅ MongoDB Connected: localhost
🛡️  ScreenGuard Server running on port 5000
📡 Socket.io ready for real-time connections
🗄️  Connect MongoDB Compass to: mongodb://localhost:27017/screenguard
```

### Step 5 – Start the Frontend

```bash
# In Terminal 2 – start the React dev server
npm run dev:client
```

You should see:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

### Step 6 – Open in Browser

Navigate to: **http://localhost:5173**

1. Click **Create Account** and register
2. You'll be automatically logged in with 10 default apps seeded
3. Click any app card to open its mock screen and start tracking!

---

## 🔭 Connect MongoDB Compass

1. Open **MongoDB Compass**
2. Click **New Connection**
3. Paste: `mongodb://localhost:27017`
4. Click **Connect**
5. Navigate to the **`screenguard`** database
6. Browse collections: `users`, `apps`, `dailyusages`, `usagesessions`

---

## 🎮 How to Use

### Set a Daily Limit
1. On the Dashboard, click the **⏱** button on any app card
2. Choose a preset (15 min, 30 min, 1 hour, etc.) or enter custom hours/minutes
3. Click **Save Limit**

### Track App Usage
1. Click **▶ Open** on an app card
2. The mock app screen opens and the live timer starts immediately
3. Watch the progress bar fill up in real time
4. Navigate away — the session ends automatically

### Set Override PIN
1. Go to **Settings**
2. Enter a 4-digit PIN twice and click **Save PIN**
3. When an app is blocked, click **Emergency Override** and enter your PIN
4. You get **10 minutes** of access

### View Analytics
Click **Analytics** in the sidebar to see:
- Stacked bar chart (daily usage per app)
- Pie chart (today's split)
- Top apps ranking
- Detailed breakdown table

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Charts | Recharts |
| HTTP client | Axios |

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt (12 rounds)**
- Override PINs are hashed separately with **bcrypt (10 rounds)**
- JWTs expire after **30 days**
- API rate limiting: **100 requests per 15 minutes** on auth endpoints
- All routes (except login/register) are JWT-protected

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| `MongoDB connection error` | Make sure `mongod` service is running |
| `Port 5000 already in use` | Change `PORT` in `.env` to `5001` |
| `Socket not connecting` | Make sure backend is running on port 5000 first |
| App shows "Blocked" incorrectly | Reset: update `isBlocked: false` in MongoDB Compass on the `apps` collection |
| Timer not counting | Check browser console for Socket.io connection errors |

---

## 📝 Notes for Evaluators

- All data is **user-specific** and isolated by `userId` in MongoDB
- The "apps" are mock/simulated representations of real apps — this is a web simulation of the Android concept
- Real-time blocking uses **Socket.io** (replaces Android's `UsageStatsManager` + `AccessibilityService`)
- WorkManager is replaced by **Socket.io background timers** that run server-side
- Room Database / SharedPreferences replaced by **MongoDB + JWT localStorage**
