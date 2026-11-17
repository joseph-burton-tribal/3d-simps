import { VW_PAYLOADS, type VwPayloadId } from "../../data/vw-payloads";

interface PayloadSelectionProps {
  selectedId: VwPayloadId;
  onChange: (id: VwPayloadId) => void;
}

export function PayloadSelection({
  selectedId,
  onChange,
}: PayloadSelectionProps) {
  return (
    <div className="vehicle-selection">
      <label htmlFor="vw-payload">Payload</label>
      <select
        id="vw-payload"
        value={selectedId}
        onChange={(event) => onChange(event.target.value as VwPayloadId)}
      >
        {VW_PAYLOADS.map((payload) => (
          <option key={payload.id} value={payload.id}>
            {payload.label}
          </option>
        ))}
      </select>
    </div>
  );
}
