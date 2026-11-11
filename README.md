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
invalid initial camera, and disables camera flight by default. These are demo settings,
not a production configuration. Streaming still depends on AVP access,
network connectivity, and available rendering capacity. The enabled Showroom Pro
feature also depends on its separate API and authentication service.

`Deck.tsx` provides `market="DEU"` for AVP market analytics and applies a partial
runtime feature override: camera navigation, environments, zoom, fullscreen,
Showroom Pro, and interior are enabled. AVP merges this partial override with the
server-side `config-id` configuration. The requested rotate behavior has no separate
feature flag in the published Deck feature list, so this demo leaves AVP's default
rotation behavior unchanged. Showroom Pro option data, authentication, and any
option-specific camera mappings still need to come from the integrating app.

The SDK is loaded once by `useDeckScript`, which waits for the custom element to be
registered before rendering it. The hook listens for readiness, connection,
initialization, disconnect, update, and fatal error events. Its status UI distinguishes
capacity (`readiness`) from a live stream (`connected` / `streamInitialized`). On
unmount, the demo sets the Deck's `active` property to `false` so an SPA route change
does not leave a stream running and consuming resources. The built-in AVP loading UI
is retained; a custom overlay can be added using those lifecycle events. AVP also
supports responsive font-size CSS variables and a `layout` override; assess those
against the host layout before forcing values. Production hosts must allow-list the
AVP and regional Kinesis Video domains listed in the [AVP network requirements](https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/docs/index.html).

Configurator URLs are no longer accepted or parsed. PR strings are passed to AVP
unchanged, including custom tokens such as `LC_PR_AEEXC034`.

<<<<<<< HEAD
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
=======
## Future Integration Spikes

- For new vehicles, the MSC configuration response includes `dataReferences`; its
  second entry points to the configurator response used to build the PR string.
  Convert the API's configuration/options into the AVP format and omit options marked
  `visible: false`. Stock-by-VIN and OPB are not configurable in this design.
- The carousel should open the full-screen viewer through a CTA. When configuration
  changes, request and persist a new MSC, validate that the configuration is buildable,
  then pass its generated PR string to AVP. This POC's presets demonstrate only the
  final PR-string handoff; they do not call the VW configuration APIs.
- Confirm Showroom Pro's API/auth flow and update behavior against real selectable
  options. Verify selected parts against the returned configuration, define stream
  outage/fallback behavior, and test mobile sizing, hidden-tab stream shutdown,
  stream performance, culling/quality options, and loading customization.
- OPB integration, tracking, and production error-handling requirements remain TBC.
>>>>>>> align-with-solution-design

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
