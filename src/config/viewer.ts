export interface ViewerConfig {
  configId: string;
  streamingStage: string;
  market: string;
  contentLanguage: string;
  multisessionDisconnect: boolean;
  hideConsumptionData: boolean;
  features: string;
}

const BASE_VIEWER_CONFIG = {
  multisessionDisconnect: true,
  hideConsumptionData: true,
  features: JSON.stringify({
    cameraNavigation: true,
    interior: true,
    environments: true,
    zoom: true,
    fullscreen: true,
    animations: true,
    trunkAnimations: true,
    lightAnimations: true,
    animationSpots: true,
    cameraFlight: true,
    showroomPro: true,
    close: false,
  }),
};

// default-demo: Audi presets on the AVP demo config.
export const DEMO_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "audi-test",
  streamingStage: "prelive-euw1",
  market: "DEU",
  contentLanguage: "de",
};

// parse-api-response: VW vehicles derived from the configurator API.
export const API_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "v-3DExhibition-default-2025",
  streamingStage: "prelive-euw1",
  market: "GBR",
  contentLanguage: "en",
};
