import { describe, expect, it } from "vitest";
import source from "../data/api-response-source.json";
import {
  createPrString,
  getVisiblePrCodes,
  normalizePrCode,
} from "./create-pr-string";

describe("API response PR strings", () => {
  it("builds the fixture's vehicle identity and selected colours", () => {
    const codes = createPrString(source).split(",");
    expect(codes.slice(0, 5)).toEqual([
      "30251",
      "D314BZ",
      "2027",
      "1C1C",
      "WG",
    ]);
    expect(codes).toContain("0TD");
    expect(codes).not.toContain("00A");
    expect(codes).not.toContain("MZFM0TD");
    expect(codes).not.toContain("F14 1C1C");
    expect(codes.slice(5)).toEqual(getVisiblePrCodes(source.specItems));
  });

  it("normalizes family prefixes, whitespace and custom tokens", () => {
    expect(normalizePrCode(" MZFM0TD ")).toBe("0TD");
    expect(normalizePrCode("GPJ4PJ4")).toBe("PJ4");
    expect(normalizePrCode("F56     WG")).toBe("WG");
    expect(normalizePrCode("LC_PR_AEEXC034")).toBe("LC_PR_AEEXC034");
  });

  it("excludes hidden options and colours and deduplicates visible options", () => {
    expect(
      getVisiblePrCodes([
        { pr: "MZFM0TD", visible: true },
        { pr: "0TD", visible: true },
        { pr: "F14 1C1C", visible: true },
        { pr: "F56     WG", visible: true },
        { pr: "MUGH00A", visible: false },
        { pr: "not a code", visible: false },
      ]),
    ).toEqual(["0TD"]);
  });

  it("rejects malformed vehicle identity, colours and visible option codes", () => {
    expect(() =>
      createPrString({
        ...source,
        derivative: { ...source.derivative, year: "" },
      }),
    ).toThrow("model year");
    expect(() =>
      createPrString({
        ...source,
        derivative: { ...source.derivative, derivativeId: "" },
      }),
    ).toThrow("sales type");
    expect(() =>
      createPrString({
        ...source,
        configuration: { ...source.configuration, exterior: "" },
      }),
    ).toThrow("configuration codes");
    expect(() => normalizePrCode("unsupported")).toThrow("Unsupported PR code");
  });
});
