import { useColorScheme } from "nativewind";
import { MAP_THEMES, type MapTheme } from "./map-theme";

/** The map's colors for the app's current color scheme; changes only when the scheme does. */
export function useMapTheme(): MapTheme {
  const { colorScheme } = useColorScheme();
  return MAP_THEMES[colorScheme ?? "light"];
}
