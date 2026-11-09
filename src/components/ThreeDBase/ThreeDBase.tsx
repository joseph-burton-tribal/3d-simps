import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type HTMLAttributes,
  type Ref,
} from "react";
import { buildPrString, parseConfiguratorUrl } from "./configurator";

// Configurator vehicle presets
// www.volkswagen.co.uk/en/new.html?---=%7B%22configurator_featureAppSection%22%3A%22%2F30260%2Flife%3FcarlineId%3D30260%26modelId%3DCS13AV%2524GPF2PF2%2524GPF3PF3%2524GPJAPJA%2524GP18P18%2524MSNRS2D%2524GWD1WD1%2524GWLAWLA%2524GYOSYOS%2524GZBPZBP%26modelVersion%3D1%26modelYear%3D2027%26salesGroupId%3D36799%26category%3Dprivate%26trimName%3DLife%26exteriorId%3DF14%2BP8P8%26interiorId%3DF56%2B%2B%2B%2B%2BEL%26buildabilityStatus%3Dbuildable%22%7D

const VEHICLE_PRESETS = [
  {
    name: "New T-Roc. Life",
    url: "https://www.volkswagen.co.uk/en/configurator.html/__app/30702/life.app?---=%7B%22configuration-step-navigation-service%22%3A%22%2F%3FconfigStep%3D%257B%2522context%2522%253A%252230702-36786-Life%2522%252C%2522selectedStep%2522%253A%2522exterior%2522%257D%22%7D&carlineId-app=30702&modelId-app=D413ME%24MBTSBZ2%24GPJBPJB%24GYOSYOS%24GZ09Z09%24MBOW1S1%24MKRM1Z2%24MEDW7AL&modelVersion-app=2&modelYear-app=2027&salesGroupId-app=36786&category-app=private&trimName-app=Life&exteriorId-app=F14+A6A6&interiorId-app=F56+++++AP&buildabilityStatus-app=buildable",
  },
  {
    name: "ID. Polo. Life",
    url: "https://www.volkswagen.co.uk/en/configurator.html/__app/30206/life.app?---=%7B%22configuration-step-navigation-service%22%3A%22%2F%3FconfigStep%3D%257B%2522context%2522%253A%252230206-36663-Life%2522%252C%2522selectedStep%2522%253A%2522exterior%2522%257D%22%7D&carlineId-app=30206&modelId-app=ES13CD%24MRUFNZ4%24GPJ1PJ1%24GPTEPTE%24GZ09Z09%24MLKC76H&modelVersion-app=3&modelYear-app=2027&salesGroupId-app=36663&category-app=private&trimName-app=Life&exteriorId-app=F14+R1R1&interiorId-app=F56+++++ZA&buildabilityStatus-app=buildable",
  },
  {
    name: "Golf Hatch. Life",
    url: "https://www.volkswagen.co.uk/en/configurator.html/__app/golf-hatch/life.app?---=%7B%22configuration-step-navigation-service%22%3A%22%2F%3FconfigStep%3D%257B%2522context%2522%253A%252230602-36687-Life%2522%252C%2522selectedStep%2522%253A%2522interior%2522%257D%22%7D&carlineId-app=30602&modelId-app=DA13BX%24MBTSBZ2%24GPG4PG4%24GPU2PU2%24GP18P18%24GRDARDA%24GYOSYOS&modelVersion-app=1&modelYear-app=2027&salesGroupId-app=36687&category-app=private&trimName-app=Life&exteriorId-app=F14+0R0R&interiorId-app=F56+++++BD&buildabilityStatus-app=buildable",
  },
  {
    name: "Taigo. Match",
    url: "https://www.volkswagen.co.uk/en/configurator.html/__app/30260/life.app?---=%7B%22configuration-step-navigation-service%22%3A%22%2F%3FconfigStep%3D%257B%2522context%2522%253A%252230260-36799-Life%2522%252C%2522selectedStep%2522%253A%2522exterior%2522%257D%22%7D&carlineId-app=30260&modelId-app=CS13AV%24GPF2PF2%24GPF3PF3%24GPJAPJA%24GP18P18%24MSNRS2D%24GWD1WD1%24GWLAWLA%24GYOSYOS%24GZBPZBP&modelVersion-app=1&modelYear-app=2027&salesGroupId-app=36799&category-app=private&trimName-app=Life&exteriorId-app=F14+P8P8&interiorId-app=F56+++++EL&buildabilityStatus-app=buildable",
  },
];

