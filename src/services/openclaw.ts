/**
 * OpenClaw Integration Service for niamOS
 * Connects web PWA to OpenClaw gateway with agent management, node commands, and real-time events
 */

// Simple EventEmitter for browser
class EventEmitter {
  private events: Record<string, Function[]> = {};
  
  on(event: string, callback: Function) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(...args));
    }
  }
  
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GatewayConfig {
  url: string;
  token?: string;
  pairingCode?: string;
  tlsFingerprint?: string;
  reconnectInterval?: number;
  reconnectMaxAttempts?: number;
  heartbeatInterval?: number;
}

export interface Agent {
  id: string;
  type: 'axis-coding' | 'axis-security' | 'axis-research' | 'axis-content' | 'axis-devops';
  prompt: string;
  status: 'spawning' | 'running' | 'idle' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  output?: string;
  error?: string;
}

export interface Message {
  id: string;
  agentId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface NodeCommand {
  id: string;
  command: 'camera.snap' | 'screen.record' | 'location.get' | 'custom';
  params?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface CanvasContent {
  type: 'image' | 'chart' | 'visualization' | 'code' | 'markdown';
  data: string | object;
  metadata?: Record<string, any>;
}

export interface SessionState {
  sessionId: string;
  gatewayUrl: string;
  authenticated: boolean;
  agents: Map<string, Agent>;
  messages: Map<string, Message[]>;
  nodeStatus: Record<string, any>;
  lastSync: number;
}

export interface WebSocketEvent {
  type: 'agent.spawn' | 'agent.complete' | 'agent.failed' | 'message.new' | 'node.update' | 'system.alert' | 'canvas.update' | 'connection.ready';
  payload: any;
  timestamp: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export declare interface OpenClawClient {
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;
  on(event: 'agent:spawn', listener: (agent: Agent) => void): this;
  on(event: 'agent:complete', listener: (agentId: string, output: string) => void): this;
  on(event: 'agent:failed', listener: (agentId: string, error: string) => void): this;
  on(event: 'message:new', listener: (message: Message) => void): this;
  on(event: 'node:update', listener: (nodeStatus: any) => void): this;
  on(event: 'canvas:update', listener: (content: CanvasContent) => void): this;
  on(event: 'system:alert', listener: (alert: { level: string; message: string }) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: string, ...args: any[]): boolean;
}

// ============================================================================
// MAIN OPENCLAW CLIENT
// ============================================================================

export class OpenClawClient extends EventEmitter {
  private config: GatewayConfig;
  private socket: WebSocket | null = null;
  private sessionState: SessionState;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();

  constructor(config: GatewayConfig) {
    super();
    this.config = {
      reconnectInterval: 3000,
      reconnectMaxAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };

    this.sessionState = {
      sessionId: this.generateSessionId(),
      gatewayUrl: config.url,
      authenticated: false,
      agents: new Map(),
      messages: new Map(),
      nodeStatus: {},
      lastSync: 0,
    };
  }

  // ========================================================================
  // CONNECTION MANAGEMENT
  // ========================================================================

  /**
   * Connect to OpenClaw gateway
   */
  async connectGateway(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.url.replace(/^http/, 'ws');
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('[OpenClaw] Connected to gateway');
          this.reconnectAttempts = 0;
          
          // Authenticate
          this.authenticate()
            .then(() => {
              this.setupHeartbeat();
              this.emit('connected');
              resolve();
            })
            .catch(reject);
        };

        this.socket.onmessage = (event) => this.handleMessage(event.data);
        this.socket.onerror = (event) => {
          const error = new Error('WebSocket error');
          this.emit('error', error);
          reject(error);
        };
        this.socket.onclose = () => this.handleDisconnect();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from gateway
   */
  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.sessionState.authenticated = false;
    this.emit('disconnected');
    console.log('[OpenClaw] Disconnected from gateway');
  }

  /**
   * Authenticate with gateway using token or pairing code
   */
  private async authenticate(): Promise<void> {
    const authPayload = {
      method: 'auth',
      sessionId: this.sessionState.sessionId,
      token: this.config.token,
      pairingCode: this.config.pairingCode,
    };

    return this.sendRequest(authPayload, 5000);
  }

  /**
   * Handle WebSocket disconnection with reconnect logic
   */
  private handleDisconnect(): void {
    this.sessionState.authenticated = false;
    this.emit('disconnected');
    console.log('[OpenClaw] Disconnected from gateway');

    if (this.reconnectAttempts < this.config.reconnectMaxAttempts!) {
      this.reconnectAttempts++;
      const delay = Math.min(this.config.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts), 60000);
      console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.reconnectMaxAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        this.connectGateway().catch((err) => {
          console.error('[OpenClaw] Reconnection failed:', err);
          this.handleDisconnect();
        });
      }, delay);
    }
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat(): void {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ method: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const event: WebSocketEvent = {
        type: message.type,
        payload: message.payload,
        timestamp: Date.now(),
      };

      // Handle request responses
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const pending = this.pendingRequests.get(message.requestId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          if (message.type === 'auth:success') {
            this.sessionState.authenticated = true;
            this.emit('connection:ready');
          }
          pending.resolve(message);
        }
      }

