import Anthropic from "@anthropic-ai/sdk";
import { EMIT_BLOCK_TOOL, SYSTEM_PROMPT, userMessage, type ScreenAssembler, type GeneratedBlock } from "./core/index.ts";

const MODEL = "claude-opus-5-5";
/** Screens must feel real-time; low effort keeps time-to-first-block short. Override with GENUI_EFFORT. */
const EFFORT = (Deno.env.get("GENUI_EFFORT") ?? "low") as "low" | "medium" | "high";
const MAX_TURNS = 3;

export interface ClaudeResult {
  accepted: number;
  rejected: number;
  input_tokens: number;
  output_tokens: number;
  stop: string;
}

/**
 * Streams a screen from Claude. The model places blocks by calling emit_block;
 * each call is parsed strictly when its content block closes, validated by the
 * ScreenAssembler (schema + limits + scope), and only then sent to the client.
 * Rejections are returned to the model as tool errors so it can correct them.
 */
export async function generateWithClaude(
  scopeJson: string,
  question: string | undefined,
  assembler: ScreenAssembler,
  onBlock: (block: GeneratedBlock) => void,
  onReject: (reason: string) => void,
): Promise<ClaudeResult> {
  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userMessage(scopeJson, question) }];
  const result: ClaudeResult = { accepted: 0, rejected: 0, input_tokens: 0, output_tokens: 0, stop: "" };

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT },
      // tools render before system, so this breakpoint caches both (they never change per request).
      tools: [EMIT_BLOCK_TOOL as unknown as Anthropic.Beta.BetaTool],
      tool_choice: { type: "auto" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages,
    });

    const buffers = new Map<number, { id: string; json: string }>();
    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];

    for await (const ev of stream) {
      if (ev.type === "content_block_start" && ev.content_block.type === "tool_use") {
        buffers.set(ev.index, { id: ev.content_block.id, json: "" });
      } else if (ev.type === "content_block_delta" && ev.delta.type === "input_json_delta") {
        const b = buffers.get(ev.index);
        if (b) b.json += ev.delta.partial_json;
      } else if (ev.type === "content_block_stop") {
        const b = buffers.get(ev.index);
        if (!b) continue;
        buffers.delete(ev.index);
        let input: unknown;
        try {
          input = JSON.parse(b.json); // strict parse: the SDK's tolerant parser can silently truncate
        } catch {
          result.rejected++;
          onReject("invalid JSON in emit_block");
          toolResults.push({ type: "tool_result", tool_use_id: b.id, is_error: true, content: "Invalid JSON. Re-emit the block." });
          continue;
        }
        const verdict = assembler.accept((input as { block?: unknown })?.block);
        if (verdict.ok) {
          result.accepted++;
          onBlock(verdict.block);
          toolResults.push({ type: "tool_result", tool_use_id: b.id, content: "placed" });
        } else {
          result.rejected++;
          onReject(verdict.reason);
          toolResults.push({ type: "tool_result", tool_use_id: b.id, is_error: true, content: `Rejected: ${verdict.reason}` });
        }
      }
    }

    const msg = await stream.finalMessage();
    result.input_tokens += msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0) + (msg.usage.cache_creation_input_tokens ?? 0);
    result.output_tokens += msg.usage.output_tokens;
    result.stop = msg.stop_reason ?? "";

    // A truncated or refused turn may have cut a tool call short: don't continue it.
    if (msg.stop_reason !== "tool_use" || toolResults.length === 0) break;
    // Continue only when there is something to fix or the model stopped early (e.g. one block per turn).
    const anyRejected = toolResults.some((t) => t.is_error);
    const minBlocks = question ? 1 : 3;
    if (assembler.blocks.length >= 6 || (!anyRejected && !assembler.missingNarrative() && assembler.blocks.length >= minBlocks)) break;

    messages.push({ role: "assistant", content: msg.content });
    messages.push({
      role: "user",
      content: [...toolResults, { type: "text", text: "Continue the screen, or stop if it is complete." }],
    });
  }
  return result;
}