const DEFAULT_PR_STRING =
  "etrongt,F83RJ7,2024,6Y6Y,JN,E0A,6H0,1PA,2DS,0GA,4UF,GV0,6XD,EA0,5SL,GM4,5RU,0K9,1X1,J9K,A8F,6K8,2EB,J2B,1LS,6FA,B0A,KB3,0VC,QJ0,C10,IT3,IU1,JE3,IW3,GW0,1BH,3S0,3FG,NI8,7AA,5MT,7M0,7X2,6A0,1P0,VF0,8K4,FP1,2V1,5L0,7G0,F0A,9R0,0YB,0JC,N02,8T6,VC0,G1X,GH1,A51,0N1,6NJ,5KA,KH5,8IY,KS0,KM2,4L6,K8S,EK0,QR8,4D0,GB0,KA0,KK3,6P1,6W1,5K5,QQ0,NW1,NJ0,ES7,L0L,QZ7,8G9,70T,73P,76H,EH1,1XW,AV1,9VD,2C5,7HA,FM0,D2V,7UG,FZ0,GP0,FT0,AQ0,47K,9JA,ER1,7K3,I43,1G8,4QE,4X4,A00,8VM,QL1,VI6,9P6,N4M,3L5,4A3,0LW,JX0,8Y1,5XC,7Y0,6I3,4KC,FA0,2W0,4I3,9B0,B01,5D1,NT0,QV3,1EX,2Z8,1T3,GA2,Q1G,9ZX,EW0,4GF,2WA,0TD,4ZC,3A1,JS1,VH0,9M3";

type DeckAttributes = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  active?: boolean;
  market?: string;
  "pr-string"?: string;
  "camera-flight"?: "disabled" | "enabled";
  "config-id": string;
  features?: string;
  "streaming-stage"?: string;
  "multisession-disconnect"?: boolean;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "avp-3dws-deck": DeckAttributes;
    }
  }
}

interface DeckProps {
  configId: string;
  market: string;
  streamingStage: string;
}

export const ThreeDBase = ({ configId, market, streamingStage }: DeckProps) => {
  const deckRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [configuratorUrl, setConfiguratorUrl] = useState("");
  const [prString, setPrString] = useState(DEFAULT_PR_STRING);
  const [vehicleSummary, setVehicleSummary] = useState("");
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState("");

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const handleStreamError = (event: Event) => {
      const payload = (event as CustomEvent<unknown>).detail;
      const detail =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>)
          : {};
      const code = [detail.reason, detail.code, detail.errorCode].find(
        (value): value is string => typeof value === "string",
      );
      const message = [detail.message, detail.errorMessage].find(
        (value): value is string => typeof value === "string",
      );
      const fallback =
        typeof payload === "string"
          ? payload
          : "The AVP stream could not start. Check that this vehicle is available.";

      setStreamError([code, message].filter(Boolean).join(": ") || fallback);
      setActive(false);
    };

    deck.addEventListener("error", handleStreamError);
    deck.addEventListener("exception", handleStreamError);
    return () => {
      deck.removeEventListener("error", handleStreamError);
      deck.removeEventListener("exception", handleStreamError);
    };
  }, []);

  const handleConfiguratorSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const config = parseConfiguratorUrl(configuratorUrl);
      setPrString(buildPrString(config));
      setVehicleSummary(
        `${config.trimName} · ${config.modelId} · ${config.modelYear}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to read this configurator URL.",
      );
    }
  };

  const handleReset = () => {
    setConfiguratorUrl("");
    setPrString(DEFAULT_PR_STRING);
    setVehicleSummary("");
    setError("");
    setStreamError("");
  };

  const handleStart = () => {
    setStreamError("");
    setActive(true);
  };

  return (
    <div className="vehicle-workspace">
      <aside className="vehicle-controls" aria-label="Vehicle configuration">
        <h1>3D vehicle viewer</h1>
        <form className="configurator-form" onSubmit={handleConfiguratorSubmit}>
          <label htmlFor="vehicle-preset">Vehicle</label>
          <select
            id="vehicle-preset"
            value={
              VEHICLE_PRESETS.some((preset) => preset.url === configuratorUrl)
                ? configuratorUrl
                : ""
            }
            onChange={(event) => {
              setConfiguratorUrl(event.target.value);
              setError("");
            }}
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {VEHICLE_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.url}>
                {preset.name}
              </option>
            ))}
          </select>
          <label htmlFor="configurator-url">Volkswagen configurator URL</label>
          <textarea
            id="configurator-url"
            value={configuratorUrl}
            onChange={(event) => setConfiguratorUrl(event.target.value)}
            placeholder="Paste a Volkswagen configurator URL"
            rows={5}
            required
          />
          <div className="configuration-actions">
            <button type="submit">Apply configuration</button>
            <button type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
          {vehicleSummary && <p aria-live="polite">{vehicleSummary}</p>}
          {error && <p role="alert">{error}</p>}
        </form>

        <div className="stream-controls">
          <h2>Stream</h2>
          <div className="configuration-actions">
            <button type="button" disabled={active} onClick={handleStart}>
              Start stream
            </button>
            <button
              type="button"
              disabled={!active}
              onClick={() => setActive(false)}
            >
              Stop stream
            </button>
          </div>
          {streamError && <p role="alert">{streamError}</p>}
        </div>
      </aside>

      <div className="vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          config-id={configId}
          market={market}
          streaming-stage={streamingStage}
          multisession-disconnect
          features='{"showroomPro":true}'
          active={active}
          pr-string={prString}
        ></avp-3dws-deck>
      </div>
    </div>
  );
};
