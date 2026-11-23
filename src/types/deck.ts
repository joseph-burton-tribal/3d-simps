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
  "pr-string"?: string;
  "multisession-disconnect"?: boolean;
  "hide-consumption-data"?: boolean;
  "ave-message-timeout"?: number;
  features?: string;
  "config-id": string;
  "streaming-stage"?: string;
  market?: string;
  "content-lang"?: string;
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
