# NiamOS — Personal AI Command Interface
## Product Requirements Document

**Version:** 1.0  
**Author:** Zo (Technical Co-Founder persona)  
**Date:** 2026-04-19  
**Status:** Draft — Ready for Review  
**Target platform:** niam.zo.space (PWA, installable on iOS/Android)

---

## 0. TL;DR

NiamOS is a mobile-first Progressive Web App that serves as the unified command interface for Niam's AI agent stack. It surfaces Zo + Hermes, live agent status, memory, files, skills, and integrations — in a single native-feeling shell installable on iPhone home screen. It replaces "opening a browser and fumbling around" with a purpose-built personal OS that knows exactly who it's for.

**Not a chat app. A command center.**

---

## 1. Product Vision

### 1.1 The Problem

Niam operates a sophisticated AI infrastructure: two persistent agents (Zo + Hermes), 6 scheduled agents running daily, 95+ skills, a hierarchical memory system, Gmail/Calendar/Drive integrations, and active projects. On desktop, this is manageable. On mobile — his phone, where he spends most of his reactive time — it's essentially inaccessible. He has to:

- Open a browser tab (no PWA install)
- Navigate a desktop-oriented interface
- Lose context when switching between chat and files
- Have no visibility into what his agents are currently doing

The result: his most powerful tool goes dark the moment he steps away from his desk.

### 1.2 The Vision

> "An AI OS that fits in your pocket. One screen to see your entire system, talk to your agents, and act on what matters."

NiamOS is the glass panel on top of his AI infrastructure. Every module is designed around a single question: **"What does Niam need to know or do right now?"**

### 1.3 Design Philosophy

| Principle | What It Means |
|-----------|---------------|
| **Native-first** | Feels like an iOS app, not a website |
| **Information density** | Show more, scroll less — like a trading terminal, not a landing page |
| **Zero login friction** | One-time setup, then instant access forever |
| **Agent-aware** | Every screen knows the current agent state |
| **Thumb-optimized** | All primary actions reachable with one thumb |
| **Offline shell** | App loads and shows cached data even without internet |

### 1.4 Success Metrics

- Opens in <2s on a 4G connection
- Installable on iPhone home screen (PWA manifest complete)
- All critical data visible within 1 tap from home
- Replaces 90% of desktop Zo usage when mobile
- Agent status always visible — no hunting for it

---

## 2. User Profile

**One user. Niam.**

| Attribute | Detail |
|-----------|--------|
| Device | iPhone (primary), Android (secondary) |
| Usage context | On the go, between meetings, morning check-in, late-night quick tasks |
| Technical level | High — understands agents, APIs, memory systems |
| Tolerance for friction | Very low |
| Expectation | This should feel like his OS, not a third-party tool |

No auth/onboarding UX needed beyond first setup. This is a single-user private app.

---

## 3. Architecture Overview

```
niam.zo.space (PWA Shell)
│
├── / (Home Dashboard)
├── /chat (Zo Chat Interface)
├── /agents (Agent Control Panel)
├── /memory (Memory Explorer)
├── /files (File System Browser)
├── /skills (Skills & Personas Hub)
└── /cmd (Command Palette — overlay)
│
├── API Layer (zo.space API routes)
│   ├── /api/zo         → Proxy to Zo API (/zo/ask)
│   ├── /api/files      → Read workspace files
│   ├── /api/memory     → Read MEMORY/ structure
│   ├── /api/agents     → Read scheduled agents + heartbeat log
│   ├── /api/context    → Read active-context.md + session-state.md
│   └── /api/search     → Grep workspace content
│
└── Data Sources
    ├── Zo API (chat, tools, memory write)
    ├── Workspace filesystem (/home/workspace)
    ├── MEMORY/ hierarchy
    └── Zo scheduled agents (cron metadata)
```

### 3.1 Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + Vite | zo.space native |
| Styling | Tailwind CSS 4 | zo.space native |
| Icons | lucide-react | zo.space native |
| State | React Context + useReducer | No extra deps needed |
| Data fetching | Native fetch + SWR-like pattern | No extra deps |
| PWA | Custom service worker + manifest | Full control |
| Navigation | React Router (already in zo.space) | Native to platform |
| Markdown | Custom lightweight renderer | No extra deps |

