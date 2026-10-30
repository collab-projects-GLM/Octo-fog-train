/**
 * Small pure helpers used by both the WebView page and React Native. Keep this file free of
 * imports: it is bundled into the page by `bun run build:viewer`.
 */

/**
 * Space around the model, as a multiple of its fitted size. The page frames the avatar with it
 * and the map puck scales its box by the inverse, so the two must share it.
 */
export const FRAME_PADDING = 1.1;

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
