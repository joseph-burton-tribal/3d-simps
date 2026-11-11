// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Deck } from "../components/Deck/Deck";
import { VEHICLE_PRESETS } from "../data/presets";
import { ApiResponseDeck } from "../components/ApiResponse/ApiResponseDeck";
import source from "../data/pr-string-source.json";
import { createPrString } from "../utils/prString";

afterEach(cleanup);

describe("API response viewer", () => {
  it("passes the derived PR string to AVP without showing Audi presets", () => {
    const { container, unmount } = render(
      <ApiResponseDeck response={source} />,
    );
    const deck = container.querySelector("avp-3dws-deck");
    if (!deck) throw new Error("API viewer did not render.");

    expect(deck.getAttribute("pr-string")).toBe(createPrString(source));
    expect(deck.getAttribute("market")).toBe("GBR");
    expect(deck.getAttribute("config-id")).toBe("vw-test");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByRole("img").getAttribute("src")).toBe(
      source.images[0].uri,
    );
    clickButton("Start stream");
    expect(screen.getByRole("status").textContent).toBe("Starting");
    expect(screen.queryByRole("img")).toBeNull();
    emitDeckEvent(deck, "streamInitialized", {});
    expect(screen.getByRole("status").textContent).toBe("Streaming");
    unmount();
    expect((deck as HTMLElement & { active?: boolean }).active).toBe(false);
  });

  it("disconnects the previous stream when a new API configuration arrives", () => {
    const { container, rerender } = render(
      <ApiResponseDeck response={source} />,
    );
    const previousDeck = container.querySelector("avp-3dws-deck");
    clickButton("Start stream");
    const response = {
      ...source,
      configuration: { ...source.configuration, exterior: "F14 2T2T" },
    };
    rerender(<ApiResponseDeck response={response} />);
    expect((previousDeck as HTMLElement & { active?: boolean }).active).toBe(
      false,
    );
    expect(
      container.querySelector("avp-3dws-deck")?.getAttribute("pr-string"),
    ).toBe(createPrString(response));
    expect(screen.getByRole("status").textContent).toBe("Idle");
  });

  it("shows parsing failures instead of mounting a viewer with invalid input", () => {
    const response = {
      ...source,
      derivative: { ...source.derivative, year: "" },
    };
    const { container } = render(<ApiResponseDeck response={response} />);
    expect(screen.getByRole("alert").textContent).toContain("model year");
    expect(container.querySelector("avp-3dws-deck")).toBeNull();
  });
});

function renderViewer() {
  const view = render(<Deck />);
  const deck = view.container.querySelector("avp-3dws-deck");
  if (!deck) throw new Error("Viewer did not render the Deck element.");
  return { ...view, deck };
}

