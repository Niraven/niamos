# niamOS

A web-based operating system PWA that integrates OpenClaw gateway features for seamless agent orchestration, real-time messaging, and autonomous task execution.

## Features

✨ **OpenClaw Gateway Integration**
- WebSocket-based real-time communication
- Automatic reconnection with exponential backoff
- Session persistence and recovery

🤖 **Agent Management**
- Spawn and manage multiple OpenClaw agents
- Support for axis-coding, axis-security, axis-research, axis-content, axis-devops
- Real-time status tracking and output streaming

💬 **Chat & Messaging**
- Real-time chat with agents
- Message history and conversation tracking
- Markdown and code block support

🎤 **Voice Interface**
- Web Speech API integration
- Continuous voice input with interim results
- Speech-to-text for hands-free operation

🎨 **Canvas Visualization**
- Display images, charts, and visualizations
- Support for code, markdown, and custom content
- Real-time canvas updates from agents

📱 **Push Notifications**
- Web Push API integration
- Service Worker for background notifications
- Event-based alerts

🛠️ **Node Commands**
- Execute system commands from agents
- Camera snapshots, screen recording, location services
- Real-time node status updates

## Project Structure

```
niamOS/
├── src/
│   ├── services/
│   │   └── openclaw.ts           # Main OpenClaw client service
│   ├── components/
│   │   ├── OpenClawChat.tsx      # Chat component with voice support
│   │   └── OpenClawSettings.tsx  # Settings & configuration UI
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── public/
│   ├── sw.js                     # Service Worker
│   ├── openclaw-icon.png         # App icons
│   └── openclaw-badge.png
├── INTEGRATION_GUIDE.md          # Comprehensive integration guide
├── README.md                     # This file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Niraven/niamos.git
cd niamOS

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Initialize OpenClaw

```typescript
import { initOpenClaw } from './services/openclaw';

// Initialize with gateway configuration
const openclaw = initOpenClaw({
  url: 'ws://localhost:8000',  // Your OpenClaw gateway
  token: 'your-auth-token',     // Optional authentication
  reconnectMaxAttempts: 10,
  heartbeatInterval: 30000,
});

// Connect to gateway
await openclaw.connectGateway();

// Ready to use!
```

### Use Chat Component

```tsx
import { OpenClawChat } from './components/OpenClawChat';

export default function App() {
  return (
    <OpenClawChat
      agentType="axis-coding"
      autoSpawn={true}
    />
  );
}
```

## Gateway Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_GATEWAY_URL=ws://localhost:8000
VITE_GATEWAY_TOKEN=your-token
VITE_ENABLE_NOTIFICATIONS=true
```

### Settings UI

Access gateway settings through the settings component:

```tsx
import { OpenClawSettings } from './components/OpenClawSettings';

<OpenClawSettings onClose={() => setShowSettings(false)} />
```

Configure:
- Gateway URL
- Authentication token
- Pairing code
- TLS fingerprint (for certificate pinning)
- Push notifications
- Data management

## Core Services

### OpenClawClient

Main service for OpenClaw integration with full TypeScript support.

**Key Methods:**

```typescript
// Connection
connectGateway(): Promise<void>
disconnect(): void
isAuthenticated(): boolean

// Agents
spawnAgent(type, prompt, options?): Promise<Agent>
getAgentStatus(agentId): Agent | undefined
listAgents(): Agent[]
killAgent(agentId, reason?): Promise<void>

// Messaging
sendMessage(agentId, content, metadata?): Promise<Message>
getMessageHistory(agentId): Message[]

// Commands
executeNodeCommand(command, params?): Promise<NodeCommand>
cameraSnap(format?): Promise<string>
screenRecord(duration?): Promise<string>
getLocation(): Promise<{ latitude, longitude, accuracy }>

// Canvas
displayCanvas(content): void

// Notifications
requestNotificationPermission(): Promise<boolean>
sendNotification(title, options?): Notification | null
registerServiceWorker(scriptPath?): Promise<ServiceWorkerRegistration>

// Session
persistSession(): void
restoreSession(): boolean
clearSession(): void
getSessionState(): SessionState
```

**Events:**

```typescript
openclaw.on('connected', () => {})
openclaw.on('disconnected', () => {})
openclaw.on('agent:spawn', (agent) => {})
openclaw.on('agent:complete', (agentId, output) => {})
openclaw.on('agent:failed', (agentId, error) => {})
openclaw.on('message:new', (message) => {})
openclaw.on('node:update', (status) => {})
openclaw.on('canvas:update', (content) => {})
openclaw.on('system:alert', (alert) => {})
openclaw.on('error', (error) => {})
```

## Components

### OpenClawChat

Interactive chat component with agent conversation.

**Props:**
- `agentId?: string` — Start with specific agent
- `agentType?: 'axis-coding' | 'axis-security' | 'axis-research' | 'axis-content' | 'axis-devops'` — Agent type to spawn
- `autoSpawn?: boolean` — Auto-spawn agent on load

**Features:**
- Real-time message exchange
- Voice input toggle (🎤)
- Agent spawn/selection
- Message history display
- Typing indicators
- Responsive design

### OpenClawSettings

Configuration and settings panel.

**Props:**
- `onClose?: () => void` — Close button callback

