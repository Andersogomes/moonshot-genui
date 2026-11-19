import { z } from "zod";

/**
 * Block schemas for `genui.screen/1.0`, from the Figma contract
 * (spec/contract.json → components). Every generated block carries
 * confidence + provenance; the grammar rejects blocks that don't.
 */

export const Confidence = z.enum(["High", "Medium", "Low"]);
export type Confidence = z.infer<typeof Confidence>;

export const Context = z.enum(["owner", "viewer", "leader"]);
export type Context = z.infer<typeof Context>;

/** "From 14 entries, 3 people" + the ids of the records it was generated from. */
export const Provenance = z.object({
  summary: z.string().min(3).max(80),
  source_ids: z.array(z.string()).min(1),
});

const generated = {
  confidence: Confidence,
  provenance: Provenance,
};

export const Delta = z.object({
  direction: z.enum(["Up", "Down", "Flat"]),
  value: z.string().max(8),
});

export const Metric = z.object({
  label: z.string().max(40),
  value: z.string().max(12),
  delta: Delta.optional(),
  series: z.array(z.number()).min(6).max(12).optional(),
});

export const NextStep = z.object({
  text: z.string().max(90),
  state: z.enum(["Suggested", "Added"]).default("Suggested"),
});

export const NarrativeBlock = z.object({
  type: z.literal("gen/insight/narrative"),
  kicker: z.string().max(60),
  headline: z.string().min(20).max(160),
  suggestions: z.array(z.string().max(60)).max(3).default([]),
  ...generated,
});

export const RiskBlock = z.object({
  type: z.literal("gen/insight/risk"),
  severity: z.enum(["Caution", "Critical"]),
  title: z.string().max(70),
  body: z.string().max(200),
  next_steps: z.array(NextStep).min(1).max(3),
  ...generated,
});

export const TrendBlock = z.object({
  type: z.literal("gen/insight/trend"),
  title: z.string().max(70),
  metric: Metric,
  body: z.string().max(200),
  ...generated,
});

export const ComparisonBlock = z.object({
  type: z.literal("gen/insight/comparison"),
  title: z.string().max(70),
  unit: z.string().max(12).optional(),
  rows: z
    .array(z.object({ label: z.string().max(30), value: z.number(), role: z.enum(["Subject", "Benchmark"]) }))
    .min(2)
    .max(5),
  body: z.string().max(160),
  ...generated,
});

export const EvidenceBlock = z.object({
  type: z.literal("gen/insight/evidence"),
  quote: z.object({
    text: z.string().max(240),
    author: z.string().max(40),
    role: z.string().max(40),
    source_id: z.string(),
  }),
  why: z.string().max(120),
  ...generated,
});

export const NextStepsBlock = z.object({
  type: z.literal("gen/insight/next-steps"),
  title: z.string().max(70),
  steps: z.array(NextStep).min(1).max(3),
  ...generated,
});

export const ChartBlock = z.object({
  type: z.literal("gen/insight/chart"),
  chart: z.enum(["Bars", "Line"]),
  title: z.string().max(70),
  series: z
    .array(
      z.object({
        name: z.string().max(30),
        values: z.array(z.number()).min(2).max(12),
        role: z.enum(["primary", "secondary", "projected", "reference"]),
      }),
    )
    .min(1)
    .max(3),
  x_labels: z.array(z.string().max(10)).min(2).max(12),
  body: z.string().max(160),
  ...generated,
});

export const TeamSummaryBlock = z.object({
  type: z.literal("gen/insight/team-summary"),
  team: z.string().max(30),
  meta: z.string().max(60),
  read: z.string().max(140),
  metrics: z.array(Metric).length(3),
  ...generated,
});

export const LockedBlock = z.object({
  type: z.literal("gen/state/locked"),
  title: z.string().max(70),
  price: z.number().int().positive(),
});

export const NotEnoughDataBlock = z.object({
  type: z.literal("gen/state/not-enough-data"),
  title: z.string().max(70),
  body: z.string().max(200),
  action: z.string().max(40),
});

/** Human data is rendered from records by the server, never by the model. */
export const HumanDataBlock = z.object({
  type: z.literal("human/data-list"),
  title: z.string(),
  meta: z.string(),
  rows: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      subtitle: z.string(),
      meta: z.string(),
      visibility: z.enum(["Public", "Private"]),
    }),
  ),
});

/** What the model may emit. */
export const GeneratedBlock = z.discriminatedUnion("type", [
  NarrativeBlock,
  RiskBlock,
  TrendBlock,
  ComparisonBlock,
  EvidenceBlock,
  NextStepsBlock,
  ChartBlock,
  TeamSummaryBlock,
  LockedBlock,
]);
export type GeneratedBlock = z.infer<typeof GeneratedBlock>;

/** What a screen may contain. */
export const Block = z.discriminatedUnion("type", [
  NarrativeBlock,
  RiskBlock,
  TrendBlock,
  ComparisonBlock,
  EvidenceBlock,
  NextStepsBlock,
  ChartBlock,
  TeamSummaryBlock,
  LockedBlock,
  NotEnoughDataBlock,
  HumanDataBlock,
]);
export type Block = z.infer<typeof Block>;
export type BlockOf<T extends Block["type"]> = Extract<Block, { type: T }>;

export const AppBar = z.object({
  context: Context,
  title: z.string(),
  subtitle: z.string(),
  credits: z.number().int().nullable(),
});
export type AppBar = z.infer<typeof AppBar>;

export const ScreenRequest = z.object({
  context: Context,
  /** Whose data the screen is about (owner/viewer) — ignored for leader. */
  subject_id: z.string().default("p-anderson"),
  /** Who is looking. */
  viewer_id: z.string().default("p-anderson"),
  question: z.string().max(300).optional(),
});
export type ScreenRequest = z.infer<typeof ScreenRequest>;

/** Server → client stream events (SSE `event:` name = `type`). */
export type StreamEvent =
  | { type: "start"; app_bar: AppBar; suggestions: string[]; generator: "claude" | "offline" }
  | { type: "status"; text: string }
  | { type: "block"; index: number; block: Block }
  | { type: "rejected"; reason: string }
  | { type: "done"; generated_at: string }
  | { type: "error"; message: string };
