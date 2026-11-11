import Deck from "../components/Deck/";
import { useDeckScript } from "../hooks/useDeckScript";

export default function DefaultDemo() {
  const scriptStatus = useDeckScript();

  return (
    <section id="center">
      {scriptStatus === "ready" ? (
        <Deck />
      ) : scriptStatus === "error" ? (
        <p role="alert">
          Unable to load the AVP viewer. Check your connection and reload.
        </p>
      ) : (
        <p role="status">Loading viewer...</p>
      )}
    </section>
  );
}
