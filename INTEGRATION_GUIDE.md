# OpenClaw Integration Guide for niamOS

Complete guide to integrating OpenClaw gateway features into your niamOS web PWA.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Gateway Connection](#gateway-connection)
3. [Agent Management](#agent-management)
4. [Messaging & Chat](#messaging--chat)
5. [Voice Input](#voice-input)
6. [Canvas Integration](#canvas-integration)
7. [Node Commands](#node-commands)
8. [Push Notifications](#push-notifications)
9. [Session Management](#session-management)
10. [Error Handling & Reconnection](#error-handling--reconnection)
11. [Complete Example](#complete-example)

## Quick Start

### 1. Install Dependencies

```bash
npm install
# No external dependencies required for the core service
# Optional: @types/node for TypeScript support
```

### 2. Initialize OpenClaw Client

```typescript
import { initOpenClaw } from './services/openclaw';

// Initialize once in your app
const openclaw = initOpenClaw({
  url: 'ws://localhost:8000', // Your gateway URL
  token: 'your-auth-token',   // Optional
});

// Connect to gateway
await openclaw.connectGateway();
```

### 3. Listen to Events

```typescript
import { getOpenClaw } from './services/openclaw';

const openclaw = getOpenClaw();

openclaw.on('connected', () => {
  console.log('Connected to gateway');
});

openclaw.on('agent:spawn', (agent) => {
  console.log('Agent spawned:', agent.id);
});

openclaw.on('message:new', (message) => {
  console.log('New message:', message.content);
});
```

### 4. Use the Chat Component

```tsx
import { OpenClawChat } from './components/OpenClawChat';

export default function App() {
  return <OpenClawChat agentType="axis-coding" autoSpawn />;
}
```

## Gateway Connection

### Connect to Gateway

```typescript
const openclaw = initOpenClaw({
  url: 'ws://localhost:8000',
  token: 'your-token',
  pairingCode: 'optional-pairing-code',
  tlsFingerprint: 'optional-sha256-hash',
  reconnectInterval: 3000,      // 3 seconds
  reconnectMaxAttempts: 10,     // Max retry attempts
  heartbeatInterval: 30000,     // 30 seconds
});

await openclaw.connectGateway();
```

### Connection Events

```typescript
openclaw.on('connected', () => {
  console.log('✓ Connected to gateway');
});

openclaw.on('disconnected', () => {
  console.log('✗ Disconnected from gateway');
  // Automatically reconnects with exponential backoff
});

openclaw.on('connection:ready', () => {
  console.log('✓ Authenticated and ready');
});

openclaw.on('error', (error) => {
  console.error('Error:', error);
});
```

### Connection Status

```typescript
if (openclaw.isAuthenticated()) {
  console.log('Connected and authenticated');
}

const sessionId = openclaw.getSessionId();
console.log('Session:', sessionId);
```

### Disconnect

```typescript
openclaw.disconnect();
```

## Agent Management

### Spawn Agent

```typescript
// Spawn a new agent
const agent = await openclaw.spawnAgent(
  'axis-coding',                    // Agent type
  'Help me refactor this function', // Initial prompt
  {
    model: 'claude-sonnet-4-6',     // Optional model override
    timeout: 10000,                 // 10 second timeout
  }
);

console.log('Agent ID:', agent.id);
console.log('Status:', agent.status); // 'spawning' -> 'running' -> 'completed'
```

### Supported Agent Types

- `axis-coding` — Code implementation, refactoring, debugging
- `axis-security` — Security audits, vulnerability scanning
- `axis-research` — Web research, competitive intelligence
- `axis-content` — Content creation, image generation
- `axis-devops` — Infrastructure, DevOps, incident response

### Listen to Agent Events

```typescript
openclaw.on('agent:spawn', (agent) => {
  console.log('Agent spawned:', agent.id, 'Status:', agent.status);
});

openclaw.on('agent:complete', (agentId, output) => {
  console.log('Agent completed:', agentId);
  console.log('Output:', output);
});

openclaw.on('agent:failed', (agentId, error) => {
  console.error('Agent failed:', agentId, 'Error:', error);
});
```

### Get Agent Status

```typescript
const agent = openclaw.getAgentStatus(agentId);
console.log('Status:', agent?.status);
console.log('Started at:', agent?.startedAt);
console.log('Output:', agent?.output);
```

### List All Agents

```typescript
const agents = openclaw.listAgents();
agents.forEach((agent) => {
  console.log(`${agent.id}: ${agent.status}`);
});
```

### Kill Agent

```typescript
// Mark as completed
await openclaw.killAgent(agentId, 'completed');

// Force kill
await openclaw.killAgent(agentId, 'killed');
```

## Messaging & Chat

### Send Message to Agent

```typescript
const message = await openclaw.sendMessage(
  agentId,
  'Continue refactoring the authentication module',
  {
    metadata: {
      priority: 'high',
      tags: ['refactoring', 'auth'],
    },
  }
);

console.log('Message sent:', message.id);
```

### Listen to New Messages

```typescript
openclaw.on('message:new', (message) => {
  console.log(`${message.role}: ${message.content}`);
});
```

### Get Message History

```typescript
const history = openclaw.getMessageHistory(agentId);
history.forEach((msg) => {
  console.log(`[${msg.timestamp}] ${msg.role}: ${msg.content}`);
});
```

## Voice Input

### Enable Voice Chat

```typescript
// Check browser support
if ('SpeechRecognition' in window) {
  const recognition = new (window as any).SpeechRecognition();
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join('');
    
    openclaw.sendMessage(agentId, transcript);
  };
  
  recognition.start();
}
```

### Web Speech API Configuration

```typescript
const recognition = new (window as any).SpeechRecognition();

// Configuration
recognition.continuous = false;        // Stop after pauses
recognition.interimResults = true;     // Show partial results
recognition.lang = 'en-US';            // Language
recognition.maxAlternatives = 1;

// Events
recognition.onstart = () => console.log('Listening...');
recognition.onend = () => console.log('Stopped listening');
recognition.onerror = (e) => console.error('Error:', e.error);

// Start/stop
recognition.start();
recognition.stop();
```

### Speech Synthesis (Optional)

```typescript
const utterance = new SpeechSynthesisUtterance('Hello from OpenClaw');
utterance.voice = speechSynthesis.getVoices()[0];
speechSynthesis.speak(utterance);
```

## Canvas Integration

### Display Canvas Content

```typescript
openclaw.displayCanvas({
  type: 'image',
  data: 'data:image/png;base64,...',
  metadata: { width: 800, height: 600 },
});
```

### Supported Canvas Types

- `image` — PNG, JPEG, WebP
- `chart` — D3.js, Chart.js, Plotly objects
- `visualization` — SVG, HTML5 Canvas
- `code` — Syntax-highlighted code blocks
- `markdown` — Rendered markdown content

### Listen to Canvas Updates

```typescript
openclaw.on('canvas:update', (content) => {
  console.log('Canvas updated:', content.type);
  console.log('Data:', content.data);
  console.log('Metadata:', content.metadata);
  
  // Render the content in your UI
  renderCanvas(content);
});
```

### Example: Render Canvas

```typescript
function renderCanvas(content: CanvasContent) {
  const container = document.getElementById('canvas-container');
  
  switch (content.type) {
    case 'image':
      const img = document.createElement('img');
      img.src = content.data as string;
      container?.appendChild(img);
      break;
    
    case 'code':
      const pre = document.createElement('pre');
      pre.textContent = content.data as string;
      container?.appendChild(pre);
      break;
    
    case 'markdown':
      const div = document.createElement('div');
      div.innerHTML = marked(content.data as string); // requires marked.js
      container?.appendChild(div);
      break;
  }
}
```

## Node Commands

### Execute Node Command

```typescript
// Take screenshot
const image = await openclaw.cameraSnap('jpeg');
console.log('Screenshot:', image);

// Record screen
const video = await openclaw.screenRecord(30); // 30 seconds
console.log('Video:', video);

// Get location
const location = await openclaw.getLocation();
console.log('Location:', location);
```

### Custom Node Command

```typescript
const command = await openclaw.executeNodeCommand('custom', {
  action: 'copy-file',
  source: '/path/to/file',
  dest: '/path/to/dest',
});

console.log('Result:', command.result);
```

### Listen to Node Updates

```typescript
openclaw.on('node:update', (nodeStatus) => {
  console.log('Node status updated:', nodeStatus);
  // Example: { online: true, battery: 85, location: {...} }
});
```

### Get Node Status

```typescript
const status = openclaw.getNodeStatus();
console.log('Node is online:', status.online);
console.log('Battery:', status.battery);
```

## Push Notifications

### Request Permission

```typescript
const permission = await openclaw.requestNotificationPermission();
if (permission) {
  console.log('Notifications enabled');
}
```

### Register Service Worker

```typescript
try {
  await openclaw.registerServiceWorker('/sw.js');
  console.log('Service Worker registered');
} catch (error) {
  console.error('Failed to register Service Worker:', error);
}
```

### Send Notification

```typescript
openclaw.sendNotification('Task Completed', {
  body: 'Your agent has finished the task',
  badge: '/openclaw-badge.png',
  icon: '/openclaw-icon.png',
  tag: 'task-complete',
  requireInteraction: false,
  actions: [
    { action: 'open', title: 'Open' },
    { action: 'close', title: 'Close' },
  ],
});
```

### Listen to Notifications (in Service Worker)

```javascript
// public/sw.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle click action
  if (event.action === 'open') {
    clients.openWindow('/');
  }
});
```

### Auto-Notify on Agent Events

```typescript
openclaw.on('agent:complete', (agentId, output) => {
  openclaw.sendNotification('Agent Complete', {
    body: `Agent ${agentId.substr(0, 8)}... finished`,
    tag: `agent-${agentId}`,
  });
});

openclaw.on('message:new', (message) => {
  if (message.role === 'assistant') {
    openclaw.sendNotification('New Message', {
      body: message.content.substring(0, 50) + '...',
      tag: `msg-${message.id}`,
    });
  }
});
```

## Session Management

### Save Session

```typescript
// Automatically persists to localStorage
openclaw.persistSession();
```

### Restore Session

```typescript
const restored = openclaw.restoreSession();
if (restored) {
  console.log('Session restored from localStorage');
  await openclaw.connectGateway(); // Reconnect
}
```

### Get Session State

```typescript
const state = openclaw.getSessionState();
console.log('Session ID:', state.sessionId);
console.log('Authenticated:', state.authenticated);
console.log('Agents:', state.agents.size);
console.log('Messages:', state.messages.size);
```

### Clear Session

```typescript
openclaw.clearSession();
// Clears all data and disconnects
```

## Error Handling & Reconnection

### Handle Errors

```typescript
openclaw.on('error', (error) => {
  console.error('OpenClaw error:', error.message);
  
  // Different error types
  if (error.message.includes('WebSocket')) {
    console.log('Connection error - will reconnect automatically');
  } else if (error.message.includes('Not authenticated')) {
    console.log('Authentication required');
    // Trigger re-authentication
  }
});
```

### Automatic Reconnection

The client automatically reconnects with exponential backoff:

```typescript
const openclaw = initOpenClaw({
  reconnectInterval: 3000,      // Start at 3 seconds
  reconnectMaxAttempts: 10,     // Max 10 attempts (exponential: 3s → ~45min)
});
```

Reconnection timeline:
- Attempt 1: 3s
- Attempt 2: 4.5s
- Attempt 3: 6.7s
- Attempt 4: 10s
- ... up to 60s max

### Connection Recovery Pattern

```typescript
async function withConnectionRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Wait before retry with exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
}

// Usage
const message = await withConnectionRetry(() =>
  openclaw.sendMessage(agentId, 'Hello')
);
```

## Complete Example

### App.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { initOpenClaw, getOpenClaw } from './services/openclaw';
import { OpenClawChat } from './components/OpenClawChat';
import { OpenClawSettings } from './components/OpenClawSettings';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const setupOpenClaw = async () => {
      try {
        // Initialize
        const config = JSON.parse(
          localStorage.getItem('openclaw:config') || 
          '{"url": "ws://localhost:8000"}'
        );
        
        const openclaw = initOpenClaw(config);
        
        // Connect
        await openclaw.connectGateway();
        setIsConnected(true);
        
        // Setup notifications
        const notifEnabled = localStorage.getItem('openclaw:notifications:enabled');
        if (notifEnabled === 'true') {
          openclaw.registerServiceWorker('/sw.js').catch(console.error);
        }
        
        // Listen to events
        openclaw.on('connected', () => setIsConnected(true));
        openclaw.on('disconnected', () => setIsConnected(false));
        
        openclaw.on('agent:complete', (agentId, output) => {
          openclaw.sendNotification('Agent Complete', {
            body: 'Task finished successfully',
          });
        });
        
      } catch (error) {
        console.error('Failed to initialize OpenClaw:', error);
      }
    };

    setupOpenClaw();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>niamOS</h1>
        <div>
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          <button onClick={() => setShowSettings(!showSettings)}>
            ⚙️ Settings
          </button>
        </div>
      </header>

      {showSettings ? (
        <OpenClawSettings onClose={() => setShowSettings(false)} />
      ) : (
        <OpenClawChat agentType="axis-coding" autoSpawn />
      )}
    </div>
  );
}
```

### package.json

```json
{
  "name": "niamos",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>niamOS</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #333;
    }
    
    #app {
      min-height: 100vh;
      background: white;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    niamOS (Browser)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          OpenClawClient Service              │  │
│  │  ────────────────────────────────────────    │  │
│  │  ✓ Gateway connection (WebSocket)            │  │
│  │  ✓ Agent management                          │  │
│  │  ✓ Message queue                             │  │
│  │  ✓ Event emitter                             │  │
│  │  ✓ Reconnection logic                        │  │
│  │  ✓ Session persistence                       │  │
│  └──────────────────────────────────────────────┘  │
│                     ▲    │                           │
│                     │    │                           │
│     ┌───────────────┼────┼────────────┐             │
│     │               │    │            │             │
│  ┌──┴──┐      ┌────┴──┐ │       ┌────┴──┐          │
│  │Chat │      │Events ├─┘       │Canvas │          │
│  │Comp │      │   Rx  │         │Comp   │          │
│  └─────┘      └───────┘         └───────┘          │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │   Service Worker (Background Sync, Push)     │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
            │                    │
            │  WebSocket         │  Push API
            ▼                    ▼
┌──────────────────────────────────────────────────┐
│         OpenClaw Gateway                         │
│  ────────────────────────────────────────       │
│  ✓ Agent orchestration                          │
│  ✓ Message routing                              │
│  ✓ Node command dispatch                        │
│  ✓ Canvas content distribution                  │
│  ✓ Push notification delivery                   │
└──────────────────────────────────────────────────┘
            │
            ├─ axis-coding
            ├─ axis-security
            ├─ axis-research
            ├─ axis-content
            └─ axis-devops
```

## Best Practices

1. **Always initialize in a useEffect**
   - Don't block component rendering on initialization
   - Handle connection errors gracefully

2. **Use event listeners instead of polling**
   - More efficient
   - Real-time updates
   - Better for mobile

3. **Persist session for recovery**
   - Call `persistSession()` after important events
   - Restore on app start

4. **Handle disconnections**
   - Client auto-reconnects, but you should inform the user
   - Disable UI during disconnection

5. **Test with slow/unreliable networks**
   - Use Chrome DevTools Network throttling
   - Verify reconnection logic

6. **Clear sensitive data**
   - Call `clearSession()` on logout
   - Don't store passwords in localStorage

## Troubleshooting

**Connection fails immediately:**
- Check gateway URL and firewall
- Verify authentication credentials
- Check browser console for CORS errors

**Messages not sending:**
- Verify agent is in 'running' status
- Check if authenticated
- Look for timeout errors in console

**Notifications not appearing:**
- Check notification permission in browser settings
- Verify Service Worker registered (`navigator.serviceWorker.getRegistrations()`)
- Check browser notifications are enabled in OS

**Voice input not working:**
- Requires HTTPS (or localhost)
- Check microphone permissions
- Browser support varies (Chrome/Edge best)

## API Reference

See `src/services/openclaw.ts` for full TypeScript definitions.

### Main Classes
- `OpenClawClient` — Main service class
- `EventEmitter` — Extends Node.js EventEmitter

### Key Methods
- `connectGateway()` — Connect to gateway
- `spawnAgent()` — Create and start agent
- `sendMessage()` — Send message to agent
- `executeNodeCommand()` — Run node command
- `displayCanvas()` — Show canvas content
- `requestNotificationPermission()` — Enable notifications
- `persistSession()` — Save to localStorage
- `restoreSession()` — Load from localStorage

### Events
- `connected`, `disconnected`, `error`
- `agent:spawn`, `agent:complete`, `agent:failed`
- `message:new`
- `node:update`
- `canvas:update`
- `system:alert`

---

**Happy integrating!** 🚀
