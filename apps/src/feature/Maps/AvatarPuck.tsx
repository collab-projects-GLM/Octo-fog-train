import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { Animated, StyleSheet } from "react-native";
import VrmView, { type VrmViewHandle } from "../test/VrmView";
import { AVATAR_FADE_END_DP, AVATAR_FADE_START_DP } from "./avatar-scale";

/** Size of the viewer box in dp. It is scaled down to the avatar's real on-screen size. */
const WIDTH = 110;
const HEIGHT = 170;
/** The viewer leaves a little air under the feet; lift the box so the feet land on the point. */
const FEET_INSET = 0.05;
/** The share of the box height the model fills (the viewer pads its framing by 1.1). */
const MODEL_FILL = 1 / 1.1;
export type AvatarPuckHandle = {
  /** Stand the avatar's feet at (x, y), in dp from the top-left of the map view. */
  moveTo: (x: number, y: number) => void;
  /** Set how tall the avatar looks on screen, in dp, head to toe. */
  setHeight: (heightDp: number) => void;
  /** Heading (radians, 0 faces the camera, π shows the back) and idle / walking. */
  setPose: (yaw: number, moving: boolean) => void;
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
 * @returns JSX
 */
export default function AvatarPuck({ model, ref }: AvatarPuckProps) {
  const viewer = useRef<VrmViewHandle>(null);
  // Parked off screen until the first position arrives.
  const [position] = useState(() => new Animated.ValueXY({ x: -1000, y: -1000 }));
  const [scale] = useState(() => new Animated.Value(0.01));
  const [opacity] = useState(() => new Animated.Value(0));

  useImperativeHandle(ref, () => ({
    moveTo(x, y) {
      position.setValue({ x: x - WIDTH / 2, y: y - HEIGHT * (1 - FEET_INSET) });
    },
    setHeight(heightDp) {
      scale.setValue(Math.max(heightDp, 1) / (HEIGHT * MODEL_FILL));
      const visibility = Math.min(
        1,
        Math.max(0, (heightDp - AVATAR_FADE_START_DP) / (AVATAR_FADE_END_DP - AVATAR_FADE_START_DP)),
      );
      opacity.setValue(visibility);
      // Nobody can see her at 0, so stop the viewer drawing 60 frames a second for nothing.
      viewer.current?.setPaused(visibility === 0);
    },
    setPose(yaw, moving) {
      viewer.current?.setPose(yaw, moving);
    },
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.puck,
        {
          opacity,
          // Scale about the feet, so growing or shrinking never moves them off the marker.
          transformOrigin: ["50%", `${(1 - FEET_INSET) * 100}%`, 0],
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
