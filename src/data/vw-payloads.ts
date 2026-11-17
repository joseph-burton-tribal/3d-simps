import type { VwVehicleResponse } from "../utils/create-vw-pr-string";
import configured from "./configured.json";
import stock from "./stock.json";

export type VwPayloadId = "configured" | "stock";

export interface VwPayload {
  id: VwPayloadId;
  label: string;
  response: VwVehicleResponse & { images?: { rel: string; uri: string }[] };
}

// Sample VW configurator responses. "Configured" is a customer/dealer build;
// "Stock" is a physical pipeline vehicle.
export const VW_PAYLOADS: VwPayload[] = [
  {
    id: "configured",
    label: "Configured — T-Cross Style Edition (D314BZ, MY2027)",
    response: configured,
  },
  {
    id: "stock",
    label: "Stock — T-Roc Black Edition (D115LE, MY2025)",
    response: stock,
  },
];
