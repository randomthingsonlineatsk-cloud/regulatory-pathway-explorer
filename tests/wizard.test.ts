// Phase 1: the classification wizard (EU MDR and IVDR, US).
import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../src/wizard/library'
import { EU_PACK, mdrHits, ivdrHits } from '../src/wizard/eu'
import { US_PACK, US_TYPES } from '../src/wizard/us'
import { QUESTIONS, visibleQuestions, isAnswered } from '../src/wizard/questions'
import { US_OPTIONS } from '../src/wizard/us'
import type { Answers } from '../src/wizard/questions'

const dev: Answers = { kind: 'device', special: [], class1_flags: [] }
const eu = (a: Answers) => EU_PACK.classify({ ...dev, ...a }).cls

describe('device library', () => {
  it('every device gets its expected class in the EU and the US, with no unanswered question', () => {
    for (const d of LIBRARY) {
      const r = { EU: EU_PACK.classify(d.answers), US: US_PACK.classify(d.answers) }
      expect(r.EU.incomplete, `${d.id} EU`).toBeUndefined()
      expect(r.US.incomplete, `${d.id} US`).toBeUndefined()
      expect(r.EU.cls, d.id).toBe(d.expect.EU)
      expect(r.US.cls, d.id).toBe(d.expect.US)
      const unanswered = visibleQuestions(d.answers, US_OPTIONS).filter((q) => !isAnswered(q, d.answers)).map((q) => q.id)
      expect(unanswered, d.id).toEqual([])
    }
  })
  it('uses fictional names and real regulation numbers', () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(12)
    for (const t of US_TYPES) expect(t.cfr).toMatch(/21 CFR|PHS Act/)
  })
})

describe('MDR Annex VIII rules', () => {
  it('rule 1 to 4: non-invasive devices', () => {
    expect(eu({ active: false, invasive: 'non', noninv: 'other' })).toBe('I')
    expect(eu({ active: false, invasive: 'non', noninv: 'channel', r2: 'blood_bag' })).toBe('IIb')
    expect(eu({ active: false, invasive: 'non', noninv: 'channel', r2: 'connect_active' })).toBe('IIa')
    expect(eu({ active: false, invasive: 'non', noninv: 'modify', r3: 'physical' })).toBe('IIa')
    expect(eu({ active: false, invasive: 'non', noninv: 'modify', r3: 'in_vitro_cells' })).toBe('III')
    expect(eu({ active: false, invasive: 'non', noninv: 'skin', r4: 'dermis' })).toBe('IIb')
    expect(eu({ active: false, invasive: 'non', noninv: 'skin', r4: 'micro' })).toBe('IIa')
  })
  it('rule 5: body orifices, by duration, site and connection', () => {
    const o = { active: false, invasive: 'orifice', connect_active: false, injured_mucosa: false }
    expect(eu({ ...o, duration: 'transient' })).toBe('I')
    expect(eu({ ...o, duration: 'short', orifice_site: 'oral_ear_nasal' })).toBe('I')
    expect(eu({ ...o, duration: 'long', orifice_site: 'other' })).toBe('IIb')
    expect(eu({ ...o, duration: 'long', orifice_site: 'oral_ear_nasal', absorbed_mucosa: false })).toBe('IIa')
    expect(eu({ ...o, duration: 'transient', connect_active: true })).toBe('IIa')
  })
  it('rules 6 to 8: surgically invasive devices and implants', () => {
    const s = { active: false, invasive: 'surgical' }
    expect(eu({ ...s, duration: 'transient', surg: ['reusable'] })).toBe('I')
    expect(eu({ ...s, duration: 'transient', surg: ['biological'] })).toBe('IIb')
    expect(eu({ ...s, duration: 'short', surg: ['biological'] })).toBe('III')
    expect(eu({ ...s, duration: 'transient', surg: ['heart_cns'] })).toBe('III')
    expect(eu({ active: false, invasive: 'implant', impl: ['teeth'] })).toBe('IIa')
    expect(eu({ active: false, invasive: 'implant', impl: ['breast_mesh'] })).toBe('III')
    expect(eu({ ...s, duration: 'long', impl: [] })).toBe('IIb')
  })
  it('rules 9, 10, 12, 13: active devices', () => {
    const a = { active: true, invasive: 'non' }
    expect(eu({ ...a, active_fn: 'therapy', r9: ['hazardous'] })).toBe('IIb')
    expect(eu({ ...a, active_fn: 'therapy', r9: ['controls_aimd'] })).toBe('III')
    expect(eu({ ...a, active_fn: 'diagnose', r10: ['illuminate'] })).toBe('I')
    expect(eu({ ...a, active_fn: 'diagnose', r10: ['vital', 'vital_danger'] })).toBe('IIb')
    expect(eu({ ...a, active_fn: 'administer', r12_hazard: false })).toBe('IIa')
    expect(eu({ ...a, active_fn: 'other' })).toBe('I')
  })
  it('rules 14 to 22: special rules, and the strictest rule wins', () => {
    const n = { active: false, invasive: 'non', noninv: 'other' }
    expect(eu({ ...n, special: ['r14'] })).toBe('III')
    expect(eu({ ...n, special: ['r16_lens'] })).toBe('IIb')
    expect(eu({ ...n, special: ['r18'], r18_skin: true })).toBe('I')
    expect(eu({ ...n, special: ['r19'], r19_level: 'low' })).toBe('IIb')
    expect(eu({ active: false, invasive: 'implant', impl: [], special: ['r15'] })).toBe('III')
    const r = mdrHits({ ...dev, ...n, special: ['r17', 'r21'], r21_site: 'skin_nose_mouth' })
    expect(r.hits.map((h) => h.rule)).toEqual(['Rule 1', 'Rule 17', 'Rule 21'])
  })
  it('class I subclasses and their notified body route', () => {
    const r = EU_PACK.classify({ ...dev, active: false, invasive: 'non', noninv: 'other', class1_flags: ['sterile', 'measuring'] })
    expect(r.cls).toBe('Ism')
    expect(r.reviewer).toMatch(/Notified body/)
  })
  it('the expert panel consultation for class III implants and class IIb drug pumps', () => {
    const hip = LIBRARY.find((d) => d.id === 'stridewell-hip')!
    expect(EU_PACK.classify(hip.answers).steps.some((s) => /consultation/.test(s.step))).toBe(true)
    const pump = LIBRARY.find((d) => d.id === 'dosaline-pump')!
    expect(EU_PACK.classify(pump.answers).steps.some((s) => /consultation/.test(s.step))).toBe(true)
    const implant = LIBRARY.find((d) => d.id === 'osteanchor-implant')!
    expect(EU_PACK.classify(implant.answers).steps.some((s) => /consultation/.test(s.step))).toBe(false)
  })
})

