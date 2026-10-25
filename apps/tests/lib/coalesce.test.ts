import { describe, expect, it } from "vitest";
import { createCoalescer } from "@/lib/coalesce";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const tick = () => new Promise((done) => setTimeout(done, 0));

describe("createCoalescer", () => {
  it("runs the task once for a single call", async () => {
    let runs = 0;
    const run = createCoalescer(async () => {
      runs++;
    });
    await run();
    expect(runs).toBe(1);
  });

  it("runs every call that arrives while idle", async () => {
    let runs = 0;
    const run = createCoalescer(async () => {
      runs++;
    });
    await run();
    await run();
    await run();
    expect(runs).toBe(3);
  });

  it("collapses calls made during a run into exactly one more run", async () => {
    const gates = [deferred(), deferred(), deferred()];
    let runs = 0;
    const run = createCoalescer(async () => {
      await gates[runs++].promise;
    });

    const first = run();
    void run();
    void run();
    void run();
    expect(runs).toBe(1);

    gates[0].resolve();
    await tick();
    expect(runs).toBe(2);

    gates[1].resolve();
    await first;
    expect(runs).toBe(2);
  });

  it("makes the extra run see the latest state, not the state at call time", async () => {
    const gate = deferred();
    let latest = 0;
    const seen: number[] = [];
    let first = true;
    const run = createCoalescer(async () => {
      if (first) {
        first = false;
        await gate.promise;
      }
      seen.push(latest);
    });

    latest = 1;
    const done = run();
    latest = 2;
    void run();
    latest = 3;
    void run();

    gate.resolve();
    await done;
    expect(seen).toEqual([3, 3]);
  });

  it("swallows a failing task and runs again on the next call", async () => {
    let runs = 0;
    const run = createCoalescer(async () => {
      runs++;
      if (runs === 1) throw new Error("map not ready");
    });

    await expect(run()).resolves.toBeUndefined();
    await run();
    expect(runs).toBe(2);
  });

  it("drops a pending extra run when the current run fails", async () => {
    const gate = deferred();
    let runs = 0;
    const run = createCoalescer(async () => {
      runs++;
      await gate.promise;
      throw new Error("boom");
    });

    const first = run();
    void run();
    gate.resolve();
    await first;
    expect(runs).toBe(1);
  });
});
