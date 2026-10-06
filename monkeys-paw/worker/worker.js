// The Monkey's Paw — Cloudflare Worker
//
// Sits between the GitHub Pages site and the Anthropic API so the API key never
// reaches the browser, and enforces the wish limit server-side.
//
// Bindings and variables (see wrangler.json and SETUP.md):
//   ANTHROPIC_API_KEY      secret   Anthropic API key — set as an encrypted secret, never in a file
//   WISHES                 KV       session and per-IP counters
//   MODEL                  var      Anthropic model ID (default claude-sonnet-5-5)
//   SYSTEM_PROMPT_URL      var      public URL of paw-system-prompt.md
//   ALLOWED_ORIGINS        var      comma-separated origins allowed to call the Worker
//   WISHES_PER_SESSION     var      wishes granted per session (default 3)
//   SESSIONS_PER_IP_PER_DAY var     new sessions one visitor may start per UTC day (default 3)
//   MAX_PROMPT_CHARS       var      longest prompt accepted (default 8000)
//   EFFORT                 var      low | medium | high (default medium)
//   MAX_TOKENS             var      response token ceiling (default 8000)
//   ENABLE_FALLBACKS       var      "true" to let Anthropic retry a refused request on another model

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;   // sessions expire after a week
const IP_TTL_SECONDS = 60 * 60 * 26;            // daily IP counters outlive the day slightly
const PROMPT_CACHE_MS = 5 * 60 * 1000;           // re-fetch the system prompt every 5 minutes

let cachedPrompt = { text: null, at: 0 };

const CURSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["curse", "trigger", "trigger_type", "severity", "fix"],
  properties: {
    curse: { type: "string" },
    trigger: { type: "string" },
    trigger_type: { type: "string", enum: ["phrase", "omission"] },
    severity: { type: "string", enum: ["nuisance", "costly", "catastrophic"] },
    fix: { type: "string" },
  },
};

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "paw_remark", "literal", "presumptuous", "concession", "fixed_prompt"],
  properties: {
    verdict: { type: "string", enum: ["cursed", "conceded"] },
    paw_remark: { type: "string" },
    literal: { type: "array", items: CURSE_SCHEMA },
    presumptuous: { type: "array", items: CURSE_SCHEMA },
    concession: { type: "string" },
    fixed_prompt: { type: "string" },
  },
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (!cors["Access-Control-Allow-Origin"]) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    try {
      if (request.method === "POST" && path === "/session") return await newSession(request, env, cors);
      if (request.method === "GET" && path === "/session") return await getSession(request, env, cors);
      if (request.method === "POST" && path === "/wish") return await makeWish(request, env, cors);
      return json({ error: "Not found." }, 404, cors);
    } catch (err) {
      console.error(err);
      return json({ error: "The paw twitched and nothing happened. Try again." }, 500, cors);
    }
  },
};

// ---------- sessions ----------

async function newSession(request, env, cors) {
  const limit = intVar(env.SESSIONS_PER_IP_PER_DAY, 3);
  const ipKey = `ip:${await visitorHash(request)}:${new Date().toISOString().slice(0, 10)}`;
  const used = parseInt((await env.WISHES.get(ipKey)) || "0", 10);
  if (used >= limit) {
    return json({ error: "The paw has granted all it will grant you today. Come back tomorrow." }, 429, cors);
  }
  await env.WISHES.put(ipKey, String(used + 1), { expirationTtl: IP_TTL_SECONDS });

  const id = crypto.randomUUID();
  const remaining = intVar(env.WISHES_PER_SESSION, 3);
  await env.WISHES.put(`s:${id}`, JSON.stringify({ remaining, created: Date.now() }), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return json({ session: id, remaining, sessionsLeftToday: limit - used - 1 }, 200, cors);
}

async function getSession(request, env, cors) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const s = await loadSession(env, id);
  if (!s) return json({ error: "Unknown or expired session." }, 404, cors);
  return json({ session: id, remaining: s.remaining }, 200, cors);
}

