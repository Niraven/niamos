# NiamOS Audit & Improvement Roadmap

> Comprehensive analysis: Current state vs PRD vs Original Design vs Reference Projects

---

## 1. CURRENT STATE

### ✅ What's Working
- **Chat Streaming** — Zo API SSE working, responses display correctly
- **File System API** — `/api/files` lists directories and files
- **Memory API** — `/api/memory` returns structured MEMORY/ sections
- **Agents API** — `/api/agents` returns scheduled agents + status
- **Calendar API** — `/api/calendar` returns real Google Calendar events
- **Projects API** — `/api/projects` returns active projects
- **Metrics API** — `/api/metrics` returns system stats
- **Dark UI** — Basic glassmorphic dark theme preserved
- **PWA** — Manifest + service worker configured
- **Deployment** — Live at https://niamos-niam.zocomputer.io

### ❌ What's Broken / Missing
- **No ⌘K Quick Capture** — PRD calls for Raycast-style spotlight, not implemented
- **No Knowledge Base** — No pgvector, no semantic search, no "Ask My Brain"
- **No Real-time Updates** — No WebSocket, no file watcher daemon
- **No Terminal** — No xterm.js SSH integration
- **No Media Hub** — No gallery, no upload, no OCR
- **No Feed Aggregation** — No news/social/finance feeds
- **No Automation Builder** — No cron UI, no webhook handlers
- **No Skills Browser** — No skill cards, no install UI
- **No Project Detail View** — Just a list, no task board
- **Chat UI is Basic** — No message history persistence, no markdown rendering

---

## 2. PRD vs REALITY GAP ANALYSIS

| PRD Feature | Priority | Current State | Effort |
|------------|----------|---------------|--------|
| **⌘K Quick Capture** | P0 | Missing | 2 days |
| **Chat History** | P0 | Missing | 1 day |
| **Markdown Rendering** | P1 | Missing | 4 hours |
| **Knowledge Base** | P1 | Missing | 1 week |
| **File Preview** | P1 | Basic | 2 days |
| **Real-time File Watch** | P2 | Missing | 3 days |
| **Terminal (xterm.js)** | P2 | Missing | 2 days |
| **Media Gallery** | P2 | Missing | 3 days |
| **Feed Aggregation** | P2 | Missing | 1 week |
| **Automation Builder** | P3 | Missing | 1 week |
| **Skills Browser** | P3 | Missing | 3 days |

---

## 3. REFERENCE PROJECT INSIGHTS

### Puter (puter.com)
- **Window management** — Multiple windows, drag/resize
- **Native-feeling UI** — Title bars, close buttons, z-index management
- **File system UI** — Desktop + file manager + contextual menus
- **Learning:** Consider windowed UI for advanced features

### daedalOS (dustinbrett/daedalOS)
- **Full desktop experience** — Start menu, taskbar, windows
- **In-browser apps** — Notepad, terminal, file viewer
- **Learning:** Too heavy for mobile-first PWA, but good for desktop view

### Khoj (khoj-ai/khoj)
- **Semantic search** — Personal knowledge search
- **Multi-source ingestion** — Files, notion, github, web
- **Chat interface** — Ask questions about your knowledge
- **Learning:** KB architecture is directly applicable

### AnythingLLM / Lobe Chat
- **Multi-agent chat** — Switch between different AI personas
- **Document upload** — Drag-drop ingestion
- **Conversation management** — Threads, history, search
- **Learning:** Chat UI patterns we should copy

### Logseq
- **Graph view** — Knowledge graph visualization
- **Block-based editing** — Outliner approach
- **Daily notes** — Automatic journal
- **Learning:** Memory viewer could use graph view

### OmniFocus / Things / Linear
- **Project management** — Tasks, projects, views
- **Quick capture** — Fast entry, automatic parsing
- **Learning:** Quick capture should be instant + intelligent

---

## 4. ORIGINAL DESIGN PRESERVATION

The original design file (`command-center-fd7f588cac4c.zip`) has the correct:
- ✅ Dark glassmorphic theme
- ✅ Sidebar navigation structure
- ✅ Tab bar for mobile
- ✅ Card components
- ✅ Widget layout
- ✅ Section headers
- ✅ Status bubbles
- ✅ Agent chat interface
- ✅ File list view
- ✅ Memory section view
- ✅ Capture interface
- ✅ Metrics dashboard

