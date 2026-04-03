# 🔌 SubSave — AI-Powered Subscription Watchdog

> **Stop Overpaying. Start Saving.**  
> SubSave uses Google Gemini AI to scan your subscriptions, surface hidden charges, and find personalized cheaper alternatives — tailored to who you are.

---

## 🏆 Hackathon Category
**AI / Personal Finance / Consumer Tools**

---

## 🚀 Live Demo
Start the app locally with the steps below. A full video walkthrough is included in the submission.

---

## 💡 The Problem

The average American spends **$273/month** on subscriptions — and most don't even know half of them exist. Forgotten trials, duplicated services, and overpriced plans quietly drain bank accounts every month. Existing tools are generic and offer no personalized guidance.

---

## ✅ Our Solution

SubSave is a full-stack AI web app that:

1. **Onboards users intelligently** — Collects name, age, occupation (student, veteran, healthcare, etc.) and interests to power hyper-personalized recommendations.
2. **Scans & detects subscriptions** — Simulates bank transaction analysis to identify all recurring charges in seconds.
3. **Applies AI-powered analysis** — Uses **Google Gemini 2.0 Flash** to give a punchy, personalized one-liner recommendation for each subscription.
4. **Surfaces cheaper alternatives** — A Tinder-style swipe deck lets users browse AI-curated alternatives with real savings amounts.
5. **Shows real-time savings** — An analytics dashboard with dual charts tracks monthly savings vs. spend over time.
6. **Floating AI chat** — Ask SubSave AI anything about your subscriptions in natural language.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎯 **Personalized Onboarding** | Profile-aware: Student, Veteran, Senior, Freelancer, etc. |
| 🤖 **Gemini AI Analysis** | Per-subscription insights powered by Gemini 2.0 Flash |
| 💳 **Swipe Deck** | Tinder-style UI to explore cheaper alternatives |
| 📊 **Analytics Dashboard** | Savings vs. spend charts with Recharts |
| 💬 **Floating AI Chat** | Real-time Q&A about your subscription portfolio |
| 🎖️ **Discount Discovery** | Student/veteran/military deals surfaced automatically |
| 🔒 **Smart Fallbacks** | Works even if Gemini is unavailable (rule-based engine) |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI framework
- **Vite** — Dev server + bundler
- **Framer Motion** — Animations and swipe gestures
- **TailwindCSS 4** — Utility-first styling
- **Recharts** — Analytics charts
- **React Router DOM 7** — Client-side routing
- **Lucide React** — Icon library
- **Axios** — HTTP client

### Backend
- **Node.js + Express** — REST API server
- **@google/genai** — Google Gemini 2.0 Flash SDK
- **dotenv** — Environment variable management

### AI
- **Google Gemini 2.0 Flash** — Subscription analysis, chat, and alternative discovery

---

## 📁 Project Structure

```
hackathon-project/
├── src/
│   ├── pages/
│   │   ├── Onboarding.jsx       # 4-step personalized onboarding flow
│   │   ├── ScanDashboard.jsx    # Transaction scanner with AI insights
│   │   ├── AlternativeSwipeDeck.jsx  # Tinder-style swipe UI
│   │   ├── Dashboard.jsx        # Analytics with dual charts
│   │   ├── AiAssistant.jsx      # Full-page AI chat
│   │   └── UserProfile.jsx      # User profile page
│   ├── components/
│   │   ├── Sidebar.jsx          # Persistent navigation
│   │   ├── FloatingChat.jsx     # Floating AI chat bubble
│   │   ├── SwipeCard.jsx        # Individual swipe card component
│   │   └── ...
│   └── services/
│       └── api.js               # API client
├── backend/
│   ├── server.js                # Express REST API
│   ├── aiService.js             # Gemini + fallback AI logic
│   ├── subscriptionEngine.js    # Transaction simulation engine
│   └── data.js                  # Seed data
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/hackathon-project.git
cd hackathon-project
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd backend
npm install
cd ..
```

### 4. Set up environment (optional — app works with demo data)
```bash
# backend/.env (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Start the backend
```bash
cd backend
node server.js
```

### 6. Start the frontend (new terminal)
```bash
npm run dev
```

### 7. Open the app
Navigate to **http://localhost:5173** and complete the onboarding!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/profile` | Save user profile for AI personalization |
| `GET` | `/api/scan` | Scan & detect subscriptions |
| `GET` | `/api/subscriptions` | Get subs with Gemini AI insights |
| `POST` | `/api/subscriptions/:id/cancel` | Mark subscription as cancelled |
| `POST` | `/api/subscriptions/:id/keep` | Mark subscription as kept |
| `GET` | `/api/sweeps` | Get personalized AI alternatives |
| `POST` | `/api/chat` | Chat with SubSave AI |
| `GET` | `/api/overview` | Dashboard overview data |

---

## 📸 Screenshots

See the demo video in the hackathon submission for a full walkthrough.

---

## 👥 Team

| Name | Role |
|------|------|
| Shiva Krishna | Full-Stack Developer & AI Integration |
| Navin Roy | Full-Stack Developer & AI Integration |
| Hrithik Turaka | Full-Stack Developer & AI Integration |
| Mohammed T | Full-Stack Developer & AI Integration |

---

## 📄 License

MIT License — feel free to fork and build on this!