async function loadSession(env, id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const raw = await env.WISHES.get(`s:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function saveSession(env, id, s) {
  await env.WISHES.put(`s:${id}`, JSON.stringify(s), { expirationTtl: SESSION_TTL_SECONDS });
}

// ---------- wishes ----------

async function makeWish(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400, cors);
  }

  const id = String(body.session || "");
  const prompt = String(body.prompt || "").trim();
  const maxChars = intVar(env.MAX_PROMPT_CHARS, 8000);

  if (prompt.length < 10) return json({ error: "Give the paw a real prompt to work with." }, 400, cors);
  if (prompt.length > maxChars) {
    return json({ error: `Prompts are limited to ${maxChars} characters.` }, 400, cors);
  }

  const s = await loadSession(env, id);
  if (!s) return json({ error: "Unknown or expired session.", code: "no_session" }, 404, cors);
  if (s.remaining <= 0) {
    return json({ error: "No wishes remain on this paw.", code: "spent", remaining: 0 }, 403, cors);
  }

  // Spend the wish before calling the model so parallel requests can't overspend,
  // then refund it if the call fails for reasons that aren't the user's.
  s.remaining -= 1;
  await saveSession(env, id, s);

  let result;
  try {
    result = await askThePaw(prompt, env);
  } catch (err) {
    console.error(err);
    s.remaining += 1;
    await saveSession(env, id, s);
    return json({ error: err.userMessage || "The paw went still. Your wish was not spent.", remaining: s.remaining }, 502, cors);
  }

  // A concession is the user's win, so it doesn't cost a wish.
  if (result.verdict === "conceded") {
    s.remaining += 1;
    await saveSession(env, id, s);
  }

  return json({ result, remaining: s.remaining }, 200, cors);
}

async function askThePaw(prompt, env) {
  const system = await loadSystemPrompt(env);

  const payload = {
    model: env.MODEL || "claude-sonnet-5-5",
    max_tokens: intVar(env.MAX_TOKENS, 8000),
    system,
    output_config: {
      effort: env.EFFORT || "medium",
      format: { type: "json_schema", schema: RESULT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `Examine this prompt. Do not perform it.\n\n<prompt_under_test>\n${prompt}\n</prompt_under_test>`,
      },
    ],
  };

  const headers = {
    "content-type": "application/json",
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };
  if (env.ENABLE_FALLBACKS === "true") {
    payload.fallbacks = "default";
    headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Anthropic error", res.status, detail);
    throw userError(
      res.status === 429 || res.status === 529
        ? "The paw is overwhelmed right now. Your wish was not spent — try again in a minute."
        : "The paw went still. Your wish was not spent."
    );
  }

  const msg = await res.json();
  if (msg.stop_reason === "refusal") {
    throw userError("The paw refused to examine that prompt. Your wish was not spent.");
  }
  if (msg.stop_reason === "max_tokens") {
    throw userError("The paw ran out of breath mid-curse. Your wish was not spent — try a shorter prompt.");
  }

  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  let out;
  try {
    out = JSON.parse(text);
  } catch {
    throw userError("The paw spoke in tongues. Your wish was not spent.");
  }
  return out;
}

async function loadSystemPrompt(env) {
  if (cachedPrompt.text && Date.now() - cachedPrompt.at < PROMPT_CACHE_MS) return cachedPrompt.text;
  if (!env.SYSTEM_PROMPT_URL) throw userError("The Worker is missing SYSTEM_PROMPT_URL.");

  const res = await fetch(env.SYSTEM_PROMPT_URL, { cf: { cacheTtl: 300 } });
  if (!res.ok) {
    if (cachedPrompt.text) return cachedPrompt.text; // stale beats broken
    throw userError("The paw could not find its instructions. Your wish was not spent.");
  }
  cachedPrompt = { text: await res.text(), at: Date.now() };
  return cachedPrompt.text;
}

// ---------- helpers ----------

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

async function visitorHash(request) {
  // Hash the IP so raw addresses are never stored.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`monkeys-paw:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function intVar(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function userError(message) {
  const e = new Error(message);
  e.userMessage = message;
  return e;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
