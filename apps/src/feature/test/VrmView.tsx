import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { ViewerMessage } from "./viewer/protocol";
import viewerHtml from "./viewer/viewer-html.generated";

/** Base64 characters per injected chunk. A multiple of 4, so each chunk decodes on its own. */
const CHUNK_SIZE = 512 * 1024;

// Module-level so the WebView never sees a new `source` object and reloads.
const SOURCE = { html: viewerHtml, baseUrl: "https://localhost" };

type Status =
  | { kind: "loading"; label: string }
  | { kind: "ready" }
  | { kind: "error"; message: string };

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
  fit?: "body" | "height";
  /** Show the loading / error text over the view. On by default. */
  showStatus?: boolean;
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @abstract Shows a VRM avatar on a transparent background. @fanoalone/vrm-controller needs a
 * real browser (Blob, createImageBitmap, WebGL2), so it runs inside a WebView: the viewer page
 * is built from `viewer/viewer.ts` by `bun run build:viewer`, and this component streams the
 * model into it as base64 chunks.
 * @returns JSX
 */
export default function VrmView({ model, ref, fit = "body", showStatus = true }: VrmViewProps) {
  const webView = useRef<WebView>(null);
  const sending = useRef(false);
  const pageReady = useRef(false);
  const pose = useRef({ yaw: 0, moving: false });
  const paused = useRef(false);
  const [status, setStatus] = useState<Status>({ kind: "loading", label: "Starting viewer…" });

  const run = (script: string) => webView.current?.injectJavaScript(`${script};true;`);
  const sendPose = () => run(`window.__vrmSetPose(${pose.current.yaw}, ${pose.current.moving})`);
  const sendPaused = () => run(`window.__vrmSetPaused(${paused.current})`);

  useImperativeHandle(ref, () => ({
    setPose(yaw, moving) {
      if (pose.current.yaw === yaw && pose.current.moving === moving) return;
      pose.current = { yaw, moving };
      if (pageReady.current) sendPose();
    },
    setPaused(value) {
      if (paused.current === value) return;
      paused.current = value;
      if (pageReady.current) sendPaused();
    },
  }));

  async function sendModel() {
    if (sending.current) return;
    sending.current = true;
    try {
      setStatus({ kind: "loading", label: "Reading model…" });
      const asset = await Asset.fromModule(model).downloadAsync();
      if (!asset.localUri) throw new Error("The model asset has no local file.");
      const base64 = await new File(asset.localUri).base64();

      const total = Math.ceil(base64.length / CHUNK_SIZE);
      setStatus({ kind: "loading", label: "Sending model…" });
      run(`window.__vrmBegin(${total})`);
      for (let i = 0; i < total; i++) {
        run(`window.__vrmChunk("${base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)}")`);
        // Yield so the JS thread isn't blocked for the whole transfer.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      run("window.__vrmEnd()");
      setStatus({ kind: "loading", label: "Loading model…" });
    } catch (error) {
      setStatus({ kind: "error", message: messageOf(error) });
    } finally {
      sending.current = false;
    }
  }

  function fail(message: string) {
    console.warn(`[VrmView] ${message}`);
    // Once the model is showing, a stray page error shouldn't replace it.
    setStatus((current) => (current.kind === "ready" ? current : { kind: "error", message }));
  }

  function onMessage(event: WebViewMessageEvent) {
    const message = JSON.parse(event.nativeEvent.data) as ViewerMessage;
    switch (message.type) {
      case "ready":
        pageReady.current = true;
        run(`window.__vrmSetFit("${fit}")`);
        sendPose();
        sendPaused();
        void sendModel();
        break;
      case "progress":
        setStatus({
          kind: "loading",
          label: `Loading model… ${Math.round(message.progress * 100)}%`,
        });
        break;
      case "loaded":
        setStatus({ kind: "ready" });
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
      {showStatus && status.kind !== "ready" && (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center gap-3 p-6"
        >
          {status.kind === "loading" ? (
            <>
              <ActivityIndicator />
              <Text className="text-center">{status.label}</Text>
            </>
          ) : (
            <Text className="text-center text-red-600">{status.message}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