**What I changed incorrectly:**
- Broke the streaming chat parser
- Changed name from "Nina Haven" → "Niam"
- Simplified some components too much

**What needs to be added (from PRD, not in original):**
- ⌘K command palette
- Knowledge base search
- Terminal
- Media hub
- Feed widgets
- Automation builder

---

## 5. IMMEDIATE IMPROVEMENTS (This Session)

### Phase 1: Fix the Core (Today)
1. **Fix Chat UI** — Add message persistence, markdown rendering, code blocks
2. **Add ⌘K Quick Capture** — Spotlight-style overlay
3. **Improve File Browser** — Add folder navigation, file preview
4. **Add Memory Graph View** — D3.js knowledge graph (simple)

### Phase 2: Connect to Zo Capabilities (Tomorrow)
1. **Terminal Tab** — xterm.js + SSH relay to Zo
2. **Media Gallery** — Browse uploaded images/videos
3. **Real Calendar Widget** — Show today's events on home

### Phase 3: Knowledge Base (Next Week)
1. **pgvector Setup** — On Zo's Postgres
2. **Document Ingestion** — Upload + chunk + embed
3. **Semantic Search** — "Ask My Brain" chat

---

## 6. TECHNICAL DEBT

1. **Server.ts needs cleanup** — Too many endpoints in one file
2. **No database** — Everything is in-memory or file-based
3. **No authentication** — Open to anyone with the URL
4. **No rate limiting** — Could be abused
5. **No tests** — Zero test coverage
6. **TypeScript is loose** — Lots of `any` types
7. **CSS is bloated** — Tailwind classes everywhere, should use more CSS vars

---

## 7. RECOMMENDED ARCHITECTURE CHANGES

### Current
```
Vite + Bun + Express → Zo Site
All APIs in server.ts
No database
```

### Recommended (Incremental)
```
Keep Vite + Bun + Express (working)
Add SQLite/DuckDB for local state
Add WebSocket for real-time
Split server.ts into routes/
```

### Future (Full PRD)
```
Next.js 14 App Router
PostgreSQL + pgvector (on Zo)
WebSocket daemon
File watcher daemon
Knowledge indexer daemon
```

---

## 8. ACTION ITEMS

### Do Now
- [ ] Add ⌘K command palette component
- [ ] Fix chat to persist messages in localStorage
- [ ] Add markdown rendering for chat responses
- [ ] Add file preview (text, markdown, images)
- [ ] Add folder navigation to Files tab
- [ ] Add simple graph view to Memory tab

### Do Soon
- [ ] Set up SQLite for local caching
- [ ] Add WebSocket for file change notifications
- [ ] Add terminal tab with xterm.js
- [ ] Add media gallery tab
- [ ] Add feed widgets to home

### Do Later
- [ ] Full knowledge base with pgvector
- [ ] Automation builder
- [ ] Skills browser
- [ ] Multi-agent workspace
- [ ] Mobile app (Capacitor)

---

## 9. DESIGN SYSTEM AUDIT

### Colors (Current)
```css
--bg: #000000
--surface: #0a0a0a
--accent: #ffffff
--text-1: #ffffff
--text-2: #a1a1a1
--text-3: #717171
--border: #1f1f1f
```

### Recommended (From PRD)
```css
--bg-app: #020617
--bg-sidebar: #0B1120
--bg-card: rgba(15, 23, 42, 0.6)
--accent-ai: #7C3AED (violet)
--accent-success: #22C55E (green)
--accent-info: #3B82F6 (blue)
--accent-warning: #F59E0B (amber)
```

### Verdict
Current colors are fine. PRD colors are more expressive but would require redesign.

---

## 10. FINAL RECOMMENDATION

**Keep the original design structure.** It's solid.

**Add what's missing from PRD in phases:**
1. ⌘K Quick Capture (essential)
2. Chat improvements (essential)
3. File browser improvements (important)
4. Terminal (useful)
5. Knowledge base (powerful but complex)

**Don't redesign everything.** Incremental improvements.

---

*Audit completed: 2026-04-20*
*Next step: Implement Phase 1 improvements*
