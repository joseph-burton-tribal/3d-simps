import { useEffect, useState } from "react";

const DECK_SCRIPT_URL =
  "https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/avp-3dws-deck.js";

type ScriptStatus = "loading" | "ready" | "error";

export function useDeckScript(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() =>
    customElements.get("avp-3dws-deck") ? "ready" : "loading",
  );

  useEffect(() => {
    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${DECK_SCRIPT_URL}"]`,
    );
    const needsScript = !script && !customElements.get("avp-3dws-deck");
    if (needsScript) {
      script = document.createElement("script");
      script.src = DECK_SCRIPT_URL;
      script.type = "module";
    }

    const handleError = () => setStatus("error");
    script?.addEventListener("error", handleError);
    if (needsScript && script) document.head.appendChild(script);

    // Wait for registration before React renders the custom element.
    customElements.whenDefined("avp-3dws-deck").then(() => {
      if (!cancelled) setStatus("ready");
    });

    return () => {
      cancelled = true;
      script?.removeEventListener("error", handleError);
    };
  }, []);

  return status;
}
