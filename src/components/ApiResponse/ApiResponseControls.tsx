import type { VehiclePreset } from "../../data/presets";
import type { useDeck } from "../../hooks/useDeck";
import { EventHistory } from "../EventHistory/EventHistory";
import { StreamControls } from "../StreamControls/StreamControls";

interface ApiResponseControlsProps {
  vehicle: VehiclePreset;
  stream: Omit<ReturnType<typeof useDeck>, "deckRef">;
}

export function ApiResponseControls({
  vehicle,
  stream,
}: ApiResponseControlsProps) {
  return (
    <aside className="vehicle-controls" aria-label="API vehicle configuration">
      <h1>{vehicle.label}</h1>
      <details className="api-pr-string">
        <summary>PR string</summary>
        <pre>{vehicle.prString}</pre>
      </details>
      <StreamControls
        active={stream.active}
        status={stream.status}
        hasCapacity={stream.hasCapacity}
        currentCamera={stream.currentCamera}
        error={stream.streamError}
        onStart={stream.startStream}
        onStop={stream.stopStream}
      />
      <EventHistory events={stream.events} onClear={stream.clearEvents} />
    </aside>
  );
}
