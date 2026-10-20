// Phase 4 region packs: the UK, Canada, Australia, Japan, China and Switzerland.
// Canada and the UK apply their own rule texts. Australia's Schedule 2 follows the EU rules with
// its own changes. Switzerland applies the EU MDR and IVDR rules in Swiss law. Japan and China
// assign a class through their product lists (JMDN codes; the Classification Catalogue), so those
// packs give an estimate from the GHTF-based rules both use, and say so.
import { usSoftwareStatus, type Answers } from './questions'
import type { RegionPack, RegionResult, RuleHit, RouteStep, RegionId } from './types'
import { EU_PACK, mdrHits } from './eu'
import { inDeviceHits, inIvdHits } from './in'
import { n12Category, N12_TEXT, notDevice } from './sw'

const pick = (a: Answers, q: string): string[] => (Array.isArray(a[q]) ? (a[q] as string[]) : [])
const top = (hits: RuleHit[], order: string[]) => hits.reduce<RuleHit | undefined>((m, h) => (!m || order.indexOf(h.cls) > order.indexOf(m.cls) ? h : m), undefined)
const empty = { route: '', reviewer: '', steps: [] as RouteStep[], documents: [] as string[], timeline: { label: '', source: '' }, notes: [] as string[] }
const incomplete = (region: RegionId, regulation: string, msg: string): RegionResult => ({ region, regulation, cls: '?', hits: [], ...empty, incomplete: msg })
const drugLed = (region: RegionId, regulation: string, authority: string, extra: string): RegionResult => {
  const hit = { rule: regulation, cls: 'Medicine', text: `A product whose principal action is the medicine’s is regulated as a medicine; the delivery device is assessed within that application. ${extra}` }
  return { region, regulation, cls: 'Medicine', hits: [hit], decisive: hit, route: `Medicine application to ${authority}, covering the device part`, reviewer: authority, steps: [{ step: 'Medicine application', detail: 'The delivery device’s design, performance and usability are part of the dossier.' }], documents: ['Medicine dossier (CTD)', 'Device part: design, performance and usability data'], timeline: { label: 'Set by the medicine review timelines. Indicative only.', source: regulation }, notes: [], facts: [{ label: 'Lead', value: `${authority} (medicines)` }] }
}

