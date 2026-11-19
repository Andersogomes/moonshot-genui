import { createContext, useContext } from "react";
import type { TextStyle } from "react-native";
import { lightColors, darkColors, dimension, type ColorToken } from "@moonshot/genui-core";

export type Colors = Record<ColorToken, string>;
export interface Theme {
  dark: boolean;
  c: Colors;
  space: { xxs: number; xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  radius: { xs: number; sm: number; md: number; lg: number; full: number };
  type: Record<TypeStyle, TextStyle>;
}

// Font family names registered in App.tsx via @expo-google-fonts.
export const FONTS = {
  serif: "Newsreader_400Regular",
  serifMedium: "Newsreader_500Medium",
  serifItalic: "Newsreader_400Regular_Italic",
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemi: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
};

/** Figma text styles (GenUI/*). Newsreader is the model's voice; Plus Jakarta Sans is UI + human data. */
export type TypeStyle =
  | "narrativeDisplay" | "narrativeTitle" | "narrativeBody" | "narrativeQuote"
  | "metricXL" | "metricM" | "titleL" | "titleM" | "body" | "bodyS" | "label" | "caption" | "button";

const type: Record<TypeStyle, TextStyle> = {
  narrativeDisplay: { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 39, letterSpacing: -0.34 },
  narrativeTitle: { fontFamily: FONTS.serifMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.11 },
  narrativeBody: { fontFamily: FONTS.serif, fontSize: 18, lineHeight: 27 },
  narrativeQuote: { fontFamily: FONTS.serifItalic, fontSize: 20, lineHeight: 28 },
  metricXL: { fontFamily: FONTS.sansBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  metricM: { fontFamily: FONTS.sansBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.24 },
  titleL: { fontFamily: FONTS.sansBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.1 },
  titleM: { fontFamily: FONTS.sansSemi, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22 },
  bodyS: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FONTS.sansSemi, fontSize: 13, lineHeight: 16 },
  caption: { fontFamily: FONTS.sansMedium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: FONTS.sansSemi, fontSize: 15, lineHeight: 20 },
};

const space = { xxs: dimension.space2xs, xs: dimension.spaceXs, sm: dimension.spaceSm, md: dimension.spaceMd, lg: dimension.spaceLg, xl: dimension.spaceXl, xxl: dimension.space2xl };
const radius = { xs: dimension.radiusXs, sm: dimension.radiusSm, md: dimension.radiusMd, lg: dimension.radiusLg, full: dimension.radiusFull };

export function makeTheme(dark: boolean): Theme {
  return { dark, c: dark ? darkColors : { ...lightColors }, space, radius, type };
}

export const ThemeContext = createContext<Theme>(makeTheme(false));
export const useTheme = () => useContext(ThemeContext);
