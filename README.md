# 3D Vehicle Viewer

A React and TypeScript proof of concept using the AVP streaming web component
(`<avp-3dws-deck>`). It has two routes: a demo driven by Audi PR-string presets,
and a viewer that derives its PR string from Volkswagen configurator and stock API
responses ("Configured" and "Stock" payloads).

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
- **Parse API response** (`/parse-api-response`): choose the **Configured**
  (`src/data/configured.json`) or **Stock** (`src/data/stock.json`) payload. The page
  shows the vehicle title, its generated PR string, stream controls, and events.
  Switching payload remounts the viewer idle with the new PR string.

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
    ApiResponse/PayloadSelection.tsx     Configured / Stock payload <select>
    StreamControls/StreamControls.tsx    Status, capacity, camera, start/stop (shared)
    EventHistory/EventHistory.tsx        Last 20 UI/Deck events (shared)
  hooks/
    useDeck.ts                    State, UI actions, and Deck event subscriptions
    useDeckScript.ts              Loads the SDK once and waits for element registration
  config/viewer.ts                DEMO_VIEWER_CONFIG and API_VIEWER_CONFIG
  data/presets.ts                 Audi preset IDs, labels, and PR strings
  data/vw-payloads.ts             Labels and imports for the two VW sample payloads
  data/configured.json            "Configured" payload (T-Cross Style Edition, D314BZ, MY2027)
  data/stock.json                 "Stock" payload (T-Roc Black Edition, D115LE, MY2025)
  types/deck.ts                   StreamStatus, EventEntry, and the JSX typing for avp-3dws-deck
  utils/create-vw-pr-string.ts    createVwPrString, getFinishCode, getPrCodes, normalizePrCode