// ============================================================================= UK
// Great Britain: UK MDR 2002, which keeps the rules of Annex IX of Directive 93/42/EEC (as later
// amended for breast implants and joint replacements). Active implants are under Part III.
const MDR_TO_MDD: Record<string, string> = { 'Rule 12': 'Rule 11', 'Rule 13': 'Rule 12', 'Rule 14': 'Rule 13', 'Rule 15': 'Rule 14', 'Rule 16': 'Rule 15', 'Rule 17': 'Rule 16', 'Rule 18': 'Rule 17' }
const UK_ORDER = ['I', 'IIa', 'IIb', 'III']
function ukDeviceHits(a: Answers): { hits: RuleHit[]; missing?: string; aimd?: boolean } {
  const impl = pick(a, 'impl')
  if (a.invasive === 'implant' && impl.includes('active_implant')) return { hits: [{ rule: 'UK MDR 2002, Part III', cls: 'AIMD', text: 'Active implantable medical devices are regulated under Part III (from Directive 90/385/EEC), with their own conformity assessment; they are not given a class.' }], aimd: true }
  const { hits, missing } = mdrHits(a)
  if (missing) return { hits: [], missing }
  const out: RuleHit[] = []
  for (const h of hits) {
    if (['Rule 11', 'Rule 19', 'Rule 20', 'Rule 21', 'Rule 22'].includes(h.rule)) continue
    if (h.rule === 'Rule 8' && /meshes|spinal|Spinal/.test(h.text)) continue
    if (h.rule === 'Rule 3' && h.cls === 'III') { out.push({ rule: 'Rule 3', cls: 'IIb', text: 'Non-invasive devices modifying the composition of blood, body liquids or other liquids are class IIb (the UK has no separate rule for substances used in vitro with cells or embryos).' }); continue }
    if (h.rule === 'Rule 2' && /Blood bags/.test(h.text)) { out.push({ rule: 'Rule 18', cls: 'IIb', text: 'Blood bags are class IIb.' }); continue }
    if (h.rule === 'Rule 18' && /human/.test(h.text)) { out.push({ rule: 'Rule 17', cls: 'III', text: 'Devices made using animal tissues or derivatives rendered non-viable are class III (devices from human tissue are outside the UK MDR).' }); continue }
    out.push({ ...h, rule: MDR_TO_MDD[h.rule] ?? h.rule })
  }
  if (a.invasive === 'implant' || (a.invasive === 'surgical' && a.duration === 'long')) {
    if (!out.some((h) => h.rule === 'Rule 8')) out.push({ rule: 'Rule 8', cls: 'IIb', text: 'Implantable and long-term surgically invasive devices are class IIb' + (impl.includes('mesh') || impl.includes('spine') ? '; the UK has no class III rule for surgical meshes or spinal implants.' : '.') })
  }
  return { hits: out }
}
function ukIvd(a: Answers): { cls: string; text: string; missing?: string } {
  if (!Array.isArray(a.ivd_d) || !a.ivd_grouping || !Array.isArray(a.ivd_c) || !a.ivd_user || !a.ivd_a) return { cls: '?', text: '', missing: 'Answer the IVD questions.' }
  const d = a.ivd_d as string[], c = a.ivd_c as string[]
  if (d.includes('blood_safety') || d.includes('life_threatening') || a.ivd_grouping === 'listed') return { cls: 'List A', text: 'Annex II List A: reagents for ABO, rhesus and Kell blood grouping, and for detecting HIV 1 and 2, HTLV I and II, and hepatitis B, C and D.' }
  if (a.ivd_grouping === 'other') return { cls: 'List B', text: 'Annex II List B: other blood groups (Duffy, Kidd, irregular antibodies) and HLA tissue typing, among others.' }
  if (a.ivd_user === 'self' && a.us_type === 'glucose') return { cls: 'List B', text: 'Annex II List B includes devices for self-testing of blood glucose.' }
  if (a.ivd_user === 'self') return { cls: 'Self-test', text: 'Devices for self-testing need a notified or approved body check of their design for lay use (UK MDR 2002, Part IV).' }
  return { cls: 'General', text: 'All other IVDs are self-declared by the manufacturer (UK MDR 2002, Part IV); companion diagnostics and cancer tests have no special class under the current rules.' }
}
const ukRoute = (cls: string, a: Answers): Pick<RegionResult, 'route' | 'reviewer' | 'steps' | 'documents' | 'timeline' | 'notes' | 'facts'> => {
  const self = cls === 'I' || cls === 'General'
  const flags = pick(a, 'class1_flags').filter((f) => f !== 'reusable')
  const nb = !self || flags.length > 0
  return {
    route: nb ? 'UKCA marking through a UK Approved Body, or a CE mark accepted in Great Britain for now' : 'Self-declaration and UKCA (or CE) marking',
    reviewer: nb ? 'UK Approved Body (or an EU notified body for CE marking)' : 'Manufacturer; no approved body',
    steps: [
      ...(nb ? [{ step: 'Conformity assessment', detail: 'A UK Approved Body for UKCA marking. CE-marked devices remain accepted in Great Britain until 30 June 2028 (directive certificates) or 30 June 2030 (EU MDR and IVDR).' }] : [{ step: 'Technical documentation and declaration of conformity', detail: 'UKCA (or CE) marking by the manufacturer.' }]),
      { step: 'UK Responsible Person', detail: 'A manufacturer outside the UK appoints a UK Responsible Person.' },
      { step: 'Register with the MHRA', detail: 'Every device is registered before it is placed on the Great Britain market.' },
      { step: 'Northern Ireland', detail: 'Under the Windsor Framework, the EU MDR and IVDR apply there: CE marking.' },
    ],
    documents: ['Technical documentation and declaration of conformity', 'Post-market surveillance plan and reports (in force since 16 June 2025)', 'Labelling in English'],
    timeline: { label: 'No statutory clock for approved bodies. Indicative only.', source: 'UK MDR 2002' },
    notes: ['Watch: draft Medical Devices (Amendment) Regulations 2026 would bring EU-style classification rules, risk classes A to D for IVDs and reliance routes for US, Canadian and Australian approvals; not yet in force. Indefinite recognition of CE marks has been deferred for further consultation.'],
    facts: [{ label: 'Market', value: 'Great Britain: UKCA or CE (time-limited); Northern Ireland: CE' }],
  }
}
function ukSoftware(a: Answers): RegionResult | { hits: RuleHit[] } {
  if (a.sw_purpose !== 'clinical') return notDevice('UK', 'UK MDR 2002', 'Not a device', 'Software with no medical purpose (wellness, administration) is not a medical device.')
  if (!a.sw_monitor || !a.sw_significance) return incomplete('UK', 'UK MDR 2002', 'Answer the software questions.')
  const hits: RuleHit[] = []
  if (a.sw_monitor === 'vital_danger') hits.push({ rule: 'Rule 10', cls: 'IIb', text: 'Active devices monitoring vital physiological parameters whose variations could mean immediate danger are class IIb.' })
  else if (a.sw_monitor === 'physiological' || a.sw_significance === 'treat_diagnose' || a.sw_significance === 'drive') hits.push({ rule: 'Rule 10', cls: 'IIa', text: 'Active diagnostic devices, including standalone software, that allow direct diagnosis or monitoring are class IIa.' })
  else hits.push({ rule: 'Rule 12', cls: 'I', text: 'Standalone software is an active device; with no other rule applying it is class I.' })
  return { hits }
}
export const UK_PACK: RegionPack = {
  id: 'UK', name: 'United Kingdom', regulator: 'MHRA', version: '1.0.0', asOf: '2026-10-20',
  classify(a) {
    const reg = 'UK MDR 2002 (SI 2002/618), Annex IX rules of Directive 93/42/EEC'
    if (a.kind === 'combination') {
      if (!a.combo_pmoa) return incomplete('UK', reg, 'Answer the combination questions.')
      if (a.combo_pmoa === 'drug') return drugLed('UK', 'Human Medicines Regulations 2012', 'the MHRA', 'The device part must meet the essential requirements.')
      const hit = { rule: 'Rule 13', cls: 'III', text: 'Devices incorporating a substance that would be a medicinal product, with an action ancillary to the device, are class III; the approved body consults a medicines authority.' }
      return { region: 'UK', regulation: reg, cls: 'III', hits: [hit], decisive: hit, ...ukRoute('III', a) }
    }
    if (a.kind === 'ivd') {
      const r = ukIvd(a)
      if (r.missing) return incomplete('UK', 'UK MDR 2002, Part IV', r.missing)
      const hit = { rule: 'UK MDR 2002, Part IV (Directive 98/79/EC Annex II)', cls: r.cls, text: r.text }
      return { region: 'UK', regulation: 'UK MDR 2002, Part IV', cls: r.cls, hits: [hit], decisive: hit, ...ukRoute(r.cls, a) }
    }
    if (a.kind === 'software') {
      const s = ukSoftware(a)
      if ('region' in s) return s
      const d = top(s.hits, UK_ORDER)!
      return { region: 'UK', regulation: reg, cls: d.cls, hits: s.hits, decisive: d, ...ukRoute(d.cls, a) }
    }
    const { hits, missing, aimd } = ukDeviceHits(a)
    if (missing) return incomplete('UK', reg, missing)
    if (aimd) return { region: 'UK', regulation: 'UK MDR 2002, Part III', cls: 'AIMD', hits, decisive: hits[0], ...ukRoute('AIMD', a) }
    const d = top(hits, UK_ORDER)!
    const f = pick(a, 'class1_flags')
    const cls = d.cls === 'I' ? 'I' + (f.includes('sterile') ? 's' : '') + (f.includes('measuring') ? 'm' : '') : d.cls
    const r = ukRoute(d.cls, a)
    return { region: 'UK', regulation: reg, cls, hits, decisive: d, ...r, notes: [...(d.cls === 'I' && f.includes('reusable') ? ['The UK has no class Ir: reusable surgical instruments are class I without an approved body.'] : []), ...r.notes] }
  },
}

