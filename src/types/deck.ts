import type { HTMLAttributes, Ref } from "react";

export type StreamStatus =
  | "idle"
  | "starting"
  | "connected"
  | "ready"
  | "disconnected"
  | "error";

export interface EventEntry {
  id: number;
  time: string;
  source: "UI" | "Deck";
  type: string;
  detail: string;
}

type DeckAttributes = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  active?: boolean;
  market?: string;
  "pr-string"?: string;
  camera?: string;
  "camera-flight"?: "disabled" | "enabled";
  "config-id": string;
  features?: string;
  "streaming-stage"?: string;
  "multisession-disconnect"?: boolean;
};

// Let TypeScript check the AVP custom element in JSX.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "avp-3dws-deck": DeckAttributes;
    }
  }
}
