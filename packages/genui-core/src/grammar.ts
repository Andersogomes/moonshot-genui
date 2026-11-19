import { Block, GeneratedBlock } from "./schema.ts";
import { LIMITS, type ScopedData } from "./scope.ts";

/**
 * Screen order from the "Generation grammar" board:
 * narrative → risks (Critical first) → trends/comparisons (≤3) → evidence (≤1)
 * → human data (owner only) → next steps. Six generated blocks at most.
 *
 * Blocks stream in any order; `rank` is where a block sits on screen, so the
 * client can insert each one into its slot as soon as it arrives.
 */
export function rank(block: Block): number {
  switch (block.type) {
    case "gen/insight/narrative":
      return 10;
    case "gen/state/not-enough-data":
      return 11;
    case "gen/insight/risk":
      return block.severity === "Critical" ? 20 : 21;
    case "gen/insight/trend":
    case "gen/insight/comparison":
    case "gen/insight/chart":
    case "gen/insight/team-summary":
      return 30;
    case "gen/insight/evidence":
      return 40;
    case "gen/state/locked":
      return 45;
    case "human/data-list":
      return 50;
    case "gen/insight/next-steps":
      return 60;
  }
}

/** Where a block goes on desktop (contract → layout.desktop.placement). */
export function desktopColumn(block: Block): "primary" | "secondary" {
  switch (block.type) {
    case "gen/insight/narrative":
    case "gen/insight/trend":
    case "gen/insight/chart":
    case "gen/insight/evidence":
    case "human/data-list":
    case "gen/state/not-enough-data":
      return "primary";
    case "gen/insight/risk":
      return block.severity === "Critical" ? "primary" : "secondary";
    default:
      return "secondary";
  }
}

const SLOT_LIMITS: Partial<Record<number, number>> = { 10: 1, 30: 3, 40: 1, 60: 1 };

export type Verdict = { ok: true; block: GeneratedBlock } | { ok: false; reason: string };

/**
 * Validates generated blocks one at a time against the contract, the limits and
 * the scope. The model is never trusted: a block that fails here is dropped and
 * reported, never shown.
 */
export class ScreenAssembler {
  private accepted: GeneratedBlock[] = [];
  constructor(private scope: ScopedData) {}

  get blocks(): readonly GeneratedBlock[] {
    return this.accepted;
  }

  accept(raw: unknown): Verdict {
    const parsed = GeneratedBlock.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, reason: `schema: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
    }
    const block = parsed.data;

    if (this.accepted.length >= LIMITS.max_generated_blocks) return { ok: false, reason: "limit: six generated blocks at most" };
    const r = rank(block);
    const limit = SLOT_LIMITS[r];
    if (limit !== undefined && this.accepted.filter((b) => rank(b) === r).length >= limit) {
      return { ok: false, reason: `limit: slot ${block.type} is full` };
    }

    // Every claim shows its sources — and only sources inside the scope.
    if ("provenance" in block) {
      const outside = block.provenance.source_ids.filter((id) => !this.scope.allowedSourceIds.has(id));
      if (outside.length) return { ok: false, reason: `scope: cites sources outside the scope (${outside.join(", ")})` };
    }

    if (block.type === "gen/insight/evidence") {
      // Quotes are human words: only public feedback in scope, verbatim, never edited.
      const src = this.scope.feedback.find((f) => f.id === block.quote.source_id);
      if (!src || src.visibility !== "public") return { ok: false, reason: "scope: quote is not public feedback in scope" };
      if (normalise(src.text) !== normalise(block.quote.text)) return { ok: false, reason: "evidence: quote was edited" };
    }

    if (block.type === "gen/state/locked" && this.scope.context !== "viewer") {
      return { ok: false, reason: "scope: locked insights only appear on viewer screens" };
    }
    if (block.type === "gen/state/locked" && !this.scope.locked.some((l) => l.title === block.title)) {
      return { ok: false, reason: "scope: locked insight is not one the server declared" };
    }

    if (block.type === "gen/insight/narrative") block.suggestions = block.suggestions.slice(0, LIMITS.max_suggestions);

    this.accepted.push(block);
    return { ok: true, block };
  }

  /** After the stream: the grammar requires a narrative first. */
  missingNarrative(): boolean {
    return !this.accepted.some((b) => b.type === "gen/insight/narrative");
  }
}

function normalise(s: string): string {
  return s.replace(/[“”"]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function sortBlocks<T extends Block>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => rank(a) - rank(b));
}

export { Block };
