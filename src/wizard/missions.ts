// Missions: classify library devices and pick routes; answers come from the engine, so the
// missions always agree with the rules.
import { EU_PACK } from './eu'
import type { Answers } from './questions'
import { US_PACK, cliaFact } from './us'
import { IN_PACK } from './in'
import { n12Category, N12_TEXT, changeControl } from './sw'
import { CA_PACK, UK_PACK, AU_PACK, JP_PACK, CN_PACK, CH_PACK } from './packs4'
import { LIBRARY } from './library'
import { MDR_CLASSES, IVDR_CLASSES, IN_CLASSES } from './engine'
import type { RegionResult } from './types'

export type Level = 'guided' | 'standard' | 'expert'

export interface Task {
  id: string
  deviceId: string
  prompt: string
  options: string[]
  answer: string
  hint: string
  explain: string
}

export interface Mission {
  id: string
  title: string
  brief: string
  devices: string[]
  tasks: () => Task[]
}

const device = (id: string) => LIBRARY.find((d) => d.id === id)!
const eu = (id: string) => EU_PACK.classify(device(id).answers)
const us = (id: string) => US_PACK.classify(device(id).answers)
const india = (id: string, over: Answers = {}) => IN_PACK.classify({ ...device(id).answers, ...over })
const fact = (r: RegionResult, label: string) => r.facts?.find((f) => f.label === label)?.value ?? ''
const IN_FORMS = ['Registration number (no licence)', 'MD-3 → MD-5 (loan licence MD-4 → MD-6)', 'MD-7 → MD-9 (loan licence MD-8 → MD-10)', 'MD-14 → MD-15']

export function usRouteKey(r: RegionResult): string {
  if (/Not regulated as a medical device/.test(r.route)) return 'Not a device'
  if (/NDA/.test(r.route)) return 'NDA or BLA (CDER lead)'
  if (/Biologics License/.test(r.route)) return 'Biologics License Application (CBER)'
  if (/^Exempt/.test(r.route)) return 'Exempt: register and list'
  if (/Special 510/.test(r.route)) return 'Special 510(k)'
  if (/510\(k\)/.test(r.route) && !/No predicate/.test(r.route)) return 'Traditional 510(k)'
  if (/HDE/.test(r.route)) return 'Humanitarian Device Exemption'
  if (/De Novo/.test(r.route)) return 'De Novo'
  if (/PMA/.test(r.route)) return 'Premarket approval (PMA)'
  return r.route
}
const US_ROUTES = ['Exempt: register and list', 'Traditional 510(k)', 'De Novo', 'Premarket approval (PMA)', 'Biologics License Application (CBER)', 'NDA or BLA (CDER lead)']

function euClassTask(id: string): Task {
  const r = eu(id), d = device(id)
  return {
    id: `${id}-eu-class`, deviceId: id, prompt: `${d.name}: what is its EU class?`,
    options: d.answers.kind === 'ivd' ? IVDR_CLASSES : MDR_CLASSES, answer: r.cls,
    hint: d.answers.kind === 'ivd' ? 'IVDR Annex VIII: check rules 1 to 3 first, then the self-test rule 4.' : 'MDR Annex VIII: start from how it touches the body, then check the special rules and the class I subclasses.',
    explain: `${r.decisive?.rule}: ${r.decisive?.text}${r.cls !== r.decisive?.cls ? ` Class ${r.decisive?.cls} becomes ${r.cls} for its sterile, measuring or reusable aspects.` : ''}`,
  }
}
function euRuleTask(id: string, options: string[]): Task {
  const r = eu(id), d = device(id)
  return { id: `${id}-eu-rule`, deviceId: id, prompt: `${d.name}: which Annex VIII rule sets that class?`, options, answer: r.decisive!.rule, hint: 'Several rules can apply; the strictest one decides.', explain: r.decisive!.text }
}
function usRouteTask(id: string): Task {
  const r = us(id), d = device(id)
  return { id: `${id}-us-route`, deviceId: id, prompt: `${d.name}: what is the US premarket route?`, options: US_ROUTES, answer: usRouteKey(r), hint: 'Find the device type’s classification regulation: its class and exemption decide the route.', explain: `${r.decisive?.rule}: ${r.cls}. ${r.route}.${r.notes.length ? ' ' + r.notes[0] : ''}` }
}
function usClassTask(id: string): Task {
  const r = us(id), d = device(id)
  return { id: `${id}-us-class`, deviceId: id, prompt: `${d.name}: what is its US class?`, options: ['Class I (510(k) exempt)', 'Class I', 'Class II', 'Class III', 'Licensed biologic (BLA)'], answer: r.cls, hint: 'The classification regulation in 21 CFR gives the class.', explain: `${r.decisive?.rule}: ${r.decisive?.text}` }
}

