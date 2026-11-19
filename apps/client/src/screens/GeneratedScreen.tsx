import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { desktopColumn, type Block, type ScreenRequest } from "@moonshot/genui-core";
import { useTheme } from "../theme";
import { useScreen, type ScreenState } from "../useScreen";
import { BlockView, GeneratingBlock, type BlockActions } from "../ui/blocks";
import { Button, Chip, Icon } from "../ui/atoms";
import { ComposerField, StatusLine } from "../ui/molecules";
import { AppBar, ComposerDock } from "../ui/frame";

interface Props {
  request: ScreenRequest;
  desktop: boolean;
  fallbackTitle: string;
  placeholder: string;
  onBack?: () => void;
  onNotice: (msg: string) => void;
  onAddEntry?: () => void;
}

export function GeneratedScreen({ request, desktop, fallbackTitle, placeholder, onBack, onNotice, onAddEntry }: Props) {
  const t = useTheme();
  const { screen, answer, ask, clearAnswer, regenerate, cancel } = useScreen(request);
  const actions: BlockActions = {
    ask,
    regenerate,
    toggleVisibility: (_id, v) => onNotice(v ? "Entry is now public" : "Entry is now private"),
    unlock: (title) => onNotice(`Access to "${title}" requested. The owner decides.`),
    stateAction: (label) => (label === "Add an entry" && onAddEntry ? onAddEntry() : onNotice("Endorsements arrive with sign-in")),
  };

  const answerPanel = answer && (
    <View style={{ gap: t.space.md, backgroundColor: t.c.sparkTint, borderRadius: t.radius.lg, padding: t.space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="spark" size={14} />
        <Text style={[t.type.label, { color: t.c.sparkText, flex: 1 }]} numberOfLines={2}>{answer.question}</Text>
        <Pressable onPress={clearAnswer} accessibilityRole="button" accessibilityLabel="Close answer" hitSlop={12}>
          <Text style={[t.type.label, { color: t.c.fgSecondary }]}>Close</Text>
        </Pressable>
      </View>
      <Blocks state={answer} actions={actions} onCancel={cancel} compactSkeleton />
    </View>
  );

  if (desktop) {
    const primary = screen.blocks.filter((b) => desktopColumn(b) === "primary");
    const secondary = screen.blocks.filter((b) => desktopColumn(b) === "secondary");
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bgCanvas }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 24, paddingHorizontal: 40, paddingVertical: 20, borderBottomWidth: 1, borderColor: t.c.lineDefault }}>
          {onBack && <Button kind="Ghost" compact label="Back" onPress={onBack} />}
          <View style={{ flex: 1 }}>
            <Text style={[t.type.titleL, { color: t.c.fgPrimary }]} accessibilityRole="header">{screen.appBar?.title ?? fallbackTitle}</Text>
            {!!screen.appBar?.subtitle && <Text style={[t.type.caption, { color: t.c.fgSecondary }]}>{screen.appBar.subtitle}</Text>}
          </View>
          <GeneratorChip state={screen} />
          <View style={{ width: 440 }}><ComposerField placeholder={placeholder} onSubmit={ask} busy={answer?.generating} /></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 40, gap: 32 }}>
          {answerPanel}
          <View style={{ flexDirection: "row", gap: 32, alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: t.space.lg, minWidth: 0 }}>
              <Blocks state={{ ...screen, blocks: primary }} actions={actions} onCancel={cancel} />
            </View>
            <View style={{ width: 400, gap: t.space.lg }}>
              {secondary.map((b, i) => <BlockView key={keyOf(b, i)} block={b} actions={actions} />)}
              {screen.generating && secondary.length === 0 && <GeneratingBlock />}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bgCanvas }}>
      <AppBar bar={screen.appBar} fallbackTitle={fallbackTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: t.space.lg, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignSelf: "flex-end" }}><GeneratorChip state={screen} /></View>
        {answerPanel}
        <Blocks state={screen} actions={actions} onCancel={cancel} />
      </ScrollView>
      <ComposerDock placeholder={placeholder} suggestions={[]} onAsk={ask} busy={answer?.generating} />
    </View>
  );
}

const keyOf = (b: Block, i: number) => `${b.type}-${"title" in b ? b.title : i}`;

function Blocks({ state, actions, onCancel, compactSkeleton }: { state: ScreenState; actions: BlockActions; onCancel: () => void; compactSkeleton?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.lg }} accessibilityState={{ busy: state.generating }}>
      {state.blocks.map((b, i) => <BlockView key={keyOf(b, i)} block={b} actions={actions} />)}
      {state.generating && (
        <View style={{ gap: t.space.md }}>
          {state.status && <StatusLine text={state.status} />}
          {!compactSkeleton && state.blocks.length < 2 && <GeneratingBlock />}
          {compactSkeleton && state.blocks.length === 0 && <GeneratingBlock />}
          {state.slow && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={[t.type.bodyS, { color: t.c.fgSecondary }]}>Still working</Text>
              <Button kind="Ghost" compact label="Cancel" onPress={onCancel} />
            </View>
          )}
        </View>
      )}
      {state.error && <Text style={[t.type.bodyS, { color: t.c.criticalFg }]}>Couldn't finish generating: {state.error}</Text>}
    </View>
  );
}

/** Tells the reader who wrote the screen: Claude, or the on-device grammar. */
function GeneratorChip({ state }: { state: ScreenState }) {
  if (!state.generator) return null;
  return <Chip tone={state.generator === "claude" ? "AI" : "Neutral"} label={state.generator === "claude" ? "Generated by Claude" : "Offline generator"} />;
}
