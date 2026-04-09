#  Anyverse

> **Empowering Indian Students to Discover, Verify, and Claim Every Opportunity They Deserve.**

Anyverse is an **agentic AI platform** that helps students across India navigate the complex landscape of government scholarships, welfare schemes, and educational programs. Powered by the **Model Context Protocol (MCP)**, it intelligently profiles students, matches them to eligible opportunities, and generates a ready-to-submit document bundle — all in one seamless flow.

---

##  The Problem

India offers hundreds of scholarships and welfare schemes for students — from central government programs to state-level initiatives. Yet, millions of eligible students miss out because:

- They don't know which schemes they qualify for.
- They struggle with complex eligibility criteria scattered across multiple portals.
- Document checklist preparation is time-consuming and error-prone.

**Anyverse solves this end-to-end.**

---

## Features

-  **Student Profile Builder** — Collects academic details, income, caste category, state, and disability status through an interactive form.
-  **AI-Powered Opportunity Discovery** — Matches profiles against a curated database of central and state government schemes.
-  **Eligibility Verification** — Checks and confirms eligibility rules per scheme (income cap, course level, gender, etc.).
-  **Document Bundle Generator** — Produces a personalized document checklist for all selected schemes.
-  **Real-Time Trace Stream** — SSE-based live feed shows every agent action as it happens.
-  **Agentic Architecture** — Three independent agents (Discovery, Verifier, Executor) work in sequence, each orchestrated by the MCP server.
-  **Embedded UI Apps** — Rich React-based forms and dashboards are served directly inside the MCP conversation context.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **MCP Server** | Node.js, TypeScript, Express |
| **AI Protocol** | Model Context Protocol (MCP) SDK v1.12+ |
| **Schema Validation** | Zod |
| **Frontend** | React 19, Vite, TypeScript |
| **Backend API** | Python, Django 5, Django REST Framework |
| **Database** | SQLite (dev) |
| **PDF Generation** | ReportLab |
| **Streaming** | Server-Sent Events (SSE) |
| **Communication** | JSON-RPC 2.0 |

---

##  What is MCP (Model Context Protocol)?

Think of MCP as a **universal plug-and-play standard** for AI agents to talk to tools.

Just like how USB-C lets you connect any device to any charger, MCP lets any AI model (like Claude, GPT, or Gemini) connect to any tool or service using a common language.

In Anyverse:
1. The **LLM host** (e.g., Claude Desktop) speaks MCP.
2. The **Anyverse MCP server** listens on `POST /mcp` using JSON-RPC 2.0.
3. The host calls tools like `build_student_profile` or `fetch_opportunities` — and the server handles everything: running the agent, showing UI, returning results.

> MCP removes the need to write custom integrations for each AI system. One server, any client.

---

## What is SSE (Server-Sent Events)?

**Server-Sent Events** is a lightweight web technology that lets the server **push real-time updates** to the browser over a single HTTP connection — without the browser needing to ask.

In Anyverse, the `/trace/stream` endpoint broadcasts every action taken by the agents in real time:

```
Agent [discover] → Searching schemes for Karnataka / EWS / PG...
Tool [check_eligibility] → PM_USHA:  Eligible
Tool [generate_doc_bundle] → Bundle ready for 3 schemes
```

This gives developers and users a live, transparent window into what the AI is doing — making the system **auditable** and **debuggable** at a glance.

---

##  Agentic Architecture

Anyverse is built on a **multi-agent pipeline** where each agent has a single responsibility:

```
┌──────────────────────────────────────────────────────┐
│                   MCP Host (LLM)                     │
│         (Claude Desktop / Custom Client)             │
└───────────────────┬──────────────────────────────────┘
                    │ JSON-RPC 2.0 over HTTP
                    ▼
┌──────────────────────────────────────────────────────┐
│              Anyverse MCP Server (Express)           │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  Discovery  │ │   Verifier   │ │   Executor   │  │
│  │   Agent     │ │    Agent     │ │    Agent     │  │
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘  │
│         │               │                │           │
│  Finds  │       Checks  │    Builds      │           │
│ schemes │    eligibility│  doc bundle   │           │
└─────────┼───────────────┼────────────────┼───────────┘
          │               │                │
          └───────────────┴── SSE Trace ───┘
                                ▼
                    GET /trace/stream (live feed)
```

| Agent | File | Role |
|---|---|---|
| **Discovery Agent** | `agents/discover.ts` | Finds matching schemes from the database |
| **Verifier Agent** | `agents/verifier.ts` | Validates eligibility for each scheme |
| **Executor Agent** | `agents/executor.ts` | Bundles documents and finalizes the workflow |

---

##  Project Structure

```
anyverse/
│
├── mcp-server/                  # Node.js MCP Server (TypeScript)
│   ├── src/
│   │   ├── index.ts             # MCP server entry point & tool registry
│   │   ├── tracer.ts            # SSE trace stream broadcaster
│   │   ├── agents/
│   │   │   ├── discover.ts      # Discovery agent
│   │   │   ├── verifier.ts      # Eligibility verifier agent
│   │   │   └── executor.ts      # Document bundle executor agent
│   │   ├── tools/
│   │   │   ├── buildStudentProfile.ts   # Tool: open profile form UI
│   │   │   ├── fetchOpportunities.ts    # Tool: fetch matched schemes
│   │   │   ├── checkEligibility.ts      # Tool: verify eligibility
│   │   │   └── generateDocBundle.ts     # Tool: generate document bundle
│   │   ├── apps/                # Embedded React UI apps (served as MCP resources)
│   │   └── data/                # Scheme dataset (JSON)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # React 19 + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Main app shell
│   │   ├── components/          # Reusable UI components
│   │   ├── index.css            # Global styles
│   │   └── main.jsx             # Entry point
│   └── vite.config.ts
│
├── api/                         # Django REST API
├── core/                        # Django core models
├── schemes/                     # Scholarship/scheme data models
├── profiles/                    # Student profile models
├── oppurtunities/               # Opportunity matching logic
├── workflows/                   # Workflow orchestration
├── documents/                   # Document management
├── exports/                     # PDF export (ReportLab)
├── manage.py                    # Django management CLI
└── requirements.txt             # Python dependencies
```

