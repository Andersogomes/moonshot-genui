# Leadership Tools — Moonshot Generative UI

An app where people contribute what they know about their work and the model turns it
into insights — each one showing its sources and confidence. Built from the Figma file
*DL - Tools - Moonshot (Copy)*, section **Generative UI v2** (contract v1.2, `spec/`).

One codebase, three targets:

| Target | How | Layout |
|---|---|---|
| **Web** (GitHub Pages) | Expo web build | ≥1024px desktop, below that mobile |
| **iOS / Android** | Expo (React Native) — run in Expo Go | mobile: tab bar + composer dock |
| **Desktop** (macOS/Windows/Linux) | Electron shell around the web build | sidebar 264px + primary/secondary columns |

## How a screen is generated

```
client ──POST {context, subject_id, viewer_id, question?}──▶ Edge Function generate-screen
                                                              1. load records (service role; RLS blocks everyone else)
                                                              2. scopeFor(): the hard wall — owner / viewer / leader
                                                              3. below thresholds → gen/state/not-enough-data (no model call)
                                                              4. Claude streams emit_block tool calls
                                                              5. ScreenAssembler validates each block:
                                                                 schema · limits · provenance in scope · verbatim quotes
◀────────────── SSE: start · status · block · rejected · done ─┘
```

* **The model is never trusted.** Every block is checked against the contract in
  `packages/genui-core` before it is sent. Rejections go back to the model as tool errors.
* **Scope is computed in code**, before the model sees anything. A viewer screen can't cite a
  private source; the grammar rejects it.
* **Human data is never generated.** "Your data" rows come from records; quotes must match
  feedback verbatim.
* **Offline generator.** Without `ANTHROPIC_API_KEY`, over the rate limit, or when the backend
  is unreachable, the same grammar runs deterministically (server or on-device). The screen
  says which generator wrote it.

## Layout

```
spec/                     contract.json + component specs exported from Figma
packages/genui-core/      schemas, tokens, grammar, scope, offline generator, prompt (+ tests)
apps/client/              Expo app (iOS, Android, web)
apps/desktop/             Electron shell
supabase/migrations/      schema (RLS on, no public policies) + seed
supabase/functions/       generate-screen Edge Function (Deno)
```

## Run it

```sh
npm install
npm test                 # grammar + scope tests
npm run web              # browser at http://localhost:8081
npm run client           # Expo dev server — scan the QR code with Expo Go (iOS/Android)
npm run desktop          # Electron app
```

## Deploy

* **Web:** push to `main`; `.github/workflows/pages.yml` builds and publishes to GitHub Pages.
* **Edge Function:** `npx supabase login` once, then `npm run deploy:function`.
* **Turn on Claude:** `npx supabase secrets set ANTHROPIC_API_KEY=... --project-ref okiljlztobcnqxtmvzfi`
  Optional: `GENUI_EFFORT` (default `low`), `GENUI_PER_IP_PER_HOUR` (20), `GENUI_GLOBAL_PER_DAY` (300).
* **Desktop installers:** `npm run dist:mac -w desktop` (also `--win`, `--linux` via electron-builder).

## Status

Sample data only (fictional cast from the Figma contract). Demo personas stand in for sign-in;
Contribute previews but does not save yet. Next: Supabase Auth → per-user scope, saving
entries, endorsements, and the "Request access" flow for locked insights.
