import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { useCallback, useImperativeHandle, useRef, useState, type Ref } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { HostCommand, ViewerMessage, VrmFit } from "./viewer/protocol";
import { errorMessage } from "./viewer/shared";
import viewerHtml from "./viewer/viewer-html.generated";
import VrmStatusOverlay, { type VrmStatus } from "./VrmStatusOverlay";

/** Base64 characters per injected chunk. A multiple of 4, so each chunk decodes on its own. */
const CHUNK_SIZE = 512 * 1024;

// Module-level so the WebView never sees a new `source` object and reloads.
const SOURCE = { html: viewerHtml, baseUrl: "https://localhost" };

/** Imperative controls, so callers can update the pose often without re-rendering. */
export type VrmViewHandle = {
  /**
   * Turn the avatar and switch between idle and walking. `yaw` is in radians: 0 faces the
   * camera, π shows the back. Safe to call before the model has loaded.
   */
  setPose: (yaw: number, moving: boolean) => void;
  /** Stop or resume drawing frames, so a view nobody can see doesn't keep the GPU busy. */
  setPaused: (paused: boolean) => void;
};

type VrmViewProps = {
  /** A `require()`d / imported `.vrm` asset (see metro.config.js). */
  model: number;
  ref?: Ref<VrmViewHandle>;
  /** "body" fits the whole T-pose width, "height" fits the height only (small avatars). */
  fit?: VrmFit;
  /**
   * Show the loading / error text over the view. On by default. When off, the view keeps no
   * status state, so the load progress messages don't re-render it.
   */
  showStatus?: boolean;
};

/**
 * @abstract Shows a VRM avatar on a transparent background. @fanoalone/vrm-controller needs a
 * real browser (Blob, createImageBitmap, WebGL2), so it runs inside a WebView: the viewer page
 * is built from `viewer/viewer.ts` by `bun run build:viewer`, and this component streams the
 * model into it as base64 chunks.
 * @returns JSX
 */
export default function VrmView({
  model,
  ref,
  fit = "body",
  showStatus = true,
}: VrmViewProps) {
  const webView = useRef<WebView>(null);
  const sending = useRef(false);
  const pageReady = useRef(false);
  const loaded = useRef(false);
  const pose = useRef({ yaw: 0, moving: false });
  const paused = useRef(false);
  const [status, setStatus] = useState<VrmStatus>({
    kind: "loading",
    label: "Starting viewer…",
  });

  const report = (next: VrmStatus) => {
    if (showStatus) setStatus(next);
  };

  const send = useCallback((command: HostCommand) => {
    webView.current?.injectJavaScript(
      `window.__vrmReceive(${JSON.stringify(command)});true;`,
    );
  }, []);
  const sendPose = () => send({ type: "pose", ...pose.current });
  const sendPaused = () => send({ type: "paused", paused: paused.current });

  useImperativeHandle(
    ref,
    () => ({
      setPose(yaw, moving) {
        // The map hands over a new heading every camera frame; hundredths of a radian are
        // finer than the eye can see and keep the equality check below skipping bridge calls.
        const rounded = Math.round(yaw * 100) / 100;
        if (pose.current.yaw === rounded && pose.current.moving === moving) return;
        pose.current = { yaw: rounded, moving };
        if (pageReady.current) send({ type: "pose", yaw: rounded, moving });
      },
      setPaused(value) {
        if (paused.current === value) return;
        paused.current = value;
        if (pageReady.current) send({ type: "paused", paused: value });
      },
    }),
    [send],
  );

  async function sendModel() {
    if (sending.current) return;
    sending.current = true;
    try {
      report({ kind: "loading", label: "Reading model…" });
      const asset = await Asset.fromModule(model).downloadAsync();
      if (!asset.localUri) throw new Error("The model asset has no local file.");
      const base64 = await new File(asset.localUri).base64();

      const total = Math.ceil(base64.length / CHUNK_SIZE);
      report({ kind: "loading", label: "Sending model…" });
      send({ type: "begin", total });
      for (let i = 0; i < total; i++) {
        send({
          type: "chunk",
          data: base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        });
        // Yield so the JS thread isn't blocked for the whole transfer.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      send({ type: "end" });
      report({ kind: "loading", label: "Loading model…" });
    } catch (error) {
      report({ kind: "error", message: errorMessage(error) });
    } finally {
      sending.current = false;
    }
  }

  function fail(message: string) {
    console.warn(`[VrmView] ${message}`);
    // Once the model is showing, a stray page error shouldn't replace it.
    if (!loaded.current) report({ kind: "error", message });
  }

  function onMessage(event: WebViewMessageEvent) {
    const message = JSON.parse(event.nativeEvent.data) as ViewerMessage;
    switch (message.type) {
      case "ready":
        pageReady.current = true;
        send({ type: "fit", fit });
        sendPose();
        sendPaused();
        void sendModel();
        break;
      case "progress":
        report({
          kind: "loading",
          label: `Loading model… ${Math.round(message.progress * 100)}%`,
        });
        break;
      case "loaded":
        loaded.current = true;
        report({ kind: "ready" });
        break;
      case "error":
        fail(message.message);
        break;
    }
  }

  return (
    <View className="w-full flex-1">
      <WebView
        ref={webView}
        source={SOURCE}
        originWhitelist={["*"]}
        style={styles.webView}
        androidLayerType="hardware"
        scrollEnabled={false}
        overScrollMode="never"
        onMessage={onMessage}
        onError={(event) => fail(`WebView failed: ${event.nativeEvent.description}`)}
        onRenderProcessGone={() => fail("The WebView process was killed (likely out of memory).")}
      />
      {showStatus && <VrmStatusOverlay status={status} />}
    </View>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