// ============================================================================= Canada
// Medical Devices Regulations (SOR/98-282), Schedule 1: Part 1 rules 1 to 16, Part 2 rules 1 to 9.
const CA_ORDER = ['I', 'II', 'III', 'IV']
export function caDeviceHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (rule: string, cls: string, text: string) => hits.push({ rule: `Schedule 1, Part 1, rule ${rule}`, cls, text })
  if (a.active === undefined || !a.invasive) return { hits, missing: 'Say whether the device is active and how it contacts the body.' }
  const inv = a.invasive as string, dur = a.duration as string | undefined
  const surg = pick(a, 'surg'), impl = pick(a, 'impl'), special = pick(a, 'special')
  if (inv === 'surgical' || inv === 'implant') {
    if (inv === 'surgical' && !dur) return { hits, missing: 'Give the duration of use.' }
    if (surg.includes('instrument') || surg.includes('reusable')) add('3', 'I', 'Surgical or dental instruments are class I (rule 3 overrides rules 1 and 2).')
    else if (surg.includes('heart_defect') || surg.includes('heart_cns') || impl.includes('heart_cns')) add('1', 'IV', 'Surgically invasive devices to diagnose, monitor, control or correct a defect of the central cardiovascular or central nervous system are class IV.')
    else if (inv === 'implant' || dur === 'long' || surg.includes('biological') || impl.includes('biological')) add('1', 'III', 'Surgically invasive devices meant to be absorbed, or to stay in the body for 30 consecutive days or more, are class III.')
    else add('1', 'II', 'Surgically invasive devices are class II.')
  }
  if (inv === 'orifice') {
    if (!dur) return { hits, missing: 'Give the duration of use.' }
    if (a.orifice_site === 'oral_ear_nasal') add('2', 'I', 'Devices placed in the oral or nasal cavities as far as the pharynx, or in the ear canal up to the eardrum, are class I.')
    else if (dur === 'long') add('2', 'III', 'Orifice devices, or devices in contact with the surface of the eye, meant to stay 30 consecutive days or more are class III.')
    else add('2', 'II', 'Devices invasive through a body orifice, or in contact with the surface of the eye, are class II.')
  }
  if (inv === 'non' && !a.active) {
    if (a.noninv === 'skin') add('4', a.r4 === 'barrier' ? 'I' : 'II', a.r4 === 'barrier' ? 'Non-invasive devices on injured skin used as a mechanical barrier, for compression or to absorb exudates are class I.' : 'Other non-invasive devices in contact with injured skin are class II.')
    else if (a.noninv === 'channel') add('5', 'II', 'Non-invasive devices channelling or storing gases, liquids, tissues or body fluids for introduction into the body are class II.')
    else if (a.noninv === 'modify') add('6', a.r3 === 'physical' ? 'II' : 'III', a.r3 === 'physical' ? 'Modification only by centrifugation, gravity filtration or exchange of gas or heat is class II.' : 'Non-invasive devices modifying the composition of blood or other liquids for introduction into the body are class III.')
    else if (a.noninv === 'other') add('7', 'I', 'All other non-invasive devices are class I.')
  }
  if (a.active === true && !(inv === 'implant' && impl.includes('active_implant'))) {
    const r9 = pick(a, 'r9'), r10 = pick(a, 'r10')
    const closed = special.includes('r22')
    if (a.active_fn === 'therapy') {
      if (r9.includes('ionizing')) add('8', 'III', 'Active devices emitting ionising radiation are class III.')
      add('9', closed && r9.includes('hazardous') ? 'IV' : r9.includes('hazardous') ? 'III' : 'II', closed && r9.includes('hazardous') ? 'A class III therapeutic device that controls the treatment through a closed-loop system is class IV.' : r9.includes('hazardous') ? 'Potentially hazardous administration or withdrawal of energy is class III.' : 'Active therapeutic devices that administer or withdraw energy are class II.')
    } else if (a.active_fn === 'diagnose') {
      if (r10.includes('xray')) add('8', 'II', 'Active devices emitting ionising radiation for radiographic use are class II (mammography is class III).')
      if (r10.includes('vital_danger')) add('10', 'III', 'Active diagnostic devices where an erroneous reading could mean immediate danger are class III.')
      else if (r10.some((x) => ['energy', 'radiopharm', 'vital', 'illuminate'].includes(x))) add('10', 'II', 'Active diagnostic devices supplying energy for imaging or monitoring physiological processes are class II.')
      else add('12', 'I', 'Any other active device is class I.')
    } else if (a.active_fn === 'administer') add('11', closed && a.r12_hazard ? 'IV' : a.r12_hazard ? 'III' : 'II', a.r12_hazard ? 'Potentially hazardous administration or withdrawal of drugs, body fluids or other substances is class III' + (closed ? ', and class IV under closed-loop control.' : '.') : 'Active devices that administer or withdraw drugs, body fluids or other substances are class II.')
    else if (a.active_fn === 'other') add('12', 'I', 'Any other active device is class I.')
  }
  if (inv === 'implant' && impl.includes('active_implant') && !hits.some((h) => h.cls === 'IV')) add('1', 'IV', 'Active implantable devices for the heart or nervous system are class IV; other implants are at least class III.')
  if (special.some((x) => x.startsWith('r16'))) add('13', 'II', 'Devices for disinfecting or sterilising a medical device are class II.')
  if (special.includes('r18')) add('14', a.r18_skin ? 'I' : 'IV', a.r18_skin ? 'Devices of animal tissue touching intact skin only are class I.' : 'Devices made from or incorporating human or animal cells or tissues, or their derivatives, are class IV.')
  if (special.includes('r15') && inv === 'orifice') add('2', 'III', 'Devices presented as preventing the transmission of infectious agents during sexual activity are class III (latex condoms are class II).')
  if (impl.includes('breast')) add('16', 'IV', 'Breast implants are class IV.')
  if (!hits.length) return { hits, missing: 'Answer the questions for this kind of device.' }
  return { hits }
}
export function caIvdHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (rule: string, cls: string, text: string) => hits.push({ rule: `Schedule 1, Part 2, rule ${rule}`, cls, text })
  if (!Array.isArray(a.ivd_d) || !a.ivd_grouping || !Array.isArray(a.ivd_c) || !a.ivd_user || !a.ivd_a) return { hits, missing: 'Answer the IVD questions.' }
  const d = a.ivd_d as string[], c = a.ivd_c as string[]
  if (d.includes('blood_safety')) add('1', 'IV', 'Tests for transmissible agents to assess the suitability of blood, tissues or organs for transfusion or transplantation are class IV.')
  if (d.includes('life_threatening')) add('2', 'IV', 'Tests for an agent causing a life-threatening disease with a risk of spread in Canada are class IV.')
  if (c.includes('sti') || c.includes('csf_blood') || c.includes('erroneous_death')) add('2', 'III', 'Tests for a sexually transmitted agent, an agent in cerebrospinal fluid or blood, or where an erroneous result could cause death or severe disability, are class III.')
  if (c.includes('prenatal_infection') || c.includes('immune_status')) add('2', 'II', 'Other tests for the presence of, or exposure to, a transmissible agent are class II.')
  if (d.includes('load') || c.includes('life_threatening_mgmt')) add('3', 'III', 'Tests to manage patients with a life-threatening disease are class III.')
  if (c.some((x) => ['cancer', 'genetic', 'embryo', 'staging', 'drug_level', 'companion'].includes(x))) add('4', 'III', 'Tests for cancer, genetic testing, foetal congenital disorders, disease staging or critical drug monitoring are class III.')
  if (a.ivd_grouping !== 'no') add('5', 'III', 'Blood grouping or tissue typing for compatibility before transfusion or transplantation is class III.')
  if (a.ivd_user === 'self' || a.ivd_user === 'near_patient') {
    if (a.ivd_self_b === 'listed') add('9', 'II', 'Near-patient tests for pregnancy, fertility or cholesterol are class II (rule 9 overrides).')
    else add('6', 'III', 'Near-patient IVDs, including those for home use, are class III.')
  }
  if (!hits.length) add('8', 'I', 'All other IVDs are class I.')
  return { hits }
}
const caRoute = (cls: string): Pick<RegionResult, 'route' | 'reviewer' | 'steps' | 'documents' | 'timeline' | 'notes' | 'facts'> => cls === 'I'
  ? { route: 'No device licence: sold through a holder of a medical device establishment licence (MDEL)', reviewer: 'Health Canada (establishment licensing only)', steps: [{ step: 'Establishment licence', detail: 'Importers and distributors hold an MDEL; a class I manufacturer selling only through them needs none.' }], documents: ['Labelling (sections 21 to 23)', 'Complaint handling, recall and mandatory problem reporting procedures'], timeline: { label: 'No premarket review of the device.', source: 'Medical Devices Regulations' }, notes: [], facts: [{ label: 'Licence', value: 'None (MDEL for importers and distributors)' }] }
  : { route: `Medical device licence (MDL), class ${cls}`, reviewer: 'Health Canada, Medical Devices Directorate', steps: [
      { step: 'MDSAP certificate', detail: 'A quality management system certificate under the Medical Device Single Audit Program is required for class II to IV.' },
      { step: cls === 'II' ? 'Licence application with attestations' : `Licence application with ${cls === 'III' ? 'a summary of' : 'full'} safety and effectiveness evidence`, detail: cls === 'II' ? 'The manufacturer attests to safety and effectiveness and labelling.' : 'Premarket review of the evidence, including clinical data where needed.' },
      { step: 'Decision', detail: cls === 'II' ? 'Screening and decision within 15 days.' : `15 days of screening, then a ${cls === 'III' ? 60 : 75}-day review; an additional information request stops the clock.` },
    ], documents: ['MDSAP certificate (ISO 13485)', 'Licence application (attestations for class II; premarket review document for III and IV)', 'Labelling'], timeline: { label: cls === 'II' ? 'Health Canada’s target: 15 days.' : `Targets: 15 days of screening, then ${cls === 'III' ? 60 : 75} days of review.`, source: 'Health Canada, guidance on managing applications for medical device licences' }, notes: [], facts: [{ label: 'Licence', value: `MDL, class ${cls}` }] }