describe('IVDR Annex VIII rules', () => {
  const ivd = { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'no' }
  const cls = (a: Answers) => EU_PACK.classify({ ...ivd, ...a }).cls
  it('rules 1 to 7', () => {
    expect(cls({ ivd_grouping: 'listed' })).toBe('D')
    expect(cls({ ivd_grouping: 'other' })).toBe('C')
    expect(cls({ ivd_c: ['companion'] })).toBe('C')
    expect(cls({ ivd_user: 'self', ivd_self_b: 'other' })).toBe('C')
    expect(cls({ ivd_user: 'self', ivd_self_b: 'not_critical' })).toBe('B')
    expect(cls({ ivd_a: 'instrument', ivd_sterile: false })).toBe('A')
    expect(cls({ ivd_a: 'control' })).toBe('B')
    expect(cls({})).toBe('B')
    expect(ivdrHits({ ...ivd, ivd_c: [] }).hits[0].rule).toBe('Rule 6')
  })
  it('companion diagnostics add the medicines authority consultation; class D adds the reference laboratory', () => {
    expect(EU_PACK.classify({ ...ivd, ivd_c: ['companion'] }).steps.some((s) => /medicines authority/.test(s.step))).toBe(true)
    expect(EU_PACK.classify({ ...ivd, ivd_d: ['blood_safety'] }).steps.some((s) => /reference laboratory/.test(s.step))).toBe(true)
  })
})

describe('US routes', () => {
  it('510(k) with and without a predicate, Special 510(k), De Novo, PMA and HDE', () => {
    expect(US_PACK.classify({ us_type: 'tens', us_predicate: true, us_own_change: false }).route).toMatch(/Traditional 510\(k\)/)
    expect(US_PACK.classify({ us_type: 'tens', us_predicate: true, us_own_change: true }).route).toBe('Special 510(k)')
    expect(US_PACK.classify({ us_type: 'tens', us_predicate: false }).route).toMatch(/De Novo/)
    expect(US_PACK.classify({ us_type: 'novel', us_risk: 'low_moderate' }).route).toMatch(/De Novo/)
    expect(US_PACK.classify({ us_type: 'novel', us_risk: 'high', us_hud: false }).route).toMatch(/PMA/)
    expect(US_PACK.classify({ us_type: 'novel', us_risk: 'high', us_hud: true }).route).toMatch(/HDE/)
    expect(US_PACK.classify({ us_type: 'cold_pack' }).notes.join(' ')).toMatch(/infants/)
  })
  it('every question has a unique id', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  })
})

import { MISSIONS, scoreMission } from '../src/wizard/missions'
describe('missions', () => {
  it('five missions; every answer is one of its options; a perfect run scores 100', () => {
    expect(MISSIONS).toHaveLength(5)
    for (const m of MISSIONS) {
      const tasks = m.tasks()
      for (const t of tasks) expect(t.options, `${m.id}/${t.id}`).toContain(t.answer)
      expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
      expect(scoreMission(tasks, Object.fromEntries(tasks.map((t) => [t.id, t.answer]))).score).toBe(100)
    }
  })
  it('the trap in the first mission: the scalpel is class IIa in the EU but exempt in the US', () => {
    const t = MISSIONS[0].tasks()
    expect(t.find((x) => x.id === 'keenedge-scalpel-eu-class')!.answer).toBe('IIa')
    expect(t.find((x) => x.id === 'keenedge-scalpel-us-route')!.answer).toBe('Exempt: register and list')
    expect(t.find((x) => x.id === 'softline-strip-eu-class')!.answer).toBe('Is')
  })
})
