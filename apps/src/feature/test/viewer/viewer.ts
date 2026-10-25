/**
 * Browser-side VRM viewer. This file never runs in React Native: `bun run build:viewer`
 * bundles it (with three, @pixiv/three-vrm and @fanoalone/vrm-controller) into
 * `viewer-html.generated.ts`, which `VrmView` hands to react-native-webview. Inside the
 * WebView it is a normal browser page, so `loadVRM` runs unchanged.
 *
 * React Native sends the model as base64 chunks (`__vrmBegin` → `__vrmChunk`… → `__vrmEnd`),
 * because the WebView can't `fetch` a `file://` asset.
 */
import {
  channel,
  createChannelAnimator,
  createIdleAnimator,
  createProceduralAnimator,
  loadVRM,
  multiplySignals,
  sine,
  smooth,
  type VRMAvatar,
} from "@fanoalone/vrm-controller";
import { VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import type { ViewerMessage } from "./protocol";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
    __vrmBegin: (totalChunks: number) => void;
    __vrmChunk: (base64: string) => void;
    __vrmEnd: () => void;
    /** Face `yaw` radians (0 faces the camera, π shows the back) and walk or stand idle. */
    __vrmSetPose: (yaw: number, moving: boolean) => void;
    /** "body" fits the whole T-pose width; "height" fits the height only (the map puck). */
    __vrmSetFit: (fit: "body" | "height") => void;
    /** Stop drawing frames (the map puck hides the avatar when it is too small to see). */
    __vrmSetPaused: (paused: boolean) => void;
  }
}

/** Space around the model, as a multiple of its fitted size. */
const FRAME_PADDING = 1.1;
/** Cap for phones with 3x+ screens; the avatar doesn't need more. */
const MAX_PIXEL_RATIO = 2;
/** How fast the avatar turns toward its heading, per second. */
const TURN_RATE = 8;
/** Full gait cycles per second while walking (two steps each). */
const WALK_HZ = 1;
/** Upper-arm roll that brings the arms from the T-pose down to the sides. */
const ARM_DOWN_DEG = 80;

function post(message: ViewerMessage) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

window.addEventListener("error", (event) => post({ type: "error", message: event.message }));
window.addEventListener("unhandledrejection", (event) =>
  post({ type: "error", message: describe(event.reason) }),
);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

scene.add(new THREE.AmbientLight(0xffffff, 1));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(1, 1.5, 2);
scene.add(keyLight);

let renderer: THREE.WebGLRenderer | null = null;
try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  document.body.appendChild(renderer.domElement);
} catch (error) {
  post({ type: "error", message: `WebGL unavailable: ${describe(error)}` });
}

let avatar: VRMAvatar | null = null;

/**
 * Holds the avatar so the heading can be set here without touching the model's own rotation
 * (`rotateVRM0` turns VRM 0.x models by π on `avatar.scene`).
 */
const pivot = new THREE.Group();
scene.add(pivot);

let fit: "body" | "height" = "body";

/** Point the camera at the avatar so the whole body fits the viewport. */
function frameAvatar() {
  if (!avatar) return;

  // Measure facing the camera, so a turned avatar doesn't change the framing.
  const heading = pivot.rotation.y;
  pivot.rotation.y = 0;
  pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(avatar.scene);
  pivot.rotation.y = heading;
  pivot.updateMatrixWorld(true);

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
  const fitHeight = size.y / (2 * Math.tan(halfFov));
  // The arms set the width in a T-pose; once they hang down it is wasted space.
  const fitWidth = fit === "body" ? size.x / (2 * Math.tan(halfFov) * camera.aspect) : 0;
  const distance = Math.max(fitHeight, fitWidth) * FRAME_PADDING + size.z / 2;

  camera.near = distance / 100;
  camera.far = distance * 10;
  camera.position.set(center.x, center.y, center.z + distance);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

function resize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  frameAvatar();
}

window.addEventListener("resize", resize);
resize();

// Facing the camera by default; the map puck sets π to show its back, walking away up the map.
let targetYaw = 0;
let yaw = targetYaw;
/** 0 = standing idle, 1 = walking; the walk layer reads it and eases between the two. */
let walkTarget = 0;

/** Turn `current` toward `target` the short way round. */
function approachAngle(current: number, target: number, rate: number, delta: number) {
  const full = Math.PI * 2;
  const diff = ((((target - current + Math.PI) % full) + full) % full) - Math.PI;
  return current + diff * Math.min(1, rate * delta);
}

