import { DeckControls } from "./DeckControls";
import { useDeck } from "../../hooks/useDeck";
import type { StreamStatus } from "./deckTypes";
import "./deckTypes";

// Embed features from the Solution Design. Rotate is on by default.
const FEATURES = {
  cameraNavigation: true,
  environments: true,
  zoom: true,
  fullscreen: true,
  interior: true,
  showroomPro: true, // Showroom app only, not the brochure
  cameraFlight: false,
};

const VIEWER_CONFIG = {
  configId: "audi-test",
  market: "GBR", // ISO alpha-3; used for per-market analytics
  streamingStage: "prelive-euw1",
  initialCamera: "MRV1",
  multisessionDisconnect: true,
  features: JSON.stringify(FEATURES),
};

// The Deck shows its own loader, so only failures are overlaid.
function StreamOverlay({
  status,
  error,
}: {
  status: StreamStatus;
  error: string;
}) {
  if (status !== "error") return null;

  return (
    <div className="stream-overlay" aria-live="polite">
      <p>Stream unavailable. {error}</p>
    </div>
  );
}

export const Deck = () => {
  const {
    deckRef,
    active,
    selectedVehicle,
    status,
    hasCapacity,
    currentCamera,
    streamError,
    events,
    selectVehicle,
    resetVehicle,
    startStream,
    stopStream,
    clearEvents,
  } = useDeck();

  return (
    <div className="vehicle-workspace">
      <DeckControls
        selectedVehicleId={selectedVehicle.id}
        active={active}
        status={status}
        hasCapacity={hasCapacity}
        currentCamera={currentCamera}
        error={streamError}
        events={events}
        onVehicleChange={selectVehicle}
        onReset={resetVehicle}
        onStart={startStream}
        onStop={stopStream}
        onClearEvents={clearEvents}
      />

      <div className="vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          active={active}
          pr-string={selectedVehicle.prString}
          multisession-disconnect={VIEWER_CONFIG.multisessionDisconnect}
          streaming-stage={VIEWER_CONFIG.streamingStage}
          camera-flight={VIEWER_CONFIG.cameraFlight}
          camera={VIEWER_CONFIG.initialCamera}
          features={VIEWER_CONFIG.features}
          config-id={VIEWER_CONFIG.configId}
          market={VIEWER_CONFIG.market}
        ></avp-3dws-deck>
        <StreamOverlay status={status} error={streamError} />
      </div>
    </div>
  );
};
