import { describe, expect, it } from "vitest";
import configured from "../data/configured.json";
import stock from "../data/stock.json";
import {
  createVwPrString,
  getFinishCode,
  getPrCodes,
  normalizePrCode,
} from "./create-vw-pr-string";

describe("VW configured/stock PR strings", () => {
  it("builds the Configured fixture's identity, finishes and equipment", () => {
    const codes = createVwPrString(configured).split(",");
    expect(codes.slice(0, 5)).toEqual([
      "36613",
      "D314BZ",
      "2027",
      "1C1C",
      "WG",
    ]);
    // 179 equipment codes in specItems, minus the four that start with "U".
    expect(codes).toHaveLength(5 + 175);
    // Hidden items are kept; replacedStandardSpecs (MBATJ4J) is suppressed.
    expect(codes).toContain("00A");
    expect(codes).not.toContain("J4J");
    // Package code is followed by its not-yet-seen contentParts (82R was
    // already emitted as a standalone item earlier in document order).
    const pj4 = codes.indexOf("PJ4");
    expect(codes.slice(pj4, pj4 + 3)).toEqual(["PJ4", "V68", "PLC"]);
    expect(codes.indexOf("82R")).toBeLessThan(pj4);
    expect(codes.slice(5).every((code) => /^[A-Z0-9]{3}$/.test(code))).toBe(
      true,
    );
  });

  it("builds the Stock fixture's identity, finishes and equipment", () => {
    const codes = createVwPrString(stock).split(",");
    expect(codes.slice(0, 5)).toEqual([
      "34785",
      "D115LE",
      "2025",
      "2T2T",
      "OC",
    ]);
    // 187 equipment codes in specItems, minus the five that start with "U".
    expect(codes).toHaveLength(5 + 182);
    expect(codes.slice(5, 11)).toEqual([
      "AV0",
      "A9I",
      "B0A",
      "B09",
      "C33",
      "C6H",
    ]);
    // Nothing in replacedStandardSpecs, so J4J stays; standalone rim/tyre and
    // optional-extra items are all sourced from specItems.
    expect(codes).toEqual(expect.arrayContaining(["J4J", "I18", "PJJ", "L0R"]));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("drops every code that starts with U", () => {
    for (const fixture of [configured, stock]) {
      const codes = createVwPrString(fixture).split(",").slice(5);
      expect(codes.some((code) => code.startsWith("U"))).toBe(false);
    }
    expect(createVwPrString(configured)).not.toContain("UD3");
    expect(createVwPrString(stock)).not.toContain("UH2");
  });

  it("normalizes family prefixes, whitespace and custom tokens", () => {
    expect(normalizePrCode(" MZFM0TD ")).toBe("0TD");
    expect(normalizePrCode("GPJ4PJ4")).toBe("PJ4");
    expect(normalizePrCode("F56     WG")).toBe("WG");
    expect(normalizePrCode("LC_PR_AEEXC034")).toBe("LC_PR_AEEXC034");
    expect(() => normalizePrCode("unsupported")).toThrow("Unsupported PR code");
  });

  it("reads finishes from specItems before falling back to configuration", () => {
    expect(getFinishCode(stock, "exterior")).toBe("2T2T");
    expect(
      getFinishCode(
        { configuration: { interior: "F56     OC" }, specItems: [] },
        "interior",
      ),
    ).toBe("OC");
    expect(() =>
      getFinishCode({ configuration: {}, specItems: [] }, "exterior"),
    ).toThrow("exterior finish");
    expect(() =>
      getFinishCode(
        { configuration: { exterior: "F14 TOOLONG" }, specItems: [] },
        "exterior",
      ),
    ).toThrow("Unsupported exterior finish");
  });

  it("unpacks contentParts, dedupes, and applies the U and exclusion filters", () => {
    expect(
      getPrCodes(
        [
          { pr: "F14 1C1C" },
          { pr: "GPJ4PJ4", contentParts: ["MRADV68", "MREI82R", "F56 WG"] },
          { pr: "MRADV68" },
          { pr: "MBATJ4J" },
          { pr: "MABAUD3" },
          { pr: "MUGH00A" },
        ],
        ["MBATJ4J"],
      ),
    ).toEqual(["PJ4", "V68", "82R", "00A"]);
  });

  it("rejects malformed vehicle identity", () => {
    expect(() =>
      createVwPrString({
        ...configured,
        derivative: { ...configured.derivative, salesGroupId: " " },
      }),
    ).toThrow("sales group ID");
    expect(() =>
      createVwPrString({
        ...configured,
        derivative: { ...configured.derivative, derivativeId: "D31-2027" },
      }),
    ).toThrow("engine code");
    expect(() =>
      createVwPrString({
        ...configured,
        derivative: { ...configured.derivative, year: "27" },
      }),
    ).toThrow("model year");
  });
});
