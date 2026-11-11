# 3D Vehicle Viewer

A React and TypeScript proof of concept using the AVP streaming web component.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Choose one of the four Audi presets and
click **Start stream**. Changing the selection sends the preset's exact PR string
to the viewer immediately. **Reset** selects the first preset; it does not stop
an active stream. Use **Stop stream** to disconnect.

## Code

- `src/data/presets.ts` contains the preset IDs, labels, and PR strings.
- `src/components/Deck/Deck.tsx` connects the hook to the UI and keeps viewer settings in `VIEWER_CONFIG`.
- `src/components/Deck/DeckControls.tsx` renders vehicle selection, stream status, and event history.
- `src/components/Deck/deckTypes.ts` defines the shared types and custom-element attributes.
- `src/hooks/useDeck.ts` manages state, UI actions, and Deck event subscriptions.
- `src/hooks/useDeckScript.ts` loads the SDK once and waits for custom-element registration.
- `src/App.tsx` shows the viewer, a loading message, or a script-loading error.

## State and Events

```text
UI action -> hook updates state -> React updates Deck properties
Deck event -> hook updates state -> React updates the UI
```

React callback props, such as `onVehicleChange`, are functions passed to a child
component. They run when that component calls them. Deck events, such as
`connected`, are native `CustomEvent`s emitted by AVP. The hook subscribes with
`addEventListener`, reads the payload from `event.detail`, and removes its listeners
when the component unmounts.

- `active` controls whether the Deck should run a stream. It also follows AVP's `update:active` events; it is not proof of a working connection.
- `status` describes the connection lifecycle: idle, starting, connected, streaming, disconnected, or error.
- `hasCapacity` is the latest server availability reported by the `readiness` event. `null` means unknown. The SDK calls this payload field `isReady`; we give the React state a clearer name.

For example, Start sets `active` to `true` and `status` to `starting`. AVP's
`connected` event changes the status to `connected`; `streamInitialized` changes
it to `ready`, displayed as **Streaming**. A capacity report never marks the
connection as streaming.

Selecting a vehicle updates `selectedVehicle`. React then passes its exact
`prString` to the Deck. The `UI: vehicle-change` history entry records the request,
not confirmation that AVP loaded the vehicle. History keeps the latest 20 UI and
Deck events; expand an entry to inspect its payload.

## Demo Settings

The viewer uses the `audi-test` demo configuration and its `prelive-euw1` stage.
It explicitly requests the listed `MRV1` camera instead of the demo configuration's
invalid initial camera. Other camera behavior follows the demo defaults. These are demo
settings, not a production configuration. Streaming still depends on AVP access,
network connectivity, and available rendering capacity. The enabled Showroom Pro
feature also depends on its separate API and authentication service.

Configurator URLs are no longer accepted or parsed. PR strings are passed to AVP
unchanged, including custom tokens such as `LC_PR_AEEXC034`.

## Solution Design Reference

Applied from the AVP 3dWS Solution Design (11-11-26) and the AVP Deck docs:

- **Features:** `FEATURES` in `Deck.tsx` enables camera navigation, environments, zoom, full screen, interior and Showroom Pro. Rotate is on by default. Showroom Pro is for the Showroom app, not the brochure.
- **Market:** `market` is an ISO alpha-3 code (`GBR`) so AVP can report analytics per market.
- **Loading:** the Deck shows its own loader, so the app only overlays failures (`exception` event) on the stage. The document lists `readiness` for loading too, but the app shows it as capacity instead.
- **Stopping streams:** in a single-page app the SDK keeps streaming after unmount, so `useDeck` removes `active` on cleanup.

Not done yet:

- **PR string from the configurator API.** The document says to build it from the second `dataReferences` entry (`/api/configurator/2.3/configuration/...`), dropping items with `"visible": false`. That needs a sample response, which I haven't seen. A string guessed from the derivative ID is not validated.
- **Cost.** The document asks whether a stream in a hidden tab should stop. That is a decision, so nothing is implemented.
- **Responsive and mobile.** The Deck sizes its UI with `--deck-fontsize-min`, `--deck-fontsize-preferred` and `--deck-fontsize-max`. If it covers half the page width, halve the `vw` part of the preferred value. The document also mentions a `--deck-loading-screen` variable, which I haven't verified.
- **Production.** The test configs (`audi-test`, `vw-test`, `lamborghini-test`) are not for production, so a real project needs its own config ID. Allow-list `*.avp.tech` and the `*.kinesisvideo.<region>.amazonaws.com` domains listed in the Deck docs.
- **Error handling, tracking, brochure.** All marked TBC in the document.

## Checks

```sh
npm test
npm run build
npm run lint
```

The tests render the viewer controls in a simulated DOM and dispatch Deck events.
They cover selection, status, capacity, retries, event history, and listener cleanup
without downloading the SDK or allocating a remote streaming instance. They do not
verify live AVP rendering or server availability.
