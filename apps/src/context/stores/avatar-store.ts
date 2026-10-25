import { create } from "zustand";

type AvatarState = {
  /** True while the avatar is big enough on screen to see (see `avatarVisibility`). */
  shown: boolean;
  setShown: (shown: boolean) => void;
};

/**
 * Lets the avatar tracker tell the live marker whether the avatar is showing, without the map
 * screen holding that as state: only the marker re-renders when it flips.
 */
export const useAvatarStore = create<AvatarState>((set) => ({
  shown: true,
  // Returning the same state object skips the update, so calling this every frame is cheap.
  setShown: (shown) => set((state) => (state.shown === shown ? state : { shown })),
}));