export const CA_PACK: RegionPack = {
  id: 'CA', name: 'Canada', regulator: 'HC', version: '1.0.0', asOf: '2026-10-20',
  classify(a) {
    const reg = 'Medical Devices Regulations (SOR/98-282), Schedule 1'
    if (a.kind === 'combination') {
      if (!a.combo_pmoa) return incomplete('CA', reg, 'Answer the combination questions.')
      if (a.combo_pmoa === 'drug') return drugLed('CA', 'Food and Drug Regulations, Part C', 'Health Canada', 'Health Canada’s policy on drug-medical device combination products assigns it by the principal mechanism of action.')
      const cls = a.combo_heart ? 'IV' : a.combo_implant ? 'III' : 'II'
      const hit = { rule: 'Schedule 1, Part 1, rule 1', cls, text: 'A device-led combination is classified by the device rules (here the surgically invasive rule); the drug component is reviewed with a consult to the drugs directorate.' }
      return { region: 'CA', regulation: reg, cls, hits: [hit], decisive: hit, ...caRoute(cls) }
    }
    if (a.kind === 'software') {
      const st = usSoftwareStatus(a)
      if (st === 'admin' || st === 'wellness') return notDevice('CA', 'Food and Drugs Act, definition of device', 'Not a device', 'Software with no medical purpose is not a medical device.')
      if (st === 'cds') return notDevice('CA', 'Health Canada guidance on software as a medical device', 'Not a device (CDS)', 'Software that supports a health care professional, does not analyse images or signals, and lets the professional review its basis, is not regulated as a device.')
      if (!a.sw_monitor || !a.sw_significance) return incomplete('CA', reg, 'Answer the software questions.')
      const danger = a.sw_monitor === 'vital_danger' || (a.sw_impact === 'death' && a.sw_significance !== 'inform')
      const cls = danger ? 'III' : a.sw_significance === 'inform' && a.sw_situation === 'non_serious' ? 'I' : 'II'
      const hit = { rule: `Schedule 1, Part 1, rule ${cls === 'I' ? '12' : '10'}`, cls, text: cls === 'III' ? 'Software for diagnosis or monitoring where an erroneous result could mean immediate danger is class III.' : cls === 'II' ? 'Software for diagnosis or monitoring of physiological processes is class II.' : 'Other active devices, including software, are class I.' }
      const cat = n12Category(a)
      return { region: 'CA', regulation: reg, cls, hits: [hit], decisive: hit, ...caRoute(cls), facts: [...caRoute(cls).facts!, ...(cat ? [{ label: 'IMDRF N12', value: N12_TEXT[cat] }] : [])], notes: ['Classified with rules 10 and 12 as Health Canada’s guidance on software as a medical device applies them.'] }
    }
    const { hits, missing } = a.kind === 'ivd' ? caIvdHits(a) : caDeviceHits(a)

    if (missing) return incomplete('CA', reg, missing)
    const d = top(hits, CA_ORDER)!
    const r = caRoute(d.cls)
    return { region: 'CA', regulation: `${reg}, Part ${a.kind === 'ivd' ? 2 : 1}`, cls: d.cls, hits, decisive: d, ...r, notes: [...(pick(a, 'special').includes('r14') ? ['Canada has no rule for a device with an ancillary medicine; the drug component is reviewed with a consult.'] : []), ...(hits.length > 1 ? [`${hits.length} rules apply; the higher class applies.`] : []), ...r.notes] }
  },
}

