import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, useColorScheme, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader/400Regular";
import { Newsreader_500Medium } from "@expo-google-fonts/newsreader/500Medium";
import { Newsreader_400Regular_Italic } from "@expo-google-fonts/newsreader/400Regular_Italic";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { sampleData, type ScreenRequest } from "@moonshot/genui-core";
import { makeTheme, ThemeContext, useTheme } from "./src/theme";
import { Sidebar, TabBar, type Tab } from "./src/ui/frame";
import { GeneratedScreen } from "./src/screens/GeneratedScreen";
import { People } from "./src/screens/People";
import { Contribute } from "./src/screens/Contribute";

/** Desktop layout above 1024px (contract → layout.desktop.breakpoint). */
const BREAKPOINT = 1024;

/** Demo personas until sign-in lands: an employee and a leader from the sample cast. */
const PERSONAS = [
  { id: "p-anderson", label: "Anderson (employee)", leader: false },
  { id: "p-amelia", label: "Amelia (leader)", leader: true },
] as const;

export default function App() {
  const scheme = useColorScheme();
  const theme = useMemo(() => makeTheme(scheme === "dark"), [scheme]);
  const [fontsLoaded] = useFonts({ Newsreader_400Regular, Newsreader_500Medium, Newsreader_400Regular_Italic, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.c.bgCanvas }} />;
  return (
    <ThemeContext.Provider value={theme}>
      <SafeAreaProvider>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <Shell />
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}

function Shell() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= BREAKPOINT;
  const [persona, setPersona] = useState<(typeof PERSONAS)[number]>(PERSONAS[0]);
  const [tab, setTab] = useState<Tab>("Home");
  const [profile, setProfile] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const me = sampleData.people.find((p) => p.id === persona.id)!;

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(id);
  }, [notice]);

  const go = (next: Tab) => { setTab(next); setProfile(null); };
  useEffect(() => { if (!persona.leader && tab === "Company") go("Home"); }, [persona, tab]);

  const first = me.name.split(" ")[0];
  let content: React.ReactNode;
  if (tab === "People" && profile) {
    const subject = sampleData.people.find((p) => p.id === profile)!;
    const req: ScreenRequest = { context: "viewer", subject_id: profile, viewer_id: me.id };
    content = <GeneratedScreen key={`viewer-${profile}`} request={req} desktop={desktop} fallbackTitle={subject.name} placeholder={`Ask about ${subject.name.split(" ")[0]}'s public story`} onBack={() => setProfile(null)} onNotice={setNotice} />;
  } else if (tab === "People") {
    content = <People me={me.id} onOpen={setProfile} desktop={desktop} />;
  } else if (tab === "Contribute") {
    content = <Contribute desktop={desktop} onNotice={setNotice} />;
  } else if (tab === "Company") {
    content = <GeneratedScreen key="leader" request={{ context: "leader", subject_id: me.id, viewer_id: me.id }} desktop={desktop} fallbackTitle={sampleData.company.name} placeholder="Ask about your company" onNotice={setNotice} />;
  } else {
    content = <GeneratedScreen key={`owner-${me.id}`} request={{ context: "owner", subject_id: me.id, viewer_id: me.id }} desktop={desktop} fallbackTitle={`Hi, ${first}`} placeholder="Ask about your story" onNotice={setNotice} onAddEntry={() => go("Contribute")} />;
  }

  const personaSwitch = (
    <View style={{ gap: 6 }}>
      <Text style={[t.type.caption, { color: t.c.fgTertiary }]}>Demo persona</Text>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {PERSONAS.map((p) => (
          <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ checked: p.id === persona.id }} onPress={() => { setPersona(p); go("Home"); }} style={{ paddingHorizontal: 10, height: 32, justifyContent: "center", borderRadius: t.radius.full, borderWidth: 1, borderColor: p.id === persona.id ? t.c.humanAccent : t.c.lineDefault, backgroundColor: p.id === persona.id ? t.c.humanTint : t.c.bgSurface }}>
            <Text style={[t.type.caption, { color: t.c.fgPrimary }]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const toast = notice && (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: desktop ? 32 : 140, alignItems: "center" }}>
      <View accessibilityLiveRegion="polite" style={{ backgroundColor: t.c.bgInverse, paddingHorizontal: 18, paddingVertical: 12, borderRadius: t.radius.full, maxWidth: 420 }}>
        <Text style={[t.type.label, { color: t.c.fgOnInverse }]}>{notice}</Text>
      </View>
    </View>
  );

  if (desktop) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: t.c.bgCanvas, height: Platform.OS === "web" ? ("100vh" as never) : undefined }}>
        <Sidebar active={tab} onChange={go} leader={persona.leader} name={me.name} company={sampleData.company.name} credits={persona.leader ? null : me.credits}>
          {personaSwitch}
        </Sidebar>
        <View style={{ flex: 1 }}>{content}</View>
        {toast}
      </View>
    );
  }
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: t.c.bgCanvas }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>{personaSwitch}</View>
      <View style={{ flex: 1 }}>{content}</View>
      <TabBar active={tab} onChange={go} leader={persona.leader} />
      {toast}
    </SafeAreaView>
  );
}
