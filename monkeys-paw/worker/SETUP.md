# Monkey's Paw — Cloudflare Worker setup

The page on GitHub Pages never sees your Anthropic key. It calls this Worker; the
Worker holds the key as an encrypted secret, counts wishes in KV, and calls Anthropic.

```
Browser (GitHub Pages) ──► Cloudflare Worker ──► Anthropic API
                             │  ANTHROPIC_API_KEY (secret)
                             └─ WISHES (KV): sessions + per-visitor daily counts
```

## What Cloudflare needs

| Name | Kind | Value |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Secret** (encrypted) | Your Anthropic key. Enter it only in the Cloudflare dashboard or `wrangler secret put`. Never in a file. |
| `WISHES` | KV namespace binding | A KV namespace you create (any name, e.g. `monkeys-paw-wishes`) |
| `MODEL` | Variable | `claude-sonnet-5-5` — change this one value to switch models |
| `SYSTEM_PROMPT_URL` | Variable | `https://conwatcher.github.io/utility/monkeys-paw/paw-system-prompt.md` |
| `ALLOWED_ORIGINS` | Variable | `https://conwatcher.github.io` (comma-separate to add more, e.g. a local test origin) |
| `WISHES_PER_SESSION` | Variable | `3` |
| `SESSIONS_PER_IP_PER_DAY` | Variable | `3` — how many fresh paws one visitor can start per UTC day |
| `MAX_PROMPT_CHARS` | Variable | `8000` |
| `EFFORT` | Variable | `medium` (`low` is cheaper/faster, `high` is more thorough) |
| `MAX_TOKENS` | Variable | `8000` |
| `ENABLE_FALLBACKS` | Variable | `true` — if Anthropic's safety filter declines a prompt, it retries on another model instead of failing. Set `false` if you switch `MODEL` to Haiku or an older model. |

All of these except the secret and the KV ID are already filled in `wrangler.json`.

## Option A — Cloudflare dashboard (no command line)

1. **Workers & Pages → Create → Create Worker.** Name it `monkeys-paw`, deploy the hello-world.
2. **Edit code.** Replace everything with the contents of `worker.js`. Deploy.
3. **Storage & Databases → KV → Create namespace** named `monkeys-paw-wishes`.
4. Back in the Worker: **Settings → Bindings → Add → KV namespace.** Variable name `WISHES`, pick the namespace.
5. **Settings → Variables and Secrets → Add:**
   - Type **Secret**, name `ANTHROPIC_API_KEY`, value = your key.
   - Type **Text** for each variable in the table above, using the values from `wrangler.json`.
6. Deploy. Copy the Worker URL (e.g. `https://monkeys-paw.yourname.workers.dev`).
7. Put that URL in `monkeys-paw/config.js` and push. Done.

## Option B — Wrangler CLI

```sh
cd monkeys-paw/worker
npx wrangler login
npx wrangler kv namespace create WISHES      # paste the printed id into wrangler.json
npx wrangler secret put ANTHROPIC_API_KEY    # paste the key when prompted
npx wrangler deploy
```

Then put the printed Worker URL in `monkeys-paw/config.js`.

## Tuning

- **The Paw's behavior:** edit `monkeys-paw/paw-system-prompt.md` and push. The Worker
  re-reads it within about 5 minutes. No code change, no redeploy.
- **Model, limits, effort:** change the variable in the Cloudflare dashboard (or
  `wrangler.json` + `wrangler deploy`).

## How the limit is enforced

- A session is created by the Worker (`POST /session`) the first time a visitor
  wishes. Its remaining-wish count lives in KV, not the browser.
- `POST /wish` spends a wish *before* calling Anthropic and refunds it if the call
  fails (Anthropic error, refusal, truncated reply). A concession is free: the wish is refunded.
- Starting a new paw is capped per visitor per day (hashed IP, raw IPs are never stored),
  so clearing the browser doesn't give unlimited wishes.
- KV is eventually consistent; a deliberate burst of simultaneous requests could squeeze
  out an extra wish. Fine for a training tool; a Durable Object would make it exact.

## Cost guardrail

Worst case per visitor per day = `WISHES_PER_SESSION × SESSIONS_PER_IP_PER_DAY` calls
(9 by default), plus any conceded wishes, which are free. Set a monthly spend limit in the Anthropic Console as the real backstop.
