# Global Regulatory Pathway Explorer

Compare how a health product moves from discovery to approval across 21 regulators and 13 product categories.

**Live site:** https://randomthingsonlineatsk-cloud.github.io/regulatory-pathway-explorer/

**Original version (Macaly):** https://macaly-wdudkdntiu579vs2jhhuidt0-prod.macaly-app.com. It stays online unchanged. New features are built only in this repository.

> This is a fictional, educational demonstration. Do not use it for real patient data, clinical decisions or regulatory submissions.

## Features
- 21 regulators, including FDA, Health Canada, EMA, MHRA, Swissmedic, TGA, PMDA, NMPA, CDSCO, the African Medicines Agency and WHO Prequalification
- 13 product categories: small molecule, biologic, vaccine, cell and gene therapy, pediatric, orphan, generic, biosimilar, medical device, diagnostic (IVD), herbal and traditional medicine, homeopathy and cosmetic
- A stage-by-stage pathway for each regulator and category, with the key documents for each stage
- Compare up to four regulators side by side, an illustrative timeline ranking, a regulator directory, a glossary and a search across every pathway
- **Device classification wizard** (new): describe a device once and see its class under the EU MDR (all 22 Annex VIII rules) or IVDR (rules 1 to 7) and in the US (classification regulation, 510(k), De Novo, PMA, HDE), with the rule that decides, the route, the documents and an indicative timeline
- A library of 15 fictional devices, from an adhesive strip to a pacemaker and from a urine cup to a donor HIV screen, and 5 scored missions at guided, standard and expert levels

## Phases of the classification wizard
| Phase | Scope | Status |
|---|---|---|
| 0 | Move from Macaly to GitHub Pages | Done |
| 1 | Engine, EU (MDR and IVDR) and US packs, side-by-side results, 15 devices, 5 missions | Done |
| 2 | India (Medical Devices Rules 2017), IVD branch in full, companion diagnostics | Planned |
| 3 | Software and AI, combination products, IMDRF lessons | Planned |
| 4 | UK, Canada, Australia, Japan, China and Switzerland; certificate | Planned |

## Run it locally
```
npm install
npm test
npm run dev
```
`npm run build` writes the static site to `dist/`. It uses relative paths, so it works from any GitHub Pages path.

## Tech stack
React, TypeScript, Vite and Tailwind CSS. It is a static site with no server and no sign-in. It was first built on Macaly Cloud and moved here in October 2026.

## Attribution
Created by **Khan Gulrez Shagufa Fazal Ahmed**.

If you reuse or adapt this project, please credit the original author and link back to https://github.com/randomthingsonlineatsk-cloud/regulatory-pathway-explorer. The Apache License 2.0 requires you to keep the `LICENSE` and `NOTICE` files with any copy you distribute.

## License
Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Khan Gulrez Shagufa Fazal Ahmed.
