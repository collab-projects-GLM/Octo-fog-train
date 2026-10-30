/// <reference types="node" />
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { PALETTE } from "@/style/palette.generated";

const require = createRequire(import.meta.url);
const { buildPalette, parseBrandCss, render } = require("../../scripts/build-palette");
const brandCss = readFileSync("src/style/brand.css", "utf8");

describe("parseBrandCss", () => {
  const css = `
    @layer base {
      :root { --a: 0 0% 100%; --b: 12 50.5% 4%; --radius: 0.5rem; }
      /* .dark:root { --a: 1 1% 1%; } */
      .dark:root { --b: 200 10% 20%; }
    }`;

  it("turns shadcn triplets into hsl() colors and skips non-colors", () => {
    expect(parseBrandCss(css).light).toEqual({
      a: "hsl(0, 0%, 100%)",
      b: "hsl(12, 50.5%, 4%)",
    });
  });

  it("lets dark override light and inherit the rest, like the cascade", () => {
    expect(parseBrandCss(css).dark).toEqual({
      a: "hsl(0, 0%, 100%)",
      b: "hsl(200, 10%, 20%)",
    });
  });

  it("rejects a dark-only color, which would have no light value", () => {
    expect(() =>
      parseBrandCss(":root { --a: 0 0% 0%; } .dark:root { --z: 0 0% 0%; }"),
    ).toThrow(/--z/);
  });

  it("needs both blocks", () => {
    expect(() => parseBrandCss(":root { --a: 0 0% 0%; }")).toThrow(/dark/);
  });
});

describe("palette.generated.ts", () => {
  it("is up to date with brand.css (run `bun run build:palette`)", () => {
    const committed = readFileSync("src/style/palette.generated.ts", "utf8");
    expect(committed).toBe(render(parseBrandCss(brandCss)));
    // And the real entry point leaves a current file alone.
    expect(buildPalette()).toBe(committed);
  });

  it("has the same colors in light and dark", () => {
    expect(Object.keys(PALETTE.dark)).toEqual(Object.keys(PALETTE.light));
  });
});

describe("tailwind.config.js", () => {
  const config = require("../../tailwind.config.js");
  const cssVars = [
    ...JSON.stringify(config.theme.extend.colors).matchAll(/var\(--([\w-]+)\)/g),
  ].map((match) => match[1]);

  it("only uses colors that brand.css defines", () => {
    expect(cssVars.filter((name) => !(name in PALETTE.light))).toEqual([]);
  });

  it("offers every color brand.css defines as a class", () => {
    expect(Object.keys(PALETTE.light).filter((name) => !cssVars.includes(name))).toEqual([]);
  });
});
