import { Hono } from "hono";
import { cors } from "hono/cors";
const app = new Hono();
app.use("*", cors());

app.post("/test-zo", async (c) => {
  const zoToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  console.log("ZO_TOKEN exists:", !!zoToken, "length:", zoToken?.length);
  
  const { input } = await c.req.json();
  
  try {
    const res = await fetch("https://api.zo.computer/zo/ask", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${zoToken}`, 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ input }),
    });
    console.log("Zo status:", res.status);
    const text = await res.text();
    console.log("Zo raw response:", text.slice(0, 200));
    return c.json(JSON.parse(text));
  } catch (err: any) {
    console.error("Error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default { fetch: app.fetch, port: 55346 };