### 3.2 Auth Strategy

- Bearer token stored in `localStorage` after first setup
- Single setup screen: user pastes their `ZO_API_KEY`
- Token validated on first load
- All API calls proxy through zo.space API routes (key never in client)
- No session expiry — personal device, stays logged in

### 3.3 PWA Manifest

```json
{
  "name": "NiamOS",
  "short_name": "NiamOS",
  "description": "Personal AI Command Interface",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 3.4 Offline Behavior

| State | Behavior |
|-------|----------|
| Full online | All features live |
| Offline, cached | Show last-known state with "offline" badge |
| Offline, no cache | Show skeleton shell with reconnect prompt |

Service worker caches: app shell, last API responses (TTL: 5min), static assets.

### 3.5 Real-time vs Polling

| Data | Strategy | Interval |
|------|----------|----------|
| Agent heartbeat status | Polling | 60s |
| Active context | Polling | 120s |
| Chat messages | Request/response | On send |
| Files | On demand | On tap |
| Memory | On demand | On tap |

---

## 4. Design System

### 4.1 Visual Language

**Aesthetic:** Dark OS. Dense. Information-rich. Fast. Not a "pretty app" — a cockpit.

Reference aesthetic: Linear's sidebar density + Raycast's command palette + iOS Control Center's grid. Monospace accents for system data. Feels like something Niam built for himself, not a product for the masses.

### 4.2 Color Tokens

```css
/* Base */
--color-bg:           #09090b;   /* zinc-950 — main background */
--color-surface:      #18181b;   /* zinc-900 — cards, panels */
--color-surface-2:    #27272a;   /* zinc-800 — elevated elements */
--color-border:       #3f3f46;   /* zinc-700 — dividers */

/* Text */
--color-text-primary:   #fafafa;  /* zinc-50 */
--color-text-secondary: #a1a1aa;  /* zinc-400 */
--color-text-muted:     #71717a;  /* zinc-500 */

/* Accent — Electric Blue (Zo identity) */
--color-accent:         #3b82f6;  /* blue-500 */
--color-accent-dim:     #1d4ed8;  /* blue-700 */
--color-accent-glow:    rgba(59, 130, 246, 0.15);

/* Status */
--color-success:    #22c55e;   /* green-500 */
--color-warning:    #f59e0b;   /* amber-500 */
--color-error:      #ef4444;   /* red-500 */
--color-inactive:   #52525b;   /* zinc-600 */

/* Agent-specific accent colors */
--color-zo:         #3b82f6;   /* blue — Zo */
--color-hermes:     #a855f7;   /* purple — Hermes */
--color-agent:      #10b981;   /* emerald — scheduled agents */
```

### 4.3 Typography

```css
/* System fonts — fastest, most native */
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
--font-mono: "SF Mono", "JetBrains Mono", ui-monospace, monospace;

