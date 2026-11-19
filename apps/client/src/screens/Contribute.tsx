import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTheme } from "../theme";
import { Button, Card, Chip, ConfidenceBars, Icon, Switch } from "../ui/atoms";

const KINDS = ["Lesson", "Job", "Course", "Event"] as const;
const PROJECTS = ["Checkout redesign", "Q3 pricing", "Something else"];

/**
 * "Add to your story" (Contribute screen). Human input first; the model asks
 * one question to make the entry useful and previews the effect. Nothing is
 * saved until the person confirms. Persistence needs sign-in (next milestone),
 * so for now entries stay on this device.
 */
export function Contribute({ desktop, onNotice }: { desktop: boolean; onNotice: (m: string) => void }) {
  const t = useTheme();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("Lesson");
  const [text, setText] = useState("");
  const [project, setProject] = useState<string | null>(null);
  const [isPublic, setPublic] = useState(false);
  const ready = text.trim().length >= 20;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bgCanvas }}>
      <View style={{ paddingHorizontal: desktop ? 40 : 16, paddingVertical: desktop ? 20 : 14, borderBottomWidth: 1, borderColor: t.c.lineDefault }}>
        <Text style={[t.type.titleL, { color: t.c.fgPrimary }]} accessibilityRole="header">Add to your story</Text>
        <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>Lessons, jobs, courses and events. You decide who sees each one.</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: desktop ? 40 : 16, gap: t.space.lg, maxWidth: 720 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }} accessibilityRole="radiogroup">
          {KINDS.map((k) => (
            <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: kind === k }} onPress={() => setKind(k)} style={{ paddingHorizontal: 16, height: 40, justifyContent: "center", borderRadius: t.radius.full, borderWidth: 1, borderColor: kind === k ? t.c.humanAccent : t.c.lineStrong, backgroundColor: kind === k ? t.c.humanTint : t.c.bgSurface }}>
              <Text style={[t.type.label, { color: kind === k ? t.c.humanAccent : t.c.fgPrimary }]}>{k}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>{kind === "Lesson" ? "What did you learn?" : `Describe the ${kind.toLowerCase()}`}</Text>
          <TextInput
            multiline
            value={text}
            onChangeText={setText}
            placeholder="When two stakeholders disagree, I now write both positions down before the meeting…"
            placeholderTextColor={t.c.fgTertiary}
            accessibilityLabel="Entry text"
            style={[t.type.body, { minHeight: 128, textAlignVertical: "top", color: t.c.fgPrimary, backgroundColor: t.c.bgSurface, borderWidth: 1, borderColor: t.c.lineStrong, borderRadius: t.radius.md, padding: 16 }]}
          />
        </View>

        {ready && (
          <Card style={{ borderColor: t.c.sparkTint }}>
            <Chip tone="AI" label="One question to make this useful" />
            <Text style={[t.type.narrativeBody, { color: t.c.fgPrimary }]}>Which project was this? Naming it lets your endorsers confirm it.</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {PROJECTS.map((p) => (
                <Pressable key={p} accessibilityRole="radio" accessibilityState={{ checked: project === p }} onPress={() => setProject(p)} style={{ paddingHorizontal: 14, height: 40, justifyContent: "center", borderRadius: t.radius.full, borderWidth: 1, borderColor: project === p ? t.c.humanAccent : t.c.lineDefault, backgroundColor: project === p ? t.c.humanTint : t.c.bgSurface }}>
                  <Text style={[t.type.label, { color: t.c.fgPrimary }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {ready && project && (
          <Card>
            <Chip tone="AI" label="Preview" />
            <Text style={[t.type.narrativeBody, { color: t.c.fgPrimary }]}>This would be your third example of aligning stakeholders.</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ConfidenceBars level="Medium" /><Text style={[t.type.caption, { color: t.c.fgSecondary }]}>Medium confidence</Text>
              <Icon name="chevron-right" size={14} color={t.c.fgTertiary} />
              <ConfidenceBars level="High" /><Text style={[t.type.caption, { color: t.c.fgSecondary }]}>High confidence</Text>
            </View>
            <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>Your "Working style" insight moves to high confidence{isPublic ? ", and viewers can unlock it." : ". Make it public to let viewers unlock it."}</Text>
          </Card>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: t.c.bgSurface, borderRadius: t.radius.md, padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[t.type.titleM, { color: t.c.fgPrimary }]}>Who can see this</Text>
            <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>{isPublic ? "Public: earns credits when people view it" : "Private: only you, earns nothing"}</Text>
          </View>
          <Switch on={isPublic} onChange={setPublic} label={isPublic ? "Public" : "Private"} />
        </View>

        <Button
          kind="Primary"
          label="Add to my story"
          disabled={!ready}
          onPress={() => {
            onNotice("Preview only: saving entries arrives with sign-in");
            setText("");
            setProject(null);
          }}
        />
      </ScrollView>
    </View>
  );
}
