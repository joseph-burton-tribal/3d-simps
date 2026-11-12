import type { StreamStatus } from "../../types/deck";

export interface StreamControlsProps {
  active: boolean;
  status: StreamStatus;
  hasCapacity: boolean | null;
  currentCamera: string;
  error: string;
  onStart: () => void;
  onStop: () => void;
}

const STATUS_LABELS: Record<StreamStatus, string> = {
  idle: "Idle",
  starting: "Starting",
  connected: "Connected",
  ready: "Streaming",
  disconnected: "Disconnected",
  error: "Error",
};

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
