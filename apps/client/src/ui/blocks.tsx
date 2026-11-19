import React from "react";
import { Text, View } from "react-native";
import Svg, { Line, Polyline, Rect } from "react-native-svg";
import type { Block, BlockOf } from "@moonshot/genui-core";
import { useTheme } from "../theme";
import { Button, Card, Chip, Divider, Icon, Skeleton } from "./atoms";
import { ComparisonRow, DataRow, Feedback, Metric, NextStep, Provenance, Quote, Suggestion } from "./molecules";

export interface BlockActions {
  ask: (question: string) => void;
  regenerate: () => void;
  toggleVisibility?: (entryId: string, visible: boolean) => void;
  unlock?: (title: string) => void;
  stateAction?: (label: string) => void;
}

/** Source ids → a human label for the "How?" sheet (no content, just what kind of record). */
export function describeSource(id: string): string {
  if (id.startsWith("e-")) return `Entry ${id}`;
  if (id.startsWith("f-")) return `Feedback note ${id}`;
  if (id.startsWith("o-")) return `1:1 note ${id}`;
  if (id.startsWith("team:")) return `Team survey, ${id.slice(7)}`;
  if (id.startsWith("kr-")) return `Key result ${id}`;
  if (id.startsWith("hr-")) return `HR record ${id}`;
  if (id.startsWith("endorsements:")) return "Endorsements by month";
  return id;
}

export function BlockView({ block, actions }: { block: Block; actions: BlockActions }) {
  switch (block.type) {
    case "gen/insight/narrative": return <Narrative b={block} actions={actions} />;
    case "gen/insight/risk": return <Risk b={block} actions={actions} />;
    case "gen/insight/trend": return <Trend b={block} actions={actions} />;
    case "gen/insight/comparison": return <Comparison b={block} actions={actions} />;
    case "gen/insight/evidence": return <Evidence b={block} />;
    case "gen/insight/next-steps": return <NextSteps b={block} actions={actions} />;
    case "gen/insight/chart": return <Chart b={block} actions={actions} />;
    case "gen/insight/team-summary": return <TeamSummary b={block} actions={actions} />;
    case "gen/state/locked": return <Locked b={block} actions={actions} />;
    case "gen/state/not-enough-data": return <NotEnoughData b={block} actions={actions} />;
    case "human/data-list": return <HumanData b={block} actions={actions} />;
  }
}

function Foot({ b, actions }: { b: { confidence: "High" | "Medium" | "Low"; provenance: { summary: string; source_ids: string[] } }; actions: BlockActions }) {
  return (
    <View style={{ gap: 12 }}>
      <Divider />
      <Provenance summary={b.provenance.summary} confidence={b.confidence} sources={b.provenance.source_ids} describe={describeSource} />
      <Feedback onRegenerate={actions.regenerate} />
    </View>
  );
}

/* gen/insight/narrative — not a card: the page headline, one per screen, always first. */
function Narrative({ b, actions }: { b: BlockOf<"gen/insight/narrative">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md, paddingVertical: t.space.xs }} accessibilityRole="header">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="spark" size={14} />
        <Text style={[t.type.label, { color: t.c.sparkText }]}>{b.kicker}</Text>
      </View>
      <Text style={[t.type.narrativeDisplay, { color: t.c.fgPrimary }]}>{b.headline}</Text>
      <Provenance summary={b.provenance.summary} confidence={b.confidence} sources={b.provenance.source_ids} describe={describeSource} />
      {b.suggestions.length > 0 && (
        <View style={{ gap: 8 }}>
          {b.suggestions.map((s) => <Suggestion key={s} text={s} onPress={actions.ask} />)}
        </View>
      )}
    </View>
  );
}

