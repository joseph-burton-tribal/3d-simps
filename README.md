# 3D Vehicle Viewer

A React and TypeScript proof of concept using the AVP streaming web component
(`<avp-3dws-deck>`). It has two routes: a demo driven by Audi PR-string presets,
and a viewer that derives its PR string from a Volkswagen configurator API response.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The nav bar switches between two pages;
`/` and unknown paths redirect to `/default-demo`.

- **Default demo** (`/default-demo`): choose one of the four Audi presets and click
  **Start stream**. Changing the selection sends the preset's exact PR string to the
  viewer immediately. **Reset** selects the first preset; it does not stop an active
  stream. Use **Stop stream** to disconnect.
- **Parse API response** (`/parse-api-response`): shows the vehicle from
  `src/data/api-response-source.json`, its generated PR string, stream controls, and
  events. There is no preset selector.

Each page loads the AVP SDK with `useDeckScript` and shows a loading message or a
script-loading error until the custom element is registered.

## Code

```text
src/
  main.tsx                        React root wrapped in BrowserRouter
  App.tsx                         Nav bar and route table
  pages/
    DefaultDemo.tsx               Loads the SDK, then renders <Deck />
    ParseApiResponse.tsx          Loads the SDK, then renders <ApiResponseDeck />
  components/
    Deck/Deck.tsx                 Preset viewer: connects useDeck to the custom element
    Deck/DeckControls.tsx         Preset selector + StreamControls + EventHistory
    ApiResponse/ApiResponseDeck.tsx      Parses a response, then mounts the viewer
    ApiResponse/ApiResponseControls.tsx  PR string readout + StreamControls + EventHistory
    StreamControls/StreamControls.tsx    Status, capacity, camera, start/stop (shared)
    EventHistory/EventHistory.tsx        Last 20 UI/Deck events (shared)
  hooks/
    useDeck.ts                    State, UI actions, and Deck event subscriptions
    useDeckScript.ts              Loads the SDK once and waits for element registration
  config/viewer.ts                DEMO_VIEWER_CONFIG and API_VIEWER_CONFIG
  data/presets.ts                 Audi preset IDs, labels, and PR strings
  data/api-response-source.json   Sample configurator response (T-Cross, MY2027)
  types/deck.ts                   StreamStatus, EventEntry, and the JSX typing for avp-3dws-deck
  utils/create-pr-string.ts       createPrString, getVisiblePrCodes, normalizePrCode
```

`StreamControls` and `EventHistory` are shared by both `DeckControls` and
`ApiResponseControls`. `DeckControls` adds the preset `<select>` and Reset button on
top of them.

## State and Events

```text
UI action -> hook updates state -> React updates Deck properties
Deck event -> hook updates state -> React updates the UI
```

`useDeck(vehicles = VEHICLE_PRESETS)` owns all viewer state for one Deck instance.
Its initial `selectedVehicle` is `vehicles[0]`; `Deck` uses the Audi presets, and
`ApiResponseDeck` passes a single-item array containing the parsed vehicle.

React callback props, such as `onVehicleChange`, are functions passed to a child
component. They run when that component calls them. Deck events, such as
`connected`, are native `CustomEvent`s emitted by AVP. The hook subscribes with
`addEventListener`, reads the payload from `event.detail`, and removes its listeners
when the component unmounts.

- `active` controls whether the Deck should run a stream. It also follows AVP's `update:active` events; it is not proof of a working connection.
- `status` describes the connection lifecycle: idle, starting, connected, streaming, disconnected, or error.
- `hasCapacity` is the latest server availability reported by the `readiness` event. `null` means unknown. The SDK calls this payload field `isReady`; we give the React state a clearer name.
- `currentCamera` follows `update:camera` events and is cleared on stop, disconnect, or error.

For example, Start sets `active` to `true` and `status` to `starting`. AVP's
`connected` event changes the status to `connected`; `streamInitialized` changes
it to `ready`, displayed as **Streaming**. A capacity report never marks the
connection as streaming. An `error` or `exception` event sets `status` to `error`
and keeps that status through a following `disconnected` event, so the message
stays visible until the user retries.

Selecting a vehicle updates `selectedVehicle`. React then passes its exact
`prString` to the Deck. The `UI: vehicle-change` history entry records the request,
not confirmation that AVP loaded the vehicle. History keeps the latest 20 UI and
Deck events; expand an entry to inspect its payload.

