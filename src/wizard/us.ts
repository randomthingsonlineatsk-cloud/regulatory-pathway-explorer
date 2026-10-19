// US pack: FD&C Act section 513 classes, the classification regulations in 21 CFR Parts 862 to
// 892, and the premarket routes (exempt, 510(k), De Novo, PMA, HDE, and BLA for blood donor
// screening tests regulated by CBER). Review goals are the MDUFA V performance goals.
import type { Answers, Option } from './questions'
import type { RegionPack, RegionResult, RouteStep } from './types'

export interface UsType {
  id: string
  name: string
  cfr: string            // classification regulation
  panel: string
  cls: 'I' | 'II' | 'III' | 'BLA'
  exempt: boolean        // exempt from 510(k), subject to the limitations in the panel's .9 section
  exemptNote?: string
  clia?: string
  note?: string
}

// Generic device types used by the app's fictional devices. The regulation numbers, classes and
// exemptions are FDA's; the device names in the library are invented.
export const US_TYPES: UsType[] = [
  { id: 'adhesive_bandage', name: 'Medical adhesive tape and adhesive bandage', cfr: '21 CFR 880.5240', panel: 'General Hospital and Personal Use', cls: 'I', exempt: true },
  { id: 'cold_pack', name: 'Hot or cold disposable pack', cfr: '21 CFR 890.5710', panel: 'Physical Medicine', cls: 'I', exempt: true, exemptNote: 'Exempt from 510(k) except when intended for use on infants (subject to 21 CFR 890.9).' },
  { id: 'wheelchair', name: 'Mechanical wheelchair', cfr: '21 CFR 890.3850', panel: 'Physical Medicine', cls: 'I', exempt: true },
  { id: 'scalpel', name: 'Manual surgical instrument for general use', cfr: '21 CFR 878.4800', panel: 'General and Plastic Surgery', cls: 'I', exempt: true },
  { id: 'contact_lens', name: 'Soft (hydrophilic) contact lens, daily wear', cfr: '21 CFR 886.5925', panel: 'Ophthalmic', cls: 'II', exempt: false, note: 'Daily-wear lenses are class II; extended-wear lenses are class III and need PMA (21 CFR 886.5925(b) and (c)).' },
  { id: 'urinary_catheter', name: 'Urological catheter and accessories', cfr: '21 CFR 876.5130', panel: 'Gastroenterology and Urology', cls: 'II', exempt: false },
  { id: 'dental_implant', name: 'Endosseous dental implant', cfr: '21 CFR 872.3640', panel: 'Dental', cls: 'II', exempt: false },
  { id: 'hip', name: 'Hip joint metal/polymer/metal semi-constrained porous-coated uncemented prosthesis', cfr: '21 CFR 888.3358', panel: 'Orthopedic', cls: 'II', exempt: false },
  { id: 'infusion_pump', name: 'Infusion pump', cfr: '21 CFR 880.5725', panel: 'General Hospital and Personal Use', cls: 'II', exempt: false, note: 'FDA expects infusion pump 510(k)s to follow its guidance on total product life cycle for infusion pumps.' },
  { id: 'tens', name: 'Transcutaneous electrical nerve stimulator for pain relief', cfr: '21 CFR 882.5890', panel: 'Neurology', cls: 'II', exempt: false },
  { id: 'pacemaker', name: 'Implantable pacemaker pulse generator', cfr: '21 CFR 870.3610', panel: 'Cardiovascular', cls: 'III', exempt: false },
  { id: 'hcg', name: 'Human chorionic gonadotropin (HCG) test system', cfr: '21 CFR 862.1155', panel: 'Clinical Chemistry and Toxicology', cls: 'II', exempt: false, clia: 'Over-the-counter home-use tests are CLIA-waived.' },
  { id: 'glucose', name: 'Glucose test system (blood glucose meter for self-monitoring)', cfr: '21 CFR 862.1345', panel: 'Clinical Chemistry and Toxicology', cls: 'II', exempt: false, clia: 'Over-the-counter self-monitoring meters are CLIA-waived; professional use needs a CLIA waiver by application or is moderate complexity.' },
  { id: 'specimen_container', name: 'Specimen transport and storage container', cfr: '21 CFR 864.3250', panel: 'Hematology and Pathology', cls: 'I', exempt: true },
  { id: 'hiv_donor', name: 'HIV screening assay for blood and plasma donors', cfr: 'PHS Act section 351; donor testing under 21 CFR 610.40', panel: 'CBER (biologics)', cls: 'BLA', exempt: false, note: 'Donor screening tests used by blood establishments are licensed as biological products by CBER, not cleared as devices by CDRH.' },
]

export const US_OPTIONS: Option[] = [
  ...US_TYPES.map((t) => ({ id: t.id, label: `${t.name} (${t.cfr})` })),
  { id: 'novel', label: 'None of these: a new type of device with no classification regulation' },
]