/* Scale */
--text-xs:   11px / 1.4  — metadata, timestamps, labels
--text-sm:   13px / 1.5  — secondary content, file names
--text-base: 15px / 1.6  — body, chat messages
--text-lg:   17px / 1.4  — section headers
--text-xl:   20px / 1.3  — page titles
--text-2xl:  24px / 1.2  — dashboard numbers
```

### 4.4 Spacing & Layout

```
Safe area:           env(safe-area-inset-*) — always respected
Bottom nav height:   56px + safe area bottom
Top bar height:      52px + safe area top
Card padding:        16px
Section gap:         12px
Item gap:            8px
Border radius:       12px (cards), 8px (items), 6px (badges), 999px (pills)
```

### 4.5 Motion Principles

- Page transitions: slide left/right (200ms, ease-out)
- Card reveal: fade + scale(0.98→1), 150ms
- Data load: skeleton shimmer, zinc-800→zinc-700, 1.5s loop
- Chat message appear: slide-up + fade, 120ms
- Status badge ACTIVE: subtle scale pulse animation
- Command palette open: backdrop blur + scale(0.95→1), 150ms

No heavy animations. Speed over aesthetics always.

### 4.6 Core Components

| Component | Description |
|-----------|-------------|
| `<StatusDot>` | 8px circle, color-coded by status, optional pulse for ACTIVE |
| `<AgentCard>` | zinc-900 card — agent name, status dot, last run, next run |
| `<MemoryEntry>` | Compact row — icon + filename + relative timestamp + preview |
| `<FileRow>` | File-type icon + name + size + modified date |
| `<ChatBubble>` | User: right-aligned blue. Zo: left-aligned zinc-800. Markdown rendered. |
| `<PersonaBadge>` | Colored pill with persona name |
| `<QuickAction>` | Square tile — icon + label, tap haptic feedback |
| `<CommandItem>` | Full-width palette row — icon + label + hint |
| `<SkeletonRow>` | Animated placeholder, matches target component dimensions |
| `<SectionHeader>` | Uppercase, zinc-500, 11px, letter-spacing: 0.08em |

---

## 5. Module Specifications

---

### 5.1 HOME — Command Dashboard

**Purpose:** 5-second situational awareness. The cockpit view.

**Layout (scrollable, single column):**

```
┌─────────────────────────────┐
│ NiamOS          [Zo ●] [⌘] │  ← top bar
├─────────────────────────────┤
│ Good morning, Niam.         │
│ 3 things need your attention│  ← from active-context.md
├─────────────────────────────┤
│ ACTIVE AGENTS               │
│ ┌──────────┐  ┌──────────┐  │
│ │● Zo      │  │○ Hermes  │  │  ← status tiles
│ │ Idle     │  │ Unknown  │  │
│ └──────────┘  └──────────┘  │
├─────────────────────────────┤
│ NEXT AGENT IN               │
│ Morning Brief · 2h 14m      │  ← countdown
├─────────────────────────────┤
│ QUICK ACTIONS               │
│ [Chat] [Files] [Memory] [+] │
├─────────────────────────────┤
│ RECENT MEMORY               │
│ > active-context · 2h ago   │
│ > decisions · 1d ago        │
│ > session-state · 3h ago    │
├─────────────────────────────┤
│ TODAY'S AGENTS              │
│ ✓ Dawn Journal    5:30 AM   │
│ ✓ Morning Brief   7:00 AM   │
│ ● Pattern Scanner 12:00 PM  │
│ ○ Afternoon Pulse 2:30 PM   │
│ ○ Evening Sync    9:00 PM   │
├─────────────────────────────┤
│ PROJECTS                    │
│ Pokee ········· Active      │
│ AgentLens ····· Active      │
│ Job Search ···· 150 apps    │
│ Blackone ······ Client ✓    │
└─────────────────────────────┘
```

**Data sources:**
- Greeting + attention line: `/api/context` → parses active-context.md
- Agent status: `/api/agents`
- Next agent countdown: computed from schedule + current time (Asia/Manila)
- Recent memory: `/api/memory?recent=3`
- Today's schedule: `/api/agents?schedule=today`

**Interactions:**
- Pull to refresh → refetch all
- Tap agent tile → /agents (focused on that agent)
- Tap memory entry → /memory (file open)
- Tap Quick Action → route to module or open chat

---

### 5.2 CHAT — Talk to Zo

**Purpose:** Full-featured mobile chat. Persona-aware. Markdown-rendered. Feels like iMessage built for AI.

**Layout:**

```
┌─────────────────────────────┐
│ ←     Chat      [👤 Persona]│
├─────────────────────────────┤
│                             │
│  ╔═══════════════════════╗  │
│  ║ Zo response — markdown ║  │
│  ║ rendered, code blocks  ║  │
│  ╚═══════════════════════╝  │
│                             │
│              ╔═══════════╗  │
│              ║ User msg  ║  │
│              ╚═══════════╝  │
│                             │
│  ╔══════════════╗           │
│  ║ Zo typing... ║           │
│  ╚══════════════╝           │
│                             │
├─────────────────────────────┤
│ [🎤] [Message...      ] [↑] │
└─────────────────────────────┘
```

**Features:**

| Feature | Detail |
|---------|--------|
| Persona switcher | Bottom sheet — 6 personas, tap to switch |
| Active persona | Shown as badge in top bar |
| Voice input | Tap mic → Web Speech API → auto-fill input field |
| Markdown rendering | Headers, bold/italic, code blocks (monospace, copyable), tables, lists, blockquotes |
| Typing indicator | Animated 3-dot ellipsis while Zo responds |
| Conversation threads | Sidebar/list of past threads, tap to resume |
| Error state | Inline error with retry button |
| Long press message | Copy text to clipboard |

**Persona switcher sheet:**
```
● Technical Co-Founder  (active)
○ Systems Copilot
○ GTM Strategist
○ Developer
○ Researcher
○ Operator
```

**API call via proxy:**
```
POST /api/zo
{ "input": "...", "persona_id": "53947de5-...", "conversation_id": "optional" }
```

**Local persistence:** Last 10 conversations in localStorage. Each conversation: id, name (auto-generated from first message), messages array (last 100 messages).

---

### 5.3 AGENTS — Agent Control Panel

**Purpose:** Full visibility into your autonomous agent infrastructure. What's running, what ran, what's coming.

**Layout (3 tabs):**

**SCHEDULED tab:**
```
┌─────────────────────────────┐
│ ← Agents                    │
│ [SCHEDULED][HEARTBEAT][LOG] │
├─────────────────────────────┤
│ ✓ Dawn Journal    5:30 AM   │  ← completed today
│ ✓ Morning Brief   7:00 AM   │
│ ● Pattern Scanner 12:00 PM  │  ← running/next
│ ○ Afternoon Pulse 2:30 PM   │  ← upcoming
│ ○ Evening Sync    9:00 PM   │
│ ─────────────────────────── │
│ WEEKLY                      │
│ ○ Capability Audit Sun 10AM │
└─────────────────────────────┘
```

Tap any agent row → expand bottom sheet:
```
Dawn Journal — Last Run
Ran: Today 5:30 AM ✓
Duration: 12s
Output: [last 500 chars of run output]
Next: Tomorrow 5:30 AM
History: ✓ ✓ ✓ ✓ ✓ ✓ ✓ (7 days)
[Trigger Now]
```

**HEARTBEAT tab:**
```
┌─────────────────────────────┐
│ Heartbeat                   │
│ ● ACTIVE                    │
│ Last cycle: 14 min ago      │
│ Next: ~16 min               │
├─────────────────────────────┤
│ LAST CYCLE                  │
│ 12:41 Memory Check     ✓    │
│ 12:41 Env Scan         ✓    │
│ 12:41 Decision Engine  ✓    │
│ 12:42 Action Execution —    │  ← no action needed
│ 12:42 Learning Capture ✓    │
├─────────────────────────────┤
│ PRIORITY QUEUE              │
│ P0  (none)                  │
│ P1  (none)                  │
│ P2  Fix Discord token       │
└─────────────────────────────┘
```

**LOG tab:** Raw scrollable log from MEMORY/HEARTBEAT_LOG.md, monospace font, newest first.

**Data source:** `/api/agents` reads HEARTBEAT_LOG.md + active-context.md Active Commitments table.

---

### 5.4 MEMORY — Memory Explorer

**Purpose:** Browse and read Niam's entire AI memory system. Strategic to working, all in one place.

**Layout:**

```
┌─────────────────────────────┐
│ ← Memory            [🔍]    │
├─────────────────────────────┤
│ WORKING (hot)               │
│ > active-context.md   2h ↑  │  ← recently modified = highlighted
│ > session-state.md    3h    │
│ > incomplete-tasks.md 1d    │
│ > hermes-outbox.md    6h    │
├─────────────────────────────┤
│ SHARED  ZO ↔ HERMES         │
│ > zo-context.md       1d    │
│ > hermes-context.md   1d    │
│ > active-tasks.md     6h    │
│ > decisions.md        2d    │
│ > sync-log.md         4h    │
├─────────────────────────────┤
│ STRATEGIC                   │
│ > decisions.md        3d    │
│ > people.md           5d    │
│ > insights.md         1w    │
├─────────────────────────────┤
│ JOURNAL                     │
│ > 2026-04-19.md    today    │
│ > 2026-04-18.md      1d     │
│ > 2026-04-17.md      2d     │
├─────────────────────────────┤
│ IDENTITY                    │
│ > SOUL.md                   │
│ > USER.md                   │
│ > AGENTS.md                 │
└─────────────────────────────┘
```

Tap any file → full-screen viewer:
- Rendered markdown
- File path in header (monospace, small)
- Last modified timestamp
- [Copy Raw] button
- Back arrow to return

**Search in memory:** Tap 🔍 → inline search input → grep within MEMORY/ only → results show file + matching line + context.

---

### 5.5 FILES — Workspace Browser

**Purpose:** Full workspace file manager. Navigate /home/workspace. Read any file on the fly.

**Layout:**

```
┌─────────────────────────────┐
│ ← Files      /workspace [🔍]│
├─────────────────────────────┤
│ PINNED                      │
│ 📄 AGENTS.md                │
│ 📄 PERSONAL_OS.md           │
├─────────────────────────────┤
│ 📁 MEMORY/                  │
│ 📁 PROJECTS/                │
│ 📁 Skills/                  │
│ 📁 Jobs/                    │
│ 📁 workflows/               │
│ 📄 AGENTS.md       12KB     │
│ 📄 PERSONAL_OS.md   5KB     │
├─────────────────────────────┤
│ RECENT                      │
│ 📄 active-context.md   2h   │
│ 📄 PRD.md              now  │
└─────────────────────────────┘
```

Navigation: tap folder → drill in, breadcrumb updates. Back arrow or tap breadcrumb segment to navigate up.

File viewer supports:
- `.md` → rendered markdown
- `.json` → pretty-printed, collapsible
- `.ts`, `.py`, `.js` → syntax-highlighted monospace
- Images → displayed inline
- `.pdf` → "Open in browser" button
- Binary/unknown → "Cannot preview" message

File size limit for preview: 100KB. Larger: show first 5000 chars + "File truncated — tap to open in browser."

---

### 5.6 SKILLS & PERSONAS — Hub

**Purpose:** Browse all 95 skills, switch active persona, quick-launch skills into chat.

**Layout (tabbed: PERSONAS | SKILLS):**

**PERSONAS:**
```
┌─────────────────────────────┐
│ ← Skills & Personas         │
│ [PERSONAS]   [SKILLS]       │
├─────────────────────────────┤
│ ACTIVE                      │
│ ┌─────────────────────────┐ │
│ │ 🔵 Technical Co-Founder  │ │
│ │ CTO mindset · Opinionated│ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ SWITCH TO                   │
│ ○ Systems Copilot  default  │
│ ● Technical Co-Founder      │
│ ○ GTM Strategist            │
│ ○ Developer                 │
│ ○ Researcher                │
│ ○ Operator                  │
└─────────────────────────────┘
```

Tap → switch → toast confirmation "Switched to GTM Strategist"

**SKILLS:**
```
┌─────────────────────────────┐
│ [Search skills...         ] │
├─────────────────────────────┤
│ PINNED                      │
│ ⚡ auto-research             │
│ ⚡ content-ops               │
│ ⚡ decision-frame            │
├─────────────────────────────┤
│ ALL (95)                    │
│ ab-test-setup               │
│ aegis-prompt-system         │
│ agentic-sdlc                │
│ ...                         │
└─────────────────────────────┘
```

Tap skill → bottom sheet:
```
auto-research
Deep research on any topic with multi-source synthesis.
Invoke: "Research [topic]"