// ============================================================================= Australia
// Therapeutic Goods (Medical Devices) Regulations 2002, Schedule 2 (devices) and 2A (IVDs). The
// device rules follow the EU's; Australia has a separate AIMD class, has moved joint
// replacements and surgical mesh to class III, and has its own software rules (2021).
const AU_ORDER = ['I', 'IIa', 'IIb', 'III', 'AIMD']
const AU_PART = (r: string) => { const n = Number(r.replace('Rule ', '')); return n <= 4 ? 'Part 2 (non-invasive)' : n <= 8 ? 'Part 3 (invasive and implantable)' : n <= 13 ? 'Part 4 (active)' : 'Part 5 (special rules)' }
function auSoftware(a: Answers): { cls: string; text: string } | 'exempt' | 'excluded' | undefined {
  if (a.sw_purpose !== 'clinical') return 'excluded'
  if (!a.sw_monitor || !a.sw_significance || !a.sw_situation || !a.sw_user) return undefined
  if (usSoftwareStatus(a) === 'cds') return 'exempt'
  if (a.sw_monitor === 'vital_danger') return { cls: 'IIb', text: 'Software monitoring a condition where variations could mean immediate danger is class IIb.' }
  const direct = a.sw_significance === 'treat_diagnose'
  const sev = a.sw_situation === 'critical' ? 2 : a.sw_situation === 'serious' ? 1 : 0
  const cls = direct ? ['IIa', 'IIb', 'III'][sev] : ['I', 'IIa', 'IIb'][sev]
  const base = { cls, text: `Software that ${direct ? 'itself diagnoses, screens or specifies treatment' : 'gives information to a health professional'} for a ${['non-serious', 'serious', 'life-threatening or high-risk'][sev]} condition is class ${cls}.` }
  if (a.sw_monitor === 'physiological' && AU_ORDER.indexOf(cls) < AU_ORDER.indexOf('IIa')) return { cls: 'IIa', text: 'Software monitoring the state or progression of a disease is class IIa.' }
  return base
}
const auRoute = (cls: string, a: Answers): Pick<RegionResult, 'route' | 'reviewer' | 'steps' | 'documents' | 'timeline' | 'notes' | 'facts'> => {
  const f = pick(a, 'class1_flags').filter((x) => x !== 'reusable')
  const self = (cls === 'I' && !f.length) || cls === 'Class 1'
  return {
    route: self ? 'Manufacturer’s declaration, then inclusion in the ARTG by the Australian sponsor' : 'Conformity assessment evidence (a TGA certificate, or comparable overseas approval), then inclusion in the ARTG',
    reviewer: self ? 'No TGA assessment before inclusion' : 'TGA, using its own assessment or evidence from a comparable overseas regulator (EU notified body, FDA, Health Canada, Japan, MDSAP)',
    steps: [
      { step: 'Australian sponsor', detail: 'A sponsor in Australia applies and holds the ARTG entry.' },
      ...(self ? [] : [{ step: 'Conformity assessment evidence', detail: 'A TGA conformity assessment certificate, or comparable overseas regulator evidence.' }]),
      { step: 'ARTG inclusion application', detail: ['III', 'AIMD', 'Class 4'].includes(cls) ? 'Class III, AIMD and some high-risk devices get a mandatory application audit.' : 'Applications may be selected for audit.' },
    ],
    documents: ['Declaration of conformity with the essential principles', 'Conformity assessment evidence', 'Labelling and instructions for use'], timeline: { label: 'No statutory timeframe for ARTG inclusion audits. Indicative only.', source: 'Therapeutic Goods Act 1989, Chapter 4' }, notes: [], facts: [{ label: 'Register', value: 'Australian Register of Therapeutic Goods (ARTG)' }],
  }
}
export const AU_PACK: RegionPack = {
  id: 'AU', name: 'Australia', regulator: 'TGA', version: '1.0.0', asOf: '2026-10-20',
  classify(a) {
    const reg = 'Therapeutic Goods (Medical Devices) Regulations 2002'
    if (a.kind === 'combination') {
      if (!a.combo_pmoa) return incomplete('AU', reg, 'Answer the combination questions.')
      if (a.combo_pmoa === 'drug') return drugLed('AU', 'Therapeutic Goods Act 1989 (medicines)', 'the TGA', 'Drug-device combinations are registered as medicines when the medicine’s action is principal.')
      const hit = { rule: 'Schedule 2, Part 5 (devices incorporating a medicine)', cls: 'III', text: 'Devices incorporating a medicine with an ancillary action are class III.' }
      return { region: 'AU', regulation: reg, cls: 'III', hits: [hit], decisive: hit, ...auRoute('III', a) }
    }
    if (a.kind === 'ivd') {
      const { hits, missing } = inIvdHits(a)
      if (missing) return incomplete('AU', `${reg}, Schedule 2A`, missing)
      const d = top(hits, ['A', 'B', 'C', 'D'])!
      const cls = `Class ${'ABCD'.indexOf(d.cls) + 1}`
      const hit = { rule: 'Schedule 2A (GHTF-based IVD rules)', cls, text: `${d.text.replace(/ are class [A-D]\.?/i, '')}: ${cls} in Australia (GHTF class ${d.cls}).` }
      return { region: 'AU', regulation: `${reg}, Schedule 2A`, cls, hits: [hit], decisive: hit, ...auRoute(cls, a), notes: ['Australia’s IVD classes 1 to 4 follow the GHTF rules; the paragraph wording here is from the GHTF-based text.'] }
    }
    if (a.kind === 'software') {
      const s = auSoftware(a)
      if (s === 'excluded') return notDevice('AU', 'Therapeutic Goods (Excluded Goods) Determination 2018', 'Not a device', 'Consumer health, administrative and similar software is excluded from regulation.')
      if (s === 'exempt') return { ...notDevice('AU', reg, 'Exempt CDS', 'Clinical decision support software that meets the exemption conditions is exempt from ARTG inclusion, but remains a medical device subject to other obligations (such as adverse event reporting).'), route: 'Exempt from ARTG inclusion; still a medical device' }
      if (!s) return incomplete('AU', reg, 'Answer the software questions.')
      const hit = { rule: 'Schedule 2, Part 4 (software rules, 2021)', cls: s.cls, text: s.text }
      return { region: 'AU', regulation: reg, cls: s.cls, hits: [hit], decisive: hit, ...auRoute(s.cls, a), notes: ['Software rules in force since 25 February 2021; the class here follows the TGA’s guidance on software-based medical devices.'] }
    }
    const impl = pick(a, 'impl')
    if (a.invasive === 'implant' && impl.includes('active_implant')) { const hit = { rule: 'Schedule 2, Part 3', cls: 'AIMD', text: 'Active implantable medical devices are their own class, AIMD, the highest.' }; return { region: 'AU', regulation: reg, cls: 'AIMD', hits: [hit], decisive: hit, ...auRoute('AIMD', a) } }
    const { hits: eu, missing } = mdrHits(a)
    if (missing) return incomplete('AU', reg, missing)
    const hits = eu.filter((h) => !['Rule 11', 'Rule 19', 'Rule 20', 'Rule 21', 'Rule 22'].includes(h.rule)).map((h) => ({ ...h, rule: `Schedule 2, ${AU_PART(h.rule)}` }))
    if (!hits.length) hits.push({ rule: 'Schedule 2, Part 2 (non-invasive)', cls: 'I', text: 'Non-invasive devices are class I unless another rule applies.' })
    const d = top(hits, AU_ORDER)!
    const f = pick(a, 'class1_flags')
    const cls = d.cls === 'I' ? 'I' + (f.includes('sterile') ? 's' : '') + (f.includes('measuring') ? 'm' : '') : d.cls
    return { region: 'AU', regulation: `${reg}, Schedule 2`, cls, hits, decisive: d, ...auRoute(d.cls, a), notes: ['Schedule 2 follows the EU rules; joint replacements and surgical mesh are class III in Australia. Australia has no class Ir, and the EU’s rules 19 to 22 are not applied here.'] }
  },
}

