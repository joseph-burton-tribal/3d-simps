import { DeckControls } from "./DeckControls";
import { useDeck } from "../../hooks/useDeck";
import "./deckTypes";

const VIEWER_CONFIG = {
  configId: "audi-test",
  market: "DEU",
  streamingStage: "prelive-euw1",
  initialCamera: "MRV1",
  multisessionDisconnect: true,
  features: '{"showroomPro":true}',
};

export const ThreeDBase = () => {
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
          config-id={VIEWER_CONFIG.configId}
          market={VIEWER_CONFIG.market}
          streaming-stage={VIEWER_CONFIG.streamingStage}
          camera={VIEWER_CONFIG.initialCamera}
          multisession-disconnect={VIEWER_CONFIG.multisessionDisconnect}
          features={VIEWER_CONFIG.features}
          active={active}
          pr-string={selectedVehicle.prString}
        ></avp-3dws-deck>
      </div>
    </div>
  );
};