On unmount, the hook sets the Deck's `active` property to `false` so an SPA route
change does not leave a stream running and consuming resources.

## Viewer Settings

`src/config/viewer.ts` defines one `ViewerConfig` per route. Both share a base:
`MRV1` initial camera, `multisession-disconnect` on, `camera-flight="disabled"`, and a
partial `features` override enabling camera navigation, environments, zoom,
fullscreen, Showroom Pro, and interior. AVP merges this override with the server-side
`config-id` configuration.

| Route | Export | `config-id` | `market` | `streaming-stage` |
| --- | --- | --- | --- | --- |
| `/default-demo` | `DEMO_VIEWER_CONFIG` | `audi-test` | `DEU` | `prelive-euw1` |
| `/parse-api-response` | `API_VIEWER_CONFIG` | `v-3DExhibition-default-2025` | `GBR` | `prod-euw1` |

These values are hard-coded; there are no environment variables. They are demo
settings, not a production configuration. Streaming still depends on AVP access,
network connectivity, and available rendering capacity. The enabled Showroom Pro
feature also depends on its separate API and authentication service. The requested
rotate behavior has no separate feature flag in the published Deck feature list, so
AVP's default rotation behavior is left unchanged. Showroom Pro option data,
authentication, and any option-specific camera mappings still need to come from the
integrating app.

The built-in AVP loading UI is retained; a custom overlay can be added using the
lifecycle events. AVP also supports responsive font-size CSS variables and a `layout`
override; assess those against the host layout before forcing values. Production
hosts must allow-list the AVP and regional Kinesis Video domains listed in the
[AVP network requirements](https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/docs/index.html).

Configurator URLs are not accepted or parsed. PR strings are passed to AVP
unchanged, including custom tokens such as `LC_PR_AEEXC034`.

## API Response Viewer

`ApiResponseDeck` calls `createPrString(response)`. On failure it renders the error
instead of mounting a Deck. On success it renders `ParsedVehicleDeck` with
`key={prString}`, so a different response unmounts the previous viewer (stopping its
stream) and mounts the new vehicle idle. The response's `exterior-front` image is
shown as a preview while the stream is inactive; it is not a live 3D render.

`src/utils/create-pr-string.ts` exports `createPrString`, `getVisiblePrCodes`, and
`normalizePrCode`. The conversion follows the preset format:

```text
modelId,salesType,year,exterior,interior,visibleOptionCodes...
30251,D314BZ,2027,1C1C,WG,0TD,...
```

The input type `VehicleApiResponse` needs `configuration.exterior` / `.interior`,
`derivative.modelId` / `.derivativeId` / `.year` / `.title`, and `specItems[]` with
`pr` and `visible`. The sales type is the first segment of `derivativeId`. Colour
values come from `configuration.exterior` (`F14 1C1C` -> `1C1C`) and
`configuration.interior` (`F56     WG` -> `WG`), with their F14/F56 family prefixes
and padding removed. Only `specItems` explicitly marked `visible: true` contribute
options; M/G-prefixed family codes (`MZFM0TD`) become their final three-character
PR value (`0TD`). Duplicates and colour spec items are excluded. Hidden specs,
`replacedStandardSpecs`, `monoselects`, and derivative package suffixes are not
appended. Selected extras are expected to appear in the visible `specItems`;
`configuration.extras` is not read.

Stock/order-style responses (`modelCode`, `modelYear`, `paint`, `upholstery`,
`extensions`) use a different shape and are not supported without an adapter.

Live rendering of the sample T-Cross against `v-3DExhibition-default-2025` and the
API-to-AVP code mapping still require verification against the VW service
configuration. No credentials are included in this repository.

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

## Checks

```sh
npm test          # vitest run
npm run test:watch
npm run build     # tsc -b && vite build
npm run lint      # eslint .
```

`src/hooks/useDeck.test.tsx` renders both viewers in jsdom and dispatches Deck
events. It covers preset selection and reset, status and capacity transitions,
error persistence and retry, event history limits, malformed payloads, listener
cleanup, the feature baseline, and the API viewer's PR string, stream handover, and
parse-error display. `src/utils/create-pr-string.test.ts` covers the fixture's
identity and colours, code normalization, hidden/duplicate exclusion, and rejection
of malformed input. The tests do not download the SDK, allocate a streaming
instance, or verify live AVP rendering.