// ============================================================================= Japan
// PMD Act. Classes I (general), II (controlled), III and IV (highly controlled); the class comes
// from the device's JMDN generic name. The classification rules behind JMDN follow the GHTF
// rules, so this pack estimates I to IV from GHTF A to D.
const JP = { A: 'I', B: 'II', C: 'III', D: 'IV' } as Record<string, string>
const jpRoute = (cls: string, ivd: boolean): Pick<RegionResult, 'route' | 'reviewer' | 'steps' | 'documents' | 'timeline' | 'notes' | 'facts'> => {
  const route = cls === 'I' ? 'Notification (todokede) to PMDA' : cls === 'II' ? 'Third-party certification (ninsho) by a registered certification body where a certification standard exists; otherwise approval (shonin)' : cls === 'III' && !ivd ? 'Approval (shonin) by MHLW after PMDA review; certification for designated class III types with standards' : 'Approval (shonin) by MHLW after PMDA review'
  return {
    route, reviewer: cls === 'I' ? 'PMDA (notification only)' : cls === 'II' ? 'Registered certification body, or PMDA and MHLW' : 'PMDA review, MHLW approval',
    steps: [
      { step: 'Marketing authorisation holder (MAH)', detail: 'A Japanese company holds the licence; an overseas maker is registered as a foreign manufacturer and can appoint a designated MAH.' },
      { step: 'QMS conformity', detail: 'Manufacturing sites meet the QMS ministerial ordinance (aligned with ISO 13485), checked at approval or certification.' },
      { step: cls === 'I' ? 'Notification' : 'Application', detail: route + '.' },
    ],
    documents: ['STED technical summary', 'QMS documentation', 'Labelling and package insert in Japanese'],
    timeline: cls === 'I' ? { label: 'No review: marketing can start after notification.', source: 'PMD Act' } : { label: 'PMDA targets: new devices 14 months (80% of applications); improved devices 10 months with clinical data, 6 months without; generic devices 4 months. Third-party certification is usually faster. Indicative only.', source: 'PMDA review time targets' },
    notes: ['Estimate: Japan assigns the class through the JMDN generic name; this pack estimates it from the GHTF-based rules that the JMDN classes follow. Check the JMDN code.'], facts: [{ label: 'Class name', value: { I: 'General medical device', II: 'Controlled medical device', III: 'Highly controlled medical device', IV: 'Highly controlled medical device' }[cls] ?? '' }],
  }
}
export const JP_PACK: RegionPack = {
  id: 'JP', name: 'Japan', regulator: 'PMDA', version: '1.0.0', asOf: '2026-10-20', basis: 'estimate',
  classify(a) {
    const reg = 'PMD Act; JMDN classification (estimate from GHTF-based rules)'
    if (a.kind === 'combination') {
      if (!a.combo_pmoa) return incomplete('JP', reg, 'Answer the combination questions.')
      if (a.combo_pmoa === 'drug') return drugLed('JP', 'PMD Act (drugs)', 'MHLW and PMDA', 'Japan regulates combination products by the principal function.')
      const cls = a.combo_heart ? 'IV' : 'III'
      const hit = { rule: 'PMD Act (combination products)', cls, text: 'A device-led combination is reviewed as a highly controlled device; PMDA reviews the drug component with it.' }
      return { region: 'JP', regulation: reg, cls, hits: [hit], decisive: hit, ...jpRoute(cls, false) }
    }
    if (a.kind === 'software') {
      if (a.sw_purpose !== 'clinical') return notDevice('JP', 'PMD Act', 'Not a device', 'Programs with no medical purpose are not medical devices.')
      const cat = n12Category(a)
      if (!cat) return incomplete('JP', reg, 'Answer the software questions.')
      if (cat === 'I' && a.sw_input !== 'image_signal') return notDevice('JP', 'PMD Act, program medical devices', 'Not regulated', 'Programs whose risk would be class I, such as displaying reference information, are not regulated as program medical devices.')
      const cls = cat === 'I' || cat === 'II' ? 'II' : 'III'
      const hit = { rule: 'PMD Act, program medical devices (estimate)', cls, text: `Software with an impact like IMDRF N12 category ${cat} is estimated as class ${cls}.` }
      return { region: 'JP', regulation: reg, cls, hits: [hit], decisive: hit, ...jpRoute(cls, false) }
    }
    const { hits, missing } = a.kind === 'ivd' ? inIvdHits(a) : inDeviceHits(a)
    if (missing) return incomplete('JP', reg, missing)
    const d = top(hits, ['A', 'B', 'C', 'D'])!
    let cls = a.kind === 'ivd' ? ({ A: 'I', B: 'II', C: 'III', D: 'III' } as Record<string, string>)[d.cls] : JP[d.cls]
    let hit = { rule: `GHTF-based rule: ${d.rule.replace(/^First Schedule Part I+(:|,)\s*/, '')}`, cls, text: `${d.text.replace(/ India has[^.]*\./, '').replace(/class [A-D]/gi, `class ${cls}`)}` }
    if (a.us_type === 'contact_lens') { cls = 'III'; hit = { rule: 'JMDN generic name: contact lenses', cls, text: 'Contact lenses for vision correction are highly controlled medical devices (class III) in Japan.' } }
    return { region: 'JP', regulation: reg, cls, hits: [hit], decisive: hit, ...jpRoute(cls, a.kind === 'ivd') }
  },
}

