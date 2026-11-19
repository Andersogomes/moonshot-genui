import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View, type ViewStyle, type TextStyle } from "react-native";
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";
import type { Confidence } from "@moonshot/genui-core";
import { useTheme } from "../theme";

/* gen/atom/icon — 24 grid, 2px stroke, round caps. Spark is the only filled icon. */
export type IconName = "spark" | "arrow-up" | "plus" | "chevron-right" | "check" | "lock" | "regenerate" | "info" | "people" | "home" | "chart" | "credits";

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  const c = color ?? (name === "spark" ? t.c.sparkAccent : t.c.fgPrimary);
  const s = { stroke: c, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === "spark" && <Path d="M12 2c.6 4.8 2.6 7.4 8 8.6v.8c-5.4 1.2-7.4 3.8-8 8.6h-.8c-.6-4.8-2.6-7.4-8-8.6v-.8c5.4-1.2 7.4-3.8 8-8.6z" fill={c} />}
      {name === "arrow-up" && <><Path d="M12 19V5" {...s} /><Polyline points="6 11 12 5 18 11" {...s} /></>}
      {name === "plus" && <Path d="M12 5v14M5 12h14" {...s} />}
      {name === "chevron-right" && <Polyline points="9 6 15 12 9 18" {...s} />}
      {name === "check" && <Polyline points="5 12.5 10 17.5 19 7" {...s} />}
      {name === "lock" && <><Rect x="5" y="11" width="14" height="9" rx="2" {...s} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" {...s} /></>}
      {name === "regenerate" && <><Path d="M20 12a8 8 0 1 1-2.3-5.7" {...s} /><Polyline points="20 4 20 9 15 9" {...s} /></>}
      {name === "info" && <><Circle cx="12" cy="12" r="9" {...s} /><Path d="M12 11v5M12 8h.01" {...s} /></>}
      {name === "people" && <><Circle cx="9" cy="8" r="3.5" {...s} /><Path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c1.9.8 3 2.9 3 6" {...s} /></>}
      {name === "home" && <><Path d="M4 11l8-7 8 7v9H4z" {...s} /><Path d="M10 20v-5h4v5" {...s} /></>}
      {name === "chart" && <Path d="M5 20V12M12 20V5M19 20v-9M3 20h18" {...s} />}
      {name === "credits" && <><Circle cx="12" cy="12" r="9" {...s} /><Path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5" {...s} /></>}
    </Svg>
  );
}

/* gen/atom/button — Primary ink, Generate pink + spark (AI actions only), Secondary, Ghost. 48 tall, 44 hit area. */
export function Button({ kind = "Primary", label, onPress, icon, compact, disabled }: { kind?: "Primary" | "Generate" | "Secondary" | "Ghost"; label: string; onPress?: () => void; icon?: IconName; compact?: boolean; disabled?: boolean }) {
  const t = useTheme();
  const bg = { Primary: t.c.bgInverse, Generate: t.c.sparkAction, Secondary: t.c.bgSurface, Ghost: "transparent" }[kind];
  const fg = { Primary: t.c.fgOnInverse, Generate: t.c.sparkOn, Secondary: t.c.fgPrimary, Ghost: t.c.humanAccent }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={compact ? 8 : 0}
      style={({ pressed }) => ({
        minHeight: compact ? 32 : 48,
        paddingHorizontal: compact ? (kind === "Ghost" ? 4 : 12) : 20,
        borderRadius: t.radius.full,
        backgroundColor: bg,
        borderWidth: kind === "Secondary" ? 1 : 0,
        borderColor: t.c.lineStrong,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {kind === "Generate" && <Icon name="spark" size={16} color={fg} />}
      {icon && <Icon name={icon} size={16} color={fg} />}
      <Text style={[compact ? t.type.label : t.type.button, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/* gen/atom/chip — Tone says where information came from: AI (spark) / Human / status. */
export type ChipTone = "AI" | "Human" | "Positive" | "Caution" | "Critical" | "Neutral";
export function Chip({ tone, label }: { tone: ChipTone; label: string }) {
  const t = useTheme();
  const map: Record<ChipTone, [string, string]> = {
    AI: [t.c.sparkTint, t.c.sparkText],
    Human: [t.c.humanTint, t.c.humanAccent],
    Positive: [t.c.positiveTint, t.c.positiveFg],
    Caution: [t.c.cautionTint, t.c.cautionFg],
    Critical: [t.c.criticalTint, t.c.criticalFg],
    Neutral: [t.c.bgSunken, t.c.fgSecondary],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 4, backgroundColor: bg, borderRadius: t.radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
      {tone === "AI" && <Icon name="spark" size={12} color={t.c.sparkAccent} />}
      <Text style={[t.type.caption, { color: fg }]}>{label}</Text>
    </View>
  );
}

/* gen/atom/confidence — three bars. */
export function ConfidenceBars({ level }: { level: Confidence }) {
  const t = useTheme();
  const n = level === "High" ? 3 : level === "Medium" ? 2 : 1;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }} accessibilityLabel={`${level} confidence`}>
      {[6, 9, 12].map((h, i) => (
        <View key={h} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: i < n ? t.c.sparkAccent : t.c.vizMuted }} />
      ))}
    </View>
  );
}

/* gen/atom/delta — arrow + sign, not colour alone. */
export function Delta({ direction, value, style }: { direction: "Up" | "Down" | "Flat"; value: string; style?: TextStyle }) {
  const t = useTheme();
  const color = direction === "Up" ? t.c.positiveFg : direction === "Down" ? t.c.criticalFg : t.c.fgSecondary;
  const glyph = direction === "Up" ? "▲" : direction === "Down" ? "▼" : "–";
  return <Text style={[t.type.label, { color }, style]}>{glyph} {value}</Text>;
}

/* gen/atom/bar — 8px bar on a track. */
export function Bar({ value, max = 100, tone = "Primary" }: { value: number; max?: number; tone?: "Primary" | "Secondary" | "Caution" | "Critical" }) {
  const t = useTheme();
  const color = { Primary: t.c.vizPrimary, Secondary: t.c.vizSecondary, Caution: t.c.cautionFg, Critical: t.c.criticalFg }[tone];
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.c.vizMuted, overflow: "hidden", flex: 1 }}>
      <View style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

/* gen/atom/sparkline — 6–12 points, no axes, last point marked. */
export function Sparkline({ values, width = 120, height = 32, tone = "Primary" }: { values: number[]; width?: number; height?: number; tone?: "Primary" | "AI" }) {
  const t = useTheme();
  const color = tone === "AI" ? t.c.sparkAccent : t.c.vizPrimary;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [4 + (i * (width - 8)) / (values.length - 1), height - 4 - ((v - min) / span) * (height - 8)] as const);
  const last = pts[pts.length - 1]!;
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts.map((p) => p.join(",")).join(" ")} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={4} fill={color} />
    </Svg>
  );
}

