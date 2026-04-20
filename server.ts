import { serveStatic } from "hono/bun";
import type { ViteDevServer } from "vite";
import { createServer as createViteServer } from "vite";
import config from "./zosite.json";
import { Hono } from "hono";
import { readdir, stat, readFile } from "fs/promises";
import { join, extname } from "path";

const app = new Hono();
const WORKSPACE = "/home/workspace";

type Mode = "development" | "production";
const mode: Mode = process.env.NODE_ENV === "production" ? "production" : "development";

// ─── API Routes ───────────────────────────────────────────────────────────────

app.post("/api/zo", async (c) => {
  const { input, persona_id, conversation_id } = await c.req.json();
  const zoToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  if (!zoToken || zoToken === "none") {
    return c.json({ error: "Zo not authenticated. Please connect Zo in Settings." }, 401);
  }
  try {
    const body: any = { input, model_name: "byok:7578d2f6-7d32-4c48-9fb3-02cfe6b5a50b" };
    if (persona_id) body.persona_id = persona_id;
    if (conversation_id) body.conversation_id = conversation_id;
    const res = await fetch("https://api.zo.computer/zo/ask", {
      method: "POST",
      headers: { "Authorization": `Bearer ${zoToken}`, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/memory", async (c) => {
  try {
    const memDir = join(WORKSPACE, "MEMORY");
    const dirs = ["working", "shared", "journal", "strategic", "recent"];
    const result: any = { working: [], shared: [], journal: [], strategic: [], recent: [] };
    
    for (const dir of dirs) {
      try {
        const fullDir = join(memDir, dir === "recent" ? "." : dir);
        if (dir === "recent") {
          result.recent = await getRecentFiles(memDir, 10);
        } else {
          const items = await readdir(fullDir);
          result[dir] = await Promise.all(
            items.filter((n: string) => n.endsWith(".md")).map(async (n: string) => {
              const s = await stat(join(fullDir, n));
              return { name: n, path: `MEMORY/${dir}/${n}`, size: s.size, modified: s.mtime.toISOString() };
            })
          );
        }
      } catch { /* dir may not exist */ }
    }
    return c.json(result);
  } catch { return c.json({ error: "Failed" }, 500); }
});

app.get("/api/memory/:path+", async (c) => {
  const parts = c.req.param("path+");
  const relPath = parts.replace(/\//g, "/").replace(/^MEMORY\//, "MEMORY/");
  const fullPath = join(WORKSPACE, relPath.startsWith("/") ? relPath.slice(1) : relPath);
  try {
    const content = await readFile(fullPath, "utf-8");
    const s = await stat(fullPath);
    return c.json({ content, size: s.size, modified: s.mtime.toISOString() });
  } catch { return c.json({ error: "File not found" }, 404); }
});

app.get("/api/agents", async (c) => {
  try {
    const memDir = join(WORKSPACE, "MEMORY");
    const scheduled = [
      { name: "Dawn Journal", time: "5:30 AM", status: "scheduled" },
      { name: "Morning Brief", time: "7:00 AM", status: "scheduled" },
      { name: "Pattern Scanner", time: "12:00 PM", status: "scheduled" },
      { name: "Afternoon Pulse", time: "2:30 PM", status: "scheduled" },
      { name: "Evening Sync", time: "9:00 PM", status: "scheduled" },
    ];
    let heartbeat = { status: "active", lastCycle: new Date().toISOString(), nextCycle: "" };
    try {
      const log = await readFile(join(memDir, "working/heartbeat-log.md"), "utf-8").catch(() => "");
      if (log) {
        const lines = log.split("\n").filter(Boolean);
        const last = lines[lines.length - 1] || "";
        heartbeat = { status: "active", lastCycle: last.slice(0, 25) || new Date().toISOString(), nextCycle: "" };
      }
    } catch { /* no heartbeat log */ }
    return c.json({ scheduled, heartbeat, priorities: { p0: [], p1: [], p2: [] } });
  } catch { return c.json({ error: "Failed" }, 500); }
});

app.get("/api/files", async (c) => {
  const query = c.req.query("path") || "";
  const search = c.req.query("q") || "";
  const baseDir = join(WORKSPACE, query.startsWith("MEMORY") ? "" : "");
  const targetDir = query ? join(WORKSPACE, query) : WORKSPACE;
  try {
    const entries = await readdir(targetDir);
    let items = await Promise.all(entries.map(async (n) => {
      try {
        const s = await stat(join(targetDir, n));
        return { name: n, path: query ? `${query}/${n}` : n, isDir: s.isDirectory(), size: s.size, modified: s.mtime.toISOString() };
      } catch { return null; }
    }));
    items = items.filter(Boolean);
    if (search) items = items.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase()));
    return c.json(items);
  } catch { return c.json([]); }
});

app.get("/api/files/:path+", async (c) => {
  const parts = c.req.param("path+");
  const fullPath = join(WORKSPACE, parts.replace(/\//g, "/"));
  try {
    const content = await readFile(fullPath, "utf-8");
    const s = await stat(fullPath);
    const ext = extname(fullPath).toLowerCase();
    const isText = [".md", ".txt", ".json", ".ts", ".js", ".tsx", ".jsx", ".py", ".yaml", ".yml", ".toml", ".css", ".html"].includes(ext);
    return c.json({ content: isText ? content.slice(0, 50000) : "[Binary file]", size: s.size, modified: s.mtime.toISOString(), isText });
  } catch { return c.json({ error: "File not found" }, 404); }
});

app.get("/api/calendar", async (c) => {
  const zoToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  if (!zoToken || zoToken === "none") {
    return c.json([{ id: "1", title: "Demo: Connect Google Calendar in Zo Settings", rawTime: "--:--", duration: "--", type: "system" }]);
  }
  try {
    const res = await fetch("https://api.zo.computer/zo/ask", {
      method: "POST",
      headers: { "Authorization": `Bearer ${zoToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: "List my calendar events for today. Return as JSON array with fields: id, title, rawTime, duration, type (internal/external/system).", model_name: "byok:7578d2f6-7d32-4c48-9fb3-02cfe6b5a50b" }),
    });
    const data = await res.json();
    try { return c.json(JSON.parse(data.output || "[]")); } catch { return c.json([]); }
  } catch { return c.json([]); }
});

app.post("/api/capture", async (c) => {
  const { content } = await c.req.json();
  const date = new Date().toISOString().split("T")[0];
  const path = join(WORKSPACE, "MEMORY/daily", `${date}.md`);
  try {
    const existing = await readFile(path, "utf-8").catch(() => "");
    const entry = `\n## Captured\n${content}\n`;
    const { writeFile } = await import("fs/promises");
    await writeFile(path, existing + entry);
    return c.json({ success: true });
  } catch { return c.json({ success: false, error: "Failed to save" }, 500); }
});

app.get("/api/context", async (c) => {
  try {
    const ctx = await readFile(join(WORKSPACE, "MEMORY/working/active-context.md"), "utf-8").catch(() => "");
    const sess = await readFile(join(WORKSPACE, "MEMORY/working/session-state.md"), "utf-8").catch(() => "");
    return c.json({ activeContext: ctx, sessionState: sess, lastUpdated: new Date().toISOString() });
  } catch { return c.json({ activeContext: "", sessionState: "", lastUpdated: new Date().toISOString() }); }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getRecentFiles(dir: string, limit: number): Promise<any[]> {
  const results: any[] = [];
  async function walk(d: string, depth: number = 0) {
    if (depth > 2 || results.length >= limit) return;
    try {
      const items = await readdir(d);
      for (const n of items) {
        if (results.length >= limit) break;
        const full = join(d, n);
        try {
          const s = await stat(full);
          if (s.isDirectory() && !n.startsWith(".")) await walk(full, depth + 1);
          else if (n.endsWith(".md")) results.push({ name: n, path: full.replace(WORKSPACE + "/", ""), size: s.size, modified: s.mtime.toISOString() });
        } catch {}
      }
    } catch {}
  }
  await walk(dir);
  return results.sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime()).slice(0, limit);
}

// ─── Static Serving ───────────────────────────────────────────────────────────

if (mode === "production") {
  app.use("/assets/*", serveStatic({ root: "./dist" }));
  app.get("/favicon.ico", (c) => c.redirect("/favicon.svg", 302));
  app.use(async (c, next) => {
    if (c.req.method !== "GET") return next();
    const path = c.req.path;
    if (path.startsWith("/api/") || path.startsWith("/assets/")) return next();
    const file = Bun.file(`./dist${path}`);
    if (await file.exists()) { const s = await file.stat(); if (s && !s.isDirectory()) return new Response(file); }
    return serveStatic({ path: "./dist/index.html" })(c, next);
  });
} else {
  const vite = await createViteServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  app.use("*", async (c, next) => {
    if (c.req.path === "/favicon.ico") return c.redirect("/favicon.svg", 302);
    if (c.req.path.startsWith("/api/")) return next();
    try {
      if (c.req.path === "/" || c.req.path === "/index.html") {
        const tpl = await Bun.file("./index.html").text();
        return c.html(await vite.transformIndexHtml(c.req.path, tpl), { headers: { "Cache-Control": "no-store" } });
      }
      const pub = Bun.file(`./public${c.req.path}`);
      if (await pub.exists()) { const s = await pub.stat(); if (s && !s.isDirectory()) return new Response(pub); }
      const res = await vite.transformRequest(c.req.path).catch(() => null);
      if (res) return new Response(res.code, { headers: { "Content-Type": "application/javascript", "Cache-Control": "no-store" } });
      return c.html(await vite.transformIndexHtml("/", await Bun.file("./index.html").text()), { headers: { "Cache-Control": "no-store" } });
    } catch (e) { (vite as any).ssrFixStacktrace(e as Error); console.error(e); return c.text("Error", 500); }
  });
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : mode === "production" ? (config.publish?.published_port ?? config.local_port) : config.local_port;
export default { fetch: app.fetch, port, idleTimeout: 255 };
