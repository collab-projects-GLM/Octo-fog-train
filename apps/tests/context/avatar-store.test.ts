import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAvatarStore } from "@/context/stores/avatar-store";

beforeEach(() => {
  useAvatarStore.setState({ shown: true });
});

describe("useAvatarStore", () => {
  it("starts with the avatar shown", () => {
    expect(useAvatarStore.getState().shown).toBe(true);
  });

  it("updates when the avatar is hidden and shown again", () => {
    useAvatarStore.getState().setShown(false);
    expect(useAvatarStore.getState().shown).toBe(false);
    useAvatarStore.getState().setShown(true);
    expect(useAvatarStore.getState().shown).toBe(true);
  });

  it("only notifies subscribers when the value actually flips", () => {
    const listener = vi.fn();
    const unsubscribe = useAvatarStore.subscribe(listener);

    // Called every camera frame; repeats must be free.
    useAvatarStore.getState().setShown(true);
    useAvatarStore.getState().setShown(true);
    expect(listener).not.toHaveBeenCalled();

    useAvatarStore.getState().setShown(false);
    useAvatarStore.getState().setShown(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
