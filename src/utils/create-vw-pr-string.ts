// The parts of a VW "Configured" or "Stock" vehicle payload used to build an AVP PR string.
// Both payload shapes share these fields, so one type covers both.
export interface VwVehicleResponse {
  configuration: {
    exterior?: string;
    interior?: string;
  };
  derivative: {
    salesGroupId: string;
    derivativeId: string;
    year: string;
    title: string;
  };
  specItems: { pr: string; contentParts?: string[] }[];
  replacedStandardSpecs?: string[];
}

// Paint finish codes start with a family prefix followed by whitespace:
// "F14 1C1C" is an exterior paint, "F56     OC" is an interior trim.
const EXTERIOR_FAMILY = /^F14\s/;
const INTERIOR_FAMILY = /^F56\s/;
const FINISH_FAMILY = /^F(?:14|56)\s/;

// Converts code into the bare value AVP expects.
// The API prefixes codes with their PR family; AVP wants the value only.
export function normalizePrCode(value: string): string {
  const code = value.trim();
  // Finishes: "F14 1C1C" -> "1C1C", "F56     WG" -> "WG" (padding varies).
  const finish = /^(?:F14|F56)\s+([A-Z0-9]+)$/.exec(code);
  if (finish) return finish[1];
  // Equipment: "MZFM0TD" -> "0TD" (M/G marker + 3-char family + 3-char value).
  if (/^[MG][A-Z0-9]{6}$/.test(code)) return code.slice(4);
  // Already bare 3-char codes or AVP custom tokens pass through unchanged.
  if (/^[A-Z0-9]{3}$/.test(code) || /^LC_PR_[A-Z0-9_]+$/.test(code)) {
    return code;
  }
  throw new Error(`Unsupported PR code: ${value}`);
}

// Finds the exterior (F14) or interior (F56) finish and returns its bare code,
// e.g. "F14 1C1C" -> "1C1C", "F56     OC" -> "OC".
// The first matching specItem wins; `configuration.exterior` / `.interior` is
// used when specItems has no finish of that family.
// Throws when neither source has a finish, or the code is not 2–4 characters.
export function getFinishCode(
  response: Pick<VwVehicleResponse, "configuration" | "specItems">,
  family: "exterior" | "interior",
): string {
  const pattern = family === "exterior" ? EXTERIOR_FAMILY : INTERIOR_FAMILY;

  const fromSpec = response.specItems.find((item) =>
    pattern.test(item.pr.trim()),
  )?.pr;

  const raw = (fromSpec ?? response.configuration[family] ?? "").trim();

  if (!pattern.test(raw)) {
    throw new Error(
      `An ${family} finish (${family === "exterior" ? "F14" : "F56"}) is required.`,
    );
  }

  const code = normalizePrCode(raw);

  if (!/^[A-Z0-9]{2,4}$/.test(code)) {
    throw new Error(`Unsupported ${family} finish code: ${raw}`);
  }
  return code;
}

// Collects the PR codes for every piece of equipment in specItems.
// Walks specItems in document order and, for each item:
//   1. skips finish items (F14/F56), which belong in the header instead;
//   2. normalises the code with `normalizePrCode` ("MKSUKA1" -> "KA1");
//   3. appends the code, then appends each code listed in the item's `contentParts`.
// Every item is included regardless of its `visible` flag or title.
// A code is emitted once only, the first time it is seen. Codes that start with
// "U", and codes whose 7-character form appears in `replacedStandardSpecs`,
// are left out entirely.
export function getPrCodes(
  specItems: VwVehicleResponse["specItems"],
  replacedStandardSpecs: string[] = [],
): string[] {
  // Initialize the set of excluded codes from replacedStandardSpecs.
  const excluded = new Set(replacedStandardSpecs.map(normalizePrCode));

  // Keeps insertion order and silently ignores repeats, so adding the
  // same code twice leaves it in place the first time it was seen.
  const codes = new Set<string>();

  const add = (value: string) => {
    const code = normalizePrCode(value);
    // skip codes that start with "U" or are in the excluded set
    if (code.startsWith("U") || excluded.has(code)) return;
    codes.add(code);
  };

  for (const item of specItems) {
    // skip items that are finish codes (F14/F56)
    if (FINISH_FAMILY.test(item.pr.trim())) continue;
    add(item.pr);
    // add the item's content parts, skipping finish codes
    for (const child of item.contentParts ?? []) {
      if (!FINISH_FAMILY.test(child.trim())) add(child);
    }
  }

  return [...codes];
}

// Builds the comma-separated PR string for the avp-3dws-deck `pr-string` attribute
// from a VW "Configured" or "Stock" payload. The first five positions are fixed:
// salesGroupId, engineCode, year, exteriorCode, interiorCode
// and every position after that is an equipment PR code from specItems.
// Throws on malformed input so the caller can show an error instead of mounting a viewer.
export function createVwPrString(response: VwVehicleResponse): string {
  const { derivative, specItems, replacedStandardSpecs } = response;

  const salesGroupId = derivative.salesGroupId.trim();

  // derivativeId is "D314BZ-2027-MKSUKA1-..." or "D115LE-2025-PDS-...";
  // the six characters before the first hyphen are the engine code.
  const engineCode = derivative.derivativeId.split("-")[0].trim().toUpperCase();

  const year = derivative.year.trim();

  if (!/^[A-Za-z0-9]+$/.test(salesGroupId)) {
    throw new Error("A sales group ID is required.");
  }

  if (!/^[A-Z0-9]{6}$/.test(engineCode)) {
    throw new Error("A six-character engine code is required.");
  }

  if (!/^\d{4}$/.test(year)) {
    throw new Error("A four-digit model year is required.");
  }

  return [
    salesGroupId,
    engineCode,
    year,
    getFinishCode(response, "exterior"),
    getFinishCode(response, "interior"),
    ...getPrCodes(specItems, replacedStandardSpecs),
  ].join(",");
}