// ============================================================================= China
// Regulations on the Supervision and Administration of Medical Devices (State Council Order 739)
// and NMPA Order 47. Classes I to III, assigned by the Classification Catalogue; this pack
// estimates from the rules (GHTF A to I, B to II, C and D to III) and applies catalogue entries it
// knows, such as contact lenses in class III.
const cnRoute = (cls: string): Pick<RegionResult, 'route' | 'reviewer' | 'steps' | 'documents' | 'timeline' | 'notes' | 'facts'> => ({
  route: cls === 'I' ? 'Filing (bei’an)' : 'Registration with technical review',
  reviewer: cls === 'I' ? 'Filing with the authority (NMPA for imports)' : 'NMPA and its Center for Medical Device Evaluation (CMDE) for imports and class III; provincial authorities for domestic class II',
  steps: cls === 'I' ? [{ step: 'Filing', detail: 'Product technical requirements and self-test report; no technical review.' }] : [
    { step: 'China legal agent', detail: 'A foreign manufacturer appoints an agent in China; the manufacturer stays the registrant.' },
    { step: 'Type testing and product technical requirements', detail: 'Tests to the Chinese standards; self-testing or foreign reports where accepted.' },
    { step: 'Clinical evaluation', detail: 'Clinical data, comparison with an equivalent device, or the exemption catalogue.' },
    { step: 'Technical review by CMDE', detail: `About ${cls === 'II' ? 60 : 90} working days for the first review; up to a year to answer questions.` },
    { step: 'Registration certificate', detail: 'Valid five years.' },
  ],
  documents: ['Product technical requirements', 'Type test report', 'Clinical evaluation', 'Labelling and instructions in Chinese'],
  timeline: cls === 'I' ? { label: 'No technical review.', source: 'NMPA Order 47' } : { label: `First technical review about ${cls === 'II' ? 60 : 90} working days; a second review of 60 after questions. Indicative only.`, source: 'NMPA Order 47; CMDE practice' },
  notes: ['Estimate: China assigns the class through its Classification Catalogue; this pack estimates from the rules. Check the catalogue entry.'], facts: [{ label: 'Validity', value: cls === 'I' ? 'Filing' : 'Five years' }],
})
export const CN_PACK: RegionPack = {
  id: 'CN', name: 'China', regulator: 'NMPA', version: '1.0.0', asOf: '2026-10-20', basis: 'estimate',
  classify(a) {
    const reg = 'Order 739 and NMPA Order 47; Classification Catalogue (estimate)'
    if (a.kind === 'combination') {
      if (!a.combo_pmoa) return incomplete('CN', reg, 'Answer the combination questions.')
      if (a.combo_pmoa === 'drug') return drugLed('CN', 'Drug Administration Law', 'NMPA', 'Combination products are assigned by the principal mode of action after an attribute definition.')
      const hit = { rule: 'NMPA combination product attribute definition', cls: 'III', text: 'A device-led drug-device combination is registered as a class III device, with the drug part reviewed by the drug evaluation centre.' }
      return { region: 'CN', regulation: reg, cls: 'III', hits: [hit], decisive: hit, ...cnRoute('III') }
    }
    if (a.kind === 'software') {
      if (a.sw_purpose !== 'clinical') return notDevice('CN', 'Order 739', 'Not a device', 'Software with no medical purpose is not a medical device.')
      if (!a.sw_significance) return incomplete('CN', reg, 'Answer the software questions.')
      const cls = a.sw_significance === 'inform' ? 'II' : 'III'
      const hit = { rule: 'NMPA guidance on classifying AI medical software (2021)', cls, text: cls === 'III' ? 'Software that gives diagnostic or treatment suggestions, where an error carries high risk, is class III.' : 'Software that processes or measures data without a diagnostic conclusion is class II.' }
      return { region: 'CN', regulation: reg, cls, hits: [hit], decisive: hit, ...cnRoute(cls) }
    }
    const { hits, missing } = a.kind === 'ivd' ? inIvdHits(a) : inDeviceHits(a)
    if (missing) return incomplete('CN', reg, missing)
    const d = top(hits, ['A', 'B', 'C', 'D'])!
    let cls = ({ A: 'I', B: 'II', C: 'III', D: 'III' } as Record<string, string>)[d.cls]
    let text = `Estimated from the rule that gives GHTF class ${d.cls}.`
    if (a.kind === 'device' && a.invasive === 'orifice' && a.orifice_site === 'other' && a.connect_active === false && a.duration === 'short' && a.us_type === 'contact_lens') { cls = 'III'; text = 'Contact lenses are class III in China’s Classification Catalogue.' }
    const hit = { rule: 'Classification rules (estimate)', cls, text }
    return { region: 'CN', regulation: reg, cls, hits: [hit], decisive: hit, ...cnRoute(cls) }
  },
}

