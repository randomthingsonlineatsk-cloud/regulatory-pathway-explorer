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
- **India** (Medical Devices Rules, 2017): classes A to D under the First Schedule (Part I for devices, Part II for IVDs), and the licence each class needs: registration for class A non-sterile, non-measuring devices; MD-3 to MD-5 from the State Licensing Authority for class A and B manufacture; MD-7 to MD-9 from the Central Licensing Authority for class C and D; MD-14 to MD-15 for imports; and, with no predicate, MD-22 to MD-23 and MD-26 to MD-27 (devices) or MD-24 to MD-25 and MD-28 to MD-29 (new IVDs), with the time limits in the Rules
- **IVD branch**: near-patient and self-tests, CLIA categories in the US (waived, moderate or high complexity), and **companion diagnostics** linked to a fictional medicine (Kestrenib, from the Clinical Trial Simulator): the EU medicines authority consultation, FDA's contemporaneous approval, and India's new-IVD route
- A library of 23 fictional devices, from an adhesive strip to a pacemaker and from a urine cup to a companion diagnostic, and 9 scored missions at guided, standard and expert levels

## Phases of the classification wizard
| Phase | Scope | Status |
|---|---|---|
| 0 | Move from Macaly to GitHub Pages | Done |
| 1 | Engine, EU (MDR and IVDR) and US packs, side-by-side results, 15 devices, 5 missions | Done |
| 2 | India (Medical Devices Rules 2017), IVD branch in full with CLIA, companion diagnostics, 8 more devices, 4 missions | Done |
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
