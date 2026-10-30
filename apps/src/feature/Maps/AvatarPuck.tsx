import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { Animated, StyleSheet } from "react-native";
import VrmView, { type VrmViewHandle } from "@/feature/Avatar/VrmView";
import { FRAME_PADDING } from "@/feature/Avatar/viewer/shared";
import { avatarVisibility } from "./avatar-scale";

/** Size of the viewer box in dp. It is scaled down to the avatar's real on-screen size. */
const WIDTH = 110;
const HEIGHT = 170;
/**
 * The viewer leaves a little air under the feet (about (1 - MODEL_FILL) / 2 of the box, rounded
 * up); lift the box so the feet land on the point.
 */
const FEET_INSET = 0.05;
/** The share of the box height the model fills: the viewer pads its framing by FRAME_PADDING. */
const MODEL_FILL = 1 / FRAME_PADDING;
/** Scale about the feet, so growing or shrinking never moves them off the marker. */
const TRANSFORM_ORIGIN: (string | number)[] = ["50%", `${(1 - FEET_INSET) * 100}%`, 0];

export type AvatarPuckHandle = Pick<VrmViewHandle, "setPose"> & {
  /**
   * Stand the avatar's feet at (x, y), in dp from the top-left of the map view, and size her to
   * `heightDp` tall head to toe on screen. One call per frame, so only values that changed are
   * written. She fades out (and the viewer stops drawing) when `heightDp` is too small to see.
   */
  place: (x: number, y: number, heightDp: number) => void;
};

type AvatarPuckProps = {
  /** A `.vrm` asset (see metro.config.js). */
  model: number;
  ref?: Ref<AvatarPuckHandle>;
};

/**
 * @abstract The player's avatar as a map puck: a transparent WebView running the VRM viewer,
 * floated over the map and moved to the user's projected screen position. It is a screen-space
 * overlay, so Mapbox buildings can't hide it, unlike a puck drawn inside the map.
 *
 * It is driven imperatively (through its handle and Animated values) on purpose: the map moves
 * it every camera frame, which must not go through React renders.
 * @returns JSX
 */
export default function AvatarPuck({ model, ref }: AvatarPuckProps) {
  const viewer = useRef<VrmViewHandle>(null);
  // Parked off screen until the first position arrives.
  const [position] = useState(() => new Animated.ValueXY({ x: -1000, y: -1000 }));
  const [scale] = useState(() => new Animated.Value(0.01));
  const [opacity] = useState(() => new Animated.Value(0));
  // What was last written, so unchanged values aren't flushed again.
  const written = useRef({ x: NaN, y: NaN, scale: NaN, opacity: NaN });

  useImperativeHandle(
    ref,
    () => ({
      place(x, y, heightDp) {
        const last = written.current;

        const left = x - WIDTH / 2;
        const top = y - HEIGHT * (1 - FEET_INSET);
        if (left !== last.x || top !== last.y) {
          last.x = left;
          last.y = top;
          position.setValue({ x: left, y: top });
        }

        const nextScale = Math.max(heightDp, 1) / (HEIGHT * MODEL_FILL);
        if (nextScale !== last.scale) {
          last.scale = nextScale;
          scale.setValue(nextScale);
        }

        const visibility = avatarVisibility(heightDp);
        if (visibility !== last.opacity) {
          last.opacity = visibility;
          opacity.setValue(visibility);
        }
        // Nobody can see her at 0, so stop the viewer drawing 60 frames a second for nothing.
        viewer.current?.setPaused(visibility === 0);
      },
      setPose(yaw, moving) {
        viewer.current?.setPose(yaw, moving);
      },
    }),
    [position, scale, opacity],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.puck,
        {
          opacity,
          transformOrigin: TRANSFORM_ORIGIN,
          transform: [...position.getTranslateTransform(), { scale }],
        },
      ]}
    >
      <VrmView ref={viewer} model={model} fit="height" showStatus={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  puck: {
    position: "absolute",
    left: 0,
    top: 0,
    width: WIDTH,
    height: HEIGHT,
  },
});
