# Swasth AI – AI-Assisted Tele-Triage & Guidance Platform

> **Hackathon Theme**: AI for Social Good
> **Problem Statement**: AI-Assisted Telemedicine Platform

Swasth AI is a web-based health guidance platform that helps users understand their symptoms and decide on next steps — rest at home, visit a clinic, or seek urgent care. It does **NOT** provide medical diagnosis.

##  Key Differentiator: Rules-Based Triage (NOT Raw AI)

Unlike simply asking an AI chatbot, Swasth AI uses a **clinically-informed rules engine** for consistent, reproducible triage decisions. AI (Gemini) is used only for understanding symptom text and generating friendly explanations — **never for the triage decision itself**.

| Feature | Raw AI Chatbot | Swasth AI |
|---|---|---|
| Triage Decision | LLM guesses (inconsistent) | Rules engine (consistent) |
| Assessment | Unstructured | Guided 4-6 question flow |
| Emergency Detection | May miss | Instant RED alert |
| Human Oversight | None | Reviewer dashboard |
| Audit Trail | None | Full session logging |

##  Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────┐
│   React +   │────▶│  Express API     │────▶│ MongoDB  │
│  Tailwind   │◀────│  (TypeScript)    │◀────│          │
│  Frontend   │     │                  │     └──────────┘
└─────────────┘     │  ┌────────────┐  │
                    │  │Rules Engine│  │     ┌──────────┐
                    │  └────────────┘  │────▶│ Gemini   │
                    │  ┌────────────┐  │◀────│ API      │
                    │  │ AI Service │  │     └──────────┘
                    │  └────────────┘  │
                    └──────────────────┘
```

##  Quick Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- Google Gemini API key (optional, app works without it)

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env     # Edit with your MongoDB URI and Gemini API key
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/swasthai
GEMINI_API_KEY=your_key_here    # Optional - works without it
JWT_SECRET=your_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Database

```bash
cd backend
npm run seed
```
This creates demo accounts:
- **Admin**: `admin` / `swasthya123`
- **Reviewer**: `reviewer` / `review123`

### 4. Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit **http://localhost:5173**

##  Testing Each Feature

### 1. Symptom Assessment Flow
- Go to `/` → Click "Get Started"
- Type: **"I have fever and cough for 3 days"**
- Answer 5 follow-up questions
- See triage result (Green/Yellow/Red)

### 2. Emergency Detection
- In symptom input, type: **"I am unconscious and not breathing"**
- System immediately shows **RED** emergency guidance

### 3. Unsupported Symptoms
- Type: **"I have a skin rash on my arm"**
- System says it can't assess and suggests contacting a doctor

### 4. Reviewer Dashboard
- Go to `/login` → Use demo credentials
- View flagged cases, click to see details
- Add review notes, mark as reviewed

### 5. Multilingual Support
- Use the language dropdown (English / हिन्दी / தமிழ்)
- All UI labels, questions, and results switch language

##  Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB, triage rules, prompts, disclaimers
│   │   ├── controllers/     # Triage, Dashboard, Auth logic
│   │   ├── middleware/       # JWT auth, error handler
│   │   ├── models/          # TriageSession, User (Mongoose)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Rules engine, AI service
│   │   └── index.ts         # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, shared components
│   │   ├── pages/           # Landing, SymptomChat, TriageResult, Login, Dashboard, CaseDetail
│   │   ├── i18n/            # en.json, hi.json, ta.json
│   │   ├── services/        # API client
│   │   ├── context/         # Language context
│   │   └── App.tsx          # Router
│   └── package.json
└── README.md
```

##  API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/triage/start` | No | Start triage session |
| POST | `/api/triage/answer` | No | Answer a question |
| POST | `/api/auth/login` | No | Reviewer login |
| GET | `/api/dashboard/cases` | JWT | List flagged cases |
| GET | `/api/dashboard/cases/:id` | JWT | Case detail |
| POST | `/api/dashboard/cases/:id/review` | JWT | Mark reviewed |
| GET | `/api/dashboard/stats` | JWT | Dashboard stats |

##  Supported Symptom Categories

1. **Fever & Cough** — flu, infection, respiratory
2. **Chest Discomfort** — chest pain, breathlessness
3. **Diarrhoea & Vomiting** — GI, dehydration
4. **Headache** — severity, vision, neck stiffness

## Disclaimer

This tool does **NOT** provide medical diagnosis, prescribe medication, or replace professional medical advice. It provides preliminary, non-diagnostic guidance only. In emergencies, call **112** or visit your nearest emergency room.

## Languages Supported

- 🇬🇧 English
- 🇮🇳 हिन्दी (Hindi)
- 🇮🇳 தமிழ் (Tamil)
