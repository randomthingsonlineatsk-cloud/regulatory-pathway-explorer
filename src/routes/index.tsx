import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/')({ component: App })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RegulatorKey =
  | 'FDA' | 'HC' | 'EMA' | 'MHRA' | 'SWISSMEDIC' | 'TGA' | 'PMDA' | 'NMPA'
  | 'CDSCO' | 'HSA' | 'MFDS' | 'ANVISA' | 'COFEPRIS' | 'SFDA' | 'SAHPRA' | 'WHO_PQ'
  | 'AMA' | 'NAFDAC' | 'ANMAT' | 'BPOM' | 'UAE_MOHAP'

type ProductCategory =
  | 'small-molecule' | 'biologic' | 'vaccine' | 'cell-gene' | 'pediatric' | 'orphan'
  | 'generic' | 'biosimilar' | 'device' | 'diagnostic' | 'herbal' | 'homeopathy' | 'cosmetic'

type PathwayShape = 'trial' | 'abbreviated' | 'device' | 'herbal' | 'cosmetic' | 'homeopathy'

interface RegulatorParams {
  key: RegulatorKey
  name: string
  fullName: string
  region: string
  color: string
  confidence: 'high' | 'moderate'
  ctaName: string
  ctaAuthority: string
  ctaTimeline: string
  ctaMonths: number | null
  maName: string
  maAuthority: string
  maTimeline: string
  maMonths: number | null
  deviceClasses: string
  deviceRoute: string
  deviceAuthority: string
  ivdNote: string
  herbalRoute: string
  herbalAuthority: string
  herbalNote: string
  homeopathyRoute: string
  homeopathyAuthority: string
  genericRoute: string
  biosimilarRoute: string
  pediatricProgram: string
  orphanProgram: string
  cosmeticRoute: string
  cosmeticAuthority: string
  parentMinistry: string
  keyCommittees: string
  notableScope: string
  funFact: string
}

interface Stage {
  id: string
  title: string
  detail: string
  authority?: string
  documents: string[]
}

const GENERIC_HOMEOPATHY = 'No dedicated homeopathy-specific framework; treated under the general drug or traditional/complementary-medicine pathway depending on the jurisdiction\u2019s classification rules.'

// ---------------------------------------------------------------------------
// Regulator data
// ---------------------------------------------------------------------------

