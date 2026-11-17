import { useState } from "react";
import { ApiResponseDeck } from "../components/ApiResponse/ApiResponseDeck";
import { PayloadSelection } from "../components/ApiResponse/PayloadSelection";
import { VW_PAYLOADS, type VwPayloadId } from "../data/vw-payloads";
import { useDeckScript } from "../hooks/useDeckScript";

export default function ParseApiResponse() {
  const scriptStatus = useDeckScript();
  const [payloadId, setPayloadId] = useState<VwPayloadId>(VW_PAYLOADS[0].id);
  const payload =
    VW_PAYLOADS.find((candidate) => candidate.id === payloadId) ??
    VW_PAYLOADS[0];

  return (
    <main id="center">
      {scriptStatus === "ready" ? (
        <ApiResponseDeck response={payload.response}>
          <PayloadSelection selectedId={payloadId} onChange={setPayloadId} />
        </ApiResponseDeck>
      ) : scriptStatus === "error" ? (
        <p role="alert">
          Unable to load the AVP viewer. Check your connection and reload.
        </p>
      ) : (
        <p role="status">Loading viewer...</p>
      )}
    </main>
  );
}