---

##  Installation

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- npm or pnpm

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/anyverse.git
cd anyverse
```

---

### 2. Set Up the MCP Server

```bash
cd mcp-server
npm install
```

**Run in development mode:**
```bash
npm run dev
```

The MCP server will start at `http://localhost:3000`.

> **Available Endpoints:**
> - `GET  /health`        — Health check
> - `POST /mcp`           — MCP JSON-RPC endpoint
> - `GET  /trace/stream`  — Live SSE trace stream

---

### 3. Set Up the Django Backend

```bash
# From the root anyverse/ directory
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The Django API will start at `http://localhost:8000`.

---

### 4. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

### 5. (Optional) Connect to Claude Desktop

Add Anyverse to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "anyverse": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Then restart Claude Desktop. You'll see Anyverse tools available in the tool panel.

---

##  Usage

### Full End-to-End Flow

Once the MCP server is running, trigger the workflow in sequence:

```
1. build_student_profile    → Opens the student profile form
2. fetch_opportunities      → AI discovers matching schemes  
3. show_schemes_dashboard   → Displays matched schemes with eligibility
4. check_eligibility        → Verifies eligibility per scheme
5. generate_doc_bundle      → Creates the document checklist
6. show_doc_bundle          → Displays the final bundle
```

### Example: Call a Tool via JSON-RPC

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_opportunities",
      "arguments": {
        "profile": {
          "name": "Rahul Sharma",
          "state": "Karnataka",
          "category": "EWS",
          "annualIncome": 250000,
          "courseLevel": "UG",
          "percentage": 78,
          "gender": "male",
          "disability": false
        }
      }
    }
  }'
```

### Watch the Live Trace Stream

```bash
curl -N http://localhost:3000/trace/stream
```

---

##  Screenshots

> _Screenshots coming soon. Run the project locally to see the full UI experience._

| Screen | Description |
|---|---|
|  Profile Form | Student data collection UI (embedded in MCP host) |
|  Schemes Dashboard | Matched government schemes with eligibility tags |
|  Document Bundle | Personalized checklist for all selected schemes |
|  Trace Stream | Live agent action feed in the terminal |

---

## 🎯 Real-World Impact for Indian Students

India has over **1000+ central and state scholarship schemes** across categories like SC/ST, OBC, EWS, minority communities, and persons with disabilities. Yet penetration remains low because:

- There is **no single discovery portal** that cross-checks your exact profile.
- Most students rely on word-of-mouth, missing out on schemes they never knew existed.
- Document preparation is often done wrong, leading to **application rejections**.

**Anyverse changes this:**

 A student in Karnataka spending 30 minutes on Anyverse can discover 5–10 eligible schemes they were unaware of.  
 The document bundle removes guesswork — students know exactly what to gather.  
 The agentic pipeline is reproducible, traceable, and consistent — no human bias.

> Whether it's a first-generation college student in a Tier-3 city or a postgraduate student from a minority community, **Anyverse works for everyone**.

---

## 🗺️ Roadmap

- [ ]  Student authentication with OTP (Aadhaar-linked)
- [ ]  State-level scheme database expansion (all 28 states + 8 UTs)
- [ ]  Mobile-first React Native app
- [ ]  Application deadline reminder notifications
- [ ]  Admin dashboard for scheme data management
- [ ]  Direct API integration with National Scholarship Portal (NSP)
- [ ]  Multilingual support (Hindi, Tamil, Telugu, Kannada, Bengali)
- [ ]  Auto-fill application forms from student profile
- [ ]  LLM-powered Q&A — "Am I eligible for PM YASASVI?"

---

##  Contributing

We welcome contributions from developers, students, and open-source enthusiasts!

1. **Fork** the repository
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "feat: add state-level scheme matching for Rajasthan"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** — describe what you built and why

### Contribution Areas

-  Add more schemes to `mcp-server/src/data/`
-  Build new MCP tools or agents
-  Improve the frontend UI/UX
-  Write tests for eligibility logic
-  Translate UI strings

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

##  License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it with attribution.

```
MIT License

Copyright (c) 2026 Anyverse Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

See the full [LICENSE](LICENSE) file for details.

---

##  Acknowledgments

- [Anthropic MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) — for the MCP protocol implementation
- [Django REST Framework](https://www.django-rest-framework.org/) — for the backend API layer
- [ReportLab](https://www.reportlab.com/) — for PDF generation
- Every student in India who deserves better access to opportunities 🇮🇳

---

<div align="center">

**Built with love for students across India**

[ Star this repo](https://github.com/your-username/anyverse) · [Report a Bug](https://github.com/your-username/anyverse/issues) · [ Request a Feature](https://github.com/your-username/anyverse/issues)

</div>
