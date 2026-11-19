import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { sampleData } from "@moonshot/genui-core";
import { useTheme } from "../theme";
import { Avatar, Icon } from "../ui/atoms";

/** Directory of colleagues. Opening one shows their profile as a viewer (public data only). */
export function People({ me, onOpen, desktop }: { me: string; onOpen: (id: string) => void; desktop: boolean }) {
  const t = useTheme();
  const teams = Object.fromEntries(sampleData.teams.map((x) => [x.id, x.name]));
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bgCanvas }}>
      <View style={{ paddingHorizontal: desktop ? 40 : 16, paddingVertical: desktop ? 20 : 14, borderBottomWidth: 1, borderColor: t.c.lineDefault }}>
        <Text style={[t.type.titleL, { color: t.c.fgPrimary }]} accessibilityRole="header">People</Text>
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>Profiles show only what each person made public</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: desktop ? 40 : 16, gap: 10, maxWidth: 760 }}>
        {sampleData.people.filter((p) => p.id !== me).map((p) => (
          <Pressable key={p.id} accessibilityRole="button" onPress={() => onOpen(p.id)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: t.radius.md, backgroundColor: t.c.bgSurface, borderWidth: 1, borderColor: t.c.lineDefault, opacity: pressed ? 0.85 : 1 })}>
            <Avatar name={p.name} />
            <View style={{ flex: 1 }}>
              <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>{p.name}</Text>
              <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>{p.role} · {teams[p.team_id]}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.c.fgTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
