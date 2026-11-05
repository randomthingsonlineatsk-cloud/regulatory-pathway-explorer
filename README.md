# Global Regulatory Pathway Explorer: original Macaly version

This branch holds the original version of the app, exactly as it was built on Macaly Cloud (TanStack Start, React, Tailwind CSS), moved to GitHub without feature changes. It is a static app with no backend: 21 regulators, 13 product categories, a stage-by-stage pathway, side-by-side comparison and a timeline chart.

The [`main` branch](https://github.com/randomthingsonlineatsk-cloud/regulatory-pathway-explorer) is the newer, extended version (device classification wizard and regional packs). It is a separate rebuild, not an upgrade of this code, and keeps all of this version's content. The extended version is live at https://regulatory-pathway-explorer.randomthingsonlineatsk.workers.dev and https://randomthingsonlineatsk-cloud.github.io/regulatory-pathway-explorer/.

> This is a fictional, educational demonstration. Do not use it for real patient data, clinical decisions or regulatory submissions.

## Run locally
```
npm install --legacy-peer-deps
npm run dev
```

## Deploy (Cloudflare Workers)
- Production branch: `macaly-original`
- Build variable: `NITRO_PRESET=node-server`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Deploy command: `npx wrangler deploy --assets .output/public --name regulatory-pathway-explorer-original --compatibility-date 2026-01-01`

## Attribution
Created by **Khan Gulrez Shagufa Fazal Ahmed**.

If you reuse or adapt this project, please credit the original author and link back to https://github.com/randomthingsonlineatsk-cloud/regulatory-pathway-explorer. The Apache License 2.0 requires you to keep the `LICENSE` and `NOTICE` files with any copy you distribute.

## License
Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Khan Gulrez Shagufa Fazal Ahmed.