const PMA_DOCS = ['PMA application under 21 CFR 814.20: device description, indications, manufacturing methods and controls, non-clinical and clinical studies, labelling', 'Investigational device exemption (IDE, 21 CFR 812) for the pivotal clinical study', 'Pre-approval manufacturing inspection under the QMSR (21 CFR 820)', 'Post-approval study commitments and annual reports (21 CFR 814.84)']
const K510_DOCS = ['510(k) in eSTAR: device description, intended use and indications', 'Substantial equivalence comparison with the predicate', 'Labelling', 'Performance testing (bench; animal or clinical if needed)', 'Biocompatibility (ISO 10993-1), sterilisation and shelf life where relevant', 'Software, cybersecurity, electrical safety and EMC where relevant']
const ALWAYS = ['Establishment registration and device listing (21 CFR 807)', 'Quality Management System Regulation, incorporating ISO 13485 (21 CFR 820)', 'Unique device identification and GUDID entry (21 CFR 830)', 'Medical device reporting (21 CFR 803)', 'Labelling (21 CFR 801; 809 for IVDs)']

function result(partial: Omit<RegionResult, 'region' | 'regulation' | 'hits' | 'notes'> & { hits: RegionResult['hits']; notes?: string[] }): RegionResult {
  return { region: 'US', regulation: 'FD&C Act section 513; 21 CFR Parts 800 to 898', notes: [], ...partial }
}

