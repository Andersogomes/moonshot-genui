import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { Confidence } from "@moonshot/genui-core";
import { useTheme } from "../theme";
import { Avatar, Bar, ConfidenceBars, Delta, Icon, Sparkline, Switch } from "./atoms";

/* gen/molecule/provenance — mandatory under every generated block. "How?" lists the sources. */
export function Provenance({ summary, confidence, sources, describe }: { summary: string; confidence: Confidence; sources: string[]; describe?: (id: string) => string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="spark" size={12} />
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{summary}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <ConfidenceBars level={confidence} />
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{confidence} confidence</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="How was this generated?" onPress={() => setOpen(true)} hitSlop={12}>
        <Text style={[t.type.caption, { color: t.c.humanAccent, textDecorationLine: "underline" }]}>How?</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(15,13,36,0.5)", justifyContent: "flex-end", alignItems: "center" }}>
          <Pressable style={{ width: "100%", maxWidth: 520, backgroundColor: t.c.bgSurface, borderTopLeftRadius: t.radius.lg, borderTopRightRadius: t.radius.lg, padding: t.space.lg, gap: t.space.sm }}>
            <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>How this was generated</Text>
            <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>{summary}. {confidence} confidence: {confidence === "High" ? "5 or more sources agree." : confidence === "Medium" ? "2 to 4 sources agree." : "a single source, or sources disagree."}</Text>
            {sources.map((id) => (
              <View key={id} style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 6, borderTopWidth: 1, borderColor: t.c.lineDefault }}>
                <Icon name="chevron-right" size={14} color={t.c.fgTertiary} />
                <Text style={[t.type.bodyS, { color: t.c.fgPrimary, flex: 1 }]}>{describe?.(id) ?? id}</Text>
              </View>
            ))}
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" style={{ alignSelf: "flex-end", padding: 12 }}>
              <Text style={[t.type.button, { color: t.c.humanAccent }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* gen/molecule/metric — XL for the one number that matters most on a screen. */
export function Metric({ label, value, delta, series, size = "XL" }: { label: string; value: string; delta?: { direction: "Up" | "Down" | "Flat"; value: string }; series?: number[]; size?: "XL" | "M" }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={[size === "XL" ? t.type.metricXL : t.type.metricM, { color: t.c.fgPrimary }]}>{value}</Text>
        {delta && <Delta {...delta} />}
      </View>
      {series && size === "XL" && <Sparkline values={series} width={200} height={36} />}
    </View>
  );
}

/* gen/molecule/suggestion — tapping sends the question to the composer. */
export function Suggestion({ text, onPress }: { text: string; onPress?: (q: string) => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(text)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", minHeight: 40, paddingHorizontal: 14, borderRadius: t.radius.full, backgroundColor: t.c.bgSurface, borderWidth: 1, borderColor: t.c.lineDefault, opacity: pressed ? 0.8 : 1 })}>
      <Icon name="spark" size={12} />
      <Text style={[t.type.label, { color: t.c.fgPrimary }]}>{text}</Text>
    </Pressable>
  );
}

/* gen/molecule/feedback — rate or regenerate. Ratings feed what gets generated next. */
export function Feedback({ onRegenerate }: { onRegenerate?: () => void }) {
  const t = useTheme();
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  const opt = (v: "yes" | "no", label: string) => (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: vote === v }} onPress={() => setVote(v)} hitSlop={10}>
      <Text style={[t.type.label, { color: vote === v ? t.c.fgPrimary : t.c.humanAccent, textDecorationLine: vote === v ? "underline" : "none" }]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{vote ? "Thanks" : "Useful?"}</Text>
      {opt("yes", "Yes")}
      {opt("no", "No")}
      {onRegenerate && (
        <Pressable accessibilityRole="button" accessibilityLabel="Regenerate" onPress={onRegenerate} hitSlop={12}>
          <Icon name="regenerate" size={16} color={t.c.fgSecondary} />
        </Pressable>
      )}
    </View>
  );
}