/* gen/insight/risk — the edge colour carries severity; always ends with what to do. */
function Risk({ b, actions }: { b: BlockOf<"gen/insight/risk">; actions: BlockActions }) {
  const t = useTheme();
  const critical = b.severity === "Critical";
  return (
    <Card edge={critical ? t.c.criticalFg : t.c.cautionFg}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip tone="AI" label="Risk" />
        <Chip tone={critical ? "Critical" : "Caution"} label={critical ? "Act now" : "Watch"} />
      </View>
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <Text style={[t.type.narrativeBody, { color: t.c.fgSecondary }]}>{b.body}</Text>
      <View>{b.next_steps.map((s) => <NextStep key={s.text} text={s.text} initial={s.state} />)}</View>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

/* gen/insight/trend — leads with the number. */
function Trend({ b, actions }: { b: BlockOf<"gen/insight/trend">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <Card>
      <Chip tone="AI" label="Trend" />
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <Metric {...b.metric} />
      <Text style={[t.type.narrativeBody, { color: t.c.fgSecondary }]}>{b.body}</Text>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

/* gen/insight/comparison — leads with the bars; subject first. */
function Comparison({ b, actions }: { b: BlockOf<"gen/insight/comparison">; actions: BlockActions }) {
  const t = useTheme();
  const max = Math.max(...b.rows.map((r) => r.value)) * 1.1;
  return (
    <Card>
      <Chip tone="AI" label="Comparison" />
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <View style={{ gap: 10 }}>{b.rows.map((r) => <ComparisonRow key={r.label} {...r} max={max} unit={b.unit} />)}</View>
      <Text style={[t.type.narrativeBody, { color: t.c.fgSecondary }]}>{b.body}</Text>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

/* gen/insight/evidence — human quote (no spark) + one generated line on why it matters. */
function Evidence({ b }: { b: BlockOf<"gen/insight/evidence"> }) {
  const t = useTheme();
  return (
    <View style={{ borderLeftWidth: 3, borderLeftColor: t.c.humanAccent, paddingLeft: t.space.md, gap: t.space.sm }}>
      <Quote text={b.quote.text} author={b.quote.author} role={b.quote.role} />
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <View style={{ paddingTop: 3 }}><Icon name="spark" size={12} /></View>
        <Text style={[t.type.bodyS, { color: t.c.fgSecondary, flex: 1 }]}>{b.why}</Text>
      </View>
    </View>
  );
}

/* gen/insight/next-steps — human-confirmed actions. */
function NextSteps({ b, actions }: { b: BlockOf<"gen/insight/next-steps">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <Card>
      <Chip tone="AI" label="Next steps" />
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <View>{b.steps.map((s) => <NextStep key={s.text} text={s.text} initial={s.state} />)}</View>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

/* gen/insight/chart — Bars or Line; projected values dashed in spark. Never pie or radar. */
function Chart({ b, actions }: { b: BlockOf<"gen/insight/chart">; actions: BlockActions }) {
  const t = useTheme();
  const W = 320, H = 140, pad = 8;
  const all = b.series.flatMap((s) => s.values);
  const min = Math.min(0, ...all), max = Math.max(...all) * 1.1 || 1;
  const n = b.x_labels.length;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, n - 1);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const color = (role: string) => (role === "primary" ? t.c.vizPrimary : role === "projected" ? t.c.sparkAccent : role === "secondary" ? t.c.vizSecondary : t.c.lineStrong);
  return (
    <Card>
      <Chip tone="AI" label="Chart" />
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" accessibilityLabel={b.title}>
        {[0.25, 0.5, 0.75].map((f) => <Line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={t.c.lineDefault} strokeWidth={1} />)}
        {b.chart === "Line"
          ? b.series.map((s) => (
              <Polyline key={s.name} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={color(s.role)} strokeWidth={2.5} strokeDasharray={s.role === "projected" ? "6 4" : undefined} strokeLinecap="round" strokeLinejoin="round" />
            ))
          : b.series.map((s, si) => s.values.map((v, i) => {
              const bw = (W - 2 * pad) / n / (b.series.length + 0.6);
              return <Rect key={`${s.name}-${i}`} x={pad + (i * (W - 2 * pad)) / n + si * bw} y={y(v)} width={bw - 2} height={H - pad - y(v)} rx={3} fill={color(s.role)} />;
            }))}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {b.x_labels.map((l) => <Text key={l} style={[t.type.caption, { color: t.c.fgTertiary }]}>{l}</Text>)}
      </View>
      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        {b.series.map((s) => (
          <View key={s.name} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: color(s.role) }} />
            <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{s.role === "projected" ? "Projected" : s.name}</Text>
          </View>
        ))}
      </View>
      <Text style={[t.type.narrativeBody, { color: t.c.fgSecondary }]}>{b.body}</Text>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

function TeamSummary({ b, actions }: { b: BlockOf<"gen/insight/team-summary">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <Card>
      <Text style={[t.type.titleL, { color: t.c.fgPrimary }]}>{b.team}</Text>
      <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>{b.meta}</Text>
      <Text style={[t.type.narrativeBody, { color: t.c.fgPrimary }]}>{b.read}</Text>
      <View style={{ flexDirection: "row", gap: 16 }}>{b.metrics.map((m) => <View key={m.label} style={{ flex: 1 }}><Metric {...m} size="M" /></View>)}</View>
      <Foot b={b} actions={actions} />
    </Card>
  );
}

/* gen/state/locked — the title is visible; content and sources are not. */
function Locked({ b, actions }: { b: BlockOf<"gen/state/locked">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <Card style={{ backgroundColor: t.c.bgSunken, borderStyle: "dashed", borderColor: t.c.lineStrong }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="lock" size={16} color={t.c.fgSecondary} />
        <Text style={[t.type.label, { color: t.c.fgSecondary }]}>Locked insight</Text>
      </View>
      <Text style={[t.type.narrativeTitle, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <View style={{ gap: 8 }}>
        <Skeleton width="92%" />
        <Skeleton width="70%" />
      </View>
      <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>Generated from entries the owner keeps private. Unlocking asks them to share; nothing is shown until they agree.</Text>
      <Button kind="Secondary" icon="credits" label={`Request access · ${b.price} credits`} onPress={() => actions.unlock?.(b.title)} />
    </Card>
  );
}

function NotEnoughData({ b, actions }: { b: BlockOf<"gen/state/not-enough-data">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <Card>
      <Icon name="info" size={20} color={t.c.fgSecondary} />
      <Text style={[t.type.titleL, { color: t.c.fgPrimary }]}>{b.title}</Text>
      <Text style={[t.type.body, { color: t.c.fgSecondary }]}>{b.body}</Text>
      <Button kind="Primary" icon="plus" label={b.action} onPress={() => actions.stateAction?.(b.action)} />
    </Card>
  );
}

/* Human data (grammar step 5, owner only). Rendered from records, never by the model. */
function HumanData({ b, actions }: { b: BlockOf<"human/data-list">; actions: BlockActions }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>{b.title}</Text>
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{b.meta}</Text>
      </View>
      {b.rows.map((r) => <DataRow key={r.id} {...r} onToggle={(v) => actions.toggleVisibility?.(r.id, v)} />)}
    </View>
  );
}

/** gen/state/generating — holds the place of a block being written. */
export function GeneratingBlock() {
  const t = useTheme();
  return (
    <Card style={{ borderColor: t.c.sparkTint }}>
      <Skeleton shape="Title" width="60%" />
      <Skeleton width="100%" />
      <Skeleton width="85%" />
    </Card>
  );
}