[Chat with this skill →]
```

[Chat with this skill] → opens /chat with pre-filled system context from SKILL.md.

---

### 5.7 COMMAND PALETTE — ⌘

**Purpose:** Raycast on mobile. One tap to do anything, go anywhere, ask anything.

**Trigger:** Tap [⌘] in top bar. Full-screen overlay, input focused immediately.

```
┌─────────────────────────────┐
│ ⌘ What do you need?         │
│ [________________________ ] │
├─────────────────────────────┤
│ QUICK CHAT                  │
│ 💬 What are my priorities?  │
│ 💬 What's on my calendar?   │
│ 💬 Summarize my emails      │
│ 💬 What did I do yesterday? │
├─────────────────────────────┤
│ NAVIGATE                    │
│ 🏠 Home                     │
│ 🤖 Agents                   │
│ 🧠 Memory                   │
│ 📁 Files                    │
│ ⚡ Skills                   │
├─────────────────────────────┤
│ SYSTEM                      │
│ 🔄 Sync memory              │
│ 💓 Check heartbeat          │
│ ⚙️  Settings                │
└─────────────────────────────┘
```

Typing filters all sections in real-time. Selecting Quick Chat → navigates to /chat and sends message immediately. Selecting Navigate → routes and closes palette. Selecting System → fires API action → toast result.

Dismiss: tap outside or swipe down.

---

## 6. Navigation Architecture

**Bottom tab bar — always visible, never hidden on scroll:**

```
[🏠 Home] [💬 Chat] [🤖 Agents] [🧠 Memory] [📁 Files]
```

- Active tab: accent blue icon + label
- Inactive: zinc-500 icon only (no label on small screens)
- Badge: red dot on Agents when priority P0 exists, on Chat when unread

**Top bar — context-sensitive:**
- Left: back arrow (in sub-view) OR app name
- Center: page title or breadcrumb path
- Right: [⌘] command palette + context actions (search icon, etc.)

**Sheet navigation:**
- Agent detail, skill detail, persona switcher: bottom sheet (80% height, draggable)
- File viewer, memory file viewer: full-screen push

---

## 7. API Layer — zo.space Routes

All at `https://niam.zo.space/api/*`. Bearer auth on all. API key stored server-side in Zo secrets as `NIAMOS_TOKEN` — never exposed to client.

