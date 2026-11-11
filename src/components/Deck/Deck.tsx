import { DeckControls } from "./DeckControls";
import { useDeck } from "../../hooks/useDeck";
import { DEMO_VIEWER_CONFIG as VIEWER_CONFIG } from "../../config/viewer";
import "../../types/deck";

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
      </div>
    </div>
  );
};