function inClassTask(id: string, over: Answers = {}, where = ''): Task {
  const r = india(id, over), d = device(id)
  return { id: `${id}-in-class${where ? '-' + where : ''}`, deviceId: id, prompt: `${d.name}${where ? ` (${where})` : ''}: what is its class in India?`, options: IN_CLASSES, answer: r.cls, hint: d.answers.kind === 'ivd' ? 'First Schedule Part II: transmissible agents, blood grouping, self-tests, near-patient tests, then the rest.' : 'First Schedule Part I follows the GHTF rules: how it touches the body, for how long, then the special rules.', explain: `${r.decisive?.rule}: ${r.decisive?.text}` }
}
function inFormsTask(id: string, over: Answers, where: string): Task {
  const r = india(id, over), d = device(id)
  const forms = fact(r, 'Forms') || fact(r, 'Licence')
  return { id: `${id}-in-forms-${where}`, deviceId: id, prompt: `${d.name} (${where}): which application and licence forms?`, options: IN_FORMS, answer: forms, hint: 'Class A and B manufacture: State Licensing Authority. Class C and D manufacture, and every import: Central Licensing Authority. Class A non-sterile, non-measuring: registration only.', explain: `Class ${r.cls}. ${r.route}. ${r.timeline.label}` }
}

export const MISSIONS: Mission[] = [
  {
    id: 'three-simple', title: 'Three simple devices?', devices: ['softline-strip', 'frostwell-pack', 'keenedge-scalpel'],
    brief: 'A start-up sells a sterile adhesive strip, a gel cold pack and a single-use scalpel. The founder thinks all three are "class I everywhere". Check each one in the EU and the US.',
    tasks: () => ['softline-strip', 'frostwell-pack', 'keenedge-scalpel'].flatMap((id) => [euClassTask(id), usRouteTask(id)]),
  },
  {
    id: 'same-hip', title: 'Same hip, two answers', devices: ['stridewell-hip'],
    brief: 'The Stridewell Hip System is about to launch in Europe and the US. The regulatory lead wants to know why the two classes differ and what that means for the route.',
    tasks: () => [euClassTask('stridewell-hip'), euRuleTask('stridewell-hip', ['Rule 1', 'Rule 7', 'Rule 8', 'Rule 14']), usClassTask('stridewell-hip'), usRouteTask('stridewell-hip')],
  },
  {
    id: 'pump', title: 'The pump and the expert panel', devices: ['dosaline-pump'],
    brief: 'The Dosaline Volumetric Pump infuses medicines that can harm a patient if over-delivered. Classify it and decide whether the EU clinical evaluation consultation applies.',
    tasks: () => {
      const r = eu('dosaline-pump')
      const consult = r.steps.some((s) => /consultation/.test(s.step)) ? 'Yes' : 'No'
      return [euClassTask('dosaline-pump'), euRuleTask('dosaline-pump', ['Rule 9', 'Rule 10', 'Rule 12', 'Rule 13']),
        { id: 'dosaline-pump-consult', deviceId: 'dosaline-pump', prompt: 'Does the clinical evaluation consultation procedure (MDR Article 54) apply?', options: ['Yes', 'No'], answer: consult, hint: 'Article 54(1) names two groups of devices.', explain: 'Article 54(1)(b): class IIb active devices intended to administer or remove a medicinal product (rule 12) go through the consultation, as do class III implantable devices.' },
        usRouteTask('dosaline-pump')]
    },
  },
  {
    id: 'ivdr-ladder', title: 'Four tests, four classes', devices: ['bloomline-test', 'novaglyx-meter', 'donorscreen-hiv', 'halvern-cup'],
    brief: 'Marrowbridge and Halvern sell a pregnancy self-test, a blood glucose meter, a donor HIV screen and a urine cup. Place each one on the IVDR ladder, then find the US route for the HIV screen.',
    tasks: () => [...['bloomline-test', 'novaglyx-meter', 'donorscreen-hiv', 'halvern-cup'].map(euClassTask), usRouteTask('donorscreen-hiv')],
  },
  {
    id: 'pacemaker', title: 'Pacemaker launch plan', devices: ['cardiorhythm-pacer'],
    brief: 'Halvern Medtech plans to launch the Cardiorhythm Pacer in Europe and the US. Work out the class, who reviews it, and the US review goal.',
    tasks: () => {
      const r = us('cardiorhythm-pacer')
      return [euClassTask('cardiorhythm-pacer'),
        { id: 'pacer-reviewer', deviceId: 'cardiorhythm-pacer', prompt: 'Who assesses its conformity in the EU?', options: ['The manufacturer alone', 'A notified body', 'A notified body, with an expert panel consulted on the clinical evaluation', 'The European Medicines Agency'], answer: 'A notified body, with an expert panel consulted on the clinical evaluation', hint: 'Class III implant.', explain: 'Class III implants: notified body under Annex IX, plus the clinical evaluation consultation procedure of Article 54.' },
        usClassTask('cardiorhythm-pacer'), usRouteTask('cardiorhythm-pacer'),
        { id: 'pacer-goal', deviceId: 'cardiorhythm-pacer', prompt: 'What is FDA’s review goal for an original PMA with an advisory panel?', options: ['90 FDA days', '150 FDA days', '180 FDA days', '320 FDA days'], answer: '320 FDA days', hint: 'MDUFA V.', explain: r.timeline.label }]
    },
  },
  {
    id: 'india-ladder', title: 'India’s licensing ladder', devices: ['frostwell-pack', 'calmpulse-tens', 'sutrafix-mesh', 'softline-strip'],
    brief: 'Four devices are headed for India: a gel cold pack and a sterile strip imported from abroad, a TENS unit and a hernia mesh made in India. In India the class decides who licenses the device and on which forms. Find the class and the forms for each.',
    tasks: () => [
      inClassTask('frostwell-pack', { in_activity: 'import' }, 'imported'), inFormsTask('frostwell-pack', { in_activity: 'import' }, 'imported'),
      inClassTask('softline-strip', { in_activity: 'import' }, 'imported'), inFormsTask('softline-strip', { in_activity: 'import' }, 'imported'),
      inClassTask('calmpulse-tens', { in_activity: 'manufacture' }, 'made in India'), inFormsTask('calmpulse-tens', { in_activity: 'manufacture' }, 'made in India'),
      inClassTask('sutrafix-mesh', { in_activity: 'manufacture' }, 'made in India'), inFormsTask('sutrafix-mesh', { in_activity: 'manufacture' }, 'made in India'),
      { id: 'mesh-clock', deviceId: 'sutrafix-mesh', prompt: 'Sutrafix (made in India): how long can the licence take at most under the Rules?', options: ['45 days', 'About 105 days', 'About 140 days', 'Nine months'], answer: 'About 105 days', hint: 'Class C: inspection within 60 days, then a decision within 45 days of the report.', explain: india('sutrafix-mesh', { in_activity: 'manufacture' }).timeline.label },
    ],
  },
  {
    id: 'one-sensor', title: 'One sensor, two meters', devices: ['novaglyx-meter', 'novaglyx-ward'],
    brief: 'Marrowbridge sells the same glucose sensor as a home meter for people with diabetes and as a ward meter used by nurses. The user and setting change the class, and the rules differ between the EU and India. In the US, the setting changes the CLIA category.',
    tasks: () => [
      euClassTask('novaglyx-meter'), euClassTask('novaglyx-ward'),
      inClassTask('novaglyx-meter'), inClassTask('novaglyx-ward'),
      { id: 'ward-clia', deviceId: 'novaglyx-ward', prompt: 'Novaglyx Ward Meter in the US: what does it need to be used in point-of-care sites with a certificate of waiver?', options: ['Nothing: home-use tests are waived', 'A CLIA waiver (CLIA Waiver by Application, or a Dual 510(k) and CLIA Waiver)', 'A PMA', 'A BLA'], answer: 'A CLIA waiver (CLIA Waiver by Application, or a Dual 510(k) and CLIA Waiver)', hint: 'Professional point-of-care tests are moderate complexity unless FDA waives them.', explain: cliaFact(device('novaglyx-ward').answers)?.value ?? '' },
    ],
  },
  {
    id: 'cdx', title: 'A test for Kestrenib', devices: ['ktb-select'],
    brief: 'Kestrenib (KTB-204), a fictional kinase inhibitor from the Clinical Trial Simulator, will only be prescribed to patients whose tumours test positive on the KTB-Select test. Plan the test’s route alongside the medicine in the EU, the US and India.',
    tasks: () => {
      const e = eu('ktb-select'), i = india('ktb-select')
      return [euClassTask('ktb-select'),
        { id: 'cdx-eu-consult', deviceId: 'ktb-select', prompt: 'In the EU, who must the notified body consult, and how long does that body have?', options: ['The expert panel, 60 days', 'The EMA or a national medicines authority, 60 days (extendable once by 60)', 'The EU reference laboratory, 30 days', 'Nobody: class C needs no consultation'], answer: 'The EMA or a national medicines authority, 60 days (extendable once by 60)', hint: 'IVDR Annex IX section 5.2.', explain: e.steps.find((s) => /medicines authority/.test(s.step))?.detail ?? '' },
        usRouteTask('ktb-select'),
        { id: 'cdx-us-timing', deviceId: 'ktb-select', prompt: 'When does FDA expect the test to be approved?', options: ['Before the pivotal trial starts', 'At the same time as Kestrenib (contemporaneous approval)', 'Within a year after Kestrenib', 'Only if a post-marketing commitment asks for it'], answer: 'At the same time as Kestrenib (contemporaneous approval)', hint: 'FDA guidance on in vitro companion diagnostic devices (2014).', explain: 'FDA expects the companion diagnostic to be approved or cleared contemporaneously with the medicine, with the two labels referring to each other.' },
        inClassTask('ktb-select'),
        { id: 'cdx-in-first', deviceId: 'ktb-select', prompt: 'No such test is approved in India. Which application comes first?', options: ['MD-14 for an import licence', 'MD-22 for a clinical investigation', 'MD-24 for a clinical performance evaluation', 'MD-28 for permission to import a new IVD'], answer: 'MD-24 for a clinical performance evaluation', hint: 'A new IVD is evaluated before permission to import it.', explain: i.steps[0]?.detail ?? '' }]
    },
  },
  {
    id: 'eu-india', title: 'Where the EU and India part ways', devices: ['sutrafix-mesh', 'veloura-implant', 'lumirinse-solution'],
    brief: 'The MDR names surgical meshes, joint replacements and breast implants in its rules; India’s First Schedule follows the GHTF rules. Classify three devices in both and spot why the classes differ.',
    tasks: () => [
      euClassTask('sutrafix-mesh'), inClassTask('sutrafix-mesh'),
      euClassTask('veloura-implant'), inClassTask('veloura-implant'),
      euClassTask('lumirinse-solution'), inClassTask('lumirinse-solution'),
      { id: 'mesh-why', deviceId: 'sutrafix-mesh', prompt: 'Why is the hernia mesh class III in the EU but class C in India?', options: ['India treats meshes as accessories', 'MDR rule 8 names surgical meshes as class III; India has no such rule, so the implant default (class C) applies', 'The EU counts it as an active implant', 'India classifies it by its sterility'], answer: 'MDR rule 8 names surgical meshes as class III; India has no such rule, so the implant default (class C) applies', hint: 'Compare the exceptions in MDR rule 8 with India’s implant rule.', explain: `${eu('sutrafix-mesh').decisive?.text} India: ${india('sutrafix-mesh').decisive?.text}` },
    ],
  },
  {
    id: 'is-it-device', title: 'Is it a device at all?', devices: ['rxcheck', 'sepsiswatch', 'heartnote'],
    brief: 'A digital health company has three products: a drug interaction checker for prescribers, a sepsis alert for wards and an over-the-counter ECG app. Before classifying, decide which are devices in the US and the EU.',
    tasks: () => [
      { id: 'dev-rx-us', deviceId: 'rxcheck', prompt: 'RxCheck Interactions in the US?', options: ['Not a device', 'Traditional 510(k)', 'De Novo', 'Premarket approval (PMA)'], answer: usRouteKey(us('rxcheck')), hint: 'Check the four criteria of FD&C Act 520(o)(1)(E).', explain: us('rxcheck').decisive!.text },
      { id: 'dev-rx-eu', deviceId: 'rxcheck', prompt: 'RxCheck Interactions in the EU: its class?', options: ['Not a device', 'I', 'IIa', 'IIb', 'III'], answer: eu('rxcheck').cls, hint: 'The EU has no clinical decision support exclusion.', explain: `${eu('rxcheck').decisive!.text} The EU has no exclusion for clinical decision support: software giving information for therapeutic decisions is at least class IIa.` },
      { id: 'dev-sepsis-us', deviceId: 'sepsiswatch', prompt: 'SepsisWatch also works on records and is used by professionals. Why is it a device in the US?', options: ['It analyses a physiological signal', 'It is for patients', 'The decision is time-critical, so staff cannot independently review its basis', 'It is not a device'], answer: 'The decision is time-critical, so staff cannot independently review its basis', hint: 'FDA guidance of 6 January 2026, criterion 4.', explain: us('sepsiswatch').notes[0] },
      { id: 'dev-ecg-us', deviceId: 'heartnote', prompt: 'HeartNote ECG in the US?', options: ['Not a device', 'Traditional 510(k)', 'De Novo', 'Premarket approval (PMA)'], answer: usRouteKey(us('heartnote')), hint: 'It analyses a physiological signal, and it is for consumers.', explain: `${us('heartnote').decisive!.text} ${us('heartnote').notes[0]}` },
    ],
  },
  {
    id: 'rule-11', title: 'Rule 11 and the N12 matrix', devices: ['triageview', 'heartnote', 'sepsiswatch'],
    brief: 'Classify three software products under MDR rule 11, then find each one’s IMDRF N12 category. The category is a teaching aid that India’s draft guidance builds on; it is not a legal class.',
    tasks: () => [
      euClassTask('triageview'), euClassTask('heartnote'), euClassTask('sepsiswatch'),
      ...['triageview', 'heartnote', 'sepsiswatch'].map((id) => { const c = n12Category(device(id).answers)!; return { id: `${id}-n12`, deviceId: id, prompt: `${device(id).name}: which IMDRF N12 category?`, options: ['I', 'II', 'III', 'IV'], answer: c, hint: 'Significance of the information (treat or diagnose, drive, inform) against the situation (critical, serious, non-serious).', explain: N12_TEXT[c] } }),
    ],
  },
  {
    id: 'ai-change', title: 'SepsisWatch learns', devices: ['sepsiswatch'],
    brief: 'SepsisWatch is retrained every quarter. Plan how each new version can reach the wards in the US, the EU and India without starting again each time.',
    tasks: () => [
      { id: 'ai-us', deviceId: 'sepsiswatch', prompt: 'In the US, what lets planned retraining ship without a new submission each time?', options: ['A predetermined change control plan authorised with the device', 'A letter to file for every change', 'An annual report', 'Nothing: every change needs a new De Novo'], answer: 'A predetermined change control plan authorised with the device', hint: 'FD&C Act section 515C.', explain: changeControl('US', device('sepsiswatch').answers)[0].value },
      { id: 'ai-eu', deviceId: 'sepsiswatch', prompt: 'In the EU, a retrained model that changes performance is…', options: ['A significant change needing the notified body’s approval before release', 'A non-significant change the manufacturer documents', 'Exempt as AI under the MDR', 'Assessed only under the AI Act'], answer: 'A significant change needing the notified body’s approval before release', hint: 'MDR Annex IX section 4.10 and MDCG 2020-3.', explain: changeControl('EU', device('sepsiswatch').answers)[0].value },
      { id: 'ai-act', deviceId: 'sepsiswatch', prompt: 'Under the EU AI Act, SepsisWatch (class III, needs a notified body) is…', options: ['High-risk AI', 'Limited-risk AI with transparency duties only', 'Outside the AI Act because it is a device', 'Prohibited AI'], answer: 'High-risk AI', hint: 'Article 6(1): a safety component of a product that needs third-party conformity assessment.', explain: changeControl('EU', device('sepsiswatch').answers)[1].value },
      { id: 'ai-in', deviceId: 'sepsiswatch', prompt: 'What does CDSCO’s draft software guidance propose for model updates?', options: ['An algorithm change protocol: document, validate and inform the regulator', 'A new licence for each update', 'Nothing: India does not regulate software', 'Approval by the ethics committee'], answer: 'An algorithm change protocol: document, validate and inform the regulator', hint: 'Draft of October 2025.', explain: changeControl('IN', device('sepsiswatch').answers)[0].value },
    ],
  },
  {
    id: 'combo-lead', title: 'Who leads a combination?', devices: ['velostent', 'dorva-pen'],
    brief: 'Halvern’s drug-coated stent and Tessaly’s prefilled pen both combine a medicine and a device. For each, find the lead regulator and the second review it triggers.',
    tasks: () => [
      euClassTask('velostent'),
      { id: 'vs-eu-second', deviceId: 'velostent', prompt: 'VeloStent in the EU: what second review does the drug coating trigger?', options: ['A medicines authority’s opinion on the substance, within 210 days', 'A full marketing authorisation for the drug', 'An expert panel opinion on the drug', 'None'], answer: 'A medicines authority’s opinion on the substance, within 210 days', hint: 'MDR rule 14 and Annex IX section 5.2.', explain: eu('velostent').steps.find((x) => /ancillary/.test(x.step))!.detail },
      usRouteTask('velostent'),
      { id: 'pen-eu', deviceId: 'dorva-pen', prompt: 'Dorvaglutide Pen in the EU: how is the pen assessed?', options: ['A notified body opinion on the pen, included in the medicine’s marketing authorisation application', 'A separate CE certificate under rule 14', 'Not at all: only the medicine is assessed', 'By the EMA’s device experts alone'], answer: 'A notified body opinion on the pen, included in the medicine’s marketing authorisation application', hint: 'MDR Article 117: a single integral product regulated as a medicine.', explain: eu('dorva-pen').steps[0].detail },
      usRouteTask('dorva-pen'),
      { id: 'pen-rfd', deviceId: 'dorva-pen', prompt: 'If the lead center were unclear, who decides, and how fast?', options: ['The Office of Combination Products, within 60 days of a request for designation', 'CDER and CDRH by agreement, no deadline', 'The sponsor chooses', 'An advisory committee'], answer: 'The Office of Combination Products, within 60 days of a request for designation', hint: '21 CFR 3.7 and 3.8.', explain: 'A request for designation goes to the Office of Combination Products, which designates the lead center within 60 days (21 CFR 3.8).' },
    ],
  },
  {
    id: 'nine-hip', title: 'One hip, nine regions', devices: ['stridewell-hip', 'sutrafix-mesh'],
    brief: 'Halvern wants the Stridewell Hip System and the Sutrafix Hernia Mesh everywhere. The same device can land in different classes: work out where, and what the Canadian licence involves.',
    tasks: () => {
      const hip = device('stridewell-hip').answers, mesh = device('sutrafix-mesh').answers
      const ca = CA_PACK.classify(hip), ukMesh = UK_PACK.classify(mesh), euMesh = EU_PACK.classify(mesh)
      return [
        { id: 'hip-ca', deviceId: 'stridewell-hip', prompt: 'Stridewell Hip in Canada: which class?', options: ['I', 'II', 'III', 'IV'], answer: ca.cls, hint: 'Schedule 1, Part 1, rule 1: surgically invasive, 30 days or more.', explain: ca.decisive!.text },
        { id: 'hip-ca-route', deviceId: 'stridewell-hip', prompt: 'What does Health Canada expect for it?', options: ['An MDSAP certificate and a licence review of about 15 + 60 days', 'An establishment licence only', 'A 510(k)', 'A notified body certificate'], answer: 'An MDSAP certificate and a licence review of about 15 + 60 days', hint: 'Class III medical device licence.', explain: ca.timeline.label },
        { id: 'hip-au', deviceId: 'stridewell-hip', prompt: 'Stridewell Hip in Australia: which class?', options: ['IIa', 'IIb', 'III', 'AIMD'], answer: AU_PACK.classify(hip).cls, hint: 'Australia reclassified joint replacements.', explain: 'Joint replacements are class III in Australia, as in the EU.' },
        { id: 'mesh-uk', deviceId: 'sutrafix-mesh', prompt: 'Sutrafix Mesh in Great Britain today: which class?', options: ['IIa', 'IIb', 'III'], answer: ukMesh.cls, hint: 'The UK still uses the directive rules.', explain: `${ukMesh.decisive!.text} In the EU it is class ${euMesh.cls} under MDR rule 8.` },
        { id: 'mesh-uk-ce', deviceId: 'sutrafix-mesh', prompt: 'Until when does Great Britain accept a CE mark under the EU MDR?', options: ['30 June 2025', '30 June 2028', '30 June 2030', 'Indefinitely, decided in 2026'], answer: '30 June 2030', hint: 'Directive certificates have an earlier date.', explain: 'CE marks are accepted in Great Britain until 30 June 2028 for directive certificates and 30 June 2030 for EU MDR and IVDR certificates; indefinite recognition was deferred for further consultation.' },
        { id: 'hip-jp', deviceId: 'stridewell-hip', prompt: 'In Japan, a class III hip needs…', options: ['Notification (todokede)', 'Certification by a registered body (ninsho) only', 'Approval (shonin) by MHLW after PMDA review, unless a designated certification standard covers it', 'Nothing'], answer: 'Approval (shonin) by MHLW after PMDA review, unless a designated certification standard covers it', hint: 'Highly controlled devices.', explain: JP_PACK.classify(hip).route },
      ]
    },
  },
  {
    id: 'global-ai', title: 'TriageView goes global', devices: ['triageview'],
    brief: 'Halvern Digital has CE and FDA clearance for TriageView Chest and now wants Canada, Australia, Japan, China, Switzerland and the UK. Find who must act for Halvern in each market and what each regulator needs.',
    tasks: () => {
      const a = device('triageview').answers
      return [
        { id: 'tv-ca', deviceId: 'triageview', prompt: 'TriageView in Canada: which class?', options: ['I', 'II', 'III', 'IV'], answer: CA_PACK.classify(a).cls, hint: 'Rule 10: diagnosis or monitoring software.', explain: CA_PACK.classify(a).decisive!.text },
        { id: 'tv-ch', deviceId: 'triageview', prompt: 'Its EU certificate is accepted in Switzerland. What else is needed?', options: ['A Swiss authorised representative and swissdamed registration', 'A new Swiss conformity assessment', 'Nothing', 'An MDSAP certificate'], answer: 'A Swiss authorised representative and swissdamed registration', hint: 'The EU treats Switzerland as a third country.', explain: CH_PACK.classify(a).steps.slice(-2).map((x) => x.detail).join(' ') },
        { id: 'tv-au', deviceId: 'triageview', prompt: 'Who applies for inclusion in the ARTG?', options: ['An Australian sponsor', 'Halvern directly from abroad', 'The hospital that buys it', 'A notified body'], answer: 'An Australian sponsor', hint: 'Australia’s register.', explain: AU_PACK.classify(a).steps[0].detail },
        { id: 'tv-cn', deviceId: 'triageview', prompt: 'Who submits the registration in China?', options: ['A China legal agent, with Halvern as registrant', 'Halvern’s EU notified body', 'Any Chinese hospital', 'Nobody: CE is accepted'], answer: 'A China legal agent, with Halvern as registrant', hint: 'Foreign manufacturers cannot apply alone.', explain: CN_PACK.classify(a).steps[0].detail },
        { id: 'tv-uk', deviceId: 'triageview', prompt: 'In Great Britain, what must a manufacturer outside the UK appoint?', options: ['A UK Responsible Person', 'A UK sponsor', 'A CH-REP', 'Nobody'], answer: 'A UK Responsible Person', hint: 'Also required after the reforms.', explain: UK_PACK.classify(a).steps.find((x) => /Responsible/.test(x.step))!.detail },
      ]
    },
  },
]

export interface Attempt {
  userId: string
  classId: string | null
  missionId: string
  level: Level
  score: number
  correct: number
  total: number
  seconds: number
  at: string
}

export function scoreMission(tasks: Task[], picks: Record<string, string>): { correct: number; total: number; score: number } {
  const correct = tasks.filter((t) => picks[t.id] === t.answer).length
  return { correct, total: tasks.length, score: Math.round((correct / tasks.length) * 100) }
}