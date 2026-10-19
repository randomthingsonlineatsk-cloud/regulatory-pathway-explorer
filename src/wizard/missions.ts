// Missions: classify library devices and pick routes; answers come from the engine, so the
// missions always agree with the rules.
import { EU_PACK } from './eu'
import { US_PACK } from './us'
import { LIBRARY } from './library'
import { MDR_CLASSES, IVDR_CLASSES } from './engine'
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

export function usRouteKey(r: RegionResult): string {
  if (/Biologics License/.test(r.route)) return 'Biologics License Application (CBER)'
  if (/^Exempt/.test(r.route)) return 'Exempt: register and list'
  if (/Special 510/.test(r.route)) return 'Special 510(k)'
  if (/510\(k\)/.test(r.route) && !/No predicate/.test(r.route)) return 'Traditional 510(k)'
  if (/HDE/.test(r.route)) return 'Humanitarian Device Exemption'
  if (/De Novo/.test(r.route)) return 'De Novo'
  if (/PMA/.test(r.route)) return 'Premarket approval (PMA)'
  return r.route
}
const US_ROUTES = ['Exempt: register and list', 'Traditional 510(k)', 'De Novo', 'Premarket approval (PMA)', 'Biologics License Application (CBER)']

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