```

`StreamControls` and `EventHistory` are shared by both `DeckControls` and
`ApiResponseControls`. `DeckControls` adds the preset `<select>` and Reset button on
top of them; `ParseApiResponse` passes `PayloadSelection` into `ApiResponseDeck` as
children, and `ApiResponseControls` renders it above the PR string readout.

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

`src/config/viewer.ts` defines one `ViewerConfig` per route. Both share
`BASE_VIEWER_CONFIG`, which carries the attributes the AVP 3dWS Solution Design v1.0
requires on every embed, and the full Showroom `features` baseline.

| Attribute                 | Value                                                       | Notes                                                                        |
| ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `config-id`               | `v-3DExhibition-default-2025` (VW) / `audi-test` (Audi demo) | Selects the server-side CMS config (cameras, environments, animations, etc.) |
| `streaming-stage`         | `prod-euw1`                                                 | Must be explicit; omitting it defaults to `qa-euw1`                         |
| `market`                  | `GBR` (VW) / `DEU` (Audi demo)                              | Sent as a matchmaker header with `brand` and `service` from the CMS config   |
| `content-lang`            | `en` (VW) / `de` (Audi demo)                                | UI language                                                                  |
| `multisession-disconnect` | `true`                                                      | Required by the design                                                       |
| `hide-consumption-data`   | `true`                                                      | Required by the design                                                       |
| `ave-message-timeout`     | `15`                                                        | Seconds before a hung AVE command raises an exception                        |
| `features`                | JSON, see below                                             | Deep-merged over the CMS `features`; attribute keys win                      |
| `active` / `pr-string`    | runtime                                                     | Set by `useDeck`; connection attributes above are present before `active`    |

`features` sets all twelve `DeckFeatureFlags` keys from the design's Showroom column:
`cameraNavigation`, `interior`, `environments`, `zoom`, `fullscreen`, `animations`,
`trunkAnimations`, `lightAnimations`, `animationSpots`, `cameraFlight`, `showroomPro`
are `true` and `close` is `false` (the host UI owns closing). They are all listed
explicitly rather than relying on CMS inheritance; `zoom` is the one key where the
VW CMS config says `false` and this override is what turns it on. For an OPB embed
the design uses `config-id="v-dga-default-my2025"` with `showroomPro: false`.

No `camera`, `camera-flight`, `design`, or `layout` attributes are set. The CMS
config decides the initial camera (`defaultCamera` for VW) and camera list; `camera`
is still typed in `src/types/deck.ts` for dynamic camera changes. `initial-camera`
is **not** a real attribute (`initialCamera` only exists inside the CMS config) and
was removed.

These values are hard-coded; there are no environment variables. Streaming still
depends on AVP access, network connectivity, and free rendering capacity on the
`brand`/`service`/`market` pool (the VW `3dexhibition` pool has reported as few as
one instance). Showroom Pro also depends on its own API and authentication service,
which this POC does not provide.

The SDK is loaded from
`https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/avp-3dws-deck.js`, which
redirects to the current versioned bundle. The design document names
`deck-bundle.js` at the same host; that path returns 403 and should not be used.
Production hosts must allow-list the AVP and regional Kinesis Video domains listed
in the [AVP network requirements](https://avp-3dws-deck.eu-west-1-web-streaming.avp.tech/docs/index.html).

Configurator URLs are not accepted or parsed. PR strings are passed to AVP
unchanged, including custom tokens such as `LC_PR_AEEXC034`.

## API Response Viewer

`ParseApiResponse` owns the selected payload (`configured` or `stock`, from
`src/data/vw-payloads.ts`) and renders `ApiResponseDeck` with that payload's response.
`ApiResponseDeck` calls `createVwPrString(response)`. On failure it renders the error
(with the payload selector still available) instead of mounting a Deck. On success it
renders `ParsedVehicleDeck` with `key={prString}`, so a different payload unmounts the
previous viewer (stopping its stream) and mounts the new vehicle idle. The response's
`exterior-front` image is shown as a preview while the stream is inactive; it is not a
live 3D render.

`src/utils/create-vw-pr-string.ts` exports `createVwPrString`, `getFinishCode`,
`getPrCodes`, and `normalizePrCode`. Both VW payload shapes are handled by the same
function and produce:

```text
salesGroupId,engineCode,year,exterior,interior,prCodes...
36613,D314BZ,2027,1C1C,WG,00A,0A2,0AS,...      (Configured)
34785,D115LE,2025,2T2T,OC,AV0,A9I,B0A,...      (Stock)
```

### Anatomy of a PR string

A PR string is a comma-separated list. The first five positions are fixed and
identify the vehicle; everything after them is a variable-length list of equipment
PR codes. Using the Configured (T-Cross) fixture:

```text
 36613 , D314BZ , 2027 , 1C1C , WG , 00A , 0A2 , 0AS , ... , ZBD
 ──┬──   ──┬───   ─┬──   ─┬──   ─┬   ─────────────┬──────────────
   │       │       │      │      │                │
   │       │       │      │      │                └─ PR codes (0..n)
   │       │       │      │      │                   every specItems[].pr, in document order
   │       │       │      │      │                   "MKSUKA1" -> "KA1"   (M/G + family + value)
   │       │       │      │      │                   each item's contentParts[] follow it
   │       │       │      │      │                   emitted once; F14/F56 items, codes in
   │       │       │      │      │                   replacedStandardSpecs[], and codes
   │       │       │      │      │                   starting with "U" are dropped
   │       │       │      │      │
   │       │       │      │      └─ Interior trim (2–4 chars)
   │       │       │      │         first specItems[].pr starting "F56"  "F56     WG" -> "WG"
   │       │       │      │         (falls back to configuration.interior)
   │       │       │      │
   │       │       │      └─ Exterior paint (2–4 chars)
   │       │       │         first specItems[].pr starting "F14"  "F14 1C1C" -> "1C1C"
   │       │       │         (falls back to configuration.exterior)
   │       │       │
   │       │       └─ Model year (4 digits)
   │       │          derivative.year
   │       │
   │       └─ Engine code (6 chars)
   │          derivative.derivativeId  "D314BZ-2027-MKSUKA1-…" -> text before the first "-"
   │
   └─ Sales group ID
      derivative.salesGroupId
