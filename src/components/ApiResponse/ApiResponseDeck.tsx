import type { ReactNode } from "react";
import type { VehiclePreset } from "../../data/presets";
import type { VwPayload } from "../../data/vw-payloads";
import { useDeck } from "../../hooks/useDeck";
import { createVwPrString } from "../../utils/create-vw-pr-string";
import { API_VIEWER_CONFIG as VIEWER_CONFIG } from "../../config/viewer";
import { ApiResponseControls } from "./ApiResponseControls";
import "../../types/deck";

interface ApiResponseDeckProps {
  response: VwPayload["response"];
  // Rendered at the top of the controls panel, e.g. a payload selector.
  children?: ReactNode;
}

function ParsedVehicleDeck({
  vehicle,
  image,
  children,
}: {
  vehicle: VehiclePreset;
  image?: string;
  children?: ReactNode;
}) {
  const { deckRef, ...stream } = useDeck([vehicle]);

  return (
    <div className="vehicle-workspace">
      <ApiResponseControls vehicle={vehicle} stream={stream}>
        {children}
      </ApiResponseControls>
      <div className="vehicle-stage api-vehicle-stage" aria-label="3D vehicle">
        <avp-3dws-deck
          ref={deckRef}
          active={stream.active}
          pr-string={vehicle.prString}
          multisession-disconnect={VIEWER_CONFIG.multisessionDisconnect}
          hide-consumption-data={VIEWER_CONFIG.hideConsumptionData}
          ave-message-timeout={VIEWER_CONFIG.aveMessageTimeout}
          features={VIEWER_CONFIG.features}
          config-id={VIEWER_CONFIG.configId}
          streaming-stage={VIEWER_CONFIG.streamingStage}
          market={VIEWER_CONFIG.market}
          content-lang={VIEWER_CONFIG.contentLang}
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

export function ApiResponseDeck({ response, children }: ApiResponseDeckProps) {
  let prString: string;
  try {
    prString = createVwPrString(response);
  } catch (error) {
    return (
      <div className="vehicle-workspace">
        <aside
          className="vehicle-controls"
          aria-label="API vehicle configuration"
        >
          {children}
          <p role="alert">
            Unable to parse vehicle:{" "}
            {error instanceof Error ? error.message : "Invalid API response."}
          </p>
        </aside>
      </div>
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
    >
      {children}
    </ParsedVehicleDeck>
  );
}
