import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type HTMLAttributes,
  type Ref,
} from "react";
import { VEHICLE_PRESETS } from "./presets";

const DECK_EVENTS = [
  "connected",
  "streamInitialized",
  "disconnected",
  "readiness",
  "error",
  "exception",
  "update:active",
  "update:camera",
  "update:pr-string",
  "update:camera-flight",
] as const;

const STATUS_LABELS = {
  idle: "Idle",
  starting: "Starting",
  connected: "Connected",
  ready: "Streaming",
  disconnected: "Disconnected",
  error: "Error",
};

type StreamStatus = keyof typeof STATUS_LABELS;

interface EventEntry {
  id: number;
  time: string;
  source: "UI" | "Deck";
  type: string;
  detail: string;
}

function formatEventDetail(detail: unknown): string {
  try {
    return JSON.stringify(detail, null, 2) ?? "No payload";
  } catch {
    return "Payload could not be displayed.";
  }
}

type DeckAttributes = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  active?: boolean;
  market?: string;
  "pr-string"?: string;
  camera?: string;
  "camera-flight"?: "disabled" | "enabled";
  "config-id": string;
  features?: string;
  "streaming-stage"?: string;
  "multisession-disconnect"?: boolean;
};

// Let TypeScript check the AVP custom element in JSX.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "avp-3dws-deck": DeckAttributes;
    }
  }
}

export const ThreeDBase = () => {
  const deckRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_PRESETS[0]);
  const [streamError, setStreamError] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [currentCamera, setCurrentCamera] = useState("");
  const [events, setEvents] = useState<EventEntry[]>([]);
  const nextEventId = useRef(0);

  const recordEvent = (
    source: EventEntry["source"],
    type: string,
    detail?: unknown,
  ) => {
    const entry: EventEntry = {
      id: nextEventId.current++,
      time: new Date().toLocaleTimeString(),
      source,
      type,
      detail: formatEventDetail(detail),
    };
    setEvents((previous) => [entry, ...previous].slice(0, 20));
  };

  // Deck events are native CustomEvents; their payload is in event.detail.
  const handleDeckEvent = useEffectEvent((event: Event) => {
    const payload = (event as CustomEvent<unknown>).detail;
    const detail =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    recordEvent("Deck", event.type, payload);

    switch (event.type) {
      case "connected":
        setStatus("connected");
        setStreamError("");
        break;
      case "streamInitialized":
        setStatus("ready");
        setStreamError("");
        break;
      case "disconnected":
        setActive(false);
        setCurrentCamera("");
        setStatus((previous) =>
          previous === "error" ? previous : "disconnected",
        );
        break;
      case "readiness":
        // Server capacity is independent of whether our stream has connected.
        if (typeof detail.isReady === "boolean") setIsReady(detail.isReady);
        break;
      case "update:active":
        if (typeof detail.value === "boolean") {
          setActive(detail.value);
          if (!detail.value) {
            setCurrentCamera("");
            setStatus((previous) =>
              previous === "error" ? previous : "disconnected",
            );
          }
        }
        break;
      case "update:camera":
        if (typeof detail.value === "string") setCurrentCamera(detail.value);
        break;
      case "error":
      case "exception": {
        const code = [detail.reason, detail.code, detail.errorCode].find(
          (value): value is string => typeof value === "string",
        );
        const message = [detail.message, detail.errorMessage].find(
          (value): value is string => typeof value === "string",
        );
        const fallback =
          typeof payload === "string"
            ? payload
            : "The AVP stream could not start. Please try again.";

        setStreamError([code, message].filter(Boolean).join(": ") || fallback);
        setActive(false);
        setCurrentCamera("");
        setStatus("error");
        break;
      }
    }
  });

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const listener = (event: Event) => handleDeckEvent(event);
    DECK_EVENTS.forEach((type) => deck.addEventListener(type, listener));
    return () => {
      DECK_EVENTS.forEach((type) => deck.removeEventListener(type, listener));
    };
  }, []);

  const handleVehicleChange = (id: string) => {
    const vehicle = VEHICLE_PRESETS.find((preset) => preset.id === id);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setStreamError("");
      recordEvent("UI", "vehicle-change", { id: vehicle.id });
    }
  };

  const handleReset = () => {
    setSelectedVehicle(VEHICLE_PRESETS[0]);
    setStreamError("");
    recordEvent("UI", "reset", { id: VEHICLE_PRESETS[0].id });
  };

  const handleStart = () => {
    setStreamError("");
    setActive(true);
    setStatus("starting");
    recordEvent("UI", "start");
  };

  const handleStop = () => {
    setActive(false);
    setCurrentCamera("");
    setStatus("idle");
    recordEvent("UI", "stop");
  };

  return (
    <div className="vehicle-workspace">
      <aside className="vehicle-controls" aria-label="Vehicle configuration">
        <h1>3D vehicle viewer</h1>
        <div className="vehicle-selection">
          <label htmlFor="vehicle-preset">Vehicle</label>
          <select
            id="vehicle-preset"
            value={selectedVehicle.id}
            onChange={(event) => handleVehicleChange(event.target.value)}
          >
            {VEHICLE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <div className="configuration-actions">
            <button type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        <div className="stream-controls">
          <h2>Stream</h2>
          <p className="stream-status" data-state={status} role="status">
            {STATUS_LABELS[status]}
          </p>
          <dl className="stream-details">
            <dt>Capacity</dt>
            <dd>
              {isReady === null
                ? "Unknown"
                : isReady
                  ? "Available"
                  : "Unavailable"}
            </dd>
            <dt>Camera</dt>
            <dd>{currentCamera || "Not reported"}</dd>
          </dl>
          <div className="configuration-actions">
            <button type="button" disabled={active} onClick={handleStart}>
              Start stream
            </button>
            <button type="button" disabled={!active} onClick={handleStop}>
              Stop stream
            </button>
          </div>
          {streamError && <p role="alert">{streamError}</p>}
        </div>

        <section className="event-controls" aria-label="Event history">
          <div className="event-heading">
            <h2>Events</h2>
            <button
              type="button"
              disabled={!events.length}
              onClick={() => setEvents([])}
            >
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
      </aside>

      <div className="vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          config-id="audi-test"
          market="DEU"
          streaming-stage="prelive-euw1"
          camera="MRV1"
          multisession-disconnect
          features='{"showroomPro":true}'
          active={active}
          pr-string={selectedVehicle.prString}
        ></avp-3dws-deck>
      </div>
    </div>
  );
};
