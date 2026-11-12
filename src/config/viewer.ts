export interface ViewerConfig {
  configId: string;
  market: string;
  streamingStage: string;
  initialCamera: string;
  multisessionDisconnect: boolean;
  cameraFlight: "disabled" | "enabled";
  features: string;
}

const BASE_VIEWER_CONFIG = {
  initialCamera: "MRV1",
  multisessionDisconnect: true,
  cameraFlight: "disabled" as const,
  features: JSON.stringify({
    cameraNavigation: true,
    environments: true,
    zoom: true,
    fullscreen: true,
    showroomPro: true,
    interior: true,
  }),
};

// default-demo: Audi presets on the AVP demo config.
export const DEMO_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "audi-test",
  market: "DEU",
  streamingStage: "prelive-euw1",
};

// parse-api-response: VW vehicles derived from the configurator API.
export const API_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "v-3DExhibition-default-2025",
  market: "GBR",
  streamingStage: "prod-euw1",
};
