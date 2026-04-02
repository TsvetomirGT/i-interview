# 🎯 i-interview

> **AI-powered technical interview practice — sharpen your skills before the real thing.**

i-interview puts you in a realistic technical interview with an AI interviewer powered by Claude. Paste a job description, pick your mode, and start practicing. Get scored, get feedback, get hired.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Interviewer** | Claude Sonnet 4.6 asks role-specific technical questions tailored to the job description |
| 📚 **Learn Mode** | Get a score (0–10), the ideal answer, and detailed feedback after every response |
| 🎭 **Real Mode** | Full simulation — no hints, no scores, just you and the interviewer |
| 📋 **10-Question Sessions** | Each session runs exactly 10 questions, then delivers a full performance summary |
| 🏆 **Hiring Recommendation** | Ends with a **Strong Hire / Hire / No Hire** assessment |
| 📂 **Interview History** | Past sessions saved locally — review scores and topics anytime |
| 📁 **File Upload** | Drop in a `.txt`, `.pdf`, `.doc`, or `.docx` job description, or paste text directly |
| 🌙 **Dark Mode** | System-preference-aware theme toggle, persisted across sessions |
| ⚡ **Streaming Responses** | AI answers stream in real-time, token by token |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/i-interview.git
cd i-interview
npm install
```

### 2. Set Your API Key

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local   # if .env.example exists
# or create it manually:
touch .env.local
```

Open `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

> 🔑 **Get your API key** at [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it! 🎉

---

## 🔑 API Key Setup (Detailed)

The app uses the **Anthropic Claude API** exclusively. No other services or databases are required.

### Where to get it
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **API Keys** in the sidebar
4. Click **Create Key**, give it a name, copy it

### Where to put it

| Environment | Location |
|---|---|
| **Local development** | `.env.local` in the project root |
| **Vercel** | Project Settings → Environment Variables → `ANTHROPIC_API_KEY` |
| **Other hosts** | Set `ANTHROPIC_API_KEY` as an environment variable in your hosting dashboard |

> ⚠️ **Never commit your API key.** `.env.local` is already in `.gitignore`.

### Expected usage
Each interview session (10 questions + summary) uses approximately **15,000–30,000 tokens** depending on answer length. Claude Sonnet 4.6 is cost-efficient for this workload.

---

## 🎮 How to Use

### Starting an Interview

1. **Open the app** at `http://localhost:3000`
2. **Paste or upload** the job description / role requirements (minimum 50 characters)
   - Drag & drop a `.txt`, `.pdf`, `.doc`, or `.docx` file onto the upload zone, or
   - Paste the job posting text directly
3. **Choose a mode:**
   - 📚 **Learn** — best for practice; you'll get scored and see the ideal answer after each question
   - 🎭 **Real** — best for final prep; the AI acts like a real interviewer, no hand-holding
4. Click **Start Interview**

### During the Interview

- Type your answer in the input box at the bottom
- Press **Enter** to submit, **Shift+Enter** for a new line
- The AI will respond (and score you in Learn mode) before moving to the next question
- A counter shows your progress (e.g., **Question 3 / 10**)

### Interview Summary

After question 10, you'll see a full summary including:

- 📊 Overall performance breakdown
- 💪 Key strengths
- 📈 Areas to improve
- 🏷️ Final verdict: **Strong Hire**, **Hire**, or **No Hire**

### Interview History

Past completed interviews are saved to your browser's `localStorage`. From the home page sidebar you can:

- See each session's topic, mode, average score, and date
- 🗑️ Delete sessions you no longer need

> 💡 History is stored locally in your browser — it won't sync across devices or survive clearing browser data.

---

## 🛠️ Development

### Commands

```bash
npm run dev      # Start dev server with Turbopack (hot reload)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
i-interview/
├── app/
│   ├── layout.tsx              # Root layout & metadata (mounts global Header)
│   ├── page.tsx                # Home page (setup form + history sidebar)
│   ├── globals.css             # Tailwind globals & CSS variables (orange theme)
│   ├── interview/
│   │   ├── page.tsx            # Interview chat page
│   │   └── loading.tsx         # Loading skeleton
│   └── api/
│       ├── interview/
│       │   └── route.ts        # Streaming AI interview endpoint
│       └── parse-file/
│           └── route.ts        # PDF / DOC / DOCX text extraction endpoint
├── components/
│   ├── setup/                  # SetupForm, ModeSelector
│   ├── interview/              # ChatShell, ChatBubble, FeedbackCard,
│   │   │                       # SummaryPanel, HistorySidebar, etc.
│   └── ui/                     # Button, FileDropZone, Header
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── chains.ts               # Anthropic SDK streaming builder
│   ├── prompts.ts              # System prompts per mode
│   ├── session.ts              # sessionStorage helpers
│   ├── history.ts              # localStorage helpers
│   └── useStreamingChat.ts     # Streaming chat React hook
└── .env.local                  # 🔑 Your API key goes here (not committed)
```

### Tech Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **UI**: React 19.2 + Tailwind CSS v4
- **Language**: TypeScript (strict)
- **AI**: Anthropic SDK — `claude-sonnet-4-6`

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

During setup, add your environment variable:
- **Key**: `ANTHROPIC_API_KEY`
- **Value**: `sk-ant-xxxxxxxxxxxxxxxxxxxx`

Or set it via the Vercel dashboard: **Project → Settings → Environment Variables**.

### Other Platforms

Set the `ANTHROPIC_API_KEY` environment variable in your host's configuration, then:

```bash
npm run build
npm run start
```

---

## 🔒 Privacy

- **No backend database** — all interview history is stored in your browser's `localStorage`
- **No user accounts** — completely anonymous
- **API calls go directly** from the server to Anthropic (your key stays server-side)
- Clearing your browser data will erase your interview history

---

## 📄 License

MIT — do whatever you want with it.
