/**
 * OpenClawChat Component
 * Chat interface with OpenClaw agents
 */

import React, { useState, useRef, useEffect } from 'react';
import { getOpenClaw, Message, Agent } from '../services/openclaw';

interface OpenClawChatProps {
  agentId?: string;
  agentType?: 'axis-coding' | 'axis-security' | 'axis-research' | 'axis-content' | 'axis-devops';
  autoSpawn?: boolean;
}

export const OpenClawChat: React.FC<OpenClawChatProps> = ({
  agentId: initialAgentId,
  agentType = 'axis-coding',
  autoSpawn = false,
}) => {
  const [agentId, setAgentId] = useState<string | undefined>(initialAgentId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<Agent | undefined>();
  const [useVoice, setUseVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const openclaw = getOpenClaw();

  // ========================================================================
  // INITIALIZATION & AGENT MANAGEMENT
  // ========================================================================

  useEffect(() => {
    const setupComponent = async () => {
      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = handleSpeechResult;
      }

      // Auto-spawn agent if requested
      if (autoSpawn && !agentId) {
        try {
          setIsLoading(true);
          const agent = await openclaw.spawnAgent(agentType, `You are a helpful ${agentType} agent`);
          setAgentId(agent.id);
          setAgentStatus(agent);
        } catch (error) {
          console.error('Failed to spawn agent:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (agentId) {
        const agent = openclaw.getAgentStatus(agentId);
        setAgentStatus(agent);
      }
    };

    setupComponent();
  }, []);

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  /**
   * Load message history
   */
  useEffect(() => {
    if (agentId) {
      const history = openclaw.getMessageHistory(agentId);
      setMessages(history);
    }
  }, [agentId]);

  /**
   * Subscribe to new messages
   */
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.agentId === agentId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleAgentComplete = (completedAgentId: string) => {
      if (completedAgentId === agentId) {
        setAgentStatus((prev) => prev ? { ...prev, status: 'completed' } : undefined);
      }
    };

    openclaw.on('message:new', handleNewMessage);
    openclaw.on('agent:complete', handleAgentComplete);

    return () => {
      openclaw.off('message:new', handleNewMessage);
      openclaw.off('agent:complete', handleAgentComplete);
    };
  }, [agentId]);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========================================================================
  // SEND MESSAGE
  // ========================================================================

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agentId || isLoading) return;

    const content = input;
    setInput('');
    setIsLoading(true);

    try {
      await openclaw.sendMessage(agentId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // VOICE INPUT
  // ========================================================================

  const handleSpeechResult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        setInput((prev) => prev + transcript);
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported');
      return;
    }

    if (useVoice) {
      recognitionRef.current.stop();
      setUseVoice(false);
    } else {
      recognitionRef.current.start();
      setUseVoice(true);
    }
  };

  // ========================================================================
  // SPAWN NEW AGENT
  // ========================================================================

  const handleSpawnAgent = async () => {
    const prompt = prompt('Enter agent prompt:', 'Help me with my task');
    if (!prompt) return;

    setIsLoading(true);
    try {
      const agent = await openclaw.spawnAgent(agentType, prompt);
      setAgentId(agent.id);
      setAgentStatus(agent);
      setMessages([]);
    } catch (error) {
      console.error('Failed to spawn agent:', error);
      alert('Failed to spawn agent');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="openclaw-chat">
      <style>{`
        .openclaw-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .openclaw-chat-header {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px 8px 0 0;
        }

        .agent-status {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 8px;
        }

        .openclaw-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          gap: 8px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 12px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .message.user .message-bubble {
          background: #667eea;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.assistant .message-bubble {
          background: #f0f0f0;
          color: #333;
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .openclaw-chat-input {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 8px;
          background: #f9f9f9;
          border-radius: 0 0 8px 8px;
        }

        .input-form {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .input-form input {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-form input:focus {
          border-color: #667eea;
        }

        .input-form button {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .input-form button:hover {
          background: #5568d3;
        }

        .input-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-btn {
          padding: 10px 12px;
          background: ${useVoice ? '#f44336' : '#4CAF50'};
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .voice-btn:hover {
          background: ${useVoice ? '#d32f2f' : '#45a049'};
        }

        .spawn-btn {
          padding: 8px 12px;
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .spawn-btn:hover {
          background: #f57c00;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #999;
          text-align: center;
        }

        .loading {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: pulse 1.5s infinite;
          margin-right: 4px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="openclaw-chat-header">
        <div>
          <strong>OpenClaw Agent Chat</strong>
          {agentStatus && (
            <div className="agent-status">
              Agent: {agentStatus.id.substr(0, 8)}... • Status: {agentStatus.status}
            </div>
          )}
        </div>
      </div>

      <div className="openclaw-chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>
              {agentId
                ? 'Start a conversation with the agent'
                : 'No agent connected. Spawn one to get started.'}
            </p>
            {!agentId && <button className="spawn-btn" onClick={handleSpawnAgent}>Spawn Agent</button>}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div>
                <div className="message-bubble">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="openclaw-chat-input">
        <form className="input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!agentId || isLoading}
          />
          <button type="submit" disabled={!agentId || isLoading || !input.trim()}>
            {isLoading ? <span className="loading" /> : 'Send'}
          </button>
        </form>
        <button className="voice-btn" onClick={toggleVoiceInput} title="Toggle voice input">
          🎤
        </button>
      </div>
    </div>
  );
};

export default OpenClawChat;