### `/api/context`
```
GET → reads MEMORY/working/active-context.md + session-state.md
Response: { activeContext: string, sessionState: string, lastUpdated: string }
```

### `/api/agents`
```
GET → reads HEARTBEAT_LOG.md, active-context.md commitments, cron metadata
Response: {
  heartbeat: { status, lastCycle, nextCycle, lastLog },
  scheduled: [{ name, time, status, lastRun, lastOutput }],
  priorities: { p0: [], p1: [], p2: [] }
}
```

### `/api/files`
```
GET ?path=/home/workspace → directory listing
GET ?path=/home/workspace/AGENTS.md → file content (max 100KB)
Response: { type, entries[] } | { type, content, size, modified, truncated }
```

### `/api/memory`
```
GET → structured memory tree
GET ?file=MEMORY/working/active-context.md → single file content
Response: { working, shared, strategic, journal, recent }
```

### `/api/zo`
```
POST { input, persona_id?, conversation_id? }
→ proxies to https://api.zo.computer/zo/ask with ZO_API_KEY
Response: { output: string, conversation_id: string }
```

### `/api/search`
```
GET ?q=term&scope=memory|files|all
→ runs grep -r, returns first 50 results
Response: { results: [{ file, line, content, context }] }
```

---

## 8. First-Time Setup Flow

