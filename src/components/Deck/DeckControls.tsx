import { VEHICLE_PRESETS } from "../../data/presets";
import type { EventEntry, StreamStatus } from "../../types/deck";

const STATUS_LABELS: Record<StreamStatus, string> = {
  idle: "Idle",
  starting: "Starting",
  connected: "Connected",
  ready: "Streaming",
  disconnected: "Disconnected",
  error: "Error",
};

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

interface StreamControlsProps {
  active: boolean;
  status: StreamStatus;
  hasCapacity: boolean | null;
  currentCamera: string;
  error: string;
  onStart: () => void;
  onStop: () => void;
}

export function StreamControls({
  active,
  status,
  hasCapacity,
  currentCamera,
  error,
  onStart,
  onStop,
}: StreamControlsProps) {
  const capacityLabel =
    hasCapacity === null
      ? "Unknown"
      : hasCapacity
        ? "Available"
        : "Unavailable";

  return (
    <div className="stream-controls">
      <h2>Stream</h2>
      <p className="stream-status" data-state={status} role="status">
        {STATUS_LABELS[status]}
      </p>
      <dl className="stream-details">
        <dt>Capacity</dt>
        <dd>{capacityLabel}</dd>
        <dt>Camera</dt>
        <dd>{currentCamera || "Not reported"}</dd>
      </dl>
      <div className="configuration-actions">
        <button type="button" disabled={active} onClick={onStart}>
          Start stream
        </button>
        <button type="button" disabled={!active} onClick={onStop}>
          Stop stream
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

interface EventHistoryProps {
  events: EventEntry[];
  onClear: () => void;
}

export function EventHistory({ events, onClear }: EventHistoryProps) {
  return (
    <section className="event-controls" aria-label="Event history">
      <div className="event-heading">
        <h2>Events</h2>
        <button type="button" disabled={!events.length} onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="event-history">
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          events.map((entry) => (
            <details key={entry.id}>
              <summary>
                <time>{entry.time}</time>
                <span>
                  {entry.source}: {entry.type}
                </span>
              </summary>
              <pre>{entry.detail}</pre>
            </details>
          ))
        )}
      </div>
    </section>
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
