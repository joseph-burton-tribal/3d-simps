// Subset of the configurator API response needed to build an AVP PR string.
// Output format matches the presets: modelId,salesType,year,exterior,interior,option...
export interface VehicleApiResponse {
  configuration: {
    exterior: string;
    interior: string;
  };
  derivative: {
    modelId: string;
    derivativeId: string;
    year: string;
    title: string;
  };
  specItems: { pr: string; visible: boolean }[];
}

// Converts one API code into the bare value AVP expects.
// The API prefixes codes with their PR family; AVP wants the value only.
export function normalizePrCode(value: string): string {
  const code = value.trim();
  // Colours: "F14 1C1C" -> "1C1C", "F56     WG" -> "WG" (padding varies).
  const colour = /^(?:F14|F56)\s+([A-Z0-9]+)$/.exec(code);
  if (colour) return colour[1];
  // Options: "MZFM0TD" -> "0TD" (M/G marker + 3-char family + 3-char value).
  if (/^[MG][A-Z0-9]{6}$/.test(code)) return code.slice(4);
  // Already bare 3-char codes or AVP custom tokens pass through unchanged.
  if (/^[A-Z0-9]{3}$/.test(code) || /^LC_PR_[A-Z0-9_]+$/.test(code)) {
    return code;
  }
  throw new Error(`Unsupported PR code: ${value}`);
}

// Collects the option codes that belong in the PR string, in API order.
// Hidden specs are internal and must not be sent; colour specs are excluded
// because `configuration` is the source of truth for exterior/interior.
export function getVisiblePrCodes(
  specItems: VehicleApiResponse["specItems"],
): string[] {
  return [
    ...new Set(
      specItems
        .filter((item) => item.visible === true)
        .filter((item) => !/^F(?:14|56)\s/.test(item.pr.trim()))
        .map((item) => normalizePrCode(item.pr)),
    ),
  ];
}

// Builds the full comma-separated PR string for the avp-3dws-deck `pr-string` attribute.
// Throws on malformed input so the caller can show an error instead of mounting a viewer.
export function createPrString(response: VehicleApiResponse): string {
  const { configuration, derivative, specItems } = response;
  const model = derivative.modelId.trim();
  // derivativeId is "D314BZ-2027-MKSUKA1-..."; only the leading sales type is needed.
  const salesType = derivative.derivativeId.split("-")[0].trim();
  const year = derivative.year.trim();
  if (!/^[A-Za-z0-9]+$/.test(model) || !/^[A-Z0-9]{6}$/.test(salesType)) {
    throw new Error(
      "A model ID and six-character derivative sales type are required.",
    );
  }
  if (!/^\d{4}$/.test(year)) {
    throw new Error("A four-digit model year is required.");
  }
  if (
    !/^F14\s+[A-Z0-9]{4}$/.test(configuration.exterior.trim()) ||
    !/^F56\s+[A-Z0-9]{2}$/.test(configuration.interior.trim())
  ) {
    throw new Error(
      "Exterior (F14) and interior (F56) configuration codes are required.",
    );
  }

  return [
    model,
    salesType,
    year,
    normalizePrCode(configuration.exterior),
    normalizePrCode(configuration.interior),
    ...getVisiblePrCodes(specItems),
  ].join(",");
}