1. App loads → checks `localStorage['niamos_auth']` → not found
2. Full-screen setup card appears:
   ```
   Welcome to NiamOS
   To connect, you need your Zo API key.
   Go to: Settings > Advanced > Access Tokens
   Create a token, then paste it below.
   [___________________________]
   [Connect →]
   ```
3. User pastes token → app sends test request to `/api/zo`
4. Success: store token → redirect to `/` → show home
5. Failure: show error "Invalid token — check and try again"

Total time: ~60 seconds. Never repeated unless user explicitly logs out.

---

## 9. Phased Roadmap

### v0.1 — MVP (build this first)

**What ships:**

| Module | Scope |
|--------|-------|
| Home Dashboard | Greeting, agent status tiles, next agent countdown, 3 recent memory files, quick action tiles, today's schedule |
| Chat | Full Zo chat, persona switcher, markdown rendering, conversation list |
| Agents | Scheduled list with status, expand for last output, Heartbeat tab |
| Memory | File tree of MEMORY/, tap to read any file, recent files highlighted |
| PWA | Manifest, service worker, installable on iOS/Android |
| API Layer | /api/zo, /api/context, /api/agents, /api/memory |
| Auth | Setup screen, localStorage persistence |

**Not in v0.1:** Files module (beyond MEMORY), Skills hub, Command palette, Voice input, Search, Hermes bridge

