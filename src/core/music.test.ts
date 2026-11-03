import { describe, expect, it } from "vitest";
import { CHROMATIC_PITCHES, NATURAL_PITCHES, formatPitch } from "./music";

describe("music model", () => {
  it("provides seven natural and twelve chromatic pitches", () => {
    expect(NATURAL_PITCHES).toHaveLength(7);
    expect(CHROMATIC_PITCHES).toHaveLength(12);
  });

  it("formats letter and fixed-do names", () => {
    const cSharp = CHROMATIC_PITCHES[1];
    expect(formatPitch(cSharp, "letters")).toBe("C♯");
    expect(formatPitch(cSharp, "solfege")).toBe("Do♯");
    expect(formatPitch(cSharp, "letters", "flat")).toBe("D♭");
    expect(formatPitch(cSharp, "solfege", "flat")).toBe("Re♭");
  });
});