**Features:**
- Gateway URL configuration
- Authentication (token/pairing code)
- TLS fingerprint for certificate pinning
- Push notification setup
- Configuration export/import
- Data management (clear all)
- Connection status indicator

## Service Worker

Push notifications and background synchronization via Service Worker at `public/sw.js`.

**Capabilities:**
- Push notification handling
- Notification click routing
- Cache management
- Background sync
- Offline fallback

**Register:**

```typescript
await openclaw.registerServiceWorker('/sw.js');
```

**Send Notification:**

```typescript
openclaw.sendNotification('Task Complete', {
  body: 'Your agent finished the task',
  icon: '/openclaw-icon.png',
  badge: '/openclaw-badge.png',
});
```

## Advanced Usage

### Session Recovery

```typescript
// On app start
const restored = openclaw.restoreSession();
if (restored) {
  await openclaw.connectGateway();
  console.log('Session restored');
}

// On important events
openclaw.persistSession();
```

### Error Handling

```typescript
openclaw.on('error', (error) => {
  if (error.message.includes('WebSocket')) {
    // Connection error - will retry automatically
    showToast('Connection lost. Reconnecting...');
  } else if (error.message.includes('Not authenticated')) {
    // Need to re-authenticate
    showAuthDialog();
  }
});
```

### Custom Agent Prompts

```typescript
const agent = await openclaw.spawnAgent(
  'axis-coding',
  `You are an expert TypeScript developer.
   Help refactor this code:
   
   ${codeSnippet}`,
  { model: 'claude-opus-4-1' }
);
```

### Agent Output Streaming

```typescript
let previousOutput = '';

const checkAgentOutput = setInterval(() => {
  const agent = openclaw.getAgentStatus(agentId);
  if (agent?.output && agent.output !== previousOutput) {
    previousOutput = agent.output;
    console.log('New output:', agent.output);
  }
  
  if (agent?.status === 'completed') {
    clearInterval(checkAgentOutput);
  }
}, 500);
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebSocket | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Push API | ✅ | ✅ | ⚠️ | ✅ |
| Web Speech API | ✅ | ❌ | ⚠️ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |

**Note:** Web Speech API requires HTTPS or localhost.

## Gateway Requirements

OpenClaw gateway must be running and accessible at configured URL.

### Local Development

```bash
# Start OpenClaw gateway (if available locally)
openclaw gateway start

# Gateway will be at ws://localhost:8000
```

### Production Deployment

For production, use:
- WSS (WebSocket Secure)
- TLS certificate
- Authentication tokens
- Rate limiting
- CORS configuration

```typescript
const openclaw = initOpenClaw({
  url: 'wss://openclaw.example.com',
  token: process.env.REACT_APP_GATEWAY_TOKEN,
  tlsFingerprint: process.env.REACT_APP_TLS_FINGERPRINT,
});
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const OpenClawChat = lazy(() => import('./components/OpenClawChat'));

<Suspense fallback={<Loading />}>
  <OpenClawChat agentType="axis-coding" />
</Suspense>
```

### Message Batching

```typescript
// Instead of sending messages individually
for (const msg of messages) {
  await openclaw.sendMessage(agentId, msg);
}

// Consider batching if possible
const batch = messages.join('\n---\n');
await openclaw.sendMessage(agentId, batch);
```

### Memory Management

```typescript
// Clean up old messages periodically
const MAX_HISTORY = 100;
const history = openclaw.getMessageHistory(agentId);
if (history.length > MAX_HISTORY) {
  // Prune older messages
  history.splice(0, history.length - MAX_HISTORY);
}
```

## Security Considerations

1. **Never hardcode tokens** — Use environment variables
2. **Use WSS in production** — Encrypted WebSocket connections
3. **Enable TLS fingerprinting** — Prevent MITM attacks
4. **Validate input** — Sanitize user prompts before sending
5. **Respect permissions** — Don't access resources without consent
6. **Clear sensitive data** — Call `clearSession()` on logout

## Troubleshooting

### Connection Issues

```bash
# Check gateway is running
curl http://localhost:8000/health

# Verify firewall rules
netstat -tlnp | grep 8000

# Check browser console for errors
# DevTools → Console tab
```

### Voice Input Not Working

1. Requires HTTPS or localhost
2. Check microphone permissions
3. Browser must support Web Speech API
4. Try Chrome/Edge first (best support)

### Service Worker Issues

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(rs => {
  rs.forEach(r => console.log(r));
});
```

### Message Not Sending

1. Verify agent status is 'running'
2. Check `openclaw.isAuthenticated()`
3. Look for timeout errors in console
4. Ensure gateway is responsive

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues and feature requests: [GitHub Issues](https://github.com/Niraven/niamos/issues)

## Roadmap

- [ ] Video streaming from agents
- [ ] File upload/download support
- [ ] Local model inference (WASM)
- [ ] Offline-first architecture
- [ ] End-to-end encryption
- [ ] Multi-language UI
- [ ] Plugin system
- [ ] Advanced analytics dashboard

## Architecture Documentation

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for:
- Complete API reference
- Integration patterns
- Example implementations
- Best practices
- Architecture diagrams

---

**Built with ❤️ for AI-powered task automation**
