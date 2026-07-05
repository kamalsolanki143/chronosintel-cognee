# 🕵️ ChronosIntel

> AI-Powered Temporal Investigation Platform using Cognee Memory Graphs

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green)
![Cognee](https://img.shields.io/badge/Cognee-AI-blue)
![Gemini](https://img.shields.io/badge/Google-Gemini-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📌 Overview

ChronosIntel is an AI-powered cyber investigation platform that transforms scattered evidence into an intelligent investigation workspace.

Instead of simply storing uploaded documents, ChronosIntel builds a persistent knowledge graph, remembers investigation context, connects entities across evidence, and assists investigators with grounded AI reasoning.

The platform is designed for digital forensics, cyber investigations, fraud analysis, compliance investigations, and intelligence workflows.

---

# 🚀 Features

- 📂 Investigation Case Management
- 📄 Evidence Upload (PDF, DOCX, TXT, CSV, JSON, LOG)
- 🤖 AI Investigation Chat
- 🧠 Persistent Case Memory using Cognee
- 🌐 Knowledge Graph Visualization
- ⏳ Temporal Timeline Generation
- 📊 Investigation Reports
- 🔍 Semantic Evidence Search
- 🧩 Entity Extraction
- 🔄 Version History
- 📈 Investigation Dashboard
- 👥 Investigator Profiles

---

# 🧠 How We Used Cognee

Cognee is the intelligence layer of ChronosIntel.

Instead of treating uploaded files independently, Cognee continuously builds long-term investigation memory.

We used Cognee for:

- Persistent Investigation Memory
- Knowledge Graph Construction
- Semantic Evidence Retrieval
- Relationship Discovery
- Temporal Context Preservation
- Cross-document Memory
- Grounded AI Responses
- Long-term Investigation Context

This allows investigators to ask questions naturally while preserving context across the entire investigation lifecycle.

---

# 🏗 Architecture

```
               User
                │
                ▼
        Next.js Frontend
                │
                ▼
         FastAPI Backend
                │
      ┌─────────┴─────────┐
      ▼                   ▼
 Google Gemini        Cognee Memory
      │                   │
      └─────────┬─────────┘
                ▼
      Knowledge Graph Engine
                │
                ▼
      SQLite + Local Storage
```

---

# ⚙ Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

## Backend

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## AI

- Cognee
- Google Gemini
- Knowledge Graph
- Semantic Memory

## Deployment

- Vercel
- Render

---

# 📂 Project Structure

```
chronosintel-cognee/

├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── styles/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── database/
│   │   ├── utils/
│   │   └── config.py
│   │
│   ├── ai/
│   │   ├── cognee/
│   │   ├── gemini/
│   │   └── prompts/
│   │
│   └── storage/
│
└── README.md
```

---

# 🖥 Installation

Clone Repository

```bash
git clone https://github.com/kamalsolanki143/chronosintel-cognee.git

cd chronosintel-cognee
```

Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌍 Environment Variables

Backend

```
ENVIRONMENT=development

DATABASE_URL=sqlite+aiosqlite:///./chronosintel.db

GEMINI_API_KEY=YOUR_KEY

COGNEE_API_KEY=YOUR_KEY
```

Frontend

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# 📸 Screenshots

- Dashboard
- Investigation
- Knowledge Graph
- Timeline
- Reports
- Case Memory
- AI Investigation Chat

---

# 🎥 Demo

Video Demo:

(Add YouTube Link)

---

# 🌐 Live Demo

Frontend

https://chronosintel-cognee.vercel.app

Backend

https://chronosintel-cognee.onrender.com

---

# 🎯 Use Cases

- Cyber Crime Investigation
- Digital Forensics
- Fraud Detection
- Threat Intelligence
- Compliance Monitoring
- Financial Investigation
- Incident Response

---

# 📈 Future Improvements

- Multi-user Collaboration
- Neo4j Integration
- Multi-LLM Support
- OCR Pipeline
- Email Investigation
- Threat Intelligence APIs
- Real-time Alerts
- Cloud Storage Integration

---

# 👨‍💻 Team

## Team Members

### Kamal Solanki
- Full Stack Development
- AI Integration
- Backend Development
- Frontend Development
- Deployment

### Krrish Yaduka
- AI Engineering
- Cognee Integration
- Knowledge Graph Development

### Muskan Yeshmin Ali
- Backend Development
- API Development
- Authentication Module
- Database Integration

### Tanish
- UI/UX
- Frontend Support
- Testing
- Demo Video & Presentation

---

GitHub Repository

https://github.com/kamalsolanki143/chronosintel-cognee

# 🏆 Built For

Cognee AI Memory Hackathon 2026

Building the next generation of AI-powered investigation systems using persistent memory and knowledge graphs.

---

## ⭐ If you like this project, please give it a star!

# 🤝 Contributors

<a href="https://github.com/kamalsolanki143/chronosintel-cognee/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kamalsolanki143/chronosintel-cognee" />
</a>
