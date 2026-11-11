import type { VehiclePreset } from "../../data/presets";
import { useDeck } from "../../hooks/useDeck";
import { createPrString, type VehicleApiResponse } from "../../utils/prString";
import { VIEWER_CONFIG } from "../Deck/viewerConfig";
import { ApiResponseControls } from "./ApiResponseControls";
import "../Deck/deckTypes";

type ApiResponse = VehicleApiResponse & {
  images?: { rel: string; uri: string }[];
};

function ParsedVehicleDeck({
  vehicle,
  image,
}: {
  vehicle: VehiclePreset;
  image?: string;
}) {
  const { deckRef, ...stream } = useDeck([vehicle]);

  console.log(vehicle.prString);
  return (
    <div className="vehicle-workspace">
      <ApiResponseControls vehicle={vehicle} stream={stream} />
      <div className="vehicle-stage api-vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          active={stream.active}
          pr-string={vehicle.prString}
          multisession-disconnect={VIEWER_CONFIG.multisessionDisconnect}
          streaming-stage={
            import.meta.env.VITE_VW_AVP_STREAMING_STAGE ||
            VIEWER_CONFIG.streamingStage
          }
          camera-flight={VIEWER_CONFIG.cameraFlight}
          camera={VIEWER_CONFIG.initialCamera}
          features={VIEWER_CONFIG.features}
          config-id={import.meta.env.VITE_VW_AVP_CONFIG_ID || "vw-test"}
          market="GBR"
        ></avp-3dws-deck>
        {!stream.active && image && (
          <img
            className="api-vehicle-preview"
            src={image}
            alt={vehicle.label}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ApiResponseDeck({ response }: { response: ApiResponse }) {
  let prString: string;
  try {
    prString = createPrString(response);
  } catch (error) {
    return (
      <p role="alert">
        Unable to parse vehicle:{" "}
        {error instanceof Error ? error.message : "Invalid API response."}
      </p>
    );
  }

  return (
    <ParsedVehicleDeck
      key={prString}
      vehicle={{
        id: response.derivative.derivativeId,
        label: response.derivative.title,
        prString,
      }}
      image={
        response.images?.find((image) => image.rel === "exterior-front")?.uri
      }
    />
  );
}