      // Handle events
      this.handleWebSocketEvent(event);
    } catch (error) {
      console.error('[OpenClaw] Failed to parse message:', error);
      this.emit('error', error as Error);
    }
  }

  /**
   * Route WebSocket events to handlers
   */
  private handleWebSocketEvent(event: WebSocketEvent): void {
    console.log('[OpenClaw] Event:', event.type);

    switch (event.type) {
      case 'agent.spawn':
        this.handleAgentSpawn(event.payload);
        break;
      case 'agent.complete':
        this.handleAgentComplete(event.payload);
        break;
      case 'agent.failed':
        this.handleAgentFailed(event.payload);
        break;
      case 'message.new':
        this.handleNewMessage(event.payload);
        break;
      case 'node.update':
        this.handleNodeUpdate(event.payload);
        break;
      case 'canvas.update':
        this.handleCanvasUpdate(event.payload);
        break;
      case 'system.alert':
        this.emit('system:alert', event.payload);
        break;
      case 'connection.ready':
        this.emit('connection:ready');
        break;
    }
  }

  // ========================================================================
  // AGENT MANAGEMENT
  // ========================================================================

  /**
   * Spawn a new agent
   */
  async spawnAgent(type: Agent['type'], prompt: string, options?: { model?: string; timeout?: number }): Promise<Agent> {
    if (!this.sessionState.authenticated) {
      throw new Error('Not authenticated with gateway');
    }

    const agentId = this.generateAgentId();
    const agent: Agent = {
      id: agentId,
      type,
      prompt,
      status: 'spawning',
      startedAt: Date.now(),
    };

    // Store locally
    this.sessionState.agents.set(agentId, agent);
    this.sessionState.messages.set(agentId, []);

    // Send to gateway
    try {
      await this.sendRequest({
        method: 'agent.spawn',
        agentId,
        type,
        prompt,
        model: options?.model,
      }, options?.timeout || 5000);

      this.emit('agent:spawn', agent);
      return agent;
    } catch (error) {
      agent.status = 'failed';
      agent.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): Agent | undefined {
    return this.sessionState.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): Agent[] {
    return Array.from(this.sessionState.agents.values());
  }

  /**
   * Kill agent
   */
  async killAgent(agentId: string, reason: 'completed' | 'killed' = 'killed'): Promise<void> {
    return this.sendRequest({
      method: 'agent.kill',
      agentId,
      reason,
    }, 5000);
  }

  /**
   * Handle agent spawn event
   */
  private handleAgentSpawn(payload: any): void {
    const agent = this.sessionState.agents.get(payload.agentId);
    if (agent) {
      agent.status = 'running';
      this.emit('agent:spawn', agent);
    }
  }

  /**
   * Handle agent completion
   */
  private handleAgentComplete(payload: any): void {
    const agent = this.sessionState.agents.get(payload.agentId);
    if (agent) {
      agent.status = 'completed';
      agent.output = payload.output;
      agent.completedAt = Date.now();
      this.emit('agent:complete', payload.agentId, payload.output);
    }
  }

  /**
   * Handle agent failure
   */
  private handleAgentFailed(payload: any): void {
    const agent = this.sessionState.agents.get(payload.agentId);
    if (agent) {
      agent.status = 'failed';
      agent.error = payload.error;
      agent.completedAt = Date.now();
      this.emit('agent:failed', payload.agentId, payload.error);
    }
  }

  // ========================================================================
  // MESSAGING
  // ========================================================================

  /**
   * Send message to agent
   */
  async sendMessage(agentId: string, content: string, metadata?: Record<string, any>): Promise<Message> {
    if (!this.sessionState.authenticated) {
      throw new Error('Not authenticated with gateway');
    }

    const agent = this.sessionState.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const message: Message = {
      id: this.generateMessageId(),
      agentId,
      content,
      role: 'user',
      timestamp: Date.now(),
      metadata,
    };

    // Store locally
    const agentMessages = this.sessionState.messages.get(agentId) || [];
    agentMessages.push(message);
    this.sessionState.messages.set(agentId, agentMessages);

    // Send to gateway
    await this.sendRequest({
      method: 'message.send',
      agentId,
      messageId: message.id,
      content,
      metadata,
    }, 5000);

    return message;
  }

  /**
   * Get agent message history
   */
  getMessageHistory(agentId: string): Message[] {
    return this.sessionState.messages.get(agentId) || [];
  }

  /**
   * Handle new message event
   */
  private handleNewMessage(payload: any): void {
    const message: Message = {
      id: payload.messageId,
      agentId: payload.agentId,
      content: payload.content,
      role: payload.role || 'assistant',
      timestamp: payload.timestamp || Date.now(),
      metadata: payload.metadata,
    };

    const agentMessages = this.sessionState.messages.get(payload.agentId) || [];
    agentMessages.push(message);
    this.sessionState.messages.set(payload.agentId, agentMessages);

    this.emit('message:new', message);
  }

  // ========================================================================
  // NODE COMMANDS
  // ========================================================================

  /**
   * Execute node command
   */
  async executeNodeCommand(command: NodeCommand['command'], params?: Record<string, any>): Promise<NodeCommand> {
    if (!this.sessionState.authenticated) {
      throw new Error('Not authenticated with gateway');
    }

    const nodeCommand: NodeCommand = {
      id: this.generateCommandId(),
      command,
      params,
      status: 'pending',
    };

    try {
      const result = await this.sendRequest({
        method: 'node.command',
        commandId: nodeCommand.id,
        command,
        params,
      }, 10000);

      nodeCommand.status = 'completed';
      nodeCommand.result = result;
      return nodeCommand;
    } catch (error) {
      nodeCommand.status = 'failed';
      nodeCommand.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * Snap camera photo
   */
  async cameraSnap(format: 'jpeg' | 'png' = 'jpeg'): Promise<string> {
    const command = await this.executeNodeCommand('camera.snap', { format });
    return command.result as string;
  }

  /**
   * Start screen recording
   */
  async screenRecord(duration: number = 30): Promise<string> {
    const command = await this.executeNodeCommand('screen.record', { duration });
    return command.result as string;
  }

  /**
   * Get current location
   */
  async getLocation(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    const command = await this.executeNodeCommand('location.get');
    return command.result as any;
  }

  /**
   * Handle node update event
   */
  private handleNodeUpdate(payload: any): void {
    this.sessionState.nodeStatus = {
      ...this.sessionState.nodeStatus,
      ...payload,
    };
    this.emit('node:update', this.sessionState.nodeStatus);
  }

  /**
   * Get node status
   */
  getNodeStatus(): Record<string, any> {
    return this.sessionState.nodeStatus;
  }

  // ========================================================================
  // CANVAS & VISUALIZATION
  // ========================================================================

  /**
   * Handle canvas update
   */
  private handleCanvasUpdate(payload: any): void {
    const content: CanvasContent = {
      type: payload.type,
      data: payload.data,
      metadata: payload.metadata,
    };
    this.emit('canvas:update', content);
  }

  /**
   * Display canvas content
   */
  displayCanvas(content: CanvasContent): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to gateway');
    }

    this.socket.send(JSON.stringify({
      method: 'canvas.display',
      type: content.type,
      data: content.data,
      metadata: content.metadata,
    }));
  }

  // ========================================================================
  // PUSH NOTIFICATIONS
  // ========================================================================

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[OpenClaw] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Send notification
   */
  sendNotification(title: string, options?: NotificationOptions): Notification | null {
    if (Notification.permission !== 'granted') {
      console.warn('[OpenClaw] Notification permission not granted');
      return null;
    }

    return new Notification(title, {
      badge: '/openclaw-badge.png',
      icon: '/openclaw-icon.png',
      ...options,
    });
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(scriptPath: string = '/sw.js'): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported');
    }

    const registration = await navigator.serviceWorker.register(scriptPath);
    console.log('[OpenClaw] Service Worker registered');
    return registration;
  }

  // ========================================================================
  // SESSION MANAGEMENT
  // ========================================================================

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionState.sessionId;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.sessionState.authenticated;
  }

  /**
   * Get full session state
   */
  getSessionState(): SessionState {
    return this.sessionState;
  }

  /**
   * Save session to localStorage
   */
  persistSession(): void {
    const state = {
      sessionId: this.sessionState.sessionId,
      gatewayUrl: this.sessionState.gatewayUrl,
      agents: Array.from(this.sessionState.agents.entries()),
      lastSync: Date.now(),
    };
    localStorage.setItem('openclaw:session', JSON.stringify(state));
  }

  /**
   * Restore session from localStorage
   */
  restoreSession(): boolean {
    const stored = localStorage.getItem('openclaw:session');
    if (!stored) return false;

    try {
      const state = JSON.parse(stored);
      this.sessionState.sessionId = state.sessionId;
      this.sessionState.agents = new Map(state.agents);
      return true;
    } catch (error) {
      console.error('[OpenClaw] Failed to restore session:', error);
      return false;
    }
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionState.agents.clear();
    this.sessionState.messages.clear();
    this.sessionState.nodeStatus = {};
    localStorage.removeItem('openclaw:session');
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Send request and wait for response
   */
  private sendRequest(payload: any, timeout: number = 5000): Promise<any> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    const requestId = this.generateRequestId();
    const timeoutTimer = setTimeout(() => {
      this.pendingRequests.delete(requestId);
    }, timeout);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutTimer });
      this.socket!.send(JSON.stringify({ ...payload, requestId }));
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique agent ID
   */
  private generateAgentId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// GLOBAL SINGLETON INSTANCE
// ============================================================================

let globalClient: OpenClawClient | null = null;

/**
 * Initialize global OpenClaw client (recommended pattern)
 */
export function initOpenClaw(config: GatewayConfig): OpenClawClient {
  if (globalClient) {
    console.warn('[OpenClaw] Client already initialized');
    return globalClient;
  }

  globalClient = new OpenClawClient(config);
  return globalClient;
}

/**
 * Get global OpenClaw client
 */
export function getOpenClaw(): OpenClawClient {
  if (!globalClient) {
    throw new Error('OpenClaw client not initialized. Call initOpenClaw() first.');
  }
  return globalClient;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default OpenClawClient;
