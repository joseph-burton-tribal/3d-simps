import { VEHICLE_PRESETS } from "../../data/presets";
import type { EventEntry } from "../../types/deck";
import { EventHistory } from "../EventHistory/EventHistory";
import { type StreamControlsProps } from "../StreamControls/StreamControls";
import { StreamControls } from "../StreamControls/StreamControls";

interface VehicleSelectionProps {
  selectedId: string;
  onChange: (id: string) => void;
  onReset: () => void;
}

function VehicleSelection({
  selectedId,
  onChange,
  onReset,
}: VehicleSelectionProps) {
  return (
    <div className="vehicle-selection">
      <label htmlFor="vehicle-preset">Vehicle</label>
      <select
        id="vehicle-preset"
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
      >
        {VEHICLE_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <div className="configuration-actions">
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

interface DeckControlsProps extends StreamControlsProps {
  selectedVehicleId: string;
  events: EventEntry[];
  onVehicleChange: (id: string) => void;
  onReset: () => void;
  onClearEvents: () => void;
}

export function DeckControls({
  selectedVehicleId,
  events,
  onVehicleChange,
  onReset,
  onClearEvents,
  active,
  status,
  hasCapacity,
  currentCamera,
  error,
  onStart,
  onStop,
}: DeckControlsProps) {
  return (
    <aside className="vehicle-controls" aria-label="Vehicle configuration">
      <h1>3D vehicle viewer</h1>
      <VehicleSelection
        selectedId={selectedVehicleId}
        onChange={onVehicleChange}
        onReset={onReset}
      />
      <StreamControls
        active={active}
        status={status}
        hasCapacity={hasCapacity}
        currentCamera={currentCamera}
        error={error}
        onStart={onStart}
        onStop={onStop}
      />
      <EventHistory events={events} onClear={onClearEvents} />
    </aside>
  );
}