export const US_PACK: RegionPack = {
  id: 'US', name: 'United States', regulator: 'FDA', version: '1.0.0', asOf: '2026-10-20',
  classify(a: Answers): RegionResult {
    const id = a.us_type as string | undefined
    if (!id) return result({ cls: '?', hits: [], route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, incomplete: 'Choose the US device type.' })

    if (id === 'novel') {
      if (!a.us_risk) return result({ cls: '?', hits: [], route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, incomplete: 'Say how risky the new device is.' })
      const hit = { rule: 'FD&C Act section 513(f)(1)', cls: 'Class III', text: 'A new type of device with no classification regulation is class III by law until FDA classifies it.' }
      if (a.us_risk === 'low_moderate') {
        return result({
          cls: 'Class I or II (by De Novo)', hits: [hit, { rule: 'FD&C Act section 513(f)(2)', cls: 'Class I or II', text: 'De Novo lets FDA classify a low or moderate risk device with no predicate into class I or II, creating a new classification regulation.' }], decisive: hit,
          route: 'De Novo classification request (21 CFR 860 subpart D)', reviewer: 'FDA CDRH',
          steps: [
            { step: 'Optional: 513(g) request or Pre-Submission meeting', detail: 'Ask FDA how it would classify the device, or agree the testing plan.' },
            { step: 'De Novo request in eSTAR', detail: 'Mandatory electronic format for De Novo requests since 1 October 2025.' },
            { step: 'FDA review', detail: 'Risk-benefit, proposed special controls, and the evidence that they assure safety and effectiveness.' },
            { step: 'Granted: new classification regulation and product code', detail: 'The device becomes a predicate for later 510(k)s.' },
          ],
          documents: ['De Novo request: device description, risks and mitigations, proposed special controls, benefit-risk', 'Performance data (bench, and clinical if needed)', 'Labelling', ...ALWAYS],
          timeline: { label: 'MDUFA V goal: a decision within 150 FDA days for 70% of De Novo requests.', source: 'MDUFA V commitment letter' },
        })
      }
      if (a.us_hud === undefined) return result({ cls: 'Class III', hits: [hit], decisive: hit, route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, incomplete: 'Say whether it is a Humanitarian Use Device.' })
      if (a.us_hud === true) {
        return result({
          cls: 'Class III (Humanitarian Use Device)', hits: [hit, { rule: '21 CFR 814 subpart H', cls: 'HDE', text: 'A Humanitarian Use Device for a condition affecting no more than 8,000 people a year in the US can be approved through an HDE on probable benefit.' }], decisive: hit,
          route: 'HUD designation, then Humanitarian Device Exemption (HDE)', reviewer: 'FDA Office of Orphan Products Development (designation); CDRH (HDE)',
          steps: [{ step: 'Request HUD designation', detail: '21 CFR 814.102.' }, { step: 'HDE application', detail: 'Safety and probable benefit; IRB approval needed at each facility using the device.' }],
          documents: ['HUD designation request', 'HDE application (21 CFR 814.104)', ...ALWAYS],
          timeline: { label: 'FDA has 75 days to review an HDE.', source: '21 CFR 814.114' },
        })
      }
      return result({
        cls: 'Class III', hits: [hit], decisive: hit, route: 'Premarket approval (PMA, 21 CFR 814)', reviewer: 'FDA CDRH, often with an advisory panel',
        steps: [{ step: 'Pre-Submission meetings', detail: 'Agree the clinical study design.' }, { step: 'IDE for the pivotal study', detail: '21 CFR 812; significant-risk study.' }, { step: 'PMA submission and review', detail: 'Filing review, substantive review, panel if needed, manufacturing inspection.' }],
        documents: [...PMA_DOCS, ...ALWAYS],
        timeline: { label: 'MDUFA V goal: a decision within 180 FDA days without an advisory panel, 320 FDA days with one.', source: 'MDUFA V commitment letter' },
      })
    }

    const t = US_TYPES.find((x) => x.id === id)!
    const hit = { rule: t.cfr, cls: t.cls === 'BLA' ? 'Biologic' : `Class ${t.cls}`, text: `${t.name}: classified in ${t.cfr} (${t.panel}).` }
    const notes = [t.note, t.exemptNote, t.clia].filter(Boolean) as string[]

    if (t.cls === 'BLA') {
      return result({
        cls: 'Licensed biologic (BLA)', hits: [hit], decisive: hit, route: 'Biologics License Application under PHS Act section 351', reviewer: 'FDA CBER',
        steps: [{ step: 'Pre-BLA meeting with CBER', detail: 'Agree the clinical (donor) studies and lot release testing.' }, { step: 'IND for the clinical studies', detail: 'Investigational use in blood establishments.' }, { step: 'BLA review and pre-licence inspection', detail: 'Including lot release protocols.' }],
        documents: ['BLA with clinical specificity and sensitivity studies in donor populations', 'Manufacturing information and lot release protocol', 'Labelling', 'Establishment registration'],
        timeline: { label: 'Reviewed under CBER performance goals; varies by submission type.', source: 'FDA CBER' }, notes,
      })
    }
    if (t.cls === 'III') {
      return result({ cls: 'Class III', hits: [hit], decisive: hit, route: 'Premarket approval (PMA, 21 CFR 814)', reviewer: 'FDA CDRH, often with an advisory panel', steps: [{ step: 'Pre-Submission meetings', detail: 'Agree the clinical study design.' }, { step: 'IDE for the pivotal study', detail: '21 CFR 812.' }, { step: 'PMA submission and review', detail: 'Including manufacturing inspection.' }], documents: [...PMA_DOCS, ...ALWAYS], timeline: { label: 'MDUFA V goal: a decision within 180 FDA days without an advisory panel, 320 FDA days with one.', source: 'MDUFA V commitment letter' }, notes })
    }
    if (t.exempt) {
      return result({ cls: `Class ${t.cls} (510(k) exempt)`, hits: [hit], decisive: hit, route: 'Exempt from premarket notification: register and list', reviewer: 'No FDA premarket review', steps: [{ step: 'Check the limits of the exemption', detail: `The exemption does not cover a device with a different intended use or different fundamental technology (the .9 section of the panel's Part).` }, { step: 'Register the establishment and list the device', detail: '21 CFR 807.' }], documents: ALWAYS, timeline: { label: 'No premarket review; the device can be marketed once registered and listed.', source: '21 CFR 807' }, notes })
    }
    // 510(k) types
    if (a.us_predicate === undefined || (a.us_predicate === true && a.us_own_change === undefined)) return result({ cls: `Class ${t.cls}`, hits: [hit], decisive: hit, route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, incomplete: 'Answer the predicate questions.', notes })
    if (a.us_predicate === false) {
      return result({ cls: `Class ${t.cls}`, hits: [hit], decisive: hit, route: 'No predicate: De Novo request (or ask FDA through a 513(g) request first)', reviewer: 'FDA CDRH', steps: [{ step: '513(g) request or Pre-Submission', detail: 'Confirm whether a predicate exists or a De Novo is needed.' }, { step: 'De Novo request in eSTAR', detail: '21 CFR 860 subpart D.' }], documents: ['De Novo request with proposed special controls', 'Performance data', ...ALWAYS], timeline: { label: 'MDUFA V goal: a decision within 150 FDA days for 70% of De Novo requests.', source: 'MDUFA V commitment letter' }, notes })
    }
    const special = a.us_own_change === true
    const steps: RouteStep[] = [
      ...(special ? [] : [{ step: 'Pick a predicate and plan testing', detail: 'Same intended use; the same technology, or differences that do not raise different questions of safety and effectiveness.' }]),
      { step: special ? 'Special 510(k) in eSTAR' : 'Traditional 510(k) in eSTAR', detail: special ? 'For a change to your own cleared device where established methods are enough to assess it; design control summary.' : 'Mandatory electronic format for 510(k)s since 1 October 2023.' },
      { step: 'FDA review and substantial equivalence decision', detail: 'An additional information request pauses the clock.' },
      { step: 'Register and list', detail: '21 CFR 807.' },
    ]
    return result({
      cls: `Class ${t.cls}`, hits: [hit], decisive: hit, route: special ? 'Special 510(k)' : 'Traditional 510(k) (or Abbreviated 510(k) if relying on guidance, special controls or recognised standards)', reviewer: 'FDA CDRH',
      steps, documents: [...K510_DOCS, ...ALWAYS],
      timeline: special ? { label: 'Special 510(k)s are processed within 30 days.', source: 'FDA guidance: The Special 510(k) Program' } : { label: 'MDUFA V goal: a decision within 90 FDA days for 95% of 510(k)s.', source: 'MDUFA V commitment letter' },
      notes,
    })
  },
}
