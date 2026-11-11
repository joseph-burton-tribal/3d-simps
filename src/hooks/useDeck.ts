import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { VEHICLE_PRESETS } from "../data/presets";
import type { EventEntry, StreamStatus } from "../components/Deck/deckTypes";

const MAX_EVENTS = 20;

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

function formatEventDetail(detail: unknown): string {
  try {
    return JSON.stringify(detail, null, 2) ?? "No payload";
  } catch {
    return "Payload could not be displayed.";
  }
}

function getErrorMessage(
  payload: unknown,
  detail: Record<string, unknown>,
): string {
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

  return [code, message].filter(Boolean).join(": ") || fallback;
}

export function useDeck() {
  const deckRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_PRESETS[0]);
  const [streamError, setStreamError] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [hasCapacity, setHasCapacity] = useState<boolean | null>(null);
  const [currentCamera, setCurrentCamera] = useState("");
  const [events, setEvents] = useState<EventEntry[]>([]);
  const nextEventId = useRef(0);

  // Ensure the deck is inactive when the component unmounts.
  useLayoutEffect(() => {
    const deck = deckRef.current as (HTMLElement & { active?: boolean }) | null;
    return () => {
      if (deck) deck.active = false;
    };
  }, []);

  // Record deck events for debugging and UI updates.
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
    setEvents((previous) => [entry, ...previous].slice(0, MAX_EVENTS));
  };

  // Mark the deck as disconnected and reset relevant state.
  const markDisconnected = () => {
    setActive(false);
    setCurrentCamera("");
    setStatus((previous) => (previous === "error" ? previous : "disconnected"));
  };

  // Deck events are native CustomEvents, their payload is in event.detail.
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
        markDisconnected();
        break;
      case "readiness":
        // Server capacity is independent of whether our stream has connected.
        if (typeof detail.isReady === "boolean") setHasCapacity(detail.isReady);
        break;
      case "update:active":
        if (typeof detail.value === "boolean") {
          if (detail.value) setActive(true);
          else markDisconnected();
        }
        break;
      case "update:camera":
        if (typeof detail.value === "string") setCurrentCamera(detail.value);
        break;
      case "error":
      case "exception":
        setStreamError(getErrorMessage(payload, detail));
        setActive(false);
        setCurrentCamera("");
        setStatus("error");
        break;
    }
  });

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    // Bind deck event listeners to handleDeckEvent
    const listener = (event: Event) => handleDeckEvent(event);
    DECK_EVENTS.forEach((type) => deck.addEventListener(type, listener));
    return () => {
      DECK_EVENTS.forEach((type) => deck.removeEventListener(type, listener));
    };
  }, []);

  const selectVehicle = (id: string) => {
    const vehicle = VEHICLE_PRESETS.find((preset) => preset.id === id);
    if (!vehicle) return;

    setSelectedVehicle(vehicle);
    setStreamError("");
    recordEvent("UI", "vehicle-change", { id: vehicle.id });
  };

  const resetVehicle = () => {
    setSelectedVehicle(VEHICLE_PRESETS[0]);
    setStreamError("");
    recordEvent("UI", "reset", { id: VEHICLE_PRESETS[0].id });
  };

  const startStream = () => {
    setStreamError("");
    setActive(true);
    setStatus("starting");
    recordEvent("UI", "start");
  };

  const stopStream = () => {
    setActive(false);
    setCurrentCamera("");
    setStatus("idle");
    recordEvent("UI", "stop");
  };

  const clearEvents = () => setEvents([]);

  return {
    deckRef,
    active,
    selectedVehicle,
    streamError,
    status,
    hasCapacity,
    currentCamera,
    events,
    selectVehicle,
    resetVehicle,
    startStream,
    stopStream,
    clearEvents,
  };
}
