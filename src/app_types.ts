import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import {
  Home, Bot, Brain, Files, Cpu, Zap, Search,
  ChevronRight, Clock, Calendar, Send, Shield,
  User, Terminal, Database, Globe, Wifi, WifiOff,
  Plus, Minus, Menu, X, ChevronDown, ArrowLeft,
  FolderOpen, FileText, Copy, Check, RefreshCw, Loader2, UserCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "home" | "chat" | "agents" | "memory" | "files";
interface Message { id: string; role: "user" | "agent"; content: string; time: string; }
interface Agent { name: string; time: string; status: "done" | "next" | "upcoming" | "failed"; output?: string; }
interface MemoryFile { name: string; path: string; mtime: string; size: number; section: string; }
interface CalendarEvent { id: string; title: string; time: string; duration: string; type: "internal" | "external" | "system"; }
interface FileEntry { name: string; path: string; isDir: boolean; size: number; mtime: string; }
interface ContextData { activeContext: string; sessionState: string; lastUpdated: string; }

// ─── API Helpers ─────────────────────────────────────────────────────────────
const API = {
  async chat(input: string, personaId?: string): Promise<string> {
    const res = await fetch("/api/zo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, persona_id: personaId }),
    });
    if (!res.ok) throw new Error("Chat failed");
    const data = await res.json();
    return data.output || data.error || "No response.";
  },
  async getContext(): Promise<ContextData> {
    const res = await fetch("/api/context");
    if (!res.ok) return { activeContext: "Could not load context.", sessionState: "", lastUpdated: "" };
    return res.json();
  },
  async getAgents(): Promise<{ scheduled: Agent[]; heartbeat: any }> {
    const res = await fetch("/api/agents");
    if (!res.ok) return { scheduled: [], heartbeat: null };
    return res.json();
  },
  async getMemory(): Promise<MemoryFile[]> {
    const res = await fetch("/api/memory");
    if (!res.ok) return [];
    return res.json();
  },
  async getMemoryFile(path: string): Promise<string> {
    const res = await fetch(`/api/memory/${encodeURIComponent(path)}`);
    if (!res.ok) return "Could not load file.";
    return res.text();
  },
  async getFiles(path?: string): Promise<FileEntry[]> {
    const url = path ? `/api/files/${encodeURIComponent(path)}` : "/api/files";
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },
  async getCalendar(): Promise<CalendarEvent[]> {
    const res = await fetch("/api/calendar");
    if (!res.ok) return [];
    return res.json();
  },
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  } catch { return ""; }
}
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function genId(): string { return Math.random().toString(36).slice(2); }

