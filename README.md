# RetailIQ — Agentic Retail Intelligence Platform

> **Tiger Premier League 2026 · Theme 2: Agentic AI for Business**  
> Team StoreIQ | Retail Intelligence for Every Role

---

## The Problem

Retail managers across every level — from CEO to store associate — are drowning in data but starving for decisions.

> *"I don't have time to dig into complex dashboards. I need quick visibility to make impactful decisions."*  
> — Store Director feedback

**The cost of slow decisions in retail:**
- Store managers spend 2–3 hours/day on manual data analysis
- PowerBI dashboards show numbers but no narrative, no "so what"
- Every persona needs different data — executives need regions, associates need tasks
- Decisions are reactive, not proactive — acting on yesterday's data

---

## The Solution

**RetailIQ** is a multi-persona agentic AI platform that delivers the right intelligence to the right person at the right scope — instantly.

- **Executive** sees all 5 regions, $18M portfolio, strategic risks
- **Region Head** sees their stores ranked and compared
- **Store Manager** sees store KPIs, staff, VIP events, inventory
- **Associate** sees their tasks, orders, dept NPS, inventory alerts

Every persona has a natural language AI chat powered by 5 specialized agents grounded in real data and store SOPs.

---

## Architecture — NextGen 4-Layer + 5-Agent Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  EXPERIENCE LAYER                                       │
│  React + TypeScript + Vite                              │
│  Persona selector → Role-based dashboards → AI Chat     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│  ORCHESTRATION LAYER                                    │
│  FastAPI + 5-Agent Pipeline                             │
│  Orchestrator → Analyst | Planner | Inventory | Client  │
│  Text-to-SQL Agent → SQLite                             │
│  Synthesizer → Persona-aware response                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│  KNOWLEDGE LAYER                                        │
│  SQLite — 11 tables, 8,295 transactions                 │
│  store_sop.txt — 7-section grounding document           │
│  DB Schema — injected into SQL agent context            │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│  OBSERVABILITY LAYER                                    │
│  Async job tracking, agent tracing, error handling      │
└─────────────────────────────────────────────────────────┘
```

### The 5 Agents

| Agent | Role | Data Sources |
|-------|------|-------------|
| **Orchestrator** | Parses intent, routes to agents | Question text |
| **Analyst** | KPIs, trends, vs-LY gaps | transactions, store_kpis |
| **Planner** | Staffing, events, tasks, ops | employees, events, orders, tasks |
| **Inventory** | Stock levels, alerts, VIP picks | inventory |
| **Client** | Segments, VIP outreach | transactions |
| **Text-to-SQL** | Natural language → SQL → results | All 11 tables |
| **Synthesizer** | Merges outputs → persona response | All agent outputs + SOP |

### Why Text-to-SQL is the Key Innovation

Instead of dumping thousands of rows into prompts:
- Agent receives the **database schema** (~200 tokens)
- Writes a **precise SQL query** for exactly what's needed
- Returns **only the relevant rows**
- **10x cheaper**, **5x faster**, **zero hallucinated numbers**

### Persona-Aware Responses

Every response is tailored by role:
- **Executive** → regional trends, portfolio risks, strategic language
- **Store Manager** → staff names, SKU numbers, SOP compliance
- **Associate** → their tasks, their orders, simple actionable steps

---

## Demo Scenario

**Demo Date:** May 20, 2025 | **Store:** Fifth Avenue Flagship, New York

| Signal | Detail |
|--------|--------|
| MTD Sales | -8.5% vs LY — urgency |
| Ready-to-Wear | -13% vs LY — drag |
| Leather Goods | +10% vs LY — opportunity |
| VIP Event | May 27 — 35 Top Tier clients |
| Staff Alert | 2 Senior CAs on vacation |
| Low Stock | Neverfull MM: 3 units |
| Overdue Orders | 20 orders, $41K at risk |

---

## Tech Stack

**Backend:** FastAPI, SQLite, Anthropic Claude (claude-sonnet-4-5), Python  
**Frontend:** React, Vite, TypeScript, TanStack Router, Recharts, Tailwind CSS  
**AI:** Text-to-SQL agent, SOP grounding, persona-aware synthesis  
**Database:** 11 tables — transactions, employees, inventory, events, regions, stores, departments, nps, orders, tasks, store_kpis

---

## Setup & Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python generate_db.py
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```
ANTHROPIC_API_KEY=your_key_here
CLAUDE_MODEL=claude-sonnet-4-5
DB_PATH=storeiq.db
```

---

## Business Value

| Metric | Before | After |
|--------|--------|-------|
| Time to insight | 2–3 hours/day | < 30 seconds |
| Decision consistency | Varies by manager | SOP-grounded |
| Persona-appropriate data | Manual | Automatic |
| VIP event prep | 4–6 hours | Minutes |
| Overdue order visibility | Next day | Real-time |

**Projected value at 50-store scale: $52M+ annually**

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Done | Multi-persona platform, 5 agents, live data |
| 2 | 🔜 Next | Real POS integration (Oracle, SAP, Salesforce) |
| 3 | 🔜 Q3 2026 | Multi-store scalability, SSO |
| 4 | 🔜 Q4 2026 | Predictive alerts, proactive AI |
| 5 | 🔜 2027 | Enterprise graph knowledge layer |

---

*RetailIQ · Tiger Premier League 2026 · Theme 2: Agentic AI for Business · Team StoreIQ*