---

### v0.2 — Full Breadth

| Addition | Detail |
|----------|--------|
| Files module | Full /home/workspace browser |
| Skills & Personas hub | Browse 95 skills, switch personas, launch to chat |
| Command palette | ⌘ overlay with quick chat, navigation, system actions |
| Global search | Cross-workspace grep via /api/search |
| Agent history | 7-day pass/fail history per agent |
| Projects widget | Live project cards on home from MEMORY/projects/ |

---

### v0.3 — Power Layer

| Addition | Detail |
|----------|--------|
| Voice input | Web Speech API → transcribe → send |
| Memory write | Edit/append to memory files from phone |
| Push notifications | Agent completions, P0 alerts → PWA push |
| Quick capture | Shortcut widget: type → Zo instantly |
| Calendar widget | Today's events on home dashboard |
| Email surface | Unread from key contacts on home |

---

### Future / v1.0

| Feature | Notes |
|---------|-------|
| Hermes bridge | Requires Hermes to expose local API (FastAPI wrapper) |
| Skill execution | Trigger skills directly from phone |
| Biometric unlock | FaceID / TouchID |
| Shared memory write | Edit hermes-updates.md, zo-updates.md from phone |
| Conversation search | Search across all chat history |

---

## 10. Non-Negotiables

| # | Requirement | Reason |
|---|-------------|--------|
| 1 | Loads in <2s on 4G | Slower = won't get used |
| 2 | Installable on iPhone home screen | Must feel like a real app |
| 3 | No login after first setup | Friction kills habits |
| 4 | Offline shell loads without internet | No blank screen ever |
| 5 | All primary actions within 2 taps from home | Thumb-optimized |
| 6 | Zero new npm packages on zo.space | Platform hard constraint |
| 7 | API key never in client-side code | Security — proxy only |
| 8 | Markdown renders properly in chat | Zo's responses are markdown-heavy |
| 9 | Bottom nav always visible | Never hidden on scroll |
| 10 | Works on iOS Safari + Android Chrome | Both matter |

---

## 11. Open Decisions (Resolve Before Building)

| Question | Options | Recommendation |
|----------|---------|----------------|
| Conversation storage | localStorage vs server | localStorage v0.1 |
| Max conversations cached | 5 / 10 / 20 | 10, LRU eviction |
| File preview size limit | 50KB / 100KB / 500KB | 100KB |
| Agent polling interval | 30s / 60s / 120s | 60s |
| Default tab on open | Home / Chat / last visited | Last visited |
| App icon | Text-based / abstract mark | Abstract — text unreadable at 60px |
| Hermes status in v0.1 | Show unknown / hide / show offline | Show as "Unknown — desktop only" |

---

## 12. Build Order (Implementation Sequence)

1. **PWA shell** — manifest, service worker, bottom nav, routing skeleton
2. **Auth setup screen** — API key input, validation, localStorage
3. **`/api/zo` proxy** — enables chat immediately
4. **Chat module** — highest-value feature, validates the whole concept
5. **`/api/memory` + Memory module** — second highest value
6. **`/api/context` + Home dashboard** — pulls it all together
7. **`/api/agents` + Agents module** — completes the cockpit
8. **Polish** — loading states, offline behavior, install prompt
9. **v0.1 ship** — install on phone, use daily
10. **Iterate** → v0.2 based on real usage

---

*This document is the source of truth for NiamOS v0.1–v0.3.*  
*Update it as decisions are made and scope evolves.*  
*Next action: decide on open questions in Section 11, then start with Step 1 above.*