// ============================================================================= Switzerland
// Medical Devices Ordinance (MedDO) and IVD Ordinance (IvDO): the EU MDR and IVDR rules apply.
export const CH_PACK: RegionPack = {
  id: 'CH', name: 'Switzerland', regulator: 'SWISSMEDIC', version: '1.0.0', asOf: '2026-10-20',
  classify(a) {
    const eu = EU_PACK.classify(a)
    const regulation = a.kind === 'ivd' ? 'IvDO (SR 812.219), applying IVDR Annex VIII' : 'MedDO (SR 812.213), applying MDR Annex VIII'
    if (eu.incomplete || /Not a device|Medicinal/.test(eu.cls)) return { ...eu, region: 'CH', regulation: eu.incomplete ? regulation : eu.regulation }
    return {
      ...eu, region: 'CH', regulation,
      route: `${eu.route}; placing on the Swiss market with a Swiss authorised representative`,
      reviewer: `${eu.reviewer}; Swissmedic supervises the market`,
      steps: [...eu.steps.filter((s) => !/EUDAMED/.test(s.step + s.detail)), { step: 'Swiss authorised representative (CH-REP)', detail: 'A manufacturer outside Switzerland appoints one; the EU has treated Switzerland as a third country since May 2021.' }, { step: 'Register in swissdamed', detail: 'Economic operators and devices are registered in Switzerland’s own database; device registration is mandatory from 1 July 2026, with a six-month transition.' }],
      notes: ['Switzerland recognises certificates of EU notified bodies under the MedDO; it applies the EU classification rules unchanged.', ...eu.notes],
      facts: [...(eu.facts ?? []), { label: 'Swiss specifics', value: 'CH-REP, swissdamed, labelling in the official languages' }],
    }
  },
}

export const PHASE4_PACKS = [UK_PACK, CA_PACK, AU_PACK, JP_PACK, CN_PACK, CH_PACK]
