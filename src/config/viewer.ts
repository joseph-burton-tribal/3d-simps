export interface ViewerConfig {
  configId: string;
  streamingStage: string;
  market: string;
  contentLang: string;
  multisessionDisconnect: boolean;
  hideConsumptionData: boolean;
  aveMessageTimeout: number;
  features: string;
}

const BASE_VIEWER_CONFIG = {
  multisessionDisconnect: true,
  hideConsumptionData: true,
  aveMessageTimeout: 15,
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

// parse-api-response: VW configurator and stock API derived vehicles.
export const API_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "v-3DExhibition-default-2025", // Showroom: v-3DExhibition-default-2025, OPB: v-dga-default-my2025
  streamingStage: "prod-euw1", // prelive-euw1 // qa-euw1 // prod-euw1
  market: "GBR",
  contentLang: "en",
};

// default-demo: Audi presets on the AVP demo config.
export const DEMO_VIEWER_CONFIG: ViewerConfig = {
  ...BASE_VIEWER_CONFIG,
  configId: "audi-test", // example
  streamingStage: "prod-euw1", // prelive-euw1 // qa-euw1 // prod-euw1
  market: "DEU",
  contentLang: "de",
};
