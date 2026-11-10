import "./App.css";

import ThreeDBase from "./components/ThreeDBase/";
import { useDeckScript } from "./hooks/useDeckScript";

function App() {
  const scriptStatus = useDeckScript();

  return (
    <>
      <section id="center">
        {scriptStatus === "ready" ? (
          <ThreeDBase />
        ) : scriptStatus === "error" ? (
          <p role="alert">
            Unable to load the AVP viewer. Check your connection and reload.
          </p>
        ) : (
          <p role="status">Loading viewer...</p>
        )}
      </section>
    </>
  );
}

export default App;
