# Staff Attendance Portal (KFA Academy)

A full-stack, mobile-first, offline-first Staff Attendance & Class Management Portal built with React Native Web (Expo), PWA Service Workers, IndexedDB, Node.js / Express Backend, and Supabase Database.

---

## 📁 Repository Folder Structure

```text
staff-attendance-portal/
│
├── frontend/             # Independent Client Web / Mobile Application (React Native Web / PWA)
│   ├── app/              # Expo Router page routes (admin, staff, auth)
│   ├── public/           # PWA Manifest, icons, sw.js
│   ├── src/
│   │   ├── components/   # UI & Mobile navigation components
│   │   ├── context/      # AuthContext & OfflineContext
│   │   ├── offline/      # IndexedDB database & SyncManager
│   │   ├── pwa/          # Service Worker registration
│   │   ├── services/     # Database API client
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Date & format helpers
│   ├── package.json
│   └── tsconfig.json
│
├── backend/              # Independent Node.js / Express API Server
│   ├── src/
│   │   ├── config/       # Supabase client configuration
│   │   ├── controllers/  # Request controllers
│   │   ├── middleware/   # Auth & Role authorization middleware
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic services
│   │   ├── app.ts        # Express app
│   │   └── server.ts     # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

---

## 🚀 Independent Running & Local Development

### 1. Frontend Client Application

```bash
cd frontend
npm install
npm start
```

Served live at `http://localhost:8081` (Mobile-app responsive mode & offline PWA support).

### 2. Backend Server Application

```bash
cd backend
npm install
npm run dev
```

Server running at `http://localhost:5000`.

---

## 🌐 Independent Deployment Guide

### Deploying Frontend (`frontend/`) to Vercel
1. Connect your repository to **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run export` or `npx expo export --platform web`.
4. Set **Output Directory** to `dist`.

### Deploying Backend (`backend/`) to Render
1. Create a new **Web Service** on **Render**.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install && npm run build`.
4. Set **Start Command** to `npm start`.
5. Add Environment Variables:
   - `SUPABASE_URL`: `https://your-supabase-project-id.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`

---

## ⚡ Features & Capabilities
- **Mobile-App UI**: Native bottom tab navigation, compact headers, mobile slide-in drawer, and safe-area support.
- **Offline-First Attendance**: IndexedDB storage, offline observations, pending sync queues, and automatic background synchronization.
- **Role-Based Portals**: Staff, Admin, and Super Admin access control with zero cross-role exposure.
