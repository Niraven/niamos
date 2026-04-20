# NiamOS
> Personal AI Command Interface — Your second brain, always with you.

**Live:** https://niamos-niam.zocomputer.io

## What is this?

NiamOS is a mobile-first Progressive Web App that surfaces your entire AI infrastructure in one native-feeling shell:
- Chat with Zo (your AI agent) via any persona
- Browse your memory system (MEMORY/)
- Monitor scheduled agents and heartbeat status
- File browser for your workspace
- Quick capture — jot ideas straight to your journal

Built on [Zo Computer](https://zocomputer.com). Powered by your own agents.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite (Zo Sites) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| State | React hooks |
| API | Bun/Hono (server-side) |
| PWA | Custom service worker + manifest |
| Auth | Zo API token (server-side, never in client) |

## Architecture

```
niamos-niam.zocomputer.io (Zo Site)
├── /src/App.tsx       — React frontend
├── /server.ts         — API routes (Zo proxy, memory, files, agents)
├── /public/           — PWA manifest, icons, service worker
└── .env               — ZO_CLIENT_IDENTITY_TOKEN (secrets)
```

## Getting Started

```bash
bun install
bun run dev       # Local development
bun run build     # Production build
bun run prod      # Run production server
```

## First-Time Setup

1. Open NiamOS in your browser
2. Enter your Zo API key when prompted
3. That's it — no accounts, no login friction

## Key Features

- **PWA** — Install on iPhone/Android home screen. Works offline (shell + cached data)
- **5 Tabs** — Home, Chat, Agents, Memory, Files
- **Zo Chat** — Full Zo AI with persona switching and markdown rendering
- **Memory Explorer** — Browse MEMORY/ structure, read any file
- **Agent Monitor** — See scheduled agents, heartbeat status, priorities
- **File Browser** — Navigate your entire workspace
- **Quick Capture** — Save thoughts to your daily journal

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/zo` | POST | Proxy to Zo AI (chat) |
| `/api/memory` | GET | Memory tree structure |
| `/api/memory/:path+` | GET | Read a memory file |
| `/api/agents` | GET | Scheduled agents + heartbeat |
| `/api/files` | GET | Workspace file listing |
| `/api/files/:path+` | GET | Read a workspace file |
| `/api/calendar` | GET | Today's calendar events |
| `/api/capture` | POST | Save to daily journal |
| `/api/context` | GET | Active context + session state |

## Roadmap

- [x] v0.1 — MVP (Home, Chat, Agents, Memory, Files, PWA)
- [ ] v0.2 — ⌘K command palette, search, persona persistence
- [ ] v0.3 — Voice input, push notifications, project widget
- [ ] v1.0 — Hermes bridge, skill execution, biometric unlock

## Project Context

Built by [Niam](https://linkedin.com/in/niam-amor) as a personal AI OS for his Zo Computer stack. 
Inspired by OpenClaw, Hermes, Linear, Raycast, and Obsidian.

## License

MIT — Do whatever you want with it.