```

| #   | Part           | Source field                                            | Normalisation                                                     | Example         |
| --- | -------------- | ------------------------------------------------------- | ----------------------------------------------------------------- | --------------- |
| 1   | Sales group ID | `derivative.salesGroupId`                               | none (alphanumeric)                                               | `36613`         |
| 2   | Engine code    | `derivative.derivativeId`                               | text before the first `-`, upper-cased                            | `D314BZ`        |
| 3   | Model year     | `derivative.year`                                       | none (4 digits)                                                   | `2027`          |
| 4   | Exterior       | `specItems[].pr` (`F14`), else `configuration.exterior` | strip `F14` prefix + padding                                      | `1C1C`          |
| 5   | Interior       | `specItems[].pr` (`F56`), else `configuration.interior` | strip `F56` prefix + padding                                      | `WG`            |
| 6+  | PR codes       | `specItems[].pr` + `specItems[].contentParts[]`         | strip `M`/`G` + family prefix; dedupe; drop `U*` and replaced specs | `00A`, `0A2`, … |

Positions 1–5 are validated and `createVwPrString` throws if any is missing or
malformed. Position 6 onwards is in `specItems` order and may be empty. The Audi
presets in `src/data/presets.ts` follow the same five-plus-options layout, with an
AVP model name (`etrongt`, `rsetrongt`) or numeric model ID (`50644`) in position 1.

The input type `VwVehicleResponse` needs `configuration` (optional `exterior` /
`interior`), `derivative.salesGroupId` / `.derivativeId` / `.year` / `.title`,
`specItems[]` with `pr` and optional `contentParts`, and optional
`replacedStandardSpecs[]`. Every `specItems` entry contributes a code whatever its
`visible` flag or `title` — AVP needs body, door, and rim codes that the API marks
`visible: false` or titles `"Missing text."`. Package children in `contentParts`
are emitted directly after their package. The Stock payload's extra top-level fields
(`buildable`, `exteriorMissing`, `interiorMissing`) and `configuration.extras`,
`monoselects`, `prices`, and `images` play no part in the PR string; the bare 3-char
tokens after the first `-` in a Stock `derivativeId` are likewise unused because the
same equipment is present in `specItems`.

Live rendering of the sample T-Cross and T-Roc against `v-3DExhibition-default-2025`
and the API-to-AVP code mapping still require verification against the VW service
configuration. No credentials are included in this repository.

## Data Sources (Showroom App and OPB)

The two fixtures stand in for the live fetches below. All four paths end at the same
configurator payload shape (`derivative`, `configuration`, `specItems`,
`replacedStandardSpecs`, `images`), so `createVwPrString` handles every case. Paths
were verified against `https://preprod.volkswagen.co.uk` (all return 200 with
`salesGroupId` and `year` as strings, as the parser expects).

| Surface   | Vehicle    | Step 1                                                              | Step 2 → configurator payload                                                             |
| --------- | ---------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Showroom  | Configured | `GET /api/car/v1/car/configuration/{MSC}?price=true&images=false`  | `GET {base}{summary.dataReferences[1]}` (already starts `/api/configurator/2.3/…`)        |
| Showroom  | Stock      | —                                                                   | `GET /api/stock-data-service/v1/stock/{VIN}/configuration`                                |
| OPB       | Configured | `GET /api/pdb/2.2/pdb/{brochureId}/{MSC}`                           | `GET {base}/api/configurator{capi.configurationEndpoint}` (value starts `/2.3/…`)         |
| OPB       | Stock      | `GET /api/pdb/2.2/pdb/{brochureId}/vin/{VIN}` → `stockVehicle.vin`  | `GET /api/stock-data-service/v1/stock/{VIN}/configuration`                                |

Notes:

- `MSC` is the Marketing Short Code. In the Showroom App every configuration change
  issues a new MSC once OKAPI confirms it is buildable; re-run the new payload through
  `createVwPrString` and update `pr-string` on the mounted element. The Deck diffs it
  over the open WebRTC channel without remounting. OPB configurations are static.
- The OPB PDB response also exposes `capi.configuratorEndpoint` (a bare
  `/{modelId}/{salesGroupId}/{derivativeId}/…` fragment). For configured vehicles it
  is equivalent to `configurationEndpoint`; for stock vehicles the configurator API
  returns 424 for it, so always use the VIN route for stock.
- Fixture provenance: `configured.json` is the Showroom Configured response for MSC
  `VHSTBGCQ`; `stock.json` is the stock-data-service response for VIN
  `WVGZZZA12SV083246`.

## Showroom App Integration Checklist

What this POC proves: payload → PR string, the attribute set, the event wiring in
`useDeck`, and a clean stop on unmount. The items below are required by the Solution
Design but are **not** implemented here and must be built in the Showroom App.

- **Pre-stream validation.** If the configurator or stock fetch fails (4xx/5xx/timeout)
  or `createVwPrString` throws, do not mount `<avp-3dws-deck>`; keep the 2D `images[]`
  carousel. The POC shows the parse error inline instead.
- **Readiness gate.** On `readiness` with `isReady: false`, hide the 3D CTA. The POC
  only displays the value.
- **Exception severity.** `exception` events carry `severity: "CRITICAL" | "NON_CRITICAL"`.
  CRITICAL codes (`AVE_CAR_NOT_INSTALLED`, `NO_INSTANCES_AVAILABLE`,
  `WEBRTC_CONNECTION_FAILED`, `AVE_SESSION_INITIALIZATION_FAILED`,
  `AVE_ENVIRONMENT_NOT_INSTALLED`, `CONFIGURATION_ERROR`, `PR_STRING_NOT_PROVIDED`)
  must fall back to the 2D carousel; NON_CRITICAL (for example an unsupported camera
  name) must only be logged. `useDeck` currently treats every `error`/`exception` as
  fatal and sets `active` to `false`.
- **Disconnect handling.** On `disconnected`, return to 2D or show a "Resume 3D" CTA.
- **Lifecycle release.** Remove `active` on unmount (done here), after 60 s with the
  tab hidden (`visibilitychange`), and after 60 s out of viewport
  (`IntersectionObserver`). Always keep `multisession-disconnect`.
- **Slow networks.** When `navigator.connection?.effectiveType` is `slow-2g`, `2g`,
  or `3g`, default to the 2D carousel and keep 3D behind an explicit CTA.
- **Showroom Pro sync.** The design asks the host to listen for
  `update:SelectConfiguration` to keep MSC state in step with in-stream selections.
  That event name does not exist in deck bundle v1.111.0; confirm the event with AVP
  before relying on it. `useDeck` listens for `update:active`, `update:camera`,
  `update:pr-string`, and `update:camera-flight`.
- **OPB variant.** Use `config-id="v-dga-default-my2025"` and `showroomPro: false`;
  all other attributes and flags are identical.
- **Custom loader and tracking.** Replace the built-in loading UI via the lifecycle
  events if required, and add the analytics events listed in the design (3D vs 2D
  time, interior views, camera switches, camera flights, live option changes).

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
cleanup, the attribute baseline (all twelve `features` flags, `content-lang`,
`hide-consumption-data`, `ave-message-timeout`, `multisession-disconnect`, and the
absence of `camera`/`camera-flight`/`initial-camera`), and the API viewer's PR
string, stream handover, and parse-error display, and switching between the
Configured and Stock payloads on the page. `src/utils/create-vw-pr-string.test.ts`
covers both fixtures' identity, finishes, and equipment counts, the `U` and
`replacedStandardSpecs` exclusions, `contentParts` unpacking and deduplication,
finish fallback to `configuration`, code normalization, and rejection of malformed
input. The tests do not download the SDK, allocate a streaming instance, or verify
live AVP rendering.
