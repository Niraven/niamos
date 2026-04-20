/**
 * niamOS - Main Application
 * Orchestrates OpenClaw gateway integration with UI components
 */

import React, { useEffect, useState } from 'react';
import { initOpenClaw, getOpenClaw } from './services/openclaw';
import { OpenClawChat } from './components/OpenClawChat';
import { OpenClawSettings } from './components/OpenClawSettings';

interface AppState {
  isConnected: boolean;
  isAuthenticated: boolean;
  activeAgent: string | null;
  showSettings: boolean;
  activeTab: 'chat' | 'agents' | 'status';
}

export default function App() {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    isAuthenticated: false,
    activeAgent: null,
    showSettings: false,
    activeTab: 'chat',
  });

  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load saved configuration
        const savedConfig = localStorage.getItem('openclaw:config');
        const config = savedConfig ? JSON.parse(savedConfig) : { url: 'ws://localhost:8000' };

        // Initialize OpenClaw client
        let openclaw;
        try {
          openclaw = getOpenClaw();
        } catch {
          openclaw = initOpenClaw(config);
        }

        // Setup event listeners
        openclaw.on('connected', handleConnected);
        openclaw.on('disconnected', handleDisconnected);
        openclaw.on('agent:spawn', handleAgentSpawn);
        openclaw.on('agent:complete', handleAgentComplete);

        // Try to restore session
        const restored = openclaw.restoreSession();
        
        // Connect to gateway
        try {
          await openclaw.connectGateway();
        } catch (error) {
          console.error('Failed to connect to gateway:', error);
        }

        // Setup notifications if enabled
        const notificationsEnabled = localStorage.getItem('openclaw:notifications:enabled');
        if (notificationsEnabled === 'true') {
          openclaw
            .registerServiceWorker('/sw.js')
            .catch((err) => console.error('Service Worker registration failed:', err));

          // Listen for agent completions
          openclaw.on('agent:complete', (agentId, output) => {
            openclaw.sendNotification('Agent Complete', {
              body: `Agent ${agentId.substr(0, 8)}... finished task`,
              tag: `agent-${agentId}`,
              requireInteraction: false,
            });
          });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleConnected = () => {
    setState((s) => ({ ...s, isConnected: true }));
  };

  const handleDisconnected = () => {
    setState((s) => ({ ...s, isConnected: false, isAuthenticated: false }));
  };

  const handleAgentSpawn = (agent: any) => {
    setState((s) => ({ ...s, activeAgent: agent.id }));
    updateAgentsList();
  };

  const handleAgentComplete = () => {
    updateAgentsList();
  };

  const updateAgentsList = () => {
    try {
      const openclaw = getOpenClaw();
      setAgentsList(openclaw.listAgents());
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to update agents list:', error);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="niamos-app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          height: 100%;
          background: #f5f5f5;
        }

        .niamos-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .niamos-header {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.1);
          color: white;
          border-bottom: 1px solid rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${state.isConnected ? '#4CAF50' : '#f44336'};
          animation: ${state.isConnected ? 'pulse 2s infinite' : 'none'};
          box-shadow: 0 0 8px ${state.isConnected ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'};
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .header-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .niamos-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0 20px;
        }

        .tab {
          padding: 12px 20px;
          color: rgba(255, 255, 255, 0.7);
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          color: white;
        }

        .tab.active {
          color: white;
          border-bottom-color: white;
        }

        .niamos-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          background: white;
        }

        .content-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
          padding: 20px;
        }

        .content-panel.hidden {
          display: none;
        }

        .agents-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .agent-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .agent-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .agent-card.active {
          background: #f5f5ff;
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .agent-type {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .agent-status {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          background: #f0f0f0;
          color: #666;
        }

        .agent-status.running {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .agent-status.completed {
          background: #f3e5f5;
          color: #6a1b9a;
        }

        .agent-status.failed {
          background: #ffebee;
          color: #c62828;
        }

        .agent-id {
          font-size: 12px;
          color: #999;
          font-family: monospace;
          margin-top: 8px;
        }

        .agent-time {
          font-size: 12px;
          color: #aaa;
          margin-top: 8px;
        }

        .status-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
        }

        .stat-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999;
          text-align: center;
        }

        .empty-state svg {
          width: 80px;
          height: 80px;
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .spawn-btn {
          margin-top: 16px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .spawn-btn:hover {
          background: #5568d3;
        }

        .sidebar {
          width: 300px;
          background: white;
          border-left: 1px solid #e0e0e0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .sidebar-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .sidebar-title {
          font-size: 12px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .sidebar-item {
          padding: 8px 12px;
          color: #333;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-item:hover {
          background: #f5f5f5;
        }

        .sidebar-item.active {
          background: #f0f0ff;
          color: #667eea;
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 250px;
          }

          .agents-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .niamos-content {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            max-height: 300px;
            border-left: none;
            border-top: 1px solid #e0e0e0;
          }

          .header-left {
            flex-direction: column;
            align-items: flex-start;
          }

          .niamos-header {
            flex-direction: column;
            gap: 12px;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .niamos-tabs {
            overflow-x: auto;
          }
        }
      `}</style>

      {state.showSettings ? (
        <OpenClawSettings onClose={() => setState((s) => ({ ...s, showSettings: false }))} />
      ) : (
        <>
          <header className="niamos-header">
            <div className="header-left">
              <h1>niamOS</h1>
              <div className="status-indicator" title={state.isConnected ? 'Connected' : 'Disconnected'} />
            </div>
            <div className="header-right">
              <span style={{ fontSize: '12px', opacity: 0.9 }}>
                {state.isConnected ? '🟢 Connected' : '🔴 Disconnected'} | Agents: {agentsList.length}
              </span>
              <button
                className="header-btn"
                onClick={() => setState((s) => ({ ...s, showSettings: true }))}
              >
                ⚙️ Settings
              </button>
            </div>
          </header>

          <div className="niamos-tabs">
            <button
              className={`tab ${state.activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setState((s) => ({ ...s, activeTab: 'chat' }))}
            >
              💬 Chat
            </button>
            <button
              className={`tab ${state.activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setState((s) => ({ ...s, activeTab: 'agents' }))}
            >
              🤖 Agents ({agentsList.length})
            </button>
            <button
              className={`tab ${state.activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setState((s) => ({ ...s, activeTab: 'status' }))}
            >
              📊 Status
            </button>
          </div>

          <div className="niamos-content">
            <div className={`content-panel ${state.activeTab !== 'chat' ? 'hidden' : ''}`}>
              <OpenClawChat
                agentId={state.activeAgent || undefined}
                agentType="axis-coding"
                autoSpawn
              />
            </div>

            <div className={`content-panel ${state.activeTab !== 'agents' ? 'hidden' : ''}`}>
              <h2 style={{ marginBottom: '20px' }}>Active Agents</h2>
              {agentsList.length === 0 ? (
                <div className="empty-state">
                  <p>No active agents</p>
                  <button className="spawn-btn">Spawn New Agent</button>
                </div>
              ) : (
                <div className="agents-list">
                  {agentsList.map((agent) => (
                    <div
                      key={agent.id}
                      className={`agent-card ${state.activeAgent === agent.id ? 'active' : ''}`}
                      onClick={() => setState((s) => ({ ...s, activeAgent: agent.id, activeTab: 'chat' }))}
                    >
                      <div className="agent-header">
                        <span className="agent-type">{agent.type}</span>
                        <span className={`agent-status ${agent.status}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="agent-id">{agent.id.substr(0, 20)}...</div>
                      {agent.startedAt && (
                        <div className="agent-time">
                          Started: {new Date(agent.startedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`content-panel ${state.activeTab !== 'status' ? 'hidden' : ''}`}>
              <h2 style={{ marginBottom: '20px' }}>System Status</h2>
              <div className="status-panel">
                <div className="stat-card">
                  <div className="stat-label">Connection</div>
                  <div className="stat-value">{state.isConnected ? '✓' : '✕'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Agents</div>
                  <div className="stat-value">{agentsList.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Running</div>
                  <div className="stat-value">{agentsList.filter((a) => a.status === 'running').length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{agentsList.filter((a) => a.status === 'completed').length}</div>
                </div>
              </div>

              <h2 style={{ marginBottom: '20px' }}>Recent Activity</h2>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