const REGULATORS: RegulatorParams[] = [
  {
    key: 'FDA', name: 'FDA', fullName: 'U.S. Food and Drug Administration', region: 'North America', color: 'hsl(208 85% 58%)', confidence: 'high',
    ctaName: 'IND (Investigational New Drug)', ctaAuthority: 'FDA CDER/CBER', ctaTimeline: '30-day review, trial may start if no clinical hold', ctaMonths: 1,
    maName: 'NDA / BLA', maAuthority: 'FDA CDER/CBER', maTimeline: '10 months standard / 6 months priority (PDUFA goal)', maMonths: 10,
    deviceClasses: 'Class I / II / III', deviceRoute: '510(k) (I/II), PMA (III), or De Novo for novel low-moderate risk devices', deviceAuthority: 'FDA CDRH',
    ivdNote: 'Same CDRH framework; most IVDs are Class II via 510(k), higher-risk via PMA.',
    herbalRoute: 'No dedicated traditional-use pathway', herbalAuthority: 'FDA (dietary supplements under DSHEA, or full NDA if a drug claim is made)',
    herbalNote: 'Most herbal products are marketed as dietary supplements (no premarket approval, no disease claims). A drug claim forces the full small-molecule pathway, though FDA\u2019s Botanical Drug Development guidance allows some manufacturing flexibility.',
    homeopathyRoute: 'FDA historically exercised broad enforcement discretion under a 1988 Compliance Policy Guide (CPG 400.400), allowing homeopathic drugs to be marketed without premarket approval if they met labeling/formulation conditions. FDA withdrew CPG 400.400 in October 2019 and shifted to a risk-based enforcement priority approach, increasing scrutiny of products claiming to treat serious conditions, delivered by injection or intranasally, or aimed at vulnerable populations — without yet creating a formal premarket approval requirement.',
    homeopathyAuthority: 'FDA (risk-based enforcement priority, not a premarket approval program)',
    genericRoute: 'ANDA (Hatch-Waxman, bioequivalence-based)', biosimilarRoute: '351(k) pathway (abbreviated licensure vs. a reference product)',
    pediatricProgram: 'PREA (Pediatric Research Equity Act) requires a pediatric assessment for most new-active-ingredient applications unless waived. BPCA (Best Pharmaceuticals for Children Act) separately offers 6 months\u2019 additional marketing exclusivity for sponsors who voluntarily complete pediatric studies on FDA\u2019s written request.',
    orphanProgram: 'Orphan Drug Designation via the Office of Orphan Products Development, for diseases affecting fewer than 200,000 US persons (or no reasonable expectation of cost recovery above that). Grants a 25% clinical-trial tax credit, a PDUFA fee waiver, and 7 years\u2019 market exclusivity upon approval.',
    cosmeticRoute: 'No premarket approval required (except color additives). Since the Modernization of Cosmetics Regulation Act (MoCRA, 2022), facilities must register and products must be listed with FDA, plus safety substantiation and adverse-event reporting — notification-based, not a premarket review.',
    cosmeticAuthority: 'FDA Office of Cosmetics and Colors',
    parentMinistry: 'U.S. Department of Health and Human Services', keyCommittees: 'Therapeutic-area-specific Advisory Committees',
    notableScope: 'Regulates drugs, biologics, devices, food, and tobacco — but not cosmetics beyond basic safety (no premarket approval).',
    funFact: 'FDA can take up to a year to review a standard new drug application, but a "priority review" voucher — sometimes sold between companies for over $100 million — can cut that to 6 months.',
  },
  {
    key: 'HC', name: 'Health Canada', fullName: 'Health Canada', region: 'North America', color: 'hsl(0 70% 62%)', confidence: 'high',
    ctaName: 'Clinical Trial Application (CTA)', ctaAuthority: 'Health Canada', ctaTimeline: '30-day default authorization if no objection raised', ctaMonths: 1,
    maName: 'New Drug Submission (NDS)', maAuthority: 'Health Canada', maTimeline: '~300-day standard review target', maMonths: 10,
    deviceClasses: 'Class I / II / III / IV', deviceRoute: 'Medical Device Licence (MDL); higher classes require MDSAP quality-system certification', deviceAuthority: 'Health Canada Medical Devices Directorate',
    ivdNote: 'Same MDL framework; IVDs are classified I–IV by risk like other devices.',
    herbalRoute: 'Natural Health Products (NHP) framework', herbalAuthority: 'Health Canada Natural and Non-prescription Health Products Directorate',
    herbalNote: 'A separate, simplified licensing stream from prescription drugs, issuing a Natural Product Number (NPN) based on safety/quality evidence rather than full efficacy trials.',
    homeopathyRoute: 'Homeopathic medicines are licensed under the same Natural Health Products framework as herbal products, generally via a simplified evidence standard drawing on recognized homeopathic references.',
    homeopathyAuthority: 'Health Canada Natural and Non-prescription Health Products Directorate',
    genericRoute: 'Abbreviated New Drug Submission (ANDS)', biosimilarRoute: 'Subsequent Entry Biologic (SEB) pathway',
    pediatricProgram: 'No PREA-equivalent statute; Health Canada generally requests pediatric data aligned with ICH E11 guidance and increasingly relies on international pediatric study packages rather than a standalone mandatory plan.',
    orphanProgram: 'No standalone orphan drug regulation; rare-disease medicines typically proceed through the standard NDS pathway, sometimes via Notice of Compliance with Conditions for promising but incomplete evidence.',
    cosmeticRoute: 'A Cosmetic Notification Form (CNF) must be filed within 10 days of first sale — a notification requirement, not a premarket approval.',
    cosmeticAuthority: 'Health Canada Consumer Product Safety Directorate',
    parentMinistry: 'Government of Canada (federal department)', keyCommittees: 'Product-specific Expert Advisory Committees',
    notableScope: 'Also regulates natural health products via a distinct, lighter licensing stream (NPN) separate from prescription drugs.',
    funFact: 'A Health Canada Clinical Trial Application is deemed authorized by default after 30 days if the agency doesn\u2019t object — silence effectively means yes.',
  },
  {
    key: 'EMA', name: 'EMA', fullName: 'European Medicines Agency', region: 'Europe', color: 'hsl(258 70% 65%)', confidence: 'high',
    ctaName: 'Clinical Trial Application (via CTIS)', ctaAuthority: 'National competent authorities, coordinated via the Clinical Trials Information System', ctaTimeline: '~60 days for a single coordinated assessment', ctaMonths: 2,
    maName: 'MAA — Centralised Procedure', maAuthority: 'EMA/CHMP; European Commission (final decision)', maTimeline: '210 active CHMP days + ~67 days for the EC decision (often 12–14 months elapsed with clock-stops)', maMonths: 13,
    deviceClasses: 'Class I / IIa / IIb / III', deviceRoute: 'CE marking via Notified Body conformity assessment (self-declaration only for standard Class I)', deviceAuthority: 'EU Member State Competent Authorities / Notified Bodies',
    ivdNote: 'Separate IVDR (2017/746) with its own risk classes A (lowest) to D (highest).',
    herbalRoute: 'Traditional Herbal Medicinal Products Directive (2004/24/EC)', herbalAuthority: 'National Competent Authorities',
    herbalNote: 'A simplified "traditional-use registration" applies if the herbal use is documented for at least 30 years (at least 15 within the EU) — the "30/15 rule."',
    homeopathyRoute: 'The EU has run a dedicated simplified registration procedure for homeopathic medicinal products since Directive 92/73/EEC (now consolidated into Directive 2001/83/EC), allowing registration without proof of therapeutic efficacy for sufficiently dilute preparations meeting quality and safety requirements.',
    homeopathyAuthority: 'National Competent Authorities under the EU homeopathic medicinal products framework (not EMA)',
    genericRoute: 'Abridged generic Marketing Authorisation (bioequivalence-based)', biosimilarRoute: 'EMA biosimilar guideline pathway (established 2005, the first jurisdiction to formalize one)',
    pediatricProgram: 'A Paediatric Investigation Plan (PIP) must be agreed with the Paediatric Committee (PDCO) before a marketing application can even be validated, unless waived. Compliance can extend the supplementary protection certificate by 6 months, and off-patent medicines developed specifically for children can use the dedicated Paediatric Use Marketing Authorisation (PUMA) route.',
    orphanProgram: 'Orphan designation via the Committee for Orphan Medicinal Products (COMP), for conditions affecting no more than 5 in 10,000 people in the EU with no satisfactory existing treatment. Grants protocol assistance, fee reductions, and 10 years\u2019 market exclusivity (extendable by 2 years for paediatric compliance).',
    cosmeticRoute: 'Not applicable to EMA — cosmetics are regulated separately under the EU Cosmetics Regulation (1223/2009) by national authorities, not EMA. Requires a Responsible Person, a Cosmetic Product Safety Report, and notification via the Cosmetic Products Notification Portal (CPNP) before sale.',
    cosmeticAuthority: 'National authorities under EU Regulation 1223/2009 (not EMA)',
    parentMinistry: 'European Union (decentralized EU agency)', keyCommittees: 'CHMP, PRAC, COMP, PDCO, CAT',
    notableScope: 'Does not regulate cosmetics, medical devices (delegated to Notified Bodies), or food — a narrower remit than many assume for "the EU\u2019s FDA."',
    funFact: 'A single EMA centralised approval is valid across all EU/EEA member states at once — one review, roughly 30 countries of market access.',
  },
  {
    key: 'MHRA', name: 'MHRA', fullName: 'Medicines and Healthcare products Regulatory Agency', region: 'Europe', color: 'hsl(220 70% 60%)', confidence: 'high',
    ctaName: 'Clinical Trial Authorisation', ctaAuthority: 'MHRA', ctaTimeline: '~30 days (combined review with ethics approval under post-2023 reforms)', ctaMonths: 1,
    maName: 'Marketing Authorisation Application', maAuthority: 'MHRA', maTimeline: '150-day assessment target for high-quality applications; a broader national timeline runs to 210 days', maMonths: 5,
    deviceClasses: 'Class I / IIa / IIb / III (UK-specific post-Brexit)', deviceRoute: 'UKCA marking (transitioning from the retained CE marking system)', deviceAuthority: 'MHRA',
    ivdNote: 'Parallel UKCA/IVD framework mirroring the former EU IVDR risk classes.',
    herbalRoute: 'Traditional Herbal Registration (THR) scheme', herbalAuthority: 'MHRA',
    herbalNote: 'The UK\u2019s retained version of the EU\u2019s 30/15-year traditional-use concept, run independently since Brexit.',
    homeopathyRoute: 'The UK retains a National Rules Scheme and a Homeopathic Registration Scheme allowing simplified registration without proof of efficacy for qualifying products, inherited from the EU framework and continued independently post-Brexit.',
    homeopathyAuthority: 'MHRA',
    genericRoute: 'Abridged generic Marketing Authorisation', biosimilarRoute: 'MHRA biosimilar guidance (closely aligned with the EMA approach)',
    pediatricProgram: 'Retains the EU-derived Paediatric Investigation Plan concept post-Brexit, generally expecting alignment with internationally agreed paediatric development plans.',
    orphanProgram: 'A UK orphan designation route broadly mirroring the former EU criteria (rare-disease prevalence threshold, significant-benefit test) and incentives.',
    cosmeticRoute: 'Not applicable to MHRA — cosmetics are regulated separately by the UK Office for Product Safety and Standards under a UK-retained version of the EU cosmetics framework, via notification (SCPN).',
    cosmeticAuthority: 'UK Office for Product Safety and Standards (not MHRA)',
    parentMinistry: 'UK Department of Health and Social Care', keyCommittees: 'Commission on Human Medicines',
    notableScope: 'Cosmetics are regulated by a separate UK body (Office for Product Safety and Standards), not MHRA.',
    funFact: 'Since leaving the EU, the UK now runs its own UKCA device-marking system in parallel with the old CE marking system — a transition many manufacturers are still navigating.',
  },
  {
    key: 'SWISSMEDIC', name: 'Swissmedic', fullName: 'Swiss Agency for Therapeutic Products', region: 'Europe', color: 'hsl(0 65% 55%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Authorisation', ctaAuthority: 'Swissmedic', ctaTimeline: '~30 days, generally ICH-aligned', ctaMonths: 1,
    maName: 'Marketing Authorisation Application', maAuthority: 'Swissmedic', maTimeline: 'Timelines generally track EMA\u2019s, roughly a year for a standard review', maMonths: 12,
    deviceClasses: 'Class I / IIa / IIb / III (aligned with the EU model)', deviceRoute: 'Swiss Medical Devices Ordinance; CE-marked devices are generally recognized', deviceAuthority: 'Swissmedic',
    ivdNote: 'Aligned with the EU IVDR risk-class structure.',
    herbalRoute: 'Dedicated complementary and herbal medicines procedures', herbalAuthority: 'Swissmedic',
    herbalNote: 'A distinct simplified registration track for complementary/herbal products, separate from the standard drug dossier.',
    homeopathyRoute: 'Switzerland has long been unusually supportive of homeopathy — including a period where national health insurance covered homeopathic treatment following a 2009 referendum — and Swissmedic runs a simplified registration procedure for qualifying homeopathic products.',
    homeopathyAuthority: 'Swissmedic',
    genericRoute: 'Abridged generic Marketing Authorisation', biosimilarRoute: 'Swissmedic biosimilar guideline (aligned with EMA)',
    pediatricProgram: 'Generally expects an internationally agreed paediatric investigation plan (e.g., the EMA PIP) to be referenced in the dossier rather than running a wholly separate Swiss process.',
    orphanProgram: 'Offers an orphan drug status with fee reductions and expedited procedures, generally aligned with EU-style criteria.',
    cosmeticRoute: 'Not applicable to Swissmedic — cosmetics fall under Swiss food-safety authorities, using a notification-based system aligned with the EU model.',
    cosmeticAuthority: 'Swiss Federal Food Safety and Veterinary Office (not Swissmedic)',
    parentMinistry: 'Swiss Federal Department of Home Affairs', keyCommittees: 'Product-specific expert committees',
    notableScope: 'Cosmetics fall under Swiss food-safety authorities, not Swissmedic.',
    funFact: 'Switzerland isn\u2019t in the EU, but Swissmedic timelines and standards track EMA\u2019s closely enough that many companies file in both almost simultaneously.',
  },
  {
    key: 'TGA', name: 'TGA', fullName: 'Therapeutic Goods Administration', region: 'Asia-Pacific', color: 'hsl(152 55% 48%)', confidence: 'high',
    ctaName: 'Clinical Trial Notification (CTN) or Clinical Trial Approval (CTA)', ctaAuthority: 'TGA', ctaTimeline: 'CTN: notification only, no upfront TGA review; CTA: full TGA review required', ctaMonths: 2,
    maName: 'ARTG Registration', maAuthority: 'TGA', maTimeline: '255 working days for Category 1 standard evaluation (target, clock pauses for sponsor responses)', maMonths: 11,
    deviceClasses: 'Class I / IIa / IIb / III (aligned with the EU model)', deviceRoute: 'Conformity assessment + inclusion in the Australian Register of Therapeutic Goods (ARTG)', deviceAuthority: 'TGA',
    ivdNote: 'Separate IVD risk classes 1–4 within the same ARTG framework.',
    herbalRoute: '"Listed" (self-certified, lower-risk) vs. "Registered" (full evaluation, therapeutic claims)', herbalAuthority: 'TGA',
    herbalNote: 'Most herbal/complementary medicines use the lower-cost "Listed" route with self-certified quality/safety evidence rather than TGA pre-review.',
    homeopathyRoute: 'Homeopathic products are generally regulated through the same "Listed" complementary-medicines route as herbal products, based on self-certified evidence rather than a dedicated homeopathy-specific track.',
    homeopathyAuthority: 'TGA',
    genericRoute: 'Generic ARTG registration (bioequivalence-based)', biosimilarRoute: 'TGA biosimilar pathway (aligned with EMA/WHO principles)',
    pediatricProgram: 'No standalone mandatory paediatric-plan statute; relies on ICH E11 guidance and increasingly requests overseas paediatric data packages at the time of registration.',
    orphanProgram: 'Orphan drug designation for conditions affecting fewer than 5 in 10,000 people in Australia (or otherwise commercially unviable to develop), with application fee waivers.',
    cosmeticRoute: 'Most cosmetics fall outside TGA\u2019s remit entirely, regulated instead as industrial chemicals under AICIS; a product only becomes TGA-regulated if it makes a therapeutic claim.',
    cosmeticAuthority: 'Australian Industrial Chemicals Introduction Scheme, AICIS (not TGA, unless a therapeutic claim is made)',
    parentMinistry: 'Australian Government Department of Health', keyCommittees: 'Advisory Committee on Medicines',
    notableScope: 'Most cosmetics are regulated as industrial chemicals by a completely different agency (AICIS), not TGA.',
    funFact: 'A "CTN" clinical trial in Australia can start without any upfront TGA review at all — the sponsor just notifies and proceeds, relying on ethics committee approval alone.',
  },
  {
    key: 'PMDA', name: 'PMDA', fullName: 'Pharmaceuticals and Medical Devices Agency', region: 'Asia-Pacific', color: 'hsl(340 65% 60%)', confidence: 'high',
    ctaName: 'Clinical Trial Notification', ctaAuthority: 'PMDA / MHLW', ctaTimeline: '30 days', ctaMonths: 1,
    maName: 'New Drug Application (Shonin)', maAuthority: 'PMDA review, MHLW final approval', maTimeline: '~12 months standard goal; SAKIGAKE designation can expedite priority products', maMonths: 12,
    deviceClasses: 'Class I–IV (Japan-specific)', deviceRoute: 'Shonin (approval) or Todokede (notification) depending on class', deviceAuthority: 'PMDA',
    ivdNote: 'Regulated under the same Pharmaceuticals and Medical Devices Act framework as devices.',
    herbalRoute: 'Kampo monograph-based approval system', herbalAuthority: 'PMDA/MHLW',
    herbalNote: 'Traditional Japanese herbal medicine (Kampo) has its own long-established, monograph-based approval system distinct from Western herbal frameworks.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'PMDA/MHLW',
    genericRoute: 'Generic approval (bioequivalence-based)', biosimilarRoute: 'Japan biosimilar guideline (an early adopter, since 2009)',
    pediatricProgram: 'Pediatric development has historically often been deferred to post-marketing commitments in Japan, though PMDA increasingly requests global pediatric data packages at the time of the New Drug Application.',
    orphanProgram: 'Japan\u2019s orphan drug system (since 1993) covers conditions affecting fewer than 50,000 patients nationally, with development subsidies, tax credits, and priority review.',
    cosmeticRoute: 'Regulated as a distinct category under the Pharmaceutical and Medical Device Act; standard cosmetics are notification-based, while "quasi-drugs" (medicated cosmetics with active ingredients) require PMDA approval.',
    cosmeticAuthority: 'PMDA / MHLW',
    parentMinistry: 'Japanese Ministry of Health, Labour and Welfare (MHLW)', keyCommittees: 'Pharmaceutical Affairs and Food Sanitation Council',
    notableScope: 'Traditional Kampo herbal medicine has run its own long-established approval system for decades, entirely separate from Western herbal frameworks.',
    funFact: 'Japan\u2019s SAKIGAKE ("pioneer") designation specifically rewards being first-in-world, prioritizing drugs developed and filed in Japan ahead of other countries.',
  },
  {
    key: 'NMPA', name: 'NMPA', fullName: 'National Medical Products Administration', region: 'Asia-Pacific', color: 'hsl(38 92% 55%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Application', ctaAuthority: 'NMPA', ctaTimeline: '60 working days, "implied consent" (deemed approval) if no objection raised', ctaMonths: 2,
    maName: 'New Drug Application', maAuthority: 'NMPA Center for Drug Evaluation (CDE)', maTimeline: '~200 working days standard; priority review available', maMonths: 9,
    deviceClasses: 'Class I / II / III', deviceRoute: 'NMPA registration certificate required for Class II/III; Class I is filing-based', deviceAuthority: 'NMPA',
    ivdNote: 'A separate IVD reagent registration category within the same NMPA framework.',
    herbalRoute: 'Traditional Chinese Medicine (TCM) simplified registration', herbalAuthority: 'NMPA',
    herbalNote: 'A dedicated pathway for "classical formula" TCM products, with reduced clinical trial requirements reflecting long-documented traditional use.',
    homeopathyRoute: 'Western-style homeopathy has no dedicated framework in China; traditional dilution-based remedies are generally addressed instead through the separate Traditional Chinese Medicine pathway.',
    homeopathyAuthority: 'NMPA',
    genericRoute: 'Generic registration (bioequivalence-based, under China\u2019s consistency evaluation program)', biosimilarRoute: 'NMPA biosimilar guideline (established 2015)',
    pediatricProgram: 'China\u2019s 2019 Drug Administration Law introduced incentives for pediatric drug development, including priority review for pediatric-specific formulations.',
    orphanProgram: 'China introduced a rare-disease list and priority-review incentives for orphan drugs starting around 2018 — newer and narrower in scope than the FDA/EMA systems.',
    cosmeticRoute: 'One of the stricter global regimes: "special cosmetics" (hair dye, whitening, sunscreen, anti-hair-loss, new-effect claims) require actual NMPA registration and review, while "general cosmetics" only need notification (record-filing) with the provincial regulator.',
    cosmeticAuthority: 'NMPA / provincial drug regulators',
    parentMinistry: 'State Administration for Market Regulation, China', keyCommittees: 'Center for Drug Evaluation (CDE) expert panels',
    notableScope: 'Regulates "special" cosmetics (hair dye, whitening, sunscreen) with actual premarket registration — stricter than most Western cosmetic regimes.',
    funFact: 'China\u2019s clinical trial review uses "implied consent" — if NMPA doesn\u2019t object within 60 working days, the trial is automatically deemed approved.',
  },
  {
    key: 'CDSCO', name: 'CDSCO', fullName: 'Central Drugs Standard Control Organisation', region: 'Asia-Pacific', color: 'hsl(30 80% 55%)', confidence: 'high',
    ctaName: 'Clinical Trial Application (Form CT-04)', ctaAuthority: 'CDSCO Central Licensing Approving Authority; Subject Expert Committee', ctaTimeline: '~90 days statutory, deemed approval if unmet', ctaMonths: 3,
    maName: 'New Drug Application', maAuthority: 'CDSCO; Subject Expert Committee; Drugs Technical Advisory Board', maTimeline: '~12–18 months, varies with SEC meeting cycles', maMonths: 15,
    deviceClasses: 'Class A / B / C / D (risk-based, aligned with global norms)', deviceRoute: 'Registration/licensing via CDSCO\u2019s medical device rules', deviceAuthority: 'CDSCO',
    ivdNote: 'Regulated under the same CDSCO medical device framework, with IVD-specific risk classes.',
    herbalRoute: 'AYUSH licensing (separate from allopathic drugs)', herbalAuthority: 'Ministry of AYUSH / State Licensing Authorities',
    herbalNote: 'Classical Ayurvedic/Unani/Siddha/Homoeopathic formulations follow a distinct AYUSH licensing track under the Drugs and Cosmetics Act, separate from CDSCO\u2019s allopathic New Drug process; genuinely novel herbal drug claims can still require full CDSCO review.',
    homeopathyRoute: 'Homeopathy is regulated as one of India\u2019s officially recognized systems of medicine, with its own Homoeopathic Pharmacopoeia and manufacturing licensing distinct from the Ayurvedic/Unani/Siddha track, historically overseen alongside the Central Council of Homeopathy for practitioner education and registration.',
    homeopathyAuthority: 'Ministry of AYUSH (Homoeopathy division) / State Licensing Authorities',
    genericRoute: 'Generic manufacturing license (bioequivalence-based)', biosimilarRoute: 'CDSCO "Similar Biologics" guidelines (2016, jointly with DBT)',
    pediatricProgram: 'No PREA/PIP-equivalent statute; pediatric studies are typically requested case-by-case by the Subject Expert Committee, especially for pediatric-specific formulations.',
    orphanProgram: 'India\u2019s National Policy for Rare Diseases (2021) provides some financial support and expedited-review provisions, though a formal exclusivity regime comparable to the FDA/EMA systems is still developing.',
    cosmeticRoute: 'Regulated under the Drugs and Cosmetics Act; imported cosmetics require CDSCO registration, while domestic manufacturing is licensed by State Licensing Authorities.',
    cosmeticAuthority: 'CDSCO (imports); State Licensing Authorities (domestic manufacturing)',
    parentMinistry: 'Indian Ministry of Health and Family Welfare', keyCommittees: 'Subject Expert Committees (SECs), Drugs Technical Advisory Board',
    notableScope: 'Classical Ayurvedic, Unani, Siddha, and Homoeopathic medicines are licensed through separate dedicated tracks, not CDSCO\u2019s allopathic New Drug process.',
    funFact: 'A CDSCO clinical trial application can be "deemed approved" if the regulator misses its 90-day statutory deadline — the clock itself becomes an approval mechanism.',
  },
  {
    key: 'HSA', name: 'HSA', fullName: 'Health Sciences Authority', region: 'Asia-Pacific', color: 'hsl(190 70% 50%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Certificate', ctaAuthority: 'HSA', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 1,
    maName: 'Product registration under the Health Products Act', maAuthority: 'HSA', maTimeline: 'Abridged/verification routes leveraging a reference agency\u2019s approval are common and faster than a full independent evaluation', maMonths: 8,
    deviceClasses: 'Class A / B / C / D', deviceRoute: 'Risk-based registration under the Health Products Act', deviceAuthority: 'HSA',
    ivdNote: 'Same Health Products Act framework applied to in-vitro diagnostics.',
    herbalRoute: 'Separate listing route for Chinese Proprietary Medicines and health supplements', herbalAuthority: 'HSA',
    herbalNote: 'A lighter-touch listing process distinct from full drug registration, similar in spirit to other Asia-Pacific "listed" traditional-medicine routes.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'HSA',
    genericRoute: 'Generic registration (abridged/verification route)', biosimilarRoute: 'HSA biosimilar guidance (aligned with WHO/ICH principles)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Generally offers reduced fees and/or priority evaluation for rare-disease products, without a fully codified exclusivity regime comparable to the FDA/EMA systems.',
    cosmeticRoute: 'Regulated under the ASEAN Cosmetic Directive framework, which Singapore has adopted — notification-based, not premarket approval.',
    cosmeticAuthority: 'HSA Health Products Regulation Group',
    parentMinistry: 'Singapore Ministry of Health', keyCommittees: 'Health Products Advisory Committees',
    notableScope: 'Leans heavily on "verification" — recognizing another reference agency\u2019s approval — rather than always running a full independent review.',
    funFact: 'Singapore adopted the ASEAN Cosmetic Directive, meaning its cosmetic rules are harmonized with nine other Southeast Asian countries at once.',
  },
  {
    key: 'MFDS', name: 'MFDS', fullName: 'Ministry of Food and Drug Safety', region: 'Asia-Pacific', color: 'hsl(265 60% 60%)', confidence: 'moderate',
    ctaName: 'IND', ctaAuthority: 'MFDS', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 1,
    maName: 'New Drug Application', maAuthority: 'MFDS', maTimeline: 'Generally ICH-aligned review; expedited pathways exist for innovative products', maMonths: 10,
    deviceClasses: 'Class I–IV', deviceRoute: 'Risk-based certification/approval', deviceAuthority: 'MFDS',
    ivdNote: 'Regulated under the same MFDS medical device framework.',
    herbalRoute: 'Separate registration category for traditional Korean (Hanbang) medicine products', herbalAuthority: 'MFDS',
    herbalNote: 'A dedicated track reflecting long-established traditional use, distinct from the standard new-drug dossier.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'MFDS',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'MFDS biosimilar guideline (Korea is a major global biosimilar manufacturing hub)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Offers a rare-disease drug designation with fee reductions and priority review, generally less codified than the FDA/EMA exclusivity systems.',
    cosmeticRoute: 'Notification-based for most cosmetics; "functional cosmetics" (whitening, anti-wrinkle, sunscreen) require an additional report/approval step for their functional claims.',
    cosmeticAuthority: 'MFDS',
    parentMinistry: 'Government of South Korea (ministry-level agency)', keyCommittees: 'Central Pharmaceutical Affairs Council',
    notableScope: 'South Korea is one of the world\u2019s largest biosimilar manufacturing hubs, giving MFDS outsized global influence in that category specifically.',
    funFact: '"Functional cosmetics" in Korea — like whitening or anti-wrinkle products — need a separate functional-claim review even though the base product is just notification-based.',
  },
  {
    key: 'ANVISA', name: 'ANVISA', fullName: 'Agência Nacional de Vigilância Sanitária', region: 'Latin America', color: 'hsl(142 55% 45%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Authorization', ctaAuthority: 'ANVISA', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Marketing Authorization (Registro)', maAuthority: 'ANVISA', maTimeline: 'Varies by category; priority review available for certain product types', maMonths: 12,
    deviceClasses: 'Risk Class I–IV', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'ANVISA',
    ivdNote: 'Same ANVISA framework applied to in-vitro diagnostics.',
    herbalRoute: 'Dedicated Traditional Herbal Medicine registration category', herbalAuthority: 'ANVISA',
    herbalNote: 'A simplified evidence standard based on documented traditional use rather than full efficacy trials.',
    homeopathyRoute: 'Brazil has a dedicated homeopathic medicine category with its own specific regulation, distinct from both conventional drugs and herbal medicines.',
    homeopathyAuthority: 'ANVISA',
    genericRoute: 'Generic registration (bioequivalence-based; Brazil also has a distinct "similar medicine" category)', biosimilarRoute: 'ANVISA biosimilar pathway (comparability-exercise route)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Offers a rare-disease medicine designation with priority review, generally less codified than the FDA/EMA exclusivity systems.',
    cosmeticRoute: 'Products are classified as "Grade 1" (lower-risk, notification-based) or "Grade 2" (higher-risk/functional claims, requiring actual ANVISA registration).',
    cosmeticAuthority: 'ANVISA',
    parentMinistry: 'Brazilian Ministry of Health (independent regulatory agency)', keyCommittees: 'Product-specific technical advisory panels',
    notableScope: 'Brazil maintains a distinct "similar medicine" category alongside true generics — a wrinkle not found in most other jurisdictions.',
    funFact: 'ANVISA classifies cosmetics into just two risk grades (1 and 2) — a much simpler system than the multi-tier classifications used for cosmetics-adjacent products elsewhere.',
  },
  {
    key: 'COFEPRIS', name: 'Cofepris', fullName: 'Comisión Federal para la Protección contra Riesgos Sanitarios', region: 'Latin America', color: 'hsl(150 45% 42%)', confidence: 'moderate',
    ctaName: 'Clinical trial authorization', ctaAuthority: 'Cofepris', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Sanitary Registration', maAuthority: 'Cofepris', maTimeline: 'Timelines vary; reliance on reference-agency approvals can shorten review', maMonths: 12,
    deviceClasses: 'Risk-based classification (I–III)', deviceRoute: 'Sanitary registration proportional to risk class', deviceAuthority: 'Cofepris',
    ivdNote: 'Same Cofepris framework applied to in-vitro diagnostics.',
    herbalRoute: 'Simplified registration for "remedios herbolarios" (traditional herbal remedies)', herbalAuthority: 'Cofepris',
    herbalNote: 'A lighter evidentiary track for products with documented traditional use in Mexico.',
    homeopathyRoute: 'Mexico recognizes homeopathic medicines as a distinct regulatory category with its own registration requirements, separate from conventional allopathic drugs.',
    homeopathyAuthority: 'Cofepris',
    genericRoute: 'Generic/interchangeable registration (bioequivalence-based)', biosimilarRoute: '"Biocomparable" pathway (Mexico\u2019s term for biosimilars)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Offers a rare-disease medicine category with some regulatory facilitation, generally less codified than the FDA/EMA exclusivity systems.',
    cosmeticRoute: 'A notification (aviso) system for most cosmetics — generally lighter-touch than the drug sanitary-registration process.',
    cosmeticAuthority: 'Cofepris',
    parentMinistry: 'Mexican Secretariat of Health', keyCommittees: 'New Molecules Committee',
    notableScope: 'Uses reliance pathways on other major agencies\u2019 approvals to speed up its own reviews rather than always evaluating from scratch.',
    funFact: 'Mexico calls biosimilars "biocomparables" — the same regulatory concept as the FDA/EMA biosimilar pathway, with an entirely different name.',
  },
  {
    key: 'SFDA', name: 'SFDA', fullName: 'Saudi Food and Drug Authority', region: 'Middle East', color: 'hsl(158 50% 45%)', confidence: 'moderate',
    ctaName: 'Clinical trial authorization', ctaAuthority: 'SFDA', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Marketing Authorization', maAuthority: 'SFDA', maTimeline: 'Varies; reliance pathways leveraging a reference agency\u2019s approval are available', maMonths: 12,
    deviceClasses: 'Risk-based classification (aligned with global norms)', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'SFDA',
    ivdNote: 'Same SFDA framework applied to in-vitro diagnostics.',
    herbalRoute: 'Separate registration category for herbal/traditional products', herbalAuthority: 'SFDA',
    herbalNote: 'A distinct, lighter evidence track from the standard new-drug dossier.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'SFDA',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'SFDA biosimilar guideline',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Offers an orphan drug registration facilitation route, generally less codified than the FDA/EMA exclusivity systems.',
    cosmeticRoute: 'Cosmetics require registration/notification through SFDA\u2019s dedicated cosmetics platform, distinct from the drug pathway.',
    cosmeticAuthority: 'SFDA Cosmetics Department',
    parentMinistry: 'Government of Saudi Arabia', keyCommittees: 'Product-specific technical committees',
    notableScope: 'Runs cosmetics through a completely separate registration platform from its drug pathway.',
    funFact: 'SFDA increasingly relies on "reliance" review — leaning on FDA/EMA approval decisions — to accelerate access to medicines already vetted elsewhere.',
  },
  {
    key: 'SAHPRA', name: 'SAHPRA', fullName: 'South African Health Products Regulatory Authority', region: 'Africa', color: 'hsl(90 45% 45%)', confidence: 'moderate',
    ctaName: 'Clinical trial authorization', ctaAuthority: 'SAHPRA', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Marketing Authorization', maAuthority: 'SAHPRA', maTimeline: 'Historically longer than FDA/EMA; ongoing reforms aim to reduce a registration backlog', maMonths: 18,
    deviceClasses: 'Risk-based classification', deviceRoute: 'A relatively recently established device regulatory framework (South Africa regulated devices separately from medicines only in recent years)', deviceAuthority: 'SAHPRA',
    ivdNote: 'Same evolving SAHPRA device framework applied to in-vitro diagnostics.',
    herbalRoute: 'Complementary medicines category (still evolving)', herbalAuthority: 'SAHPRA',
    herbalNote: 'A distinct, still-maturing registration category for complementary and traditional African medicines.',
    homeopathyRoute: 'Homeopathic products fall under the same evolving complementary medicines category as herbal products, rather than a dedicated homeopathy-specific framework.',
    homeopathyAuthority: 'SAHPRA',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'SAHPRA biosimilar guideline (aligned with WHO principles)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'No fully codified orphan drug regime yet; rare-disease products generally proceed through the standard pathway with case-by-case facilitation.',
    cosmeticRoute: 'Cosmetics are regulated separately from medicines in South Africa under distinct legislation, generally with lighter, notification-style requirements.',
    cosmeticAuthority: 'Department of Health (Foodstuffs, Cosmetics and Disinfectants Act) — not SAHPRA',
    parentMinistry: 'South African National Department of Health', keyCommittees: 'Expert committees succeeding the former Medicines Control Council',
    notableScope: 'Only began regulating medical devices as their own category relatively recently — one of the newest device frameworks on this list.',
    funFact: 'SAHPRA has been working through a historical registration backlog, part of why its marketing-authorization timelines are longer than most peers on this list.',
  },
  {
    key: 'WHO_PQ', name: 'WHO PQ', fullName: 'WHO Prequalification of Medicines Programme', region: 'Global / lower-resource markets', color: 'hsl(210 15% 55%)', confidence: 'high',
    ctaName: 'Not applicable — WHO PQ does not authorize trials', ctaAuthority: 'Trials are conducted under whichever national regulator has jurisdiction where the trial takes place', ctaTimeline: 'n/a', ctaMonths: null,
    maName: 'WHO Prequalification', maAuthority: 'WHO Prequalification Team', maTimeline: 'Assesses quality/safety/efficacy for UN-agency and donor procurement — not a national marketing authorization, and does not itself grant the right to sell in any country', maMonths: null,
    deviceClasses: 'n/a (WHO PQ evaluates specific product dossiers, not a device class system)', deviceRoute: 'A separate WHO Prequalification of In Vitro Diagnostics programme exists for IVDs', deviceAuthority: 'WHO Prequalification Team',
    ivdNote: 'The WHO PQ IVD programme is a distinct track from medicines prequalification, widely used for HIV, malaria, TB, and hepatitis diagnostics procured for low-resource settings.',
    herbalRoute: 'Not generally in scope', herbalAuthority: 'n/a',
    herbalNote: 'WHO Prequalification focuses on essential medicines, vaccines, and IVDs for procurement; it does not run a traditional-herbal-medicine track.',
    homeopathyRoute: 'Not applicable — outside WHO Prequalification\u2019s essential-medicines procurement focus.', homeopathyAuthority: 'n/a',
    genericRoute: 'Generics make up a large share of prequalified products (notably HIV, TB, and malaria treatments)', biosimilarRoute: 'WHO guidelines for "Similar Biotherapeutic Products" (SBPs) — WHO\u2019s term for biosimilars',
    pediatricProgram: 'WHO Prequalification treats pediatric-appropriate formulations (e.g., dispersible tablets, pediatric dosing) as a priority area, reflecting its focus on treatment access in low-resource settings, especially for HIV, TB, and malaria.',
    orphanProgram: 'Not applicable in the traditional sense — WHO Prequalification prioritizes high-burden diseases for procurement rather than operating a rare-disease incentive program.',
    cosmeticRoute: 'Not applicable — WHO Prequalification does not cover cosmetics.',
    cosmeticAuthority: 'n/a',
    parentMinistry: 'World Health Organization (UN specialized agency)', keyCommittees: 'WHO Prequalification Team, Expert Review Panels',
    notableScope: 'Doesn\u2019t grant the legal right to sell anywhere — prequalification is a procurement-quality signal for UN agencies and donors, layered on top of national approval.',
    funFact: 'A huge share of the HIV, TB, and malaria medicines distributed globally through donor programs got there because they passed WHO Prequalification, not a traditional national approval alone.',
  },
  {
    key: 'AMA', name: 'AMA', fullName: 'African Medicines Agency', region: 'Africa', color: 'hsl(45 70% 50%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Authorization (via national regulator, or joint AMA-coordinated review)', ctaAuthority: 'National medicines regulatory authorities; AMA Scientific Committee for coordinated multi-country reviews', ctaTimeline: 'Varies by country; AMA\u2019s joint-review timelines are still being established', ctaMonths: null,
    maName: 'AMA Joint/Coordinated Scientific Review', maAuthority: 'AMA Scientific Committee, coordinating with National Medicines Regulatory Authorities (which retain final national authorization)', maTimeline: 'A newly operational program — its founding treaty entered into force in 2021 and its Governing Board was first seated in 2022 — still scaling up review capacity to reduce duplicate national reviews', maMonths: null,
    deviceClasses: 'n/a — device regulation remains primarily national at this stage', deviceRoute: 'Coordinated harmonization efforts are underway, but device conformity assessment currently stays with national/regional bodies', deviceAuthority: 'National regulators; AMA (harmonization role)',
    ivdNote: 'Same early-stage harmonization approach as medical devices generally.',
    herbalRoute: 'Coordinates with national traditional-medicine frameworks rather than running its own', herbalAuthority: 'National traditional-medicine authorities',
    herbalNote: 'AMA\u2019s initial focus has been on conventional medicines and vaccines; traditional/herbal medicine harmonization remains largely a national matter for now.',
    homeopathyRoute: 'Not yet in scope — AMA\u2019s early priorities are conventional medicines, vaccines, and medical products harmonization.', homeopathyAuthority: 'n/a',
    genericRoute: 'Supports joint review of generics across member states as capacity develops', biosimilarRoute: 'Biosimilar harmonization is an intended long-term goal, not yet a mature joint pathway',
    pediatricProgram: 'Continent-wide pediatric development guidance is still developing; national programs vary considerably across member states.',
    orphanProgram: 'No continent-wide orphan drug incentive system yet.',
    cosmeticRoute: 'Cosmetics remain nationally regulated; AMA\u2019s initial focus is on medicines and vaccines rather than cosmetics.',
    cosmeticAuthority: 'National regulators',
    parentMinistry: 'African Union (specialized health agency)', keyCommittees: 'AMA Governing Board; Scientific Committee',
    notableScope: 'Does not replace national regulators — it coordinates joint scientific reviews to reduce duplication across African Union member states, similar in spirit to how EMA centralizes EU review, but still much earlier in its development.',
    funFact: 'AMA is one of the newest medicines regulatory bodies in the world — its founding treaty only entered into force in 2021, and it\u2019s explicitly modeled on the idea of centralized review that made EMA effective for the EU.',
  },
  {
    key: 'NAFDAC', name: 'NAFDAC', fullName: 'National Agency for Food and Drug Administration and Control', region: 'Africa', color: 'hsl(120 45% 42%)', confidence: 'moderate',
    ctaName: 'Clinical Trial Certificate/Permit', ctaAuthority: 'NAFDAC', ctaTimeline: 'Generally ICH-aligned, though timelines can vary in practice', ctaMonths: 2,
    maName: 'Product Registration', maAuthority: 'NAFDAC', maTimeline: 'Historically variable; NAFDAC has been modernizing review processes and timelines in recent years', maMonths: 14,
    deviceClasses: 'Risk-based classification (aligned with global norms)', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'NAFDAC',
    ivdNote: 'Same NAFDAC framework applied to in-vitro diagnostics.',
    herbalRoute: 'Dedicated registration category for herbal/traditional medicines', herbalAuthority: 'NAFDAC',
    herbalNote: 'Nigeria has a distinct evidentiary track for traditional/herbal medicines separate from conventional drugs, reflecting widespread traditional medicine use.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'NAFDAC',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'NAFDAC biosimilar guideline (a relatively newer framework)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'No fully codified orphan drug regime; rare-disease products generally proceed through the standard registration pathway.',
    cosmeticRoute: 'A notification/registration system for cosmetics, distinct from the drug pathway.',
    cosmeticAuthority: 'NAFDAC',
    parentMinistry: 'Nigerian Federal Ministry of Health', keyCommittees: 'NAFDAC Governing Council; product-specific technical committees',
    notableScope: 'As Africa\u2019s most populous country and one of its largest pharmaceutical markets, Nigeria plays an outsized role in the continent\u2019s medicine supply and counterfeit-drug enforcement efforts.',
    funFact: 'NAFDAC gained international recognition for an aggressive crackdown on counterfeit medicines in the 2000s, becoming a widely cited case study in pharmaceutical anti-counterfeiting efforts.',
  },
  {
    key: 'ANMAT', name: 'ANMAT', fullName: 'Administración Nacional de Medicamentos, Alimentos y Tecnología Médica', region: 'Latin America', color: 'hsl(200 55% 48%)', confidence: 'moderate',
    ctaName: 'Clinical trial authorization', ctaAuthority: 'ANMAT', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Sanitary Registration (Registro Sanitario)', maAuthority: 'ANMAT', maTimeline: 'Varies; ANMAT has reliance/facilitated pathways for products already approved by reference agencies', maMonths: 12,
    deviceClasses: 'Risk-based classification (I–IV, similar to regional norms)', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'ANMAT',
    ivdNote: 'Same ANMAT framework applied to in-vitro diagnostics.',
    herbalRoute: 'Distinct registration category for "medicamentos fitoterápicos" (herbal medicines)', herbalAuthority: 'ANMAT',
    herbalNote: 'A simplified evidentiary track for herbal products with documented traditional use, similar in spirit to Brazil\u2019s ANVISA framework.',
    homeopathyRoute: 'Argentina regulates homeopathic medicines under their own specific framework, distinct from both conventional and herbal medicines.',
    homeopathyAuthority: 'ANMAT',
    genericRoute: 'Generic/"similar" registration (bioequivalence-based)', biosimilarRoute: 'ANMAT biosimilar pathway (comparability-based)',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Argentina has rare-disease legislation (Ley de Enfermedades Poco Frecuentes, 2011) providing some patient-access support, though not a fully codified FDA/EMA-style exclusivity regime.',
    cosmeticRoute: 'A simpler notification-based system for cosmetics, distinct from the drug pathway.',
    cosmeticAuthority: 'ANMAT',
    parentMinistry: 'Argentine Ministry of Health', keyCommittees: 'Product-specific technical advisory committees',
    notableScope: 'One of Latin America\u2019s most established regulators outside Brazil, often referenced alongside ANVISA for regional harmonization efforts.',
    funFact: 'Argentina was one of the first Latin American countries to pass dedicated rare-disease legislation, in 2011, well before many peer countries in the region.',
  },
  {
    key: 'BPOM', name: 'BPOM', fullName: 'Badan Pengawas Obat dan Makanan (National Agency of Drug and Food Control)', region: 'Asia-Pacific', color: 'hsl(15 75% 55%)', confidence: 'moderate',
    ctaName: 'Clinical trial approval', ctaAuthority: 'BPOM', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Marketing Authorization (Izin Edar)', maAuthority: 'BPOM', maTimeline: 'Varies; BPOM has accelerated pathways for products with prior approval from reference agencies', maMonths: 12,
    deviceClasses: 'Risk-based classification (aligned with ASEAN/global norms)', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'BPOM (or Ministry of Health for some device categories)',
    ivdNote: 'Same general BPOM framework applied to in-vitro diagnostics.',
    herbalRoute: 'Tiered system: Jamu, standardized herbal medicine, and phytopharmaca', herbalAuthority: 'BPOM',
    herbalNote: 'Indonesia has a distinctive tiered traditional-medicine framework — Jamu (lowest evidence bar, based on traditional use), standardized herbal medicine (with quality standardization), and phytopharmaca (requiring clinical evidence, closest to a conventional drug).',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'BPOM',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'BPOM biosimilar guideline',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Indonesia has some regulatory facilitation for rare-disease products, though not a fully codified exclusivity regime.',
    cosmeticRoute: 'Notification-based under the ASEAN Cosmetic Directive, similar to Singapore\u2019s HSA framework.',
    cosmeticAuthority: 'BPOM',
    parentMinistry: 'Government of Indonesia (non-ministerial government agency)', keyCommittees: 'Product-specific expert committees',
    notableScope: 'As the largest Southeast Asian market by population, BPOM decisions carry significant regional weight, and Indonesia\u2019s three-tier Jamu/standardized/phytopharmaca system is one of the most distinctive traditional-medicine frameworks on this whole list.',
    funFact: 'Indonesia\u2019s "Jamu" traditional medicine tradition is old enough to appear in temple carvings from the 9th century, and it still has its own dedicated modern regulatory tier at BPOM today.',
  },
  {
    key: 'UAE_MOHAP', name: 'UAE MOHAP', fullName: 'Ministry of Health and Prevention', region: 'Middle East', color: 'hsl(175 55% 45%)', confidence: 'moderate',
    ctaName: 'Clinical trial approval', ctaAuthority: 'MOHAP; Dubai Health Authority (DHA) or Department of Health Abu Dhabi (DOH) for trials within their free zones', ctaTimeline: 'Generally ICH-aligned timelines', ctaMonths: 2,
    maName: 'Drug Registration', maAuthority: 'MOHAP (federal registration, used for most of the UAE)', maTimeline: 'Varies; the UAE relies heavily on reference-agency approvals to speed up review for many products', maMonths: 10,
    deviceClasses: 'Risk-based classification (aligned with global norms)', deviceRoute: 'Registration proportional to risk class', deviceAuthority: 'MOHAP (or emirate-level health authority within free zones)',
    ivdNote: 'Same general MOHAP framework applied to in-vitro diagnostics.',
    herbalRoute: 'Distinct registration category for herbal/traditional products', herbalAuthority: 'MOHAP',
    herbalNote: 'A lighter evidentiary track for products with documented traditional use.',
    homeopathyRoute: GENERIC_HOMEOPATHY, homeopathyAuthority: 'MOHAP',
    genericRoute: 'Generic registration (bioequivalence-based)', biosimilarRoute: 'MOHAP biosimilar guideline',
    pediatricProgram: 'Generally requests pediatric data aligned with ICH E11 guidance rather than operating a dedicated statutory pediatric-plan requirement.',
    orphanProgram: 'Offers some regulatory facilitation for rare-disease products, generally less codified than the FDA/EMA systems.',
    cosmeticRoute: 'A notification-based system for cosmetics, distinct from the drug pathway.',
    cosmeticAuthority: 'MOHAP',
    parentMinistry: 'Government of the United Arab Emirates', keyCommittees: 'Drug registration technical committees',
    notableScope: 'Regulatory authority is genuinely split: MOHAP handles federal registration for most of the country, while Dubai (DHA) and Abu Dhabi (DOH) run their own health authorities with independent authority within their free zones.',
    funFact: 'The UAE\u2019s regulatory landscape is unusually fragmented for such a small country — Dubai and Abu Dhabi each maintain their own health authorities (DHA and DOH) alongside the federal MOHAP, tracing back to the emirates\u2019 individual governance traditions.',
  },
]