/* gen/molecule/comparison-row — subject uses the Primary bar, benchmarks Secondary. */
export function ComparisonRow({ label, value, max, role, unit }: { label: string; value: number; max: number; role: "Subject" | "Benchmark"; unit?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessibilityLabel={`${label}: ${value} ${unit ?? ""}`}>
      <Text style={[role === "Subject" ? t.type.label : t.type.bodyS, { color: t.c.fgPrimary, width: 96 }]} numberOfLines={1}>{label}</Text>
      <Bar value={value} max={max} tone={role === "Subject" ? "Primary" : "Secondary"} />
      <Text style={[t.type.label, { color: t.c.fgPrimary, width: 32, textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

/* gen/molecule/data-row — human data: never a spark. */
export function DataRow({ title, subtitle, meta, visibility, onToggle }: { title: string; subtitle: string; meta: string; visibility: "Public" | "Private"; onToggle?: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: t.c.bgSurface, borderRadius: t.radius.md, padding: t.space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>{title}</Text>
        <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>{subtitle}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="people" size={12} color={t.c.fgTertiary} />
          <Text style={[t.type.caption, { color: t.c.fgTertiary }]}>{meta}</Text>
        </View>
      </View>
      <Switch on={visibility === "Public"} onChange={onToggle} label={visibility} />
    </View>
  );
}

/* gen/molecule/next-step — the model suggests, the person decides. Never auto-executes. */
export function NextStep({ text, initial = "Suggested" }: { text: string; initial?: "Suggested" | "Added" }) {
  const t = useTheme();
  const [state, setState] = useState(initial);
  const added = state === "Added";
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: added }} onPress={() => setState(added ? "Suggested" : "Added")} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: added ? 0 : 1.5, borderColor: t.c.lineStrong, backgroundColor: added ? t.c.humanAccent : "transparent", alignItems: "center", justifyContent: "center" }}>
        {added && <Icon name="check" size={14} color={t.c.fgOnInverse} />}
      </View>
      <Text style={[t.type.body, { color: t.c.fgPrimary, flex: 1 }]}>{text}</Text>
      <Text style={[t.type.label, { color: added ? t.c.positiveFg : t.c.humanAccent }]}>{added ? "Added" : "Add to 1:1"}</Text>
    </Pressable>
  );
}

/* gen/molecule/quote — verbatim human words, always attributed, never pink. */
export function Quote({ text, author, role }: { text: string; author: string; role: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={[t.type.narrativeQuote, { color: t.c.fgPrimary }]}>“{text}”</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Avatar name={author} size="S" />
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{author}{role ? `, ${role}` : ""}</Text>
      </View>
    </View>
  );
}

/* gen/molecule/status-line — present tense, names the real data. */
export function StatusLine({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityLiveRegion="polite">
      <Icon name="spark" size={14} />
      <Text style={[t.type.bodyS, { color: t.c.sparkText }]}>{text}</Text>
    </View>
  );
}

/* gen/molecule/composer-field — ink send button appears only when there is text. */
export function ComposerField({ placeholder, onSubmit, busy }: { placeholder: string; onSubmit: (q: string) => void; busy?: boolean }) {
  const t = useTheme();
  const [q, setQ] = useState("");
  const send = () => {
    if (!q.trim() || busy) return;
    onSubmit(q.trim());
    setQ("");
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 52, borderRadius: t.radius.full, borderWidth: 1, borderColor: t.c.lineStrong, backgroundColor: t.c.bgSurface, paddingLeft: 18, paddingRight: 6 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        onSubmitEditing={send}
        placeholder={placeholder}
        placeholderTextColor={t.c.fgTertiary}
        returnKeyType="send"
        accessibilityLabel={placeholder}
        style={[t.type.body, { flex: 1, color: t.c.fgPrimary, paddingVertical: 12, outlineStyle: "none" } as never]}
      />
      {q.trim().length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Send question" onPress={send} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.c.bgInverse, alignItems: "center", justifyContent: "center" }}>
          <Icon name="arrow-up" size={18} color={t.c.fgOnInverse} />
        </Pressable>
      )}
    </View>
  );
}
