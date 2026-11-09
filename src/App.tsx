import { useEffect } from "react";
import "./App.css";

import ThreeDBase from "./components/ThreeDBase/";

function App() {
  useEffect(() => {
    const script = document.createElement("script");

    script.src =
      "https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/avp-3dws-deck.js";
    script.type = "module";

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <section id="center">
        <ThreeDBase configId="audi-test" market="GBR" />
      </section>
    </>
  );
}

export default App;