/** Idle (breathing, sway), arms lowered, and a gait cycle that fades in with `walkTarget`. */
function createAvatarAnimator(vrm: VRMAvatar["vrm"]) {
  const walk = smooth(() => walkTarget, { stiffness: 40, damping: 9 });
  // Positive x swings a hanging limb backward; the opposite arm moves with the opposite leg.
  const swing = (bone: Parameters<typeof channel>[0], phase: number, amp: number, offset = 0) =>
    channel(bone, "x", multiplySignals(sine({ hz: WALK_HZ, amp, phase, offset }), walk));

  return createProceduralAnimator(vrm, [
    createIdleAnimator(),
    createChannelAnimator([
      channel("leftUpperArm", "z", -ARM_DOWN_DEG),
      channel("rightUpperArm", "z", ARM_DOWN_DEG),
      swing("leftUpperLeg", 0, 20),
      swing("rightUpperLeg", 0.5, 20),
      swing("leftUpperArm", 0.5, 16),
      swing("rightUpperArm", 0, 16),
      // Knees only bend one way, so keep these waves above zero.
      swing("leftLowerLeg", 0.25, 11, 11),
      swing("rightLowerLeg", 0.75, 11, 11),
      channel("hips", "y", multiplySignals(sine({ hz: WALK_HZ, amp: 4 }), walk)),
    ]),
  ]);
}

let lastFrame = performance.now();
let paused = false;
let frameId: number | null = null;

function schedule() {
  if (frameId === null && !paused) frameId = requestAnimationFrame(tick);
}

function tick(now: number) {
  frameId = null;
  schedule();
  // Clamp so a stalled frame can't throw the spring bones.
  const delta = Math.min((now - lastFrame) / 1000, 0.1);
  yaw = approachAngle(yaw, targetYaw, TURN_RATE, delta);
  pivot.rotation.y = yaw;
  avatar?.update(delta);
  lastFrame = now;
  renderer?.render(scene, camera);
}
schedule();

async function show(model: Blob) {
  const url = URL.createObjectURL(model);
  try {
    avatar?.dispose();
    avatar = null;

    const loaded = await loadVRM(url, {
      scene: pivot,
      onProgress: ({ progress }) => post({ type: "progress", progress }),
    });

    // VRM 0.x faces -Z; turn it to face the camera. No-op for VRM 1.0.
    VRMUtils.rotateVRM0(loaded.vrm);
    // Skinned meshes can be culled by their rest-pose bounds while animating.
    loaded.scene.traverse((object) => {
      object.frustumCulled = false;
    });

    // Frame the rest pose first; the animator lowers the arms from the next frame on.
    avatar = loaded;
    frameAvatar();
    const animator = createAvatarAnimator(loaded.vrm);
    loaded.registerUpdate((delta) => animator.update(delta));
    post({ type: "loaded", metaVersion: loaded.vrm.meta.metaVersion });
  } catch (error) {
    post({ type: "error", message: describe(error) });
  } finally {
    URL.revokeObjectURL(url);
  }
}

let chunks: Uint8Array<ArrayBuffer>[] = [];
let expectedChunks = 0;

window.__vrmBegin = (totalChunks) => {
  chunks = [];
  expectedChunks = totalChunks;
};

window.__vrmChunk = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  chunks.push(bytes);
};

window.__vrmEnd = () => {
  if (chunks.length !== expectedChunks) {
    post({
      type: "error",
      message: `Model transfer incomplete: got ${chunks.length} of ${expectedChunks} chunks.`,
    });
    return;
  }
  const model = new Blob(chunks, { type: "model/gltf-binary" });
  chunks = [];
  void show(model);
};

window.__vrmSetPose = (yawRadians, moving) => {
  targetYaw = yawRadians;
  walkTarget = moving ? 1 : 0;
};

window.__vrmSetFit = (mode) => {
  fit = mode;
  frameAvatar();
};

window.__vrmSetPaused = (value) => {
  paused = value;
  if (paused) {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  } else {
    // Don't count the time spent paused as one long frame.
    lastFrame = performance.now();
    schedule();
  }
};

/** react-native-webview injects its bridge object; wait for it before announcing. */
function announceReady() {
  if (window.ReactNativeWebView) post({ type: "ready" });
  else setTimeout(announceReady, 50);
}
announceReady();
