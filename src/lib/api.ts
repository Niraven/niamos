// Types
export type Tab = "home" | "chat" | "capture" | "agents" | "memory" | "files";

export interface Message { role: "user" | "agent"; content: string; }
export interface Agent { name: string; time: string; status: "done" | "next" | "upcoming"; lastRun?: string; }
export interface MemoryFile { name: string; path: string; mtime: string; }
export interface CalendarEvent { id: string; title: string; start: string; }
export interface FileEntry { name: string; isDir: boolean; size: number; }

// API Layer
export const API = {
  getAgents: () =>
    fetch("/api/agents").then(r => r.json()).catch(() => ({ scheduled: [], heartbeat: {} })),

  getMemory: () =>
    fetch("/api/memory").then(r => r.json()).catch(() => ({ files: [] })),

  getCalendar: () =>
    fetch("/api/calendar").then(r => r.json()).catch(() => []),

  getFiles: (p?: string) =>
    fetch(p ? `/api/files/${encodeURIComponent(p)}` : "/api/files")
      .then(r => r.json()).catch(() => []),

  sendChat: (input: string, persona_id?: string, conversation_id?: string) =>
    fetch("/api/zo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, persona_id, conversation_id }),
    }).then(async r => {
      if (!r.ok) throw new Error("API error");
      const data = await r.json();
      return { output: data.output || "No response", conversation_id: data.conversation_id };
    }),

  capture: (content: string) =>
    fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).then(r => r.json()),

  getMemoryFile: (path: string) =>
    fetch(`/api/memory/${encodeURIComponent(path)}`).then(r => r.text()).catch(() => "Could not load file."),

  getFileContent: (path: string) =>
    fetch(`/api/files/${encodeURIComponent(path)}`).then(r => r.text()).catch(() => "Could not load file."),
};
