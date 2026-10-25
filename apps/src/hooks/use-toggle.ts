import { useCallback, useState } from "react";

/** A boolean with a stable `toggle` function, so memoized children aren't re-rendered by it. */
export function useToggle(initial: boolean): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((current) => !current), []);
  return [value, toggle];
}
