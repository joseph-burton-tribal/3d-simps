import type { EventEntry } from "../../types/deck";

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
