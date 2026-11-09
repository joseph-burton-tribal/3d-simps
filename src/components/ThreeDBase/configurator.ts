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

function extractSelectionCode(value: string): string {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && /^[A-Z]\d{2}$/i.test(tokens[0])) {
    return tokens.slice(1).join("");
  }
  return tokens.join("");
}

function decodePrToken(token: string): string {
  const clean = token.trim();
  if (clean.length === 7 && (clean[0] === "M" || clean[0] === "G")) {
    return clean.slice(4, 7);
  }
  return clean;
}

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

  const optionTokens = (params.get("options-app") || "")
    .split(/[-$,]+/)
    .map(decodePrToken)
    .filter(Boolean);
  const prCodes = [...modelParts.slice(1).map(decodePrToken), ...optionTokens];
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
