export const VIEWER_CONFIG = {
  configId: "v-3DExhibition-default-2025", // audi-test, v-3DExhibition-default-2025
  market: "GBR",
  streamingStage: "prod-euw1", // prelive-euw1, prod-euw1
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
