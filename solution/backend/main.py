"""
StoreIQ — main.py
Full FastAPI backend with 5-agent agentic architecture + Text-to-SQL
Run: uvicorn main:app --reload --port 8000
"""

import os
import sqlite3
import json
import threading
import uuid
from datetime import date, datetime
from typing import Optional
from contextlib import contextmanager

import anthropic
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()



# ── CONFIG ────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
print(f"API KEY LOADED: {ANTHROPIC_API_KEY[:20]}...")
CLAUDE_MODEL      = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
DB_PATH           = os.getenv("DB_PATH", "storeiq.db")
DEMO_TODAY        = date(2025, 5, 20)
DEMO_TODAY_STR    = "2025-05-20"
DEMO_MONTH        = 5
DEMO_YEAR         = 2025
LY_YEAR           = 2024

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

app = FastAPI(title="StoreIQ API", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store for async results
job_store: dict = {}

# ── DATABASE SCHEMA (for SQL Agent) ──────────────────────────────────────────
DB_SCHEMA = """
DATABASE SCHEMA for RetailIQ (SQLite) — 11 tables:

TABLE: transactions
  transaction_id    TEXT  -- unique ID e.g. TXN-00001
  dream_id          TEXT  -- client ID e.g. CLT-001
  transaction_date  TEXT  -- YYYY-MM-DD
  transaction_year  INT   -- 2024 or 2025
  transaction_month INT   -- 1-12
  transaction_hour  INT   -- 10-20
  turnover_usd      REAL  -- sale amount in USD
  units             INT   -- number of units sold
  category          TEXT  -- 'Leather Goods','Ready-to-Wear','Shoes','Accessories','Jewelry & Watches','Fragrances'
  gender            TEXT  -- 'Women' or 'Men'
  is_appointment    INT   -- 1 if appointment-based, 0 if walk-in
  client_segment    TEXT  -- 'Top Tier','High Potential','Repeater 10K+','Repeater','One-Timer'
  client_location   TEXT  -- 'Local','Non-Local','International'
  salesperson_id    TEXT  -- e.g. EMP-001
  job_title         TEXT  -- e.g. 'Client Advisor'
  generation        TEXT  -- 'Gen Z','Millennial','Gen X','Boomer'
  sale_type         TEXT  -- 'Normal Sale'
  season_animation  TEXT  -- 'SS25','FW24','Core','Holiday'
  store_id          TEXT  -- e.g. STR-001 (Fifth Avenue Flagship)

TABLE: employees
  employee_id       TEXT  -- e.g. EMP-001
  name              TEXT  -- full name
  job_title         TEXT  -- 'Store Director','Assistant Director','Senior Client Advisor','Client Advisor','Client Host','Visual Merchandiser','Stock Associate'
  macro_group       TEXT  -- 'Management','Selling Team','Back Office'
  store_id          TEXT  -- e.g. STR-001
  hire_date         TEXT  -- YYYY-MM-DD
  gender            TEXT
  language_skills   TEXT  -- comma-separated e.g. 'English,Mandarin,French'
  speciality        TEXT  -- product category specialty
  schedule_type     TEXT  -- 'Full-Time' or 'Part-Time'
  days_off_this_week TEXT
  on_vacation       INT   -- 1 if on vacation week of May 26-30 (EMP-008 Sarah Mitchell, EMP-011 James Chen)
  performance_tier  TEXT  -- 'Top','Mid','Junior'

TABLE: inventory
  sku_id            TEXT  -- e.g. SKU-001
  product_name      TEXT
  category          TEXT  -- same as transactions
  gender            TEXT
  color             TEXT
  size              TEXT
  retail_price      REAL
  units_in_stock    INT
  units_sold_mtd    INT
  units_sold_ly     INT
  reorder_point     INT
  last_restock      TEXT
  season            TEXT  -- 'SS25','FW24','Core','Holiday'
  is_hero_product   INT   -- 1 if hero/flagship item
  is_vip_selection  INT   -- 1 if curated for VIP event May 27
  store_id          TEXT

TABLE: events
  event_id          TEXT
  event_name        TEXT
  event_date        TEXT  -- YYYY-MM-DD
  event_type        TEXT  -- 'VIP','Animation','Training','Operations'
  expected_clients  INT
  target_segment    TEXT
  store_id          TEXT
  assigned_staff    TEXT  -- comma-separated employee IDs
  notes             TEXT
  category_focus    TEXT

TABLE: regions
  region_id         TEXT  -- e.g. RGN-001
  region_name       TEXT  -- 'Northeast','Southeast','Midwest','West','Southwest'
  hq_city           TEXT

TABLE: stores
  store_id          TEXT  -- e.g. STR-001
  store_name        TEXT  -- e.g. 'Fifth Avenue Flagship'
  region_id         TEXT  -- foreign key to regions
  city              TEXT
  is_flagship       INT   -- 1 if flagship store
  sq_footage        INT

TABLE: departments
  dept_id           TEXT  -- e.g. DEPT-001
  dept_name         TEXT  -- 'Leather Goods','Ready-to-Wear','Shoes','Accessories','Jewelry & Watches','Fragrances'
  sales_share       REAL  -- share of total sales (0.35 = 35%)
  avg_price         REAL  -- average price point

TABLE: nps
  nps_id            TEXT
  store_id          TEXT  -- foreign key to stores
  dept_id           TEXT  -- foreign key to departments
  nps_score         INT   -- NPS score 0-100
  promoters_pct     REAL  -- % promoters
  passives_pct      REAL  -- % passives
  detractors_pct    REAL  -- % detractors
  response_count    INT   -- number of survey responses
  period_date       TEXT  -- YYYY-MM-DD

TABLE: orders
  order_id          TEXT  -- e.g. ORD-STR-001-001
  store_id          TEXT  -- foreign key to stores
  dept_id           TEXT  -- foreign key to departments
  customer_name     TEXT
  order_channel     TEXT  -- 'Online','App','Phone'
  status            TEXT  -- 'Ready','Pulling','Pending','Overdue'
  order_date        TEXT  -- YYYY-MM-DD
  pickup_time       TEXT  -- HH:MM
  order_value       REAL  -- order value in USD

TABLE: tasks
  task_id           TEXT  -- e.g. TASK-0001
  employee_id       TEXT  -- foreign key to employees
  store_id          TEXT  -- foreign key to stores
  task_name         TEXT  -- e.g. 'Morning floor check','Process pickup orders'
  task_type         TEXT  -- 'routine','orders','inventory','event','clienteling'
  status            TEXT  -- 'Done','Pending','Overdue'
  due_date          TEXT  -- YYYY-MM-DD
  due_time          TEXT  -- HH:MM

TABLE: store_kpis
  kpi_id            TEXT
  store_id          TEXT  -- foreign key to stores
  region_id         TEXT  -- foreign key to regions
  date              TEXT  -- YYYY-MM-DD
  sales_ty          REAL  -- sales this year
  sales_ly          REAL  -- sales last year
  transactions      REAL  -- transaction count
  upt               REAL  -- units per transaction
  nps_score         INT   -- NPS score
  stock_level_pct   REAL  -- stock level percentage
  order_count       INT   -- number of orders

DEMO CONTEXT:
  - Today: 2025-05-20
  - MTD = transaction_month=5, transaction_year=2025
  - LY MTD = transaction_month=5, transaction_year=2024, transaction_date <= '2024-05-20'
  - Flagship store: STR-001 (Fifth Avenue Flagship, Northeast)
  - VIP event: 2025-05-27 (EVT-001) — 35 Top Tier clients expected
  - EMP-008 (Sarah Mitchell) and EMP-011 (James Chen) on vacation May 26-30
  - RTW underperforming vs LY, Leather Goods outperforming
  - Low stock: SKU-001 Neverfull MM (3 units), SKU-002 Speedy 25 (4 units)
  - Overdue orders exist in orders table (status='Overdue')
  - Tasks table has Overdue tasks that need attention
"""

# ── SOP LOADER ────────────────────────────────────────────────────────────────
def load_sop() -> str:
    try:
        with open("store_sop.txt", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "SOP document not found. Use general luxury retail best practices."

SOP_TEXT = load_sop()

# ── DB HELPERS ────────────────────────────────────────────────────────────────
@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def run_query(sql: str, params: tuple = ()) -> list[dict]:
    with get_db() as conn:
        try:
            rows = conn.execute(sql, params).fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            return [{"error": str(e), "sql": sql}]

# ── AGENT 0: TEXT-TO-SQL AGENT ────────────────────────────────────────────────
def sql_agent(question: str, context_hint: str = "") -> dict:
    """
    Given a natural language question and a context hint,
    generates and executes SQL, returns results as JSON.
    """
    prompt = f"""You are a Text-to-SQL agent for a luxury retail store database.

{DB_SCHEMA}

Context hint: {context_hint}

User question: {question}

Write a SQLite SQL query to answer this question. Return ONLY a JSON object with:
{{
  "sql": "your SQL query here",
  "description": "one sentence describing what this query returns"
}}

Rules:
- Use correct SQLite syntax
- For MTD TY: transaction_year=2025 AND transaction_month=5
- For MTD LY: transaction_year=2024 AND transaction_month=5 AND transaction_date <= '2024-05-20'
- Always alias columns clearly (e.g. SUM(turnover_usd) AS sales_ty)
- Limit results to top 20 rows maximum unless the question requires all rows
- Do NOT use markdown, only return the JSON object
"""
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        parsed = json.loads(raw.strip())
        sql    = parsed.get("sql", "")
        desc   = parsed.get("description", "")
        results = run_query(sql)
        return {"sql": sql, "description": desc, "results": results, "error": None}
    except Exception as e:
        return {"sql": raw, "description": "", "results": [], "error": str(e)}


# ── AGENT 1: ANALYST AGENT ───────────────────────────────────────────────────
def analyst_agent(question: str) -> str:
    data = sql_agent(
        question,
        "Focus on sales KPIs: turnover, transactions, SPT (sales per transaction), "
        "ASP (average selling price), UPT (units per transaction), vs last year comparisons, "
        "category performance, daily trends."
    )
    results_str = json.dumps(data["results"][:30], indent=2)
    prompt = f"""You are the Analytics Agent for a luxury retail store manager.
Your job: analyze sales data and surface the most important KPI insights.

SQL executed: {data['sql']}
Query description: {data['description']}
Data results:
{results_str}

Question: {question}

Provide a concise ANALYTICS INSIGHT (3-5 sentences max). Focus on:
- Key numbers with context (vs LY %, dollar gaps)
- What is driving performance up or down
- Any urgency or opportunity visible in the data
Do NOT make recommendations — that is another agent's job.
Use rounded numbers ($1.2M not $1,234,567).
"""
    r = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.content[0].text.strip()


# ── AGENT 2: PLANNER AGENT ───────────────────────────────────────────────────
def planner_agent(question: str) -> str:
    # Get staffing + events data via SQL agent
    staff_data = sql_agent(
        "List all selling team employees with their name, job title, language skills, "
        "performance tier, on_vacation status",
        "Focus on selling team availability and language skills"
    )
    event_data = sql_agent(
        "List upcoming events from 2025-05-20 onwards ordered by date",
        "Focus on VIP events and their staffing requirements"
    )
    staff_str = json.dumps(staff_data["results"], indent=2)
    event_str = json.dumps(event_data["results"], indent=2)

    prompt = f"""You are the Planning Agent for a luxury retail store manager.
Your job: create operational plans for staffing, events, and weekly priorities.

CURRENT STAFF:
{staff_str}

UPCOMING EVENTS:
{event_str}

STORE SOPs (use these for all recommendations):
{SOP_TEXT}

Question: {question}

Provide a concise OPERATIONAL PLAN (use specific staff names and event details).
Focus on: who, when, what action, why it matters per SOP.
Do NOT repeat analytics — focus purely on the operational plan.
"""
    r = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.content[0].text.strip()


# ── AGENT 3: INVENTORY AGENT ─────────────────────────────────────────────────
def inventory_agent(question: str) -> str:
    inv_data = sql_agent(
        question,
        "Focus on inventory: stock levels, low stock alerts (units_in_stock < 5), "
        "overstocked items, VIP selections (is_vip_selection=1), hero products (is_hero_product=1), "
        "what to push, SS25 season items."
    )
    results_str = json.dumps(inv_data["results"][:30], indent=2)
    prompt = f"""You are the Inventory Agent for a luxury retail store manager.
Your job: analyze stock levels and recommend what to push, flag alerts, and support event prep.

SQL executed: {inv_data['sql']}
Inventory data:
{results_str}

STORE SOPs (inventory sections):
{SOP_TEXT}

Question: {question}

Provide a concise INVENTORY BRIEF:
- What to push (overstocked / slow-moving)
- What to flag (low stock alerts)
- VIP event selections if relevant
Use specific product names and stock numbers.
"""
    r = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.content[0].text.strip()


# ── AGENT 4: CLIENT AGENT ────────────────────────────────────────────────────
def client_agent(question: str) -> str:
    client_data = sql_agent(
        question,
        "Focus on client segments: Top Tier, High Potential, Repeater, One-Timer. "
        "Client location (Local, International). Generation breakdown. "
        "Client counts, spend per segment, vs last year."
    )
    results_str = json.dumps(client_data["results"][:30], indent=2)
    prompt = f"""You are the Client Intelligence Agent for a luxury retail store manager.
Your job: analyze client segment performance and identify relationship opportunities.

SQL executed: {client_data['sql']}
Client data:
{results_str}

STORE SOPs (client relationship sections):
{SOP_TEXT}

Question: {question}

Provide a concise CLIENT INTELLIGENCE BRIEF:
- Which segments are driving or dragging performance
- Outreach priorities per SOP protocols
- Any VIP client opportunities
"""
    r = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.content[0].text.strip()


# ── AGENT 5: SYNTHESIZER AGENT ───────────────────────────────────────────────
def synthesizer_agent(question: str, agent_outputs: dict, persona: str = "store_manager") -> str:
    parts = []
    for agent_name, output in agent_outputs.items():
        if output:
            parts.append(f"=== {agent_name.upper()} OUTPUT ===\n{output}")
    combined = "\n\n".join(parts)

    persona_context = {
        "executive": "You are responding to a C-suite EXECUTIVE (CEO/COO/VP). Focus on regional trends, total portfolio performance, strategic risks, and high-level recommendations across all 17 stores and 5 regions. Use $M figures. Avoid store-specific operational details.",
        "region_head": "You are responding to a REGION HEAD. Focus on store comparisons within their region, regional KPIs, which stores need attention, and regional action plans. Reference specific stores by name.",
        "store_manager": "You are responding to a STORE MANAGER for Fifth Avenue Flagship. Focus on today's store performance, specific staff names, inventory SKUs, client advisors, and concrete floor-level actions they can take today.",
        "associate": "You are responding to a SALES ASSOCIATE. Focus only on their department, their tasks for today, their pickup orders, and simple actionable steps. Keep it brief and practical.",
    }

    persona_instruction = persona_context.get(persona, persona_context["store_manager"])

    prompt = f"""You are the Synthesizer for RetailIQ — a multi-persona retail intelligence platform.

PERSONA CONTEXT:
{persona_instruction}

SPECIALIST AGENT OUTPUTS:
{combined}

STORE SOPs:
{SOP_TEXT}

ORIGINAL QUESTION: {question}

Synthesize all inputs into a single response tailored to the persona above. Use EXACTLY this format:

INSIGHT:
[2-3 sentences with the most important findings relevant to THIS persona's scope and responsibilities.]

RECOMMENDATION:
[2-4 specific actions grounded in the SOP. Reference actual data from agent outputs.]

NEXT STEPS:
- [Concrete action 1 — who does what, by when]
- [Concrete action 2]
- [Concrete action 3]
- [Concrete action 4 if needed]

Rules:
- Tailor language and scope to the persona
- Do NOT invent numbers not present in agent outputs
- Reference SOP sections when relevant
- Be direct and actionable
- Use rounded numbers
"""
    r = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.content[0].text.strip()


# ── INTENT DETECTION ─────────────────────────────────────────────────────────
def detect_intents(question: str) -> list[str]:
    q = question.lower()
    intents = []
    if any(w in q for w in ["sale","revenue","kpi","performance","trend","spt","asp","upt","tracking","gap","close","last year","vs ly","daily","target","pace"]):
        intents.append("analytics")
    if any(w in q for w in ["staff","team","schedule","who should","assign","cover","shift","vacation","available","language","speaker","advisor","hire","person"]):
        intents.append("planning")
    if any(w in q for w in ["event","vip","preview","cocktail","next week","may 27","prepare","organize","ready","brunch","dinner","trunk show"]):
        intents.append("planning")
    if any(w in q for w in ["inventory","stock","sku","units","how many","available","restock","low stock","push","sell","product","item","hero","ss25","carry"]):
        intents.append("inventory")
    if any(w in q for w in ["client","customer","segment","tier","top tier","high potential","repeater","international","local","generation","vip client","relationship","outreach"]):
        intents.append("client")
    if not intents:
        intents = ["analytics"]
    return list(set(intents))


# ── CHART TYPE DETECTION ──────────────────────────────────────────────────────
def detect_charts(question: str, intents: list[str]) -> list[str]:
    q = question.lower()
    charts = []
    if "category" in q or "what" in q or "product" in q: charts.append("what")
    if "client" in q or "segment" in q or "whom" in q:   charts.append("whom")
    if "team" in q or "advisor" in q or "who" in q:      charts.append("who")
    if "trend" in q or "daily" in q or "pace" in q:      charts.append("trend")
    if "appointment" in q:                                charts.append("appointments")
    if "inventory" in intents or "stock" in q:            charts.append("inventory")
    if "planning" in intents or "staff" in q:             charts.append("staffing")
    if "event" in q:                                      charts.append("events")
    if not charts:
        if "analytics" in intents: charts.append("kpis")
        else:                      charts.append("kpis")
    return list(set(charts))


# ── ORCHESTRATOR ──────────────────────────────────────────────────────────────
def orchestrate(question: str, persona: str = "store_manager") -> dict:
    intents = detect_intents(question)
    charts  = detect_charts(question, intents)
    agent_outputs = {}

    if "analytics" in intents:
        agent_outputs["Analytics Agent"] = analyst_agent(question)
    if "planning" in intents:
        agent_outputs["Planning Agent"] = planner_agent(question)
    if "inventory" in intents:
        agent_outputs["Inventory Agent"] = inventory_agent(question)
    if "client" in intents:
        agent_outputs["Client Agent"] = client_agent(question)

    final_answer = synthesizer_agent(question, agent_outputs, persona)
    return {
        "answer":      final_answer,
        "intents":     intents,
        "charts":      charts,
        "agents_used": list(agent_outputs.keys()),
    }


# ── BACKGROUND WORKER ─────────────────────────────────────────────────────────
def run_in_background(job_id: str, question: str, persona: str = "store_manager"):
    try:
        result = orchestrate(question, persona)
        job_store[job_id] = {"status": "done", **result}
    except Exception as e:
        job_store[job_id] = {"status": "error", "answer": str(e), "intents": [], "charts": [], "agents_used": []}


# ── REQUEST MODELS ────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    period: str = "mtd"
    persona: str = "store_manager"

class SummaryRequest(BaseModel):
    type:   str = "summary"
    period: str = "mtd"


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.get("/status")
def status():
    with get_db() as conn:
        counts = {}
        for t in ["transactions","employees","inventory","events"]:
            counts[t] = conn.execute(f"SELECT COUNT(*) as n FROM {t}").fetchone()["n"]
    return {
        "data_ready":  True,
        "demo_today":  DEMO_TODAY_STR,
        "model":       CLAUDE_MODEL,
        "row_counts":  counts,
        "agents":      ["SQL Agent","Analyst","Planner","Inventory","Client","Synthesizer"]
    }


@app.get("/get_kpis")
def get_kpis(
    period:    str = Query("mtd"),
    gender:    str = Query("all"),
    sale_type: str = Query("all")
):
    def build_filter(year, is_ly=False):
        clauses = [f"transaction_year = {year}", f"transaction_month = {DEMO_MONTH}"]
        if is_ly:
            clauses.append(f"transaction_date <= '{DEMO_TODAY.year - 1}-{DEMO_TODAY.month:02d}-{DEMO_TODAY.day:02d}'")
        if gender != "all":
            clauses.append(f"gender = '{gender}'")
        if sale_type != "all":
            clauses.append(f"sale_type = '{sale_type}'")
        return " AND ".join(clauses)

    ty_f = build_filter(DEMO_YEAR)
    ly_f = build_filter(LY_YEAR, is_ly=True)

    def q(filt):
        rows = run_query(f"""
            SELECT
                SUM(turnover_usd)                                    AS sales,
                COUNT(*)                                             AS transactions,
                SUM(turnover_usd) / NULLIF(COUNT(*), 0)             AS spt,
                SUM(turnover_usd) / NULLIF(SUM(units), 0)           AS asp,
                SUM(units)        / NULLIF(COUNT(*), 0)             AS upt,
                COUNT(DISTINCT dream_id)                             AS unique_clients
            FROM transactions WHERE {filt}
        """)
        return rows[0] if rows else {}

    ty = q(ty_f)
    ly = q(ly_f)

    def vs(a, b):
        if not a or not b or b == 0: return {"pct": None, "gap": None}
        return {"pct": round((a/b - 1)*100, 1), "gap": round(a - b, 0)}

    # Days remaining
    days_in_month = 31
    days_elapsed  = DEMO_TODAY.day
    days_remaining = days_in_month - days_elapsed
    daily_rate = (ty.get("sales") or 0) / max(days_elapsed, 1)
    projected  = daily_rate * days_in_month

    # Full month LY
    ly_full = run_query(f"""
        SELECT SUM(turnover_usd) AS sales_full_ly
        FROM transactions
        WHERE transaction_year={LY_YEAR} AND transaction_month={DEMO_MONTH}
    """)
    full_ly_sales = (ly_full[0].get("sales_full_ly") or 0) if ly_full else 0
    gap_to_ly     = full_ly_sales - (ty.get("sales") or 0)
    needed_per_day = gap_to_ly / max(days_remaining, 1) + daily_rate

    return {
        "sales":         {"ty": ty.get("sales"),         "ly": ly.get("sales"),         "vs": vs(ty.get("sales"), ly.get("sales"))},
        "transactions":  {"ty": ty.get("transactions"),  "ly": ly.get("transactions"),  "vs": vs(ty.get("transactions"), ly.get("transactions"))},
        "spt":           {"ty": ty.get("spt"),           "ly": ly.get("spt"),           "vs": vs(ty.get("spt"), ly.get("spt"))},
        "asp":           {"ty": ty.get("asp"),           "ly": ly.get("asp"),           "vs": vs(ty.get("asp"), ly.get("asp"))},
        "upt":           {"ty": ty.get("upt"),           "ly": ly.get("upt"),           "vs": vs(ty.get("upt"), ly.get("upt"))},
        "unique_clients":{"ty": ty.get("unique_clients"),"ly": ly.get("unique_clients"),"vs": vs(ty.get("unique_clients"), ly.get("unique_clients"))},
        "daily_rate":       round(daily_rate, 0),
        "projected_month":  round(projected, 0),
        "days_remaining":   days_remaining,
        "sales_needed_day": round(needed_per_day, 0),
        "full_ly_sales":    round(full_ly_sales, 0),
        "gap_to_ly":        round(gap_to_ly, 0),
        "period":           period,
    }


@app.get("/get_what")
def get_what(period: str = "mtd", gender: str = "all", sale_type: str = "all"):
    extra = ""
    if gender    != "all": extra += f" AND gender='{gender}'"
    if sale_type != "all": extra += f" AND sale_type='{sale_type}'"

    rows = run_query(f"""
        SELECT
            category,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN transaction_year={LY_YEAR}   AND transaction_month={DEMO_MONTH} AND transaction_date<='2024-05-20' THEN turnover_usd ELSE 0 END) AS sales_ly,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN 1 ELSE 0 END) AS transactions,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN units ELSE 0 END) AS units
        FROM transactions WHERE 1=1 {extra}
        GROUP BY category ORDER BY sales_ty DESC
    """)
    total = sum(r["sales_ty"] for r in rows) or 1
    for r in rows:
        r["vs_ly_pct"] = round((r["sales_ty"]/r["sales_ly"] - 1)*100, 1) if r["sales_ly"] else None
        r["gap"]       = round(r["sales_ty"] - r["sales_ly"], 0)
        r["share"]     = round(r["sales_ty"] / total * 100, 1)
    return rows


@app.get("/get_whom")
def get_whom(period: str = "mtd", gender: str = "all", sale_type: str = "all"):
    extra = ""
    if gender    != "all": extra += f" AND gender='{gender}'"
    if sale_type != "all": extra += f" AND sale_type='{sale_type}'"

    pyramid = run_query(f"""
        SELECT
            client_segment,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN transaction_year={LY_YEAR}   AND transaction_month={DEMO_MONTH} AND transaction_date<='2024-05-20' THEN turnover_usd ELSE 0 END) AS sales_ly,
            COUNT(DISTINCT CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN dream_id END) AS clients,
            COUNT(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN 1 END) AS transactions
        FROM transactions WHERE 1=1 {extra}
        GROUP BY client_segment ORDER BY sales_ty DESC
    """)
    location = run_query(f"""
        SELECT
            client_location,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN transaction_year={LY_YEAR}   AND transaction_month={DEMO_MONTH} AND transaction_date<='2024-05-20' THEN turnover_usd ELSE 0 END) AS sales_ly,
            COUNT(DISTINCT CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN dream_id END) AS clients
        FROM transactions WHERE 1=1 {extra}
        GROUP BY client_location ORDER BY sales_ty DESC
    """)
    total = sum(r["sales_ty"] for r in pyramid) or 1
    for r in pyramid:
        r["vs_ly_pct"] = round((r["sales_ty"]/r["sales_ly"]-1)*100,1) if r["sales_ly"] else None
        r["gap"]       = round(r["sales_ty"]-r["sales_ly"],0)
        r["share"]     = round(r["sales_ty"]/total*100,1)
    for r in location:
        r["vs_ly_pct"] = round((r["sales_ty"]/r["sales_ly"]-1)*100,1) if r["sales_ly"] else None
        r["share"]     = round(r["sales_ty"]/total*100,1)
    return {"pyramid": pyramid, "location": location}


@app.get("/get_who")
def get_who(period: str = "mtd", gender: str = "all", sale_type: str = "all"):
    extra = ""
    if gender    != "all": extra += f" AND t.gender='{gender}'"
    if sale_type != "all": extra += f" AND t.sale_type='{sale_type}'"

    teams = run_query(f"""
        SELECT
            e.macro_group,
            SUM(CASE WHEN t.transaction_year={DEMO_YEAR} AND t.transaction_month={DEMO_MONTH} THEN t.turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN t.transaction_year={LY_YEAR}   AND t.transaction_month={DEMO_MONTH} AND t.transaction_date<='2024-05-20' THEN t.turnover_usd ELSE 0 END) AS sales_ly
        FROM transactions t JOIN employees e ON t.salesperson_id=e.employee_id
        WHERE 1=1 {extra}
        GROUP BY e.macro_group ORDER BY sales_ty DESC
    """)
    top_cas = run_query(f"""
        SELECT
            t.salesperson_id AS employee_id,
            e.name,
            e.performance_tier,
            SUM(t.turnover_usd)                          AS sales,
            COUNT(*)                                     AS transactions,
            COUNT(DISTINCT t.dream_id)                   AS clients,
            SUM(t.turnover_usd)/NULLIF(COUNT(*),0)       AS spt,
            SUM(t.units)/NULLIF(COUNT(*),0)              AS upt
        FROM transactions t JOIN employees e ON t.salesperson_id=e.employee_id
        WHERE t.transaction_year={DEMO_YEAR} AND t.transaction_month={DEMO_MONTH} {extra}
        GROUP BY t.salesperson_id ORDER BY sales DESC LIMIT 10
    """)
    total = sum(r["sales_ty"] for r in teams) or 1
    for r in teams:
        r["vs_ly_pct"] = round((r["sales_ty"]/r["sales_ly"]-1)*100,1) if r["sales_ly"] else None
        r["gap"]       = round(r["sales_ty"]-r["sales_ly"],0)
        r["share"]     = round(r["sales_ty"]/total*100,1)
    return {"teams": teams, "top_cas": top_cas}


@app.get("/get_trend")
def get_trend(period: str = "mtd", gender: str = "all", sale_type: str = "all"):
    extra = ""
    if gender    != "all": extra += f" AND gender='{gender}'"
    if sale_type != "all": extra += f" AND sale_type='{sale_type}'"

    ty_rows = run_query(f"""
        SELECT transaction_date AS date, SUM(turnover_usd) AS sales_ty
        FROM transactions
        WHERE transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} {extra}
        GROUP BY transaction_date ORDER BY transaction_date
    """)
    ly_rows = run_query(f"""
        SELECT transaction_date AS date, SUM(turnover_usd) AS sales_ly
        FROM transactions
        WHERE transaction_year={LY_YEAR} AND transaction_month={DEMO_MONTH}
        AND transaction_date<='2024-05-20' {extra}
        GROUP BY transaction_date ORDER BY transaction_date
    """)
    return {"ty": ty_rows, "ly": ly_rows}


@app.get("/get_appointments")
def get_appointments(period: str = "mtd", gender: str = "all", sale_type: str = "all"):
    extra = ""
    if gender    != "all": extra += f" AND gender='{gender}'"
    if sale_type != "all": extra += f" AND sale_type='{sale_type}'"

    rows = run_query(f"""
        SELECT
            is_appointment,
            SUM(turnover_usd)                      AS sales_ty,
            COUNT(*)                               AS transactions,
            COUNT(DISTINCT dream_id)               AS clients,
            SUM(turnover_usd)/NULLIF(COUNT(*),0)   AS spt
        FROM transactions
        WHERE transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} {extra}
        GROUP BY is_appointment
    """)
    appt    = next((r for r in rows if r["is_appointment"]==1), {"sales_ty":0,"transactions":0,"clients":0,"spt":0})
    organic = next((r for r in rows if r["is_appointment"]==0), {"sales_ty":0,"transactions":0,"clients":0,"spt":0})
    total   = (appt["sales_ty"] or 0) + (organic["sales_ty"] or 0) or 1
    return {
        "appointment":    appt,
        "organic":        organic,
        "appointment_pct": round((appt["sales_ty"] or 0)/total*100,1),
        "organic_pct":     round((organic["sales_ty"] or 0)/total*100,1),
    }


@app.get("/get_staff")
def get_staff():
    return run_query("SELECT * FROM employees ORDER BY macro_group, job_title, name")


@app.get("/get_inventory")
def get_inventory(
    category:  str  = Query("all"),
    low_stock: bool = Query(False),
    vip_only:  bool = Query(False)
):
    clauses = ["1=1"]
    if category  != "all": clauses.append(f"category='{category}'")
    if low_stock:           clauses.append("units_in_stock < reorder_point")
    if vip_only:            clauses.append("is_vip_selection=1")
    where = " AND ".join(clauses)
    return run_query(f"SELECT * FROM inventory WHERE {where} ORDER BY units_in_stock ASC")


@app.get("/get_events")
def get_events():
    return run_query(f"SELECT * FROM events WHERE event_date >= '{DEMO_TODAY_STR}' ORDER BY event_date")


@app.get("/get_suggested_questions")
def get_suggested_questions():
    return {"questions": [
        # Performance
        "What are my 3 priorities today?",
        "How are we tracking vs last year?",
        "How many sales per day do I need to close the gap to LY?",
        "What is driving our SPT performance?",
        # Products
        "Which product categories are underperforming?",
        "What inventory should I be pushing right now?",
        "Which items are low in stock and need restocking?",
        "How is Ready-to-Wear performing vs last year?",
        # Clients
        "Which client segment is driving our sales?",
        "How are our Top Tier clients performing?",
        "How are international clients performing?",
        # Team
        "Who are the top performing client advisors this month?",
        "How can I improve UPT across the team?",
        "How can I improve ASP?",
        # Events & Staffing
        "We have a VIP event next week — how should I staff it?",
        "Which staff members are available for the May 27th event?",
        "Who speaks Mandarin on my team for international clients?",
        "How should I reorganize my team given 2 senior CAs are on vacation?",
        "What do I need to prepare for the SS25 VIP Preview?",
        # Inventory & Planning
        "What should I brief my team to push this week?",
        "Which products should I feature at the VIP event?",
        "What are my overstocked items I should prioritize selling?",
        "How do I prepare my inventory for the VIP event next week?",
        # Appointments
        "How successful were appointments this month?",
        "What percentage of our sales came from appointments?",
        "How can I improve appointment conversion?",
    ]}


# ── CHAT ENDPOINTS (async) ────────────────────────────────────────────────────

@app.post("/chat")
def chat(req: ChatRequest):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "running"}
    t = threading.Thread(
        target=run_in_background, 
        args=(job_id, req.question, req.persona), 
        daemon=True
    )
    t.start()
    return {"job_id": job_id, "status": "running"}


@app.get("/get_chat_result/{job_id}")
def get_chat_result(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/generate_async")
def generate_async(req: SummaryRequest):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "running"}

    if req.type == "priorities":
        question = "What are my 3 priorities today? Give me a full performance summary and action plan."
    else:
        question = "Give me a full store performance summary for today — what's happening, what's the key story, what do I need to know?"

    t = threading.Thread(target=run_in_background, args=(job_id, question), daemon=True)
    t.start()
    return {"job_id": job_id, "status": "running"}


@app.get("/get_result/{job_id}")
def get_result(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": job["status"], "result": job.get("answer", "")}

# ── EXECUTIVE ENDPOINTS ───────────────────────────────────────────────────────

@app.get("/get_executive_summary")
def get_executive_summary():
    """KPIs aggregated across all stores for executive view"""
    rows = run_query(f"""
        SELECT
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN transaction_year={LY_YEAR} AND transaction_month={DEMO_MONTH} AND transaction_date<='2024-05-20' THEN turnover_usd ELSE 0 END) AS sales_ly,
            COUNT(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN 1 END) AS transactions_ty,
            COUNT(DISTINCT CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN dream_id END) AS clients_ty
        FROM transactions
    """)
    r = rows[0] if rows else {}

    # Get regional breakdown from store_kpis
    regions = run_query(f"""
        SELECT
            r.region_name,
            SUM(k.sales_ty) AS sales_ty,
            SUM(k.sales_ly) AS sales_ly,
            SUM(k.transactions) AS transactions,
            ROUND(AVG(k.nps_score), 1) AS nps,
            ROUND(AVG(k.stock_level_pct), 1) AS stock_level,
            SUM(k.order_count) AS orders
        FROM store_kpis k
        JOIN stores s ON k.store_id = s.store_id
        JOIN regions r ON s.region_id = r.region_id
        WHERE k.date >= '2025-05-01' AND k.date <= '{DEMO_TODAY_STR}'
        GROUP BY r.region_id, r.region_name
        ORDER BY sales_ty DESC
    """)

    for reg in regions:
        reg["vs_ly_pct"] = round((reg["sales_ty"] / reg["sales_ly"] - 1) * 100, 1) if reg["sales_ly"] else 0
        if reg["vs_ly_pct"] >= 3:
            reg["status"] = "On Track"
            reg["status_color"] = "green"
        elif reg["vs_ly_pct"] >= -2:
            reg["status"] = "Review"
            reg["status_color"] = "amber"
        else:
            reg["status"] = "At Risk"
            reg["status_color"] = "red"

    total_ty = sum(r["sales_ty"] for r in regions) or 1
    for reg in regions:
        reg["share"] = round(reg["sales_ty"] / total_ty * 100, 1)

    return {
        "kpis": {
            "total_sales_ty": r.get("sales_ty", 0),
            "total_sales_ly": r.get("sales_ly", 0),
            "vs_ly_pct": round((r.get("sales_ty", 0) / r.get("sales_ly", 1) - 1) * 100, 1),
            "transactions": r.get("transactions_ty", 0),
            "clients": r.get("clients_ty", 0),
        },
        "regions": regions,
    }


@app.get("/get_executive_sales")
def get_executive_sales():
    """Sales trend and category breakdown for executive view"""
    trend = run_query(f"""
        SELECT
            k.date,
            SUM(k.sales_ty) AS sales_ty,
            SUM(k.sales_ly) AS sales_ly
        FROM store_kpis k
        WHERE k.date >= '2025-05-01' AND k.date <= '{DEMO_TODAY_STR}'
        GROUP BY k.date
        ORDER BY k.date
    """)

    categories = run_query(f"""
        SELECT
            category,
            SUM(CASE WHEN transaction_year={DEMO_YEAR} AND transaction_month={DEMO_MONTH} THEN turnover_usd ELSE 0 END) AS sales_ty,
            SUM(CASE WHEN transaction_year={LY_YEAR} AND transaction_month={DEMO_MONTH} AND transaction_date<='2024-05-20' THEN turnover_usd ELSE 0 END) AS sales_ly
        FROM transactions
        GROUP BY category
        ORDER BY sales_ty DESC
    """)

    for c in categories:
        c["vs_ly_pct"] = round((c["sales_ty"] / c["sales_ly"] - 1) * 100, 1) if c["sales_ly"] else 0

    return {"trend": trend, "categories": categories}


@app.get("/get_executive_inventory")
def get_executive_inventory():
    """Inventory health across all stores"""
    by_category = run_query("""
        SELECT
            category,
            SUM(units_in_stock) AS total_stock,
            SUM(units_sold_mtd) AS sold_mtd,
            SUM(CASE WHEN units_in_stock < reorder_point THEN 1 ELSE 0 END) AS low_stock_count,
            SUM(CASE WHEN is_vip_selection=1 THEN 1 ELSE 0 END) AS vip_selections,
            COUNT(*) AS total_skus,
            ROUND(AVG(CAST(units_in_stock AS FLOAT) / NULLIF(reorder_point, 0) * 100), 1) AS stock_health_pct
        FROM inventory
        GROUP BY category
        ORDER BY sold_mtd DESC
    """)

    low_stock = run_query("""
        SELECT sku_id, product_name, category, units_in_stock, reorder_point
        FROM inventory
        WHERE units_in_stock < reorder_point
        ORDER BY units_in_stock ASC
        LIMIT 10
    """)

    vip_items = run_query("""
        SELECT sku_id, product_name, category, units_in_stock, retail_price
        FROM inventory
        WHERE is_vip_selection=1
        ORDER BY retail_price DESC
    """)

    return {
        "by_category": by_category,
        "low_stock": low_stock,
        "vip_items": vip_items,
        "summary": {
            "total_skus": sum(c["total_skus"] for c in by_category),
            "low_stock_count": sum(c["low_stock_count"] for c in by_category),
            "vip_selections": sum(c["vip_selections"] for c in by_category),
        }
    }


@app.get("/get_executive_orders")
def get_executive_orders():
    """Order status across all stores"""
    by_status = run_query("""
        SELECT
            status,
            COUNT(*) AS count,
            ROUND(SUM(order_value), 0) AS total_value
        FROM orders
        GROUP BY status
        ORDER BY count DESC
    """)

    by_store = run_query("""
        SELECT
            s.store_name,
            r.region_name,
            COUNT(*) AS total_orders,
            SUM(CASE WHEN o.status='Ready' THEN 1 ELSE 0 END) AS ready,
            SUM(CASE WHEN o.status='Overdue' THEN 1 ELSE 0 END) AS overdue,
            ROUND(SUM(o.order_value), 0) AS total_value
        FROM orders o
        JOIN stores s ON o.store_id = s.store_id
        JOIN regions r ON s.region_id = r.region_id
        GROUP BY o.store_id, s.store_name, r.region_name
        ORDER BY overdue DESC, total_orders DESC
        LIMIT 10
    """)

    return {
        "by_status": by_status,
        "by_store": by_store,
        "summary": {
            "total": sum(s["count"] for s in by_status),
            "overdue": next((s["count"] for s in by_status if s["status"] == "Overdue"), 0),
            "ready": next((s["count"] for s in by_status if s["status"] == "Ready"), 0),
        }
    }


@app.get("/get_executive_nps")
def get_executive_nps():
    """NPS scores across regions and stores"""
    by_region = run_query("""
        SELECT
            r.region_name,
            ROUND(AVG(n.nps_score), 1) AS avg_nps,
            ROUND(AVG(n.promoters_pct), 1) AS promoters,
            ROUND(AVG(n.passives_pct), 1) AS passives,
            ROUND(AVG(n.detractors_pct), 1) AS detractors,
            SUM(n.response_count) AS responses
        FROM nps n
        JOIN stores s ON n.store_id = s.store_id
        JOIN regions r ON s.region_id = r.region_id
        GROUP BY r.region_id, r.region_name
        ORDER BY avg_nps DESC
    """)

    by_dept = run_query("""
        SELECT
            d.dept_name,
            ROUND(AVG(n.nps_score), 1) AS avg_nps,
            ROUND(AVG(n.promoters_pct), 1) AS promoters,
            ROUND(AVG(n.detractors_pct), 1) AS detractors
        FROM nps n
        JOIN departments d ON n.dept_id = d.dept_id
        GROUP BY n.dept_id, d.dept_name
        ORDER BY avg_nps DESC
    """)

    return {
        "by_region": by_region,
        "by_dept": by_dept,
        "overall_nps": round(sum(r["avg_nps"] for r in by_region) / len(by_region), 1) if by_region else 0,
    }

# ── ASSOCIATE ENDPOINTS ───────────────────────────────────────────────────────

@app.get("/get_associate_tasks")
def get_associate_tasks(store_id: str = "STR-001"):
    return run_query(f"""
        SELECT t.task_id, t.task_name, t.task_type, t.status, 
               t.due_time, e.name as employee_name, e.speciality as dept
        FROM tasks t
        JOIN employees e ON t.employee_id = e.employee_id
        WHERE t.store_id = '{store_id}'
        ORDER BY 
            CASE t.status 
                WHEN 'Overdue' THEN 1 
                WHEN 'Pending' THEN 2 
                WHEN 'Done' THEN 3 
            END
    """)

@app.get("/get_associate_orders")
def get_associate_orders(store_id: str = "STR-001", dept_id: str = "DEPT-001"):
    orders = run_query(f"""
        SELECT o.order_id, o.customer_name, o.order_channel,
               o.status, o.pickup_time, o.order_value, d.dept_name
        FROM orders o
        JOIN departments d ON o.dept_id = d.dept_id
        WHERE o.store_id = '{store_id}' AND o.dept_id = '{dept_id}'
        ORDER BY 
            CASE o.status 
                WHEN 'Overdue' THEN 1 
                WHEN 'Ready' THEN 2 
                WHEN 'Pulling' THEN 3 
                WHEN 'Pending' THEN 4 
            END
    """)
    summary = run_query(f"""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status='Ready' THEN 1 ELSE 0 END) as ready,
            SUM(CASE WHEN status='Overdue' THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending
        FROM orders
        WHERE store_id='{store_id}' AND dept_id='{dept_id}'
    """)
    return {"orders": orders, "summary": summary[0] if summary else {}}

@app.get("/get_associate_inventory")
def get_associate_inventory(category: str = "Leather Goods"):
    items = run_query(f"""
        SELECT sku_id, product_name, category, units_in_stock, 
               units_sold_mtd, units_sold_ly, reorder_point,
               is_hero_product, is_vip_selection, season
        FROM inventory
        WHERE category = '{category}'
        ORDER BY units_in_stock ASC
    """)
    return {
        "items": items,
        "summary": {
            "total_skus": len(items),
            "low_stock": sum(1 for i in items if i["units_in_stock"] < i["reorder_point"]),
            "vip_selections": sum(1 for i in items if i["is_vip_selection"]),
            "total_units": sum(i["units_in_stock"] for i in items),
        }
    }

@app.get("/get_associate_nps")
def get_associate_nps(store_id: str = "STR-001", dept_id: str = "DEPT-001"):
    dept_nps = run_query(f"""
        SELECT n.nps_score, n.promoters_pct, n.passives_pct, 
               n.detractors_pct, n.response_count, d.dept_name
        FROM nps n
        JOIN departments d ON n.dept_id = d.dept_id
        WHERE n.store_id = '{store_id}' AND n.dept_id = '{dept_id}'
    """)
    store_avg = run_query(f"""
        SELECT ROUND(AVG(nps_score), 1) as avg_nps
        FROM nps WHERE store_id = '{store_id}'
    """)
    all_depts = run_query(f"""
        SELECT d.dept_name, n.nps_score,
            RANK() OVER (ORDER BY n.nps_score DESC) as dept_rank
        FROM nps n
        JOIN departments d ON n.dept_id = d.dept_id
        WHERE n.store_id = '{store_id}'
        ORDER BY n.nps_score DESC
    """)
    return {
        "dept": dept_nps[0] if dept_nps else {},
        "store_avg": store_avg[0]["avg_nps"] if store_avg else 0,
        "all_depts": all_depts,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
