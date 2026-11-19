import { fetch as expoFetch } from "expo/fetch";
import {
  appBarFor,
  hasEnoughData,
  humanDataBlock,
  notEnoughData,
  offlineBlocks,
  sampleData,
  ScreenAssembler,
  scopeFor,
  type ScreenRequest,
  type StreamEvent,
} from "@moonshot/genui-core";
import { FORCE_OFFLINE, GENERATE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Streams a generated screen. Events arrive as SSE from the generate-screen
 * Edge Function; each `block` has already passed the grammar on the server.
 * If the backend is unreachable, the same grammar runs on-device over the
 * sample data so the app still works offline (marked generator: "offline").
 */
export async function streamScreen(req: ScreenRequest, onEvent: (e: StreamEvent) => void, signal: AbortSignal): Promise<void> {
  if (FORCE_OFFLINE) return localScreen(req, onEvent, signal);
  let started = false;
  // Skeletons show for at most ~8 s (gen/atom/skeleton): if the server hasn't started
  // streaming within CONNECT_TIMEOUT_MS, generate on-device instead of waiting.
  const connect = new AbortController();
  const onAbort = () => connect.abort();
  signal.addEventListener("abort", onAbort);
  const timer = setTimeout(() => { if (!started) connect.abort(); }, CONNECT_TIMEOUT_MS);
  try {
    const res = await expoFetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY, Accept: "text/event-stream" },
      body: JSON.stringify(req),
      signal: connect.signal,
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        const data = frame.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("\n");
        if (!data) continue;
        const ev = JSON.parse(data) as StreamEvent;
        if (ev.type === "start") started = true;
        onEvent(ev);
      }
    }
  } catch (err) {
    if (signal.aborted) return;
    if (!started) return localScreen(req, onEvent, signal); // backend unreachable, slow, or not deployed yet
    onEvent({ type: "error", message: err instanceof Error ? err.message : "stream failed" });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

const CONNECT_TIMEOUT_MS = 6000;

const wait = (ms: number, signal: AbortSignal) => new Promise<void>((r) => { const id = setTimeout(r, ms); signal.addEventListener("abort", () => { clearTimeout(id); r(); }); });

async function localScreen(req: ScreenRequest, onEvent: (e: StreamEvent) => void, signal: AbortSignal) {
  const scope = scopeFor(sampleData, req.context, req.subject_id);
  onEvent({ type: "start", app_bar: appBarFor(sampleData, req.context, req.subject_id, req.viewer_id), suggestions: [], generator: "offline" });
  onEvent({ type: "status", text: req.context === "leader" ? `Reading ${scope.teams.length} teams and ${scope.keyResults.length} key results` : `Reading ${scope.entries.length} entries and ${scope.feedback.length} feedback notes` });
  let index = 0;
  if (!hasEnoughData(scope)) {
    onEvent({ type: "block", index: index++, block: notEnoughData(scope) });
  } else {
    const a = new ScreenAssembler(scope);
    for (const b of offlineBlocks(scope, req.question)) {
      await wait(350, signal);
      if (signal.aborted) return;
      const v = a.accept(b);
      if (v.ok) onEvent({ type: "block", index: index++, block: v.block });
    }
    const human = req.question ? null : humanDataBlock(scope);
    if (human) onEvent({ type: "block", index: index++, block: human });
  }
  onEvent({ type: "done", generated_at: new Date().toISOString() });
}
