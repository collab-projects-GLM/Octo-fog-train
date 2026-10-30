/**
 * The contract between React Native (`VrmView`) and the WebView page (`viewer.ts`). Both ends
 * import it, so a command can't be sent that the page doesn't understand.
 */

/** "body" fits the whole T-pose width; "height" fits the height only (the map puck). */
export type VrmFit = "body" | "height";

/**
 * Commands React Native sends to the page, as `window.__vrmReceive(command)`. The model goes
 * over as `begin`, `chunk`... `end`, because the WebView can't `fetch` a `file://` asset.
 */
export type HostCommand =
  | { type: "begin"; total: number }
  | { type: "chunk"; data: string }
  | { type: "end" }
  /** Face `yaw` radians (0 faces the camera, π shows the back) and walk or stand idle. */
  | { type: "pose"; yaw: number; moving: boolean }
  | { type: "fit"; fit: VrmFit }
  /** Stop or resume drawing frames, for when the avatar can't be seen. */
  | { type: "paused"; paused: boolean };

/** Messages the page posts back (`window.ReactNativeWebView.postMessage`, JSON-encoded). */
export type ViewerMessage =
  | { type: "ready" }
  | { type: "progress"; progress: number }
  | { type: "loaded" }
  | { type: "error"; message: string };
