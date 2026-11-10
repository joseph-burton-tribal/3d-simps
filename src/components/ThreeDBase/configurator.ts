export interface ParsedConfigurator {
  carlineId: string;
  salesGroupId: string;
  modelId: string;
  modelYear: string;
  trimName: string;
  paintCode: string;
  interiorCode: string;
  prCodes: string[];
}

/**
 * Removes spaces from a paint or interior selection. When a prefix consisting
 * of one letter and two digits is followed by a separate code, drops the prefix.
 * For example, "F14 R1R1" becomes "R1R1" and "F56     ZA" becomes "ZA".
 */
function extractSelectionCode(value: string): string {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && /^[A-Z]\d{2}$/i.test(tokens[0])) {
    return tokens.slice(1).join("");
  }
  return tokens.join("");
}

/**
 * Trims an option token from modelId-app. For the seven-character tokens
 * starting with uppercase M or G used in the supplied URLs, keeps the last
 * three characters: "GPJ1PJ1" becomes "PJ1" and "MRUFNZ4" becomes "NZ4".
 * Leaves other trimmed tokens unchanged.
 */
function decodePrToken(token: string): string {
  const clean = token.trim();
  if (clean.length === 7 && (clean[0] === "M" || clean[0] === "G")) {
    return clean.slice(4, 7);
  }
  return clean;
}

/**
 * Reads vehicle details from the URL's -app query parameters. URLSearchParams
 * decodes encoded values and turns + into spaces. The first $-separated part
 * of modelId-app is the model; the remaining parts contain option codes.
 * Cleans the selection and option codes, then removes duplicate option codes
 * regardless of letter case, keeping the spelling from the last occurrence.
 * Falls back to the carline ID for a missing sales group and the model ID for
 * a missing trim name. Throws if URL parsing fails or required details are
 * missing. Does not verify the website's hostname or vehicle availability.
 */
export function parseConfiguratorUrl(rawUrl: string): ParsedConfigurator {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid Volkswagen configurator URL.");
  }

  const params = url.searchParams;
  const carlineId = params.get("carlineId-app")?.trim() || "";
  const salesGroupId = params.get("salesGroupId-app")?.trim() || carlineId;
  const modelParts = (params.get("modelId-app") || "")
    .split("$")
    .filter(Boolean);
  const modelId = modelParts[0]?.trim() || "";
  const modelYear = params.get("modelYear-app")?.trim() || "";

  if (!modelId || !modelYear || !salesGroupId) {
    throw new Error(
      "This URL is missing a model, model year, or sales group. Use a Volkswagen configurator URL with its configuration parameters.",
    );
  }

  const prCodes = modelParts.slice(1).map(decodePrToken);
  const uniquePrCodes = [
    ...new Map(prCodes.map((code) => [code.toLowerCase(), code])).values(),
  ];

  return {
    carlineId,
    salesGroupId,
    modelId,
    modelYear,
    trimName: params.get("trimName-app")?.trim() || modelId,
    paintCode: extractSelectionCode(params.get("exteriorId-app") || ""),
    interiorCode: extractSelectionCode(params.get("interiorId-app") || ""),
    prCodes: uniquePrCodes,
  };
}

/**
 * Builds the viewer's comma-separated configuration string in this order:
 * sales group (or carline ID if missing), model, year, paint, interior, then
 * option codes. Leaves out empty values; does not validate the configuration.
 */
export function buildPrString(config: ParsedConfigurator): string {
  return [
    config.salesGroupId || config.carlineId,
    config.modelId,
    config.modelYear,
    config.paintCode,
    config.interiorCode,
    ...config.prCodes,
  ]
    .filter(Boolean)
    .join(",");
}
