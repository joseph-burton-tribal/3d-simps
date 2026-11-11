import { ApiResponseDeck } from "../components/ApiResponse/ApiResponseDeck";
import source from "../data/api-response-source.json";
import { useDeckScript } from "../hooks/useDeckScript";

export default function ParseApiResponse() {
  const scriptStatus = useDeckScript();

  return (
    <main id="center">
      {scriptStatus === "ready" ? (
        <ApiResponseDeck response={source} />
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