// ---------------------------------------------------------------------------
// Category & shape metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<ProductCategory, { label: string; shape: PathwayShape; note: string }> = {
  'small-molecule': { label: 'Small Molecule (NCE)', shape: 'trial', note: 'Follows the standard new-drug pathway shown below.' },
  biologic: { label: 'Biologic', shape: 'trial', note: 'Follows the same clinical pathway as a small molecule, reviewed by the agency\u2019s biologics-focused center/committee, with full characterization of the biological reference material required.' },
  vaccine: { label: 'Vaccine', shape: 'trial', note: 'Follows the same clinical pathway, plus mandatory lot/batch release testing before each commercial batch ships, and often qualifies for rolling review during public health emergencies.' },
  'cell-gene': { label: 'Cell & Gene Therapy', shape: 'trial', note: 'Usually pursued under an advanced-therapy/regenerative-medicine designation (e.g., RMAT, ATMP, SAKIGAKE) given the small, often single-arm trial populations typical of these products — generally the fastest-track category across most agencies.' },
  pediatric: { label: 'Pediatric', shape: 'trial', note: 'Not a separate development track — the same clinical pathway as any drug, plus a dedicated pediatric study plan requirement or incentive layered on top. See the highlighted stage below.' },
  orphan: { label: 'Orphan / Rare Disease', shape: 'trial', note: 'Also not a separate track — the same clinical pathway, but with an early, sponsor-requested designation that unlocks incentives (fee waivers, protocol assistance, extended market exclusivity). See the highlighted stage below.' },
  generic: { label: 'Generic', shape: 'abbreviated', note: 'Requires only bioequivalence data against the reference product; full efficacy/safety trials are not repeated.' },
  biosimilar: { label: 'Biosimilar', shape: 'abbreviated', note: 'Requires analytical and functional similarity data plus a targeted clinical package; a full comparative efficacy trial can often be waived where analytical/PK data are sufficiently robust.' },
  device: { label: 'Medical Device', shape: 'device', note: 'Regulated by risk classification and conformity assessment rather than clinical trial phases.' },
  diagnostic: { label: 'Diagnostic (IVD)', shape: 'device', note: 'Follows the same classification-based framework as medical devices, generally under its own in-vitro-diagnostics-specific risk classes.' },
  herbal: { label: 'Herbal / Traditional Medicine', shape: 'herbal', note: 'Evidence is based on documented traditional use plus quality/safety data, not full clinical efficacy trials, wherever a simplified pathway exists.' },
  homeopathy: { label: 'Homeopathy', shape: 'homeopathy', note: 'Evidentially distinct even from herbal medicine — based on pharmacopeial dilution/potency preparation methods rather than active-ingredient concentration, and regulated very differently (or not specifically at all) across agencies.' },
  cosmetic: { label: 'Cosmetic', shape: 'cosmetic', note: 'Most agencies require no premarket approval at all for cosmetics — some don\u2019t even regulate them through the same body as medicines. Notification, ingredient compliance, and post-market surveillance replace clinical review.' },
}

