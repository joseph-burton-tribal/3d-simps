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

export function normalizePrCode(value: string): string {
  const code = value.trim();
  const colour = /^(?:F14|F56)\s+([A-Z0-9]+)$/.exec(code);
  if (colour) return colour[1];
  if (/^[MG][A-Z0-9]{6}$/.test(code)) return code.slice(4);
  if (/^[A-Z0-9]{3}$/.test(code) || /^LC_PR_[A-Z0-9_]+$/.test(code)) {
    return code;
  }
  throw new Error(`Unsupported PR code: ${value}`);
}

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

export function createPrString(response: VehicleApiResponse): string {
  const { configuration, derivative, specItems } = response;
  const model = derivative.modelId.trim();
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
