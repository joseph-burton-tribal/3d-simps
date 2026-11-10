# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

````js
export default defineConfig([
  # 3D Vehicle Viewer

  A React and TypeScript proof of concept using the AVP streaming web component.

  ## Run

  ```sh
  npm install
  npm run dev
````

Open the local URL printed by Vite. Choose one of the four Audi presets and
click **Start stream**. Changing the selection sends the preset's exact PR string
to the viewer immediately. **Reset** selects the first preset; it does not stop
an active stream. Use **Stop stream** to disconnect.

## Code

- `src/components/ThreeDBase/presets.ts` contains the preset IDs, labels, and PR strings.
- `src/components/ThreeDBase/ThreeDBase.tsx` manages selection, stream controls, and AVP events.
- `src/App.tsx` loads the external AVP script.

The viewer uses the `audi-test` demo configuration and its `prelive-euw1` stage.
It explicitly requests the listed `MRV1` camera instead of the demo configuration's
invalid initial camera. Other camera behavior follows the demo defaults. These are demo
settings, not a production configuration. Streaming still depends on AVP access,
network connectivity, and available rendering capacity. The enabled Showroom Pro
feature also depends on its separate API and authentication service.

Configurator URLs are no longer accepted or parsed. PR strings are passed to AVP
unchanged, including custom tokens such as `LC_PR_AEEXC034`.

## Checks

```sh
npm run build
npm run lint
```

    extends: [