const CATEGORY_ORDER: ProductCategory[] = ['small-molecule', 'biologic', 'vaccine', 'cell-gene', 'pediatric', 'orphan', 'generic', 'biosimilar', 'device', 'diagnostic', 'herbal', 'homeopathy', 'cosmetic']

const SHAPE_META: Record<PathwayShape, { icon: string; color: string; label: string }> = {
  trial: { icon: '🧪', color: 'hsl(208 70% 60%)', label: 'Clinical trial-based' },
  abbreviated: { icon: '⚖️', color: 'hsl(152 55% 50%)', label: 'Abbreviated / comparative' },
  device: { icon: '⚙️', color: 'hsl(38 80% 55%)', label: 'Classification + conformity' },
  herbal: { icon: '🌿', color: 'hsl(90 45% 45%)', label: 'Traditional-use evidence' },
  homeopathy: { icon: '💧', color: 'hsl(280 55% 62%)', label: 'Pharmacopeial dilution-based' },
  cosmetic: { icon: '💄', color: 'hsl(330 60% 60%)', label: 'Notification-based' },
}

// ---------------------------------------------------------------------------
// Stage generation
// ---------------------------------------------------------------------------

function finalizeStages(stages: Stage[]): Stage[] {
  const result = [...stages]
  const gmpStage: Stage = {
    id: 'gmp',
    title: 'Manufacturing (GMP) Inspection',
    detail: 'Manufacturing facilities are inspected for Good Manufacturing Practice (GMP) compliance before approval — in practice, one of the most common sources of real-world delay even after clinical or technical review is otherwise complete.',
    documents: ['GMP compliance certificate', 'Facility inspection report'],
  }
  result.splice(Math.max(0, result.length - 1), 0, gmpStage)
  const variationsStage: Stage = {
    id: 'variations',
    title: 'Post-Approval Variations & Renewals',
    detail: 'Changing the formulation, manufacturing site, indication, or labeling after approval typically requires its own variation/supplement filing (e.g., an EU Type IA/IB/II variation, or a US Prior-Approval Supplement) rather than a brand-new application. Regulatory approval also isn\u2019t the same as market access — pricing and reimbursement decisions (e.g., a health technology assessment body like NICE) happen separately, afterward, and are outside this app\u2019s scope.',
    documents: ['Variation/supplement application', 'Comparability data (for manufacturing changes)'],
  }
  result.push(variationsStage)
  return result
}

