/**
 * Wraps an async `task` so it never runs twice at once. A call that arrives while it is running
 * does not queue up: it only marks the task to run once more when the current run ends, so
 * however many calls come in meanwhile, at most one extra run follows and it sees the latest
 * state. A run that throws ends the loop; the next call starts fresh.
 *
 * This is for work triggered at frame rate (like projecting a coordinate to the screen) where
 * only the newest result matters.
 */
export function createCoalescer(task: () => Promise<void>): () => Promise<void> {
  let running = false;
  let again = false;

  return async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      do {
        again = false;
        await task();
      } while (again);
    } catch {
      // The next call retries.
    } finally {
      running = false;
    }
  };
}
