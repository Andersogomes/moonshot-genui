import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  appBarFor,
  hasEnoughData,
  humanDataBlock,
  notEnoughData,
  offlineBlocks,
  ScreenAssembler,
  ScreenRequest,
  scopeFor,
  scopeToPrompt,
  type StreamEvent,
} from "./core/index.ts";
import { loadDataset, serviceClient } from "./db.ts";
import { generateWithClaude } from "./claude.ts";

/** Abuse guard for a public site: per-IP and global caps on model calls. Past them → offline generator. */
const PER_IP_PER_HOUR = Number(Deno.env.get("GENUI_PER_IP_PER_HOUR") ?? 20);
const GLOBAL_PER_DAY = Number(Deno.env.get("GENUI_GLOBAL_PER_DAY") ?? 300);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("POST only", { status: 405, headers: CORS });

  const parsed = ScreenRequest.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400, headers: CORS });
  const request = parsed.data;
  const ipHash = await hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown");

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: StreamEvent) => controller.enqueue(enc.encode(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`));
      let index = 0;
      try {
        const data = await loadDataset();
        const scope = scopeFor(data, request.context, request.subject_id);
        const useClaude = !!Deno.env.get("ANTHROPIC_API_KEY") && (await underLimits(ipHash));
        send({ type: "start", app_bar: appBarFor(data, request.context, request.subject_id, request.viewer_id), suggestions: [], generator: useClaude ? "claude" : "offline" });
        send({ type: "status", text: statusLine(scope) });

        if (!hasEnoughData(scope)) {
          send({ type: "block", index: index++, block: notEnoughData(scope) });
        } else {
          const assembler = new ScreenAssembler(scope);
          let stats = { accepted: 0, rejected: 0, input_tokens: 0, output_tokens: 0 };
          if (useClaude) {
            stats = await generateWithClaude(
              scopeToPrompt(scope),
              request.question,
              assembler,
              (block) => send({ type: "block", index: index++, block }),
              (reason) => send({ type: "rejected", reason }),
            );
          }
          // Offline generator: no key, over the limits, or the model produced no narrative.
          if (!useClaude || assembler.missingNarrative()) {
            for (const block of offlineBlocks(scope, request.question)) {
              const v = assembler.accept(block);
              if (v.ok) send({ type: "block", index: index++, block: v.block });
            }
          }
          const human = request.question ? null : humanDataBlock(scope);
          if (human) send({ type: "block", index: index++, block: human });
          await log(ipHash, request.context, useClaude ? "claude" : "offline", stats);
        }
        send({ type: "done", generated_at: new Date().toISOString() });
      } catch (err) {
        console.error(err);
        send({ type: "error", message: err instanceof Error ? err.message : "generation failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
});

/** gen/molecule/status-line: present tense, names the real data. */
function statusLine(s: ReturnType<typeof scopeFor>): string {
  if (s.context === "leader") return `Reading ${s.teams.length} teams, ${s.keyResults.length} key results and ${s.orgChanges.length} org changes`;
  return `Reading ${s.entries.length} entries and ${s.feedback.length} feedback notes`;
}

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("GENUI_IP_SALT") ?? "moonshot";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ip));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function underLimits(ipHash: string): Promise<boolean> {
  const db = serviceClient();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const [ip, all] = await Promise.all([
    db.from("generation_log").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).eq("generator", "claude").gte("created_at", hourAgo),
    db.from("generation_log").select("id", { count: "exact", head: true }).eq("generator", "claude").gte("created_at", dayAgo),
  ]);
  return (ip.count ?? 0) < PER_IP_PER_HOUR && (all.count ?? 0) < GLOBAL_PER_DAY;
}

async function log(ipHash: string, context: string, generator: string, s: { accepted: number; rejected: number; input_tokens: number; output_tokens: number }) {
  await serviceClient().from("generation_log").insert({ ip_hash: ipHash, context, generator, ...s });
}