function buildStages(r: RegulatorParams, category: ProductCategory): Stage[] {
  const shape = CATEGORY_META[category].shape

  if (shape === 'trial') {
    const stages: Stage[] = [
      { id: 'preclinical', title: 'Discovery & Preclinical', detail: 'Lab and animal studies establish basic safety pharmacology and toxicology before human testing. This sits outside the regulatory clock — length depends on the science, not the agency.', documents: ['Preclinical study reports', 'Toxicology data', 'CMC/manufacturing summary'] },
    ]
    if (category === 'orphan') {
      stages.push({ id: 'orphan-designation', title: 'Orphan Drug Designation (sponsor-requested)', detail: r.orphanProgram, documents: ['Prevalence/epidemiology data', 'Scientific rationale', 'Designation request form'] })
    }
    stages.push({ id: 'cta', title: r.ctaName, detail: r.ctaTimeline, authority: r.ctaAuthority, documents: ['Investigator\u2019s brochure', 'Clinical protocol', 'Preclinical data package'] })
    if (category === 'pediatric') {
      stages.push({ id: 'pip', title: 'Pediatric Study Plan / Investigation Plan', detail: r.pediatricProgram, documents: ['Proposed pediatric study plan', 'Waiver/deferral justification (if applicable)'] })
    }
    stages.push(
      { id: 'phase1', title: 'Phase I Trials', detail: 'Small trials assessing safety, tolerability, and pharmacokinetics, typically in tens of participants.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Site-level ethics approval', 'Informed consent documents'] },
      { id: 'phase2', title: 'Phase II Trials', detail: 'Larger controlled trials exploring efficacy, dosing, and further safety characterization.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Interim safety reports', 'Draft statistical analysis plan'] },
      { id: 'phase3', title: 'Phase III Trials', detail: 'Large, often multi-site confirmatory trials establishing efficacy and monitoring safety at scale.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Final statistical analysis plan', 'Data safety monitoring board reports'] },
      { id: 'ma', title: r.maName, detail: r.maTimeline, authority: r.maAuthority, documents: ['Full quality/safety/efficacy dossier', 'Proposed labeling', 'Risk management plan'] },
      { id: 'post', title: 'Approval & Post-Market', detail: 'Ongoing pharmacovigilance, periodic safety reporting, and any post-marketing study commitments required by the agency.', documents: ['Periodic safety update reports', 'Post-marketing study reports'] },
    )
    return finalizeStages(stages)
  }

  if (shape === 'abbreviated') {
    const isBiosimilar = category === 'biosimilar'
    const stages: Stage[] = [
      { id: 'reference', title: 'Reference Product Selection & Gap Analysis', detail: 'Identify the approved reference product and map out what comparative data will be needed to demonstrate equivalence or similarity.', documents: ['Reference product labeling', 'Patent/exclusivity landscape review'] },
      { id: 'comparability', title: isBiosimilar ? 'Analytical & Functional Comparability Studies' : 'Formulation & Bioequivalence Study Design', detail: isBiosimilar ? 'Extensive analytical, structural, and functional testing establishing high similarity to the reference biologic.' : 'Formulation development followed by a pharmacokinetic bioequivalence study against the reference product.', documents: isBiosimilar ? ['Analytical comparability report'] : ['Bioequivalence study protocol'] },
    ]
    if (isBiosimilar) {
      stages.push({ id: 'clinical', title: 'Confirmatory Clinical Study (often waivable)', detail: 'A targeted PK/PD or comparative efficacy study, which recent guidance in several jurisdictions increasingly allows to be waived when analytical data are sufficiently robust.', documents: ['Comparative clinical study report'] })
    }
    stages.push(
      { id: 'application', title: `${isBiosimilar ? r.biosimilarRoute : r.genericRoute} — Filing & Review`, detail: 'Abbreviated dossier submitted and reviewed against the reference product\u2019s established safety/efficacy record.', authority: r.maAuthority, documents: ['Abbreviated dossier', 'Proposed labeling matching reference'] },
      { id: 'post', title: 'Approval & Post-Market', detail: 'Ongoing pharmacovigilance; interchangeability/substitution designations (where applicable) may require additional evidence.', documents: ['Periodic safety reporting'] },
    )
    return finalizeStages(stages)
  }

  if (shape === 'device') {
    const isIVD = category === 'diagnostic'
    const stages: Stage[] = [
      { id: 'classify', title: 'Intended Use & Risk Classification', detail: `Classified under: ${r.deviceClasses}. ${isIVD ? r.ivdNote : ''}`, documents: ['Intended use statement', 'Risk classification rationale'] },
      { id: 'qms', title: 'Design Controls & Quality Management System', detail: 'Establish a quality management system (typically ISO 13485-aligned) and design/development documentation.', documents: ['Quality management system certificate', 'Design history file'] },
      { id: 'evaluation', title: 'Preclinical/Analytical & Clinical Evaluation', detail: 'Bench, analytical, and (for higher-risk devices) clinical performance data demonstrating safety and performance.', documents: ['Clinical/performance evaluation report', 'Risk management file'] },
      { id: 'conformity', title: 'Conformity Assessment / Premarket Submission', detail: r.deviceRoute, authority: r.deviceAuthority, documents: ['Technical file / Device Master Record', 'Declaration of conformity'] },
      { id: 'post', title: 'Market Authorization & Post-Market Surveillance', detail: 'Ongoing vigilance reporting, periodic safety updates, and field-safety-corrective-action obligations once on the market.', documents: ['Post-market surveillance plan', 'Vigilance/adverse-event reports'] },
    ]
    return finalizeStages(stages)
  }

  if (shape === 'cosmetic') {
    const stages: Stage[] = [
      { id: 'formulation', title: 'Formulation & Ingredient Safety Assessment', detail: 'A cosmetic safety assessor evaluates the formulation and each ingredient\u2019s safety profile at the intended concentration.', documents: ['Cosmetic Product Safety Report', 'Ingredient (INCI) list'] },
      { id: 'restricted', title: 'Restricted / Banned Substance Compliance', detail: 'Checked against the jurisdiction\u2019s restricted- and banned-ingredient lists — these lists differ significantly between regions.', documents: ['Restricted-substance compliance check'] },
      { id: 'notify', title: 'Notification or Registration', detail: r.cosmeticRoute, authority: r.cosmeticAuthority, documents: ['Notification/registration filing', 'Responsible Person appointment (where required)'] },
      { id: 'labeling', title: 'Labeling & Claims Substantiation', detail: 'Ingredient labeling, usage warnings, and evidence backing any cosmetic claims made (e.g., "reduces wrinkles") must be substantiated and are frequently the subject of enforcement action.', documents: ['Label proof', 'Claims substantiation dossier'] },
      { id: 'post', title: 'Market Placement & Post-Market Surveillance', detail: 'Ongoing adverse-event/cosmetovigilance monitoring; market surveillance rather than clinical-style pharmacovigilance.', documents: ['Cosmetovigilance / adverse-event log'] },
    ]
    return finalizeStages(stages)
  }

  if (shape === 'homeopathy') {
    const stages: Stage[] = [
      { id: 'classify', title: 'Product Classification & Pharmacopeia Compliance', detail: 'Determine whether the product is formulated according to an official homeopathic pharmacopeia monograph (e.g., HPUS in the US, homeopathic monographs in the European Pharmacopoeia, or the Homoeopathic Pharmacopoeia of India).', documents: ['Pharmacopeia monograph reference'] },
      { id: 'potency', title: 'Potency & Dilution Documentation', detail: 'Manufacturing documentation for the specific dilution/potency claimed (e.g., 6C, 30C), following the pharmacopeial preparation method rather than a novel-drug specification.', documents: ['Manufacturing/dilution process record'] },
      { id: 'quality', title: 'Safety & Quality Documentation', detail: 'Good manufacturing practice compliance and quality control, generally without the toxicology package required for a novel active ingredient given the extreme dilutions typically involved.', documents: ['GMP compliance evidence', 'Quality control specifications'] },
      { id: 'filing', title: 'Registration or Notification', detail: r.homeopathyRoute, authority: r.homeopathyAuthority, documents: ['Registration/notification filing (where one exists)'] },
      { id: 'post', title: 'Market Placement & Post-Market Vigilance', detail: 'Ongoing adverse-event monitoring; regulatory attention has been increasing in some jurisdictions for higher-risk or high-concentration homeopathic products.', documents: ['Adverse-event monitoring reports'] },
    ]
    return finalizeStages(stages)
  }

  // herbal
  const stages: Stage[] = [
    { id: 'classify', title: 'Product Classification', detail: 'Determine whether the product is treated as a traditional medicine, a food/dietary supplement, or a full drug requiring the standard pathway.', documents: ['Product classification rationale'] },
    { id: 'quality', title: 'Quality & Manufacturing Documentation', detail: 'Good manufacturing practice compliance and quality/specification documentation for the herbal material and finished product.', documents: ['GMP certificate', 'Quality specifications'] },
    { id: 'evidence', title: 'Traditional-Use Evidence Compilation', detail: 'Bibliographic and historical-use evidence substituting for full clinical efficacy trials, per: ' + r.herbalRoute, documents: ['Bibliographic traditional-use evidence', 'Safety literature review'] },
    { id: 'filing', title: 'Simplified Registration Filing & Review', detail: r.herbalNote, authority: r.herbalAuthority, documents: ['Simplified registration dossier', 'Proposed labeling'] },
    { id: 'post', title: 'Registration & Post-Market Vigilance', detail: 'Ongoing adverse-event reporting; scope is typically narrower than for full pharmaceutical pharmacovigilance.', documents: ['Adverse-event monitoring reports'] },
  ]
  return finalizeStages(stages)
}

