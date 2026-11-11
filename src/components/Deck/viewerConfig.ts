export const VIEWER_CONFIG = {
  configId: "audi-test", // audi-test, v-3DExhibition-default-2025
  market: "DEU",
  streamingStage: "prelive-euw1", // prelive-euw1, prod-euw1
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