/* gen/atom/skeleton — pink-tinted so the wait reads as generation, not loading. */
export function Skeleton({ shape = "Line", width = "100%" }: { shape?: "Line" | "Title" | "Block"; width?: ViewStyle["width"] }) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const h = shape === "Title" ? 28 : shape === "Block" ? 96 : 14;
  return <Animated.View style={{ width, height: h, borderRadius: shape === "Block" ? t.radius.md : 7, backgroundColor: t.c.sparkTint, opacity: pulse }} />;
}

/* gen/atom/avatar — humans only; AI never gets an avatar, it gets the spark. */
export function Avatar({ name, size = "M" }: { name: string; size?: "L" | "M" | "S" }) {
  const t = useTheme();
  const px = { L: 72, M: 36, S: 24 }[size];
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <View style={{ width: px, height: px, borderRadius: px / 2, backgroundColor: t.c.humanTint, alignItems: "center", justifyContent: "center" }} accessibilityLabel={name}>
      <Text style={[size === "S" ? t.type.caption : t.type.label, { color: t.c.humanAccent, fontSize: px * 0.36 }]}>{initials}</Text>
    </View>
  );
}

/* gen/atom/switch — 44 × 26, always paired with a label stating the visibility. */
export function Switch({ on, onChange, label }: { on: boolean; onChange?: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={() => onChange?.(!on)} hitSlop={9} style={{ alignItems: "center", gap: 4 }}>
      <View style={{ width: 44, height: 26, borderRadius: 13, padding: 3, backgroundColor: on ? t.c.humanAccent : t.c.lineStrong, alignItems: on ? "flex-end" : "flex-start" }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.c.bgSurface }} />
      </View>
      <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, edge }: { children: React.ReactNode; style?: ViewStyle; edge?: string }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.c.bgSurface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.lineDefault, padding: t.space.lg, gap: t.space.md, overflow: "hidden" }, edge ? { borderLeftWidth: 4, borderLeftColor: edge } : null, style]}>
      {children}
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.c.lineDefault }} />;
}
