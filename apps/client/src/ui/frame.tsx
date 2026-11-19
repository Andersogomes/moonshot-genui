import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AppBar as AppBarModel } from "@moonshot/genui-core";
import { useTheme } from "../theme";
import { Avatar, Icon, type IconName } from "./atoms";
import { ComposerField, Suggestion } from "./molecules";

export type Tab = "Home" | "Contribute" | "People" | "Company";
const TABS: { id: Tab; icon: IconName }[] = [
  { id: "Home", icon: "home" },
  { id: "Contribute", icon: "plus" },
  { id: "People", icon: "people" },
  { id: "Company", icon: "chart" },
];

function Credits({ n }: { n: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: t.radius.full, borderWidth: 1, borderColor: t.c.lineDefault, backgroundColor: t.c.bgSurface, paddingHorizontal: 10, height: 32 }} accessibilityLabel={`${n} credits`}>
      <Icon name="credits" size={16} color={t.c.humanAccent} />
      <Text style={[t.type.label, { color: t.c.fgPrimary }]}>{n}</Text>
    </View>
  );
}

/* gen/frame/app-bar — context, title, credit balance (hidden for Leader). */
export function AppBar({ bar, fallbackTitle, onBack }: { bar: AppBarModel | null; fallbackTitle: string; onBack?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.c.bgCanvas, borderBottomWidth: 1, borderColor: t.c.lineDefault }}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={12} style={{ transform: [{ scaleX: -1 }] }}>
          <Icon name="chevron-right" size={22} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[t.type.titleL, { color: t.c.fgPrimary }]} accessibilityRole="header">{bar?.title ?? fallbackTitle}</Text>
        {!!bar?.subtitle && <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{bar.subtitle}</Text>}
      </View>
      {bar?.credits != null && <Credits n={bar.credits} />}
    </View>
  );
}

/* gen/frame/tab-bar — mobile primary navigation. Company only for leaders. */
export function TabBar({ active, onChange, leader }: { active: Tab; onChange: (t: Tab) => void; leader: boolean }) {
  const t = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: t.c.bgSurface, borderTopWidth: 1, borderColor: t.c.lineDefault, paddingBottom: 6 }}>
      {TABS.filter((x) => leader || x.id !== "Company").map((x) => {
        const on = x.id === active;
        return (
          <Pressable key={x.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(x.id)} style={{ flex: 1, alignItems: "center", paddingTop: 10, gap: 4, minHeight: 56 }}>
            <Icon name={x.icon} size={22} color={on ? t.c.humanAccent : t.c.fgTertiary} />
            <Text style={[t.type.caption, { color: on ? t.c.humanAccent : t.c.fgTertiary }]}>{x.id}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* gen/frame/sidebar — desktop navigation (264px). The model never generates sidebar content. */
export function Sidebar({ active, onChange, leader, name, company, credits, children }: { active: Tab; onChange: (t: Tab) => void; leader: boolean; name: string; company: string; credits: number | null; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ width: 264, backgroundColor: t.c.bgSurface, borderRightWidth: 1, borderColor: t.c.lineDefault, padding: 24, gap: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="spark" size={20} />
        <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>Leadership Tools</Text>
      </View>
      <View accessibilityRole="tablist" style={{ gap: 4 }}>
        {TABS.filter((x) => leader || x.id !== "Company").map((x) => {
          const on = x.id === active;
          return (
            <Pressable key={x.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(x.id)} style={(state) => ({ flexDirection: "row", alignItems: "center", gap: 12, height: 44, paddingHorizontal: 12, borderRadius: t.radius.sm, backgroundColor: on ? t.c.humanTint : (state as { hovered?: boolean }).hovered ? t.c.bgSunken : "transparent" })}>
              <Icon name={x.icon} size={20} color={on ? t.c.humanAccent : t.c.fgSecondary} />
              <Text style={[t.type.titleM, { color: on ? t.c.humanAccent : t.c.fgSecondary }]}>{x.id}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      {children}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderColor: t.c.lineDefault, paddingTop: 16 }}>
        <Avatar name={name} />
        <View style={{ flex: 1 }}>
          <Text style={[t.type.label, { color: t.c.fgPrimary }]}>{name}</Text>
          <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{company}</Text>
        </View>
        {credits != null && <Credits n={credits} />}
      </View>
    </View>
  );
}

/* gen/frame/composer-dock — pinned above the tab bar; answers come back as insight blocks. */
export function ComposerDock({ placeholder, suggestions, onAsk, busy }: { placeholder: string; suggestions: string[]; onAsk: (q: string) => void; busy?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 10, backgroundColor: t.c.bgCanvas, borderTopWidth: 1, borderColor: t.c.lineDefault }}>
      {suggestions.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {suggestions.slice(0, 2).map((s) => <Suggestion key={s} text={s} onPress={onAsk} />)}
        </View>
      )}
      <ComposerField placeholder={placeholder} onSubmit={onAsk} busy={busy} />
    </View>
  );
}