function totalTrialMonths(r: RegulatorParams): number | null {
  if (r.ctaMonths === null || r.maMonths === null) return null
  return r.ctaMonths + 12 + 24 + 36 + r.maMonths
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'IND', def: 'Investigational New Drug application (US) — required before starting human clinical trials.' },
  { term: 'NDA / BLA', def: 'New Drug Application / Biologics License Application (US) — the marketing application for a small molecule or biologic.' },
  { term: 'CTA', def: 'Clinical Trial Application — the generic term most jurisdictions use for authorization to begin a clinical trial.' },
  { term: 'MAA', def: 'Marketing Authorisation Application — the EU (and EU-influenced) term for a drug\u2019s approval application.' },
  { term: 'CHMP', def: 'Committee for Medicinal Products for Human Use — EMA\u2019s scientific committee that recommends approval decisions.' },
  { term: 'PDCO', def: 'Paediatric Committee — the EMA committee that reviews and agrees Paediatric Investigation Plans.' },
  { term: 'COMP', def: 'Committee for Orphan Medicinal Products — the EMA committee that grants orphan drug designation.' },
  { term: 'CAT', def: 'Committee for Advanced Therapies — the EMA committee overseeing ATMPs (cell/gene therapies).' },
  { term: 'ANDA', def: 'Abbreviated New Drug Application (US) — the generic-drug approval application, based on bioequivalence.' },
  { term: 'ANDS', def: 'Abbreviated New Drug Submission (Canada) — the Canadian equivalent of an ANDA.' },
  { term: 'NDS', def: 'New Drug Submission (Canada) — Health Canada\u2019s marketing application for a new drug.' },
  { term: '351(k)', def: 'The US biosimilar approval pathway, named for its section of the Public Health Service Act.' },
  { term: '510(k)', def: 'The most common US medical device clearance route, based on substantial equivalence to an existing device.' },
  { term: 'PMA', def: 'Premarket Approval — the most rigorous US device pathway, required for high-risk (Class III) devices.' },
  { term: 'De Novo', def: 'A US device pathway for novel low-to-moderate risk devices with no existing equivalent to compare against.' },
  { term: 'MDR', def: 'Medical Device Regulation (EU) — the current EU legal framework for medical devices.' },
  { term: 'IVDR', def: 'In Vitro Diagnostic Regulation (EU) — the EU\u2019s dedicated framework for diagnostic devices.' },
  { term: 'THMPD', def: 'Traditional Herbal Medicinal Products Directive (EU) — the simplified registration route for herbal products with 30+ years of documented use.' },
  { term: 'AYUSH', def: 'India\u2019s Ministry of Ayurveda, Yoga, Unani, Siddha and Homoeopathy — regulates classical traditional medicine separately from CDSCO.' },
  { term: 'TCM', def: 'Traditional Chinese Medicine — has its own simplified registration pathway under China\u2019s NMPA.' },
  { term: 'Kampo', def: 'Traditional Japanese herbal medicine, with its own long-established monograph-based approval system under PMDA.' },
  { term: 'PREA', def: 'Pediatric Research Equity Act (US) — requires pediatric study plans for most new drug applications.' },
  { term: 'BPCA', def: 'Best Pharmaceuticals for Children Act (US) — offers 6 months\u2019 exclusivity for voluntary pediatric studies.' },
  { term: 'PIP', def: 'Paediatric Investigation Plan (EU) — a mandatory plan for pediatric drug development, agreed with the PDCO.' },
  { term: 'PUMA', def: 'Paediatric Use Marketing Authorisation (EU) — a dedicated pathway for off-patent medicines newly developed for children.' },
  { term: 'RMAT', def: 'Regenerative Medicine Advanced Therapy (US) — an expedited FDA designation for qualifying cell and gene therapies.' },
  { term: 'ATMP', def: 'Advanced Therapy Medicinal Product (EU) — the EU\u2019s regulatory category for cell, gene, and tissue-engineered therapies.' },
  { term: 'SAKIGAKE', def: 'Japan\u2019s "pioneer" designation prioritizing drugs developed and filed first in Japan.' },
  { term: 'MoCRA', def: 'Modernization of Cosmetics Regulation Act (US, 2022) — introduced facility registration and product listing for cosmetics.' },
  { term: 'CPNP', def: 'Cosmetic Products Notification Portal (EU) — where cosmetics must be notified before sale in the EU.' },
  { term: 'DSHEA', def: 'Dietary Supplement Health and Education Act (US) — the law under which most herbal products are marketed as supplements, not drugs.' },
  { term: 'PDUFA', def: 'Prescription Drug User Fee Act (US) — sets FDA\u2019s review-time goals in exchange for sponsor-paid fees.' },
  { term: 'PvPI', def: 'Pharmacovigilance Programme of India — India\u2019s national adverse-event monitoring system.' },
  { term: 'PSUR', def: 'Periodic Safety Update Report — a recurring post-approval safety report required in many jurisdictions.' },
  { term: 'REMS', def: 'Risk Evaluation and Mitigation Strategy (US) — extra safety controls FDA can require for higher-risk drugs.' },
  { term: 'MDSAP', def: 'Medical Device Single Audit Program — one audit accepted across several countries\u2019 device regulators, including Canada.' },
  { term: 'ARTG', def: 'Australian Register of Therapeutic Goods — the master list a product must join to be legally supplied in Australia.' },
  { term: 'NPN', def: 'Natural Product Number (Canada) — issued to a Natural Health Product under its simplified licensing stream.' },
  { term: 'SEB', def: 'Subsequent Entry Biologic — Health Canada\u2019s term for what most other jurisdictions call a biosimilar.' },
  { term: 'SBP', def: 'Similar Biotherapeutic Product — WHO\u2019s term for a biosimilar.' },
  { term: 'AMA', def: 'African Medicines Agency — a new pan-African body (founding treaty in force 2021) coordinating joint scientific review across African Union member states, without replacing national regulators.' },
  { term: 'HPUS', def: 'Homeopathic Pharmacopoeia of the United States — the official compendium historically underpinning US homeopathic product formulation.' },
  { term: 'HTA', def: 'Health Technology Assessment — the pricing/reimbursement evaluation (e.g., by NICE) that happens after regulatory approval, and is outside this app\u2019s scope.' },
  { term: 'Jamu', def: 'Indonesia\u2019s traditional herbal medicine tradition — the lowest-evidence tier of BPOM\u2019s three-tier traditional-medicine framework.' },
]

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({ stages, color, selectedId, onSelect }: { stages: Stage[]; color: string; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-0">
      {stages.map((s, i) => {
        const isSelected = s.id === selectedId
        return (
          <button key={s.id} onClick={() => onSelect(s.id)} className="w-full text-left flex gap-3 group">
            <div className="flex flex-col items-center">
              <div
                key={isSelected ? `${s.id}-active` : s.id}
                className="w-4 h-4 rounded-full border-2 shrink-0 mt-1"
                style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent', animation: isSelected ? 'stagePop 0.35s ease-out' : undefined }}
              />
              {i < stages.length - 1 && <div className="w-0.5 flex-1 min-h-6" style={{ backgroundColor: 'hsl(var(--lab-line))' }} />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-mono font-bold" style={{ color: isSelected ? color : 'hsl(var(--lab-text))' }}>{s.title}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compare table
// ---------------------------------------------------------------------------

function CompareTable({ category, selectedRegulators, onSelectCell }: { category: ProductCategory; selectedRegulators: RegulatorKey[]; onSelectCell: (r: RegulatorKey, id: string) => void }) {
  const regs = REGULATORS.filter((r) => selectedRegulators.includes(r.key))
  const stagesByReg = regs.map((r) => ({ r, stages: buildStages(r, category) }))
  const maxStages = Math.max(...stagesByReg.map((s) => s.stages.length))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 text-lab-text-muted">Stage #</th>
            {regs.map((r) => (
              <th key={r.key} className="text-left p-2" style={{ color: r.color }}>{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxStages }, (_, row) => (
            <tr key={row} className="border-t border-lab-line">
              <td className="p-2 text-lab-text-muted align-top">{row + 1}</td>
              {stagesByReg.map(({ r, stages }) => {
                const stage = stages[row]
                if (!stage) return <td key={r.key} className="p-2 align-top text-lab-text-muted">—</td>
                return (
                  <td key={r.key} className="p-2 align-top">
                    <button onClick={() => onSelectCell(r.key, stage.id)} className="text-left hover:underline">
                      <span className="block text-lab-text">{stage.title}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeline & ranking (trial-shape categories only)
// ---------------------------------------------------------------------------

function TimelineRanking({ category }: { category: ProductCategory }) {
  if (CATEGORY_META[category].shape !== 'trial') return null
  const rows = REGULATORS.map((r) => ({ r, months: totalTrialMonths(r) })).filter((x): x is { r: RegulatorParams; months: number } => x.months !== null).sort((a, b) => a.months - b.months)
  const maxMonths = Math.max(...rows.map((x) => x.months))

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-text-muted">Illustrative fastest-to-slowest ranking, {CATEGORY_META[category].label} (regulatory-clock stages only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.map(({ r, months }) => {
          const pct = (months / maxMonths) * 100
          return (
            <div key={r.key} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-24 shrink-0 text-lab-text-muted truncate">{r.name}</span>
              <div className="flex-1 h-4 rounded bg-lab-panel-strong overflow-hidden">
                <div style={{ width: `${pct}%`, backgroundColor: r.color, height: '100%', animation: 'barGrowWidth 0.6s ease-out' }} />
              </div>
              <span className="w-14 shrink-0 text-lab-text text-right">{(months / 12).toFixed(1)} yrs</span>
            </div>
          )
        })}
        <p className="text-xs text-lab-text-muted mt-2">Illustrative only — actual timelines vary widely by product and procedure (standard vs. expedited). Regulators without a comparable timeline (e.g., AMA, WHO PQ) are omitted here.</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

function DirectoryView() {
  return (
    <div className="grid gap-3">
      {REGULATORS.map((r) => (
        <Card key={r.key} className="border-2 bg-lab-panel" style={{ borderColor: r.color }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-base" style={{ color: r.color }}>{r.name} — {r.fullName}</CardTitle>
            <CardDescription className="text-lab-text-muted font-mono text-xs">{r.region}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Parent body: </span>{r.parentMinistry}</p>
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Key committees: </span>{r.keyCommittees}</p>
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Scope note: </span>{r.notableScope}</p>
            <p className="rounded bg-lab-panel-strong p-2 text-xs text-lab-text mt-2">💡 <span className="font-mono text-lab-amber">Did you know:</span> {r.funFact}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Glossary view
// ---------------------------------------------------------------------------

function GlossaryView() {
  const [query, setQuery] = useState('')
  const filtered = GLOSSARY.filter((g) => g.term.toLowerCase().includes(query.toLowerCase()) || g.def.toLowerCase().includes(query.toLowerCase()))
  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardContent className="pt-4 space-y-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter glossary (e.g. PIP, ATMP, DSHEA, AMA)" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
        <div className="grid sm:grid-cols-2 gap-2">
          {filtered.map((g) => (
            <div key={g.term} className="text-sm">
              <span className="font-mono font-bold text-lab-text">{g.term}</span>
              <span className="block text-lab-text-muted text-xs">{g.def}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-lab-text-muted">No matching terms.</p>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Search view
// ---------------------------------------------------------------------------

interface SearchHit {
  regulator: RegulatorParams
  category: ProductCategory
  stage: Stage
}

function SearchView({ onJump }: { onJump: (r: RegulatorKey, category: ProductCategory, stageId: string) => void }) {
  const [query, setQuery] = useState('')

  const hits = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase()
    const results: SearchHit[] = []
    for (const r of REGULATORS) {
      for (const c of CATEGORY_ORDER) {
        const stages = buildStages(r, c)
        for (const s of stages) {
          const haystack = `${s.title} ${s.detail} ${s.authority ?? ''} ${s.documents.join(' ')}`.toLowerCase()
          if (haystack.includes(q)) results.push({ regulator: r, category: c, stage: s })
        }
      }
    }
    return results.slice(0, 50)
  }, [query])

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardContent className="pt-4 space-y-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every regulator × category (e.g. 'priority review', 'waiver', 'GMP')" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
        {query.trim().length >= 2 && (
          <p className="text-xs text-lab-text-muted font-mono">{hits.length}{hits.length === 50 ? '+' : ''} match{hits.length === 1 ? '' : 'es'}{hits.length === 50 ? ' (showing first 50)' : ''}</p>
        )}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hits.map((h, i) => (
            <button key={i} onClick={() => onJump(h.regulator.key, h.category, h.stage.id)} className="w-full text-left rounded border border-lab-line p-2 hover:border-lab-text-muted">
              <span className="font-mono text-xs" style={{ color: h.regulator.color }}>{h.regulator.name}</span>
              <span className="text-xs text-lab-text-muted"> · {CATEGORY_META[h.category].label} · </span>
              <span className="text-sm text-lab-text font-mono">{h.stage.title}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const REGIONS = Array.from(new Set(REGULATORS.map((r) => r.region)))

function App() {
  const [mode, setMode] = useState<'explore' | 'compare' | 'directory' | 'glossary' | 'search'>('explore')
  const [category, setCategory] = useState<ProductCategory>('small-molecule')
  const [regulatorKey, setRegulatorKey] = useState<RegulatorKey>('FDA')
  const [selectedId, setSelectedId] = useState<string>('preclinical')
  const [compareSet, setCompareSet] = useState<RegulatorKey[]>(['FDA', 'EMA', 'CDSCO'])

  const regulator = REGULATORS.find((r) => r.key === regulatorKey)!
  const stages = useMemo(() => buildStages(regulator, category), [regulator, category])
  const stage = useMemo(() => stages.find((s) => s.id === selectedId) ?? stages[0], [stages, selectedId])
  const catMeta = CATEGORY_META[category]
  const shapeMeta = SHAPE_META[catMeta.shape]

  function selectCell(r: RegulatorKey, id: string) {
    setRegulatorKey(r)
    setSelectedId(id)
    setMode('explore')
  }

  function jumpFromSearch(r: RegulatorKey, cat: ProductCategory, stageId: string) {
    setRegulatorKey(r)
    setCategory(cat)
    setSelectedId(stageId)
    setMode('explore')
  }

  function toggleCompare(key: RegulatorKey) {
    setCompareSet((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 4) return prev
      return [...prev, key]
    })
  }

  return (
    <div className="min-h-screen bg-lab-bg text-lab-text">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-lab-text-muted">Global Regulatory Pathway Explorer</p>
          <h1 className="text-xl font-mono font-bold text-lab-text">21 regulators · 13 product categories</h1>
          <p className="text-sm text-lab-text-muted">How a health product moves from discovery to approval, across every major world region and product type.</p>
        </header>

        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Product category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => (
              <Button key={c} onClick={() => setCategory(c)} variant="outline" size="sm" className="border-2 font-mono text-[11px] px-2 h-7" style={category === c ? { borderColor: 'hsl(var(--lab-text))', color: 'hsl(var(--lab-text))' } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}>
                {CATEGORY_META[c].label}
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-lab-panel border-lab-line">
          <CardContent className="pt-4 flex items-start gap-2">
            <span className="text-lg shrink-0" style={{ color: shapeMeta.color }} title={shapeMeta.label}>{shapeMeta.icon}</span>
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: shapeMeta.color }}>{shapeMeta.label} pathway</p>
              <p className="text-sm text-lab-text">{catMeta.note}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 flex-wrap">
          {(['explore', 'compare', 'directory', 'glossary', 'search'] as const).map((m) => (
            <Button key={m} onClick={() => setMode(m)} variant="outline" size="sm" className="border-2 font-mono capitalize" style={mode === m ? { borderColor: 'hsl(var(--lab-text))', color: 'hsl(var(--lab-text))' } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}>
              {m === 'compare' ? 'Compare up to 4' : m}
            </Button>
          ))}
        </div>

        {mode === 'explore' && (
          <>
            {REGIONS.map((region) => (
              <div key={region} className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-mono text-lab-text-muted">{region}</p>
                <div className="flex flex-wrap gap-1.5">
                  {REGULATORS.filter((r) => r.region === region).map((r) => (
                    <Button
                      key={r.key}
                      onClick={() => { setRegulatorKey(r.key); setSelectedId('preclinical') }}
                      variant="outline"
                      size="sm"
                      className="border-2 font-mono text-[11px] px-2 h-7"
                      style={regulatorKey === r.key ? { borderColor: r.color, color: r.color } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}
                    >
                      {r.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div key={regulator.key} style={{ animation: 'regionFade 0.3s ease-out' }} className="space-y-2">
              <p className="text-xs font-mono text-lab-text-muted">
                {regulator.fullName} — {regulator.region}
                {regulator.confidence === 'moderate' && <span className="text-lab-amber"> · illustrative detail, general/ICH-aligned where agency-specific sourcing is thinner</span>}
              </p>
              <div className="rounded-md border border-lab-amber-soft bg-lab-panel-strong p-2.5 text-xs text-lab-text" style={{ animation: 'factReveal 0.4s ease-out' }}>
                💡 <span className="font-mono text-lab-amber">Did you know:</span> {regulator.funFact}
              </div>
            </div>

            <TimelineRanking category={category} />

            <div className="grid sm:grid-cols-[220px_1fr] gap-4">
              <Card className="bg-lab-panel border-lab-line">
                <CardContent className="pt-4">
                  <Stepper stages={stages} color={regulator.color} selectedId={stage.id} onSelect={setSelectedId} />
                </CardContent>
              </Card>

              <Card className="border-2" style={{ borderColor: regulator.color, backgroundColor: 'hsl(var(--lab-panel))' }} key={stage.id}>
                <CardHeader>
                  <CardTitle className="font-mono text-lg" style={{ color: regulator.color }}>{stage.title}</CardTitle>
                  {stage.authority && <CardDescription className="text-lab-text-muted font-mono text-xs">{stage.authority}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                  <p className="text-sm text-lab-text">{stage.detail}</p>
                  {stage.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-mono text-lab-text-muted mb-1">Key documents</p>
                      <ul className="space-y-1">
                        {stage.documents.map((d, i) => (
                          <li key={i} className="text-sm text-lab-text-muted before:content-['—'] before:mr-2">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {mode === 'compare' && (
          <>
            <div>
              <p className="text-xs font-mono text-lab-text-muted mb-1">Choose up to 4 regulators to compare</p>
              <div className="flex flex-wrap gap-1.5">
                {REGULATORS.map((r) => (
                  <Button
                    key={r.key}
                    onClick={() => toggleCompare(r.key)}
                    variant="outline"
                    size="sm"
                    className="border-2 font-mono text-[11px] px-2 h-7"
                    style={compareSet.includes(r.key) ? { borderColor: r.color, color: r.color } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}
                  >
                    {r.name}
                  </Button>
                ))}
              </div>
            </div>
            <Card className="bg-lab-panel border-lab-line">
              <CardContent className="pt-4">
                <CompareTable category={category} selectedRegulators={compareSet} onSelectCell={selectCell} />
                <p className="text-xs text-lab-text-muted mt-3">Click any cell to open its full detail in Explore mode.</p>
              </CardContent>
            </Card>
          </>
        )}

        {mode === 'directory' && <DirectoryView />}
        {mode === 'glossary' && <GlossaryView />}
        {mode === 'search' && <SearchView onJump={jumpFromSearch} />}

        <p className="text-center text-xs text-lab-text-muted font-mono">Educational overview only, not regulatory or legal advice — always consult current official agency guidance for a specific product. Detail depth varies by agency based on available public documentation. Regulatory approval is separate from pricing/reimbursement (health technology assessment), which is outside this app\u2019s scope.</p>
        <p className="text-center text-xs text-lab-text-muted font-mono">built by Khan Gulrez Shagufa Fazal Ahmed</p>
      </div>
    </div>
  )
}

