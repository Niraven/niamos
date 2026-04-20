/**
 * OpenClawSettings Component
 * Gateway configuration, authentication, and settings
 */

import React, { useState, useEffect } from 'react';
import { getOpenClaw, initOpenClaw, GatewayConfig } from '../services/openclaw';

interface OpenClawSettingsProps {
  onClose?: () => void;
}

export const OpenClawSettings: React.FC<OpenClawSettingsProps> = ({ onClose }) => {
  const [gatewayUrl, setGatewayUrl] = useState('ws://localhost:8000');
  const [token, setToken] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [tlsFingerprint, setTlsFingerprint] = useState('');
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [expandedSection, setExpandedSection] = useState<string>('gateway');

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('openclaw:config');
      if (saved) {
        const config = JSON.parse(saved);
        setGatewayUrl(config.url || 'ws://localhost:8000');
        setToken(config.token || '');
        setPairingCode(config.pairingCode || '');
        setTlsFingerprint(config.tlsFingerprint || '');
      }

      const notifEnabled = localStorage.getItem('openclaw:notifications:enabled');
      setNotificationsEnabled(notifEnabled === 'true');

      try {
        const openclaw = getOpenClaw();
        setConnected(openclaw.isAuthenticated());
      } catch (e) {
        // Not initialized yet
      }
    };

    loadSettings();
  }, []);

  // ========================================================================
  // GATEWAY CONNECTION
  // ========================================================================

  const handleConnectGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const config: GatewayConfig = {
        url: gatewayUrl,
        token: token || undefined,
        pairingCode: pairingCode || undefined,
        tlsFingerprint: tlsFingerprint || undefined,
      };

      // Save config
      localStorage.setItem('openclaw:config', JSON.stringify(config));

      // Initialize or reconnect
      let openclaw;
      try {
        openclaw = getOpenClaw();
        openclaw.disconnect();
      } catch (e) {
        openclaw = initOpenClaw(config);
      }

      await openclaw.connectGateway();
      setConnected(true);
      setSuccessMessage('Connected to gateway');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    try {
      const openclaw = getOpenClaw();
      openclaw.disconnect();
      setConnected(false);
    } catch (e) {
      // Not initialized
    }
  };

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const openclaw = getOpenClaw();
      const permission = await openclaw.requestNotificationPermission();

      if (permission) {
        localStorage.setItem('openclaw:notifications:enabled', 'true');
        setNotificationsEnabled(true);
        await openclaw.registerServiceWorker('/sw.js');
        setSuccessMessage('Notifications enabled');
      } else {
        setError('Notification permission denied');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleTestNotification = () => {
    try {
      const openclaw = getOpenClaw();
      openclaw.sendNotification('Test Notification', {
        body: 'This is a test notification from OpenClaw',
        tag: 'test-notification',
      });
      setSuccessMessage('Test notification sent');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to send notification');
    }
  };

  // ========================================================================
  // IMPORT/EXPORT
  // ========================================================================

  const handleExportConfig = () => {
    const config = {
      gatewayUrl,
      token: token ? `${token.substring(0, 10)}...` : '',
      pairingCode: pairingCode ? `${pairingCode.substring(0, 10)}...` : '',
      tlsFingerprint,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openclaw-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure? This will clear all OpenClaw data.')) {
      localStorage.removeItem('openclaw:config');
      localStorage.removeItem('openclaw:session');
      localStorage.removeItem('openclaw:notifications:enabled');
      try {
        const openclaw = getOpenClaw();
        openclaw.clearSession();
        openclaw.disconnect();
      } catch (e) {
        // Not initialized
      }
      setConnected(false);
      window.location.reload();
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="openclaw-settings">
      <style>{`
        .openclaw-settings {
          max-width: 600px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px 8px 0 0;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
        }

        .settings-section {
          border: 1px solid #e0e0e0;
          margin-bottom: 0;
          border-radius: 0;
        }

        .settings-section:first-of-type {
          border-top: 1px solid #e0e0e0;
        }

        .settings-section:last-of-type {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        .section-header {
          padding: 16px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }

        .section-header:hover {
          background: #efefef;
        }

        .section-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .section-toggle {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
        }

        .section-content {
          padding: 16px;
          display: none;
        }

        .section-content.expanded {
          display: block;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          font-family: monospace;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
          font-family: monospace;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }

        .status-connected {
          background: #4CAF50;
          color: white;
        }

        .status-disconnected {
          background: #f44336;
          color: white;
        }

        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5568d3;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #efefef;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #d32f2f;
        }

        .btn-success {
          background: #4CAF50;
          color: white;
        }

        .btn-success:hover {
          background: #45a049;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.4;
        }

        .alert-error {
          background: #ffebee;
          color: #c62828;
          border-left: 4px solid #f44336;
        }

        .alert-success {
          background: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #4CAF50;
        }

        .settings-info {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }

        .feature-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .feature-checkbox input {
          width: auto;
          margin: 0;
        }

        .feature-checkbox label {
          margin: 0;
          font-weight: 400;
          cursor: pointer;
          color: #333;
        }
      `}</style>

      <div className="settings-header">
        <h1>OpenClaw Settings</h1>
        {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* GATEWAY SECTION */}
      <div className="settings-section">
        <div className="section-header" onClick={() => setExpandedSection(expandedSection === 'gateway' ? '' : 'gateway')}>
          <div>
            <h2>
              Gateway Connection
              <span className={`status-badge ${connected ? 'status-connected' : 'status-disconnected'}`}>
                {connected ? '✓ Connected' : '✕ Disconnected'}
              </span>
            </h2>
          </div>
          <div className="section-toggle">{expandedSection === 'gateway' ? '▼' : '▶'}</div>
        </div>

        <div className={`section-content ${expandedSection === 'gateway' ? 'expanded' : ''}`}>
          <form onSubmit={handleConnectGateway}>
            <div className="form-group">
              <label>Gateway URL</label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="ws://localhost:8000"
                disabled={isLoading}
              />
              <div className="settings-info">
                WebSocket URL to your OpenClaw gateway instance
              </div>
            </div>

            <div className="form-group">
              <label>Authentication Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Leave blank for guest access"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Pairing Code</label>
              <input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                placeholder="Optional pairing code"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>TLS Fingerprint</label>
              <textarea
                value={tlsFingerprint}
                onChange={(e) => setTlsFingerprint(e.target.value)}
                placeholder="SHA256 fingerprint for certificate pinning"
                disabled={isLoading}
              />
              <div className="settings-info">
                For HTTPS/WSS connections, optional certificate pinning
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect Gateway'}
              </button>
              {connected && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="settings-section">
        <div className="section-header" onClick={() => setExpandedSection(expandedSection === 'notifications' ? '' : 'notifications')}>
          <div>
            <h2>
              Notifications
              <span className={`status-badge ${notificationsEnabled ? 'status-connected' : 'status-disconnected'}`}>
                {notificationsEnabled ? '✓ Enabled' : '✕ Disabled'}
              </span>
            </h2>
          </div>
          <div className="section-toggle">{expandedSection === 'notifications' ? '▼' : '▶'}</div>
        </div>

        <div className={`section-content ${expandedSection === 'notifications' ? 'expanded' : ''}`}>
          <div className="feature-checkbox">
            <input
              type="checkbox"
              id="notifications-toggle"
              checked={notificationsEnabled}
              onChange={handleEnableNotifications}
              disabled={isLoading}
            />
            <label htmlFor="notifications-toggle">
              Enable push notifications for agent events
            </label>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div className="settings-info">
              Get notified when agents complete tasks, receive new messages, or system events occur.
            </div>
          </div>

          {notificationsEnabled && (
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn btn-success"
                onClick={handleTestNotification}
                disabled={isLoading}
              >
                Send Test Notification
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DATA MANAGEMENT SECTION */}
      <div className="settings-section">
        <div className="section-header" onClick={() => setExpandedSection(expandedSection === 'data' ? '' : 'data')}>
          <div>
            <h2>Data Management</h2>
          </div>
          <div className="section-toggle">{expandedSection === 'data' ? '▼' : '▶'}</div>
        </div>

        <div className={`section-content ${expandedSection === 'data' ? 'expanded' : ''}`}>
          <div className="settings-info" style={{ marginBottom: '16px' }}>
            Export, backup, or clear your OpenClaw configuration and session data.
          </div>

          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={handleExportConfig}
              disabled={isLoading}
            >
              Export Configuration
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClearAllData}
              disabled={isLoading}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenClawSettings;
