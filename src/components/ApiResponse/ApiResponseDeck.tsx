import type { VehiclePreset } from "../../data/presets";
import { useDeck } from "../../hooks/useDeck";
import {
  createPrString,
  type VehicleApiResponse,
} from "../../utils/create-pr-string";
import { API_VIEWER_CONFIG as VIEWER_CONFIG } from "../../config/viewer";
import { ApiResponseControls } from "./ApiResponseControls";
import "../../types/deck";

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

  return (
    <div className="vehicle-workspace">
      <ApiResponseControls vehicle={vehicle} stream={stream} />
      <div className="vehicle-stage api-vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          active={stream.active}
          pr-string={vehicle.prString}
          multisession-disconnect={VIEWER_CONFIG.multisessionDisconnect}
          streaming-stage={VIEWER_CONFIG.streamingStage}
          camera-flight={VIEWER_CONFIG.cameraFlight}
          camera={VIEWER_CONFIG.initialCamera}
          features={VIEWER_CONFIG.features}
          config-id={VIEWER_CONFIG.configId}
          market={VIEWER_CONFIG.market}
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