function emitDeckEvent(deck: Element, type: string, detail: unknown) {
  act(() => {
    deck.dispatchEvent(new CustomEvent(type, { detail }));
  });
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("Deck controls and events", () => {
  it("starts idle with unknown capacity and the first preset", () => {
    const { deck } = renderViewer();

    expect(screen.getByRole("status").textContent).toBe("Idle");
    expect(screen.getAllByRole("definition")[0].textContent).toBe("Unknown");
    expect(deck.getAttribute("pr-string")).toBe(VEHICLE_PRESETS[0].prString);
    expect(
      screen
        .getByRole("button", { name: "Stop stream" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("enables the showroom feature baseline", () => {
    const { deck } = renderViewer();

    expect(deck.getAttribute("camera-flight")).toBe("disabled");
    expect(JSON.parse(deck.getAttribute("features") ?? "{}")).toEqual({
      cameraNavigation: true,
      environments: true,
      zoom: true,
      fullscreen: true,
      showroomPro: true,
      interior: true,
    });
  });

  it("stops the stream when the viewer unmounts", () => {
    const { deck, unmount } = renderViewer();

    clickButton("Start stream");
    unmount();

    expect((deck as HTMLElement & { active?: boolean }).active).toBe(false);
  });

  it("passes each preset string unchanged to the Deck and resets to the first", () => {
    const { deck } = renderViewer();

    for (const preset of VEHICLE_PRESETS) {
      fireEvent.change(screen.getByRole("combobox", { name: "Vehicle" }), {
        target: { value: preset.id },
      });
      expect(deck.getAttribute("pr-string")).toBe(preset.prString);
    }

    expect(screen.getAllByText("UI: vehicle-change")).toHaveLength(
      VEHICLE_PRESETS.length,
    );
    clickButton("Reset");
    expect(deck.getAttribute("pr-string")).toBe(VEHICLE_PRESETS[0].prString);
  });

  it("updates connection status from Deck events, not capacity reports", () => {
    const { deck } = renderViewer();

    clickButton("Start stream");
    expect(screen.getByRole("status").textContent).toBe("Starting");
    emitDeckEvent(deck, "readiness", { isReady: true });
    expect(screen.getAllByRole("definition")[0].textContent).toBe("Available");
    expect(screen.getByRole("status").textContent).toBe("Starting");

    emitDeckEvent(deck, "connected", {});
    expect(screen.getByRole("status").textContent).toBe("Connected");
    emitDeckEvent(deck, "streamInitialized", {});
    expect(screen.getByRole("status").textContent).toBe("Streaming");

    emitDeckEvent(deck, "readiness", { isReady: false });
    expect(screen.getAllByRole("definition")[0].textContent).toBe(
      "Unavailable",
    );
    expect(screen.getByRole("status").textContent).toBe("Streaming");
    emitDeckEvent(deck, "update:camera", { value: "MRV4" });
    expect(screen.getAllByRole("definition")[1].textContent).toBe("MRV4");
  });

  it("preserves errors through disconnect events and allows a clean retry", () => {
    const { deck } = renderViewer();

    clickButton("Start stream");
    emitDeckEvent(deck, "exception", {
      reason: "NO_INSTANCES_AVAILABLE",
      message: "No streaming instances are currently available.",
    });
    emitDeckEvent(deck, "disconnected", {});
    emitDeckEvent(deck, "update:active", { value: false });

    expect(screen.getByRole("status").textContent).toBe("Error");
    expect(screen.getByRole("alert").textContent).toContain(
      "NO_INSTANCES_AVAILABLE",
    );
    expect(
      screen
        .getByRole("button", { name: "Start stream" })
        .hasAttribute("disabled"),
    ).toBe(false);

    clickButton("Start stream");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Starting");
    clickButton("Stop stream");
    expect(screen.getByRole("status").textContent).toBe("Idle");
  });

  it("records one entry per event and keeps only the latest 20 payloads", () => {
    const { container, deck } = renderViewer();

    for (let index = 0; index < 25; index++) {
      emitDeckEvent(deck, "update:camera", { value: `camera-${index}` });
    }

    expect(container.querySelectorAll("details")).toHaveLength(20);
    expect(container.querySelector("details pre")?.textContent).toContain(
      "camera-24",
    );
    clickButton("Clear");
    expect(container.querySelectorAll("details")).toHaveLength(0);
    expect(screen.getByText("No events yet.")).toBeTruthy();
  });

  it("ignores malformed capacity, camera, and active-state payloads", () => {
    const { deck } = renderViewer();

    emitDeckEvent(deck, "readiness", { isReady: "yes" });
    emitDeckEvent(deck, "update:camera", null);
    emitDeckEvent(deck, "update:active", { value: "true" });

    expect(screen.getByRole("status").textContent).toBe("Idle");
    expect(screen.getAllByRole("definition")[0].textContent).toBe("Unknown");
    expect(screen.getAllByRole("definition")[1].textContent).toBe(
      "Not reported",
    );
  });

  it("removes every subscribed listener when the viewer unmounts", () => {
    const { deck, unmount } = renderViewer();
    const removeListener = vi.spyOn(deck, "removeEventListener");

    unmount();

    expect(removeListener.mock.calls.map(([type]) => type)).toEqual([
      "connected",
      "streamInitialized",
      "disconnected",
      "readiness",
      "error",
      "exception",
      "update:active",
      "update:camera",
      "update:pr-string",
      "update:camera-flight",
    ]);
  });
});
