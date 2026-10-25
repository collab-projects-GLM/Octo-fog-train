/**
 * Messages the WebView viewer posts to React Native (`window.ReactNativeWebView.postMessage`,
 * JSON-encoded). React Native talks back by calling `window.__vrmBegin`, `__vrmChunk` and
 * `__vrmEnd` (see `viewer.ts`).
 */
export type ViewerMessage =
  | { type: "ready" }
  | { type: "progress"; progress: number }
  | { type: "loaded"; metaVersion: string }
  | { type: "error"; message: string };
