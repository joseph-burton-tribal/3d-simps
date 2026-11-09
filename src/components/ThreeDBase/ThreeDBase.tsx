import { useState, type HTMLAttributes } from "react";

type DeckAttributes = HTMLAttributes<HTMLElement> & {
  active?: boolean;
  market?: string;
  "pr-string"?: string;
  "model-revision"?: string;
  "camera-flight"?: "disabled" | "enabled";
  "config-id": string;
  features?: string;
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
}

export const ThreeDBase = ({ configId, market }: DeckProps) => {
  const [active, setActive] = useState(false);

  return (
    <div>
      <button onClick={() => setActive(true)}>Start stream</button>
      <button onClick={() => setActive(false)}>Stop stream</button>

      <avp-3dws-deck
        config-id={configId}
        market={market}
        model-revision="MP1"
        features='{"zoom":true,"interior":false,"fullscreen":false}'
        camera-flight="enabled"
        active={active}
        pr-string="etrongt,F83RJ7,2024,6Y6Y,JN,E0A,6H0,1PA,2DS,0GA,4UF,GV0,6XD,EA0,5SL,GM4,5RU,0K9,1X1,J9K,A8F,6K8,2EB,J2B,1LS,6FA,B0A,KB3,0VC,QJ0,C10,IT3,IU1,JE3,IW3,GW0,1BH,3S0,3FG,NI8,7AA,5MT,7M0,7X2,6A0,1P0,VF0,8K4,FP1,2V1,5L0,7G0,F0A,9R0,0YB,0JC,N02,8T6,VC0,G1X,GH1,A51,0N1,6NJ,5KA,KH5,8IY,KS0,KM2,4L6,K8S,EK0,QR8,4D0,GB0,KA0,KK3,6P1,6W1,5K5,QQ0,NW1,NJ0,ES7,L0L,QZ7,8G9,70T,73P,76H,EH1,1XW,AV1,9VD,2C5,7HA,FM0,D2V,7UG,FZ0,GP0,FT0,AQ0,47K,9JA,ER1,7K3,I43,1G8,4QE,4X4,A00,8VM,QL1,VI6,9P6,N4M,3L5,4A3,0LW,JX0,8Y1,5XC,7Y0,6I3,4KC,FA0,2W0,4I3,9B0,B01,5D1,NT0,QV3,1EX,2Z8,1T3,GA2,Q1G,9ZX,EW0,4GF,2WA,0TD,4ZC,3A1,JS1,VH0,9M3"
      ></avp-3dws-deck>
    </div>
  );
};
