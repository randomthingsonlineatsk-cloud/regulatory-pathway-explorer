// Phase 2: the India pack (Medical Devices Rules, 2017), the IVD branch, companion diagnostics
// and CLIA, and the Phase 2 missions.
import { describe, expect, it } from 'vitest'
import { IN_PACK, inDeviceHits, inIvdHits } from '../src/wizard/in'
import { EU_PACK } from '../src/wizard/eu'
import { US_PACK, cliaFact } from '../src/wizard/us'
import { LIBRARY } from '../src/wizard/library'
import { MISSIONS, scoreMission } from '../src/wizard/missions'
import type { Answers } from '../src/wizard/questions'

const dev: Answers = { kind: 'device', special: [], class1_flags: [], in_activity: 'manufacture', in_predicate: true }
const ivd: Answers = { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'no', in_activity: 'import', in_predicate: true }
const cls = (a: Answers) => IN_PACK.classify({ ...dev, ...a }).cls
const icls = (a: Answers) => IN_PACK.classify({ ...ivd, ...a }).cls
const lib = (id: string) => LIBRARY.find((d) => d.id === id)!

describe('India First Schedule Part I (devices)', () => {
  it('non-invasive devices', () => {
    expect(cls({ active: false, invasive: 'non', noninv: 'other' })).toBe('A')
    expect(cls({ active: false, invasive: 'non', noninv: 'skin', r4: 'barrier' })).toBe('A')
    expect(cls({ active: false, invasive: 'non', noninv: 'skin', r4: 'micro' })).toBe('B')
    expect(cls({ active: false, invasive: 'non', noninv: 'skin', r4: 'dermis' })).toBe('C')
    expect(cls({ active: false, invasive: 'non', noninv: 'channel', r2: 'blood_bag' })).toBe('C')
    expect(cls({ active: false, invasive: 'non', noninv: 'channel', r2: 'other' })).toBe('A')
    expect(cls({ active: false, invasive: 'non', noninv: 'modify', r3: 'physical' })).toBe('B')
    expect(cls({ active: false, invasive: 'non', noninv: 'modify', r3: 'other' })).toBe('C')
  })
  it('body orifice: India’s transient exception and the absorption test', () => {
    const o = { active: false, invasive: 'orifice', connect_active: false, injured_mucosa: false }
    expect(cls({ ...o, duration: 'transient', orifice_transient_flag: false })).toBe('A')
    expect(cls({ ...o, duration: 'transient', orifice_transient_flag: true })).toBe('B')
    expect(cls({ ...o, duration: 'short', orifice_site: 'oral_ear_nasal', absorbed_mucosa: false })).toBe('A')
    expect(cls({ ...o, duration: 'short', orifice_site: 'oral_ear_nasal', absorbed_mucosa: true })).toBe('B')
    expect(cls({ ...o, duration: 'long', orifice_site: 'other' })).toBe('C')
    expect(cls({ ...o, duration: 'long', orifice_site: 'oral_ear_nasal', absorbed_mucosa: false })).toBe('B')
    expect(cls({ ...o, duration: 'transient', orifice_transient_flag: false, connect_active: true })).toBe('B')
  })
  it('surgically invasive and implants: heart and CNS are class D even for transient use', () => {
    const s = { active: false, invasive: 'surgical' }
    expect(cls({ ...s, duration: 'transient', surg: [] })).toBe('B')
    expect(cls({ ...s, duration: 'transient', surg: ['reusable'] })).toBe('A')
    expect(cls({ ...s, duration: 'transient', surg: ['heart_cns'] })).toBe('D')
    expect(cls({ ...s, duration: 'transient', surg: ['biological'] })).toBe('C')
    expect(cls({ ...s, duration: 'short', surg: ['biological'] })).toBe('D')
    expect(cls({ ...s, duration: 'short', surg: ['medicine'] })).toBe('C')
    expect(cls({ active: false, invasive: 'implant', impl: [] })).toBe('C')
    expect(cls({ active: false, invasive: 'implant', impl: ['teeth'] })).toBe('B')
    for (const k of ['heart_cns', 'life_support', 'active_implant', 'biological', 'chemical_medicine', 'breast']) expect(cls({ active: false, invasive: 'implant', impl: [k] }), k).toBe('D')
    for (const k of ['mesh', 'joint', 'spine']) expect(cls({ active: false, invasive: 'implant', impl: [k] }), k).toBe('C')
  })
  it('active devices', () => {
    const a = { active: true, invasive: 'non' }
    expect(cls({ ...a, active_fn: 'therapy', r9: [] })).toBe('B')
    expect(cls({ ...a, active_fn: 'therapy', r9: ['hazardous'] })).toBe('C')
    expect(cls({ ...a, active_fn: 'diagnose', r10: ['illuminate'] })).toBe('A')
    expect(cls({ ...a, active_fn: 'diagnose', r10: ['vital'] })).toBe('B')
    expect(cls({ ...a, active_fn: 'diagnose', r10: ['xray'] })).toBe('C')
    expect(cls({ ...a, active_fn: 'administer', r12_hazard: true })).toBe('C')
    expect(cls({ ...a, active_fn: 'other' })).toBe('A')
  })
  it('special rules, and the higher class wins', () => {
    const n = { active: false, invasive: 'non', noninv: 'other' }
    expect(cls({ ...n, special: ['r14'] })).toBe('D')
    expect(cls({ ...n, special: ['r18'], r18_skin: false })).toBe('D')
    expect(cls({ ...n, special: ['r18'], r18_skin: true })).toBe('A')
    expect(cls({ ...n, special: ['r16_lens'] })).toBe('C')
    expect(cls({ ...n, special: ['r16_sterilise'] })).toBe('C')
    expect(cls({ ...n, special: ['r16_disinfect'] })).toBe('B')
    expect(cls({ ...n, special: ['r15'] })).toBe('C')
    expect(cls({ active: false, invasive: 'implant', impl: [], special: ['r15'] })).toBe('D')
    expect(inDeviceHits({ ...dev, ...n, special: ['r14', 'r16_disinfect'] }).hits.length).toBe(3)
  })
})

describe('India First Schedule Part II (IVDs)', () => {
  it('paragraphs 2(i) to 2(vi)', () => {
    expect(icls({ ivd_d: ['blood_safety'] })).toBe('D')
    expect(icls({ ivd_d: ['load'] })).toBe('C')
    expect(icls({ ivd_grouping: 'listed' })).toBe('D')
    expect(icls({ ivd_grouping: 'other' })).toBe('C')
    for (const k of ['sti', 'cancer', 'companion', 'genetic', 'drug_level', 'embryo']) expect(icls({ ivd_c: [k] }), k).toBe('C')
    expect(icls({ ivd_c: ['newborn'] })).toBe('B')
    expect(icls({ ivd_user: 'self', ivd_self_b: 'other' })).toBe('C')
    expect(icls({ ivd_user: 'self', ivd_self_b: 'not_critical' })).toBe('B')
    expect(icls({ ivd_user: 'near_patient', ivd_np_gas_glucose: true })).toBe('C')
    expect(icls({ ivd_user: 'near_patient', ivd_np_gas_glucose: false })).toBe('B')
    expect(icls({ ivd_a: 'instrument' })).toBe('A')
    expect(icls({})).toBe('B')
    expect(inIvdHits({ ...ivd, ivd_d: ['blood_safety'] }).hits[0].rule).toBe('First Schedule Part II, para 2(i)(a)')
  })
  it('near-patient glucose: EU class B, India class C', () => {
    const a = { ...ivd, ivd_user: 'near_patient', ivd_np_gas_glucose: true }
    expect(EU_PACK.classify(a).cls).toBe('B')
    expect(IN_PACK.classify(a).cls).toBe('C')
  })
})

describe('India licences', () => {
  const facts = (a: Answers) => Object.fromEntries((IN_PACK.classify(a).facts ?? []).map((f) => [f.label, f.value]))
  it('the class decides the authority and the forms', () => {
    expect(facts({ ...dev, active: false, invasive: 'non', noninv: 'other' }).Licence).toBe('Registration number (no licence)')
    expect(facts({ ...dev, active: false, invasive: 'non', noninv: 'other', class1_flags: ['sterile'] }).Forms).toBe('MD-3 → MD-5 (loan licence MD-4 → MD-6)')
    expect(facts({ ...dev, active: true, invasive: 'non', active_fn: 'therapy', r9: [] }).Authority).toBe('State Licensing Authority')
    expect(facts({ ...dev, active: false, invasive: 'implant', impl: [] }).Forms).toBe('MD-7 → MD-9 (loan licence MD-8 → MD-10)')
    expect(facts({ ...dev, in_activity: 'import', active: false, invasive: 'implant', impl: [] }).Forms).toBe('MD-14 → MD-15')
    expect(IN_PACK.classify({ ...dev, in_activity: 'import', active: false, invasive: 'implant', impl: [] }).timeline.label).toMatch(/nine months/)
  })
  it('no predicate: clinical investigation and MD-27 for devices, performance evaluation and MD-29 for IVDs', () => {
    expect(facts({ ...dev, in_predicate: false, active: false, invasive: 'implant', impl: [] })['No predicate']).toBe('MD-22 → MD-23, then MD-26 → MD-27')
    expect(facts({ ...ivd, in_predicate: false })['No predicate']).toBe('MD-24 → MD-25, then MD-28 → MD-29')
  })
  it('asks for the India questions before giving a licence', () => {
    const r = IN_PACK.classify({ kind: 'device', active: false, invasive: 'non', noninv: 'other', special: [] })
    expect(r.cls).toBe('A'); expect(r.incomplete).toMatch(/India questions/)
  })
})

describe('US IVD additions', () => {
  it('CLIA follows the user', () => {
    expect(cliaFact({ ...ivd, ivd_user: 'self' })?.value).toMatch(/Waived/)
    expect(cliaFact({ ...ivd, ivd_user: 'near_patient' })?.value).toMatch(/CLIA Waiver by Application/)
    expect(cliaFact({ ...ivd, ivd_user: 'lab' })?.value).toMatch(/493\.17/)
    expect(cliaFact({ ...ivd, ivd_a: 'receptacle' })).toBeNull()
  })
  it('a co-developed companion diagnostic: EU consultation, US PMA with contemporaneous approval, India MD-24 first', () => {
    const a = lib('ktb-select').answers
    expect(EU_PACK.classify(a).steps.some((s) => /60 days, extendable once by 60 days/.test(s.detail))).toBe(true)
    const us = US_PACK.classify(a)
    expect(us.route).toMatch(/PMA/)
    expect(us.steps.some((s) => s.step === 'Contemporaneous approval')).toBe(true)
    expect(IN_PACK.classify(a).steps[0].detail).toMatch(/MD-24/)
  })
})

describe('Phase 2 missions', () => {
  it('nine missions; every task’s answer is one of its options, and right answers score 100', () => {
    expect(MISSIONS.length).toBe(9)
    for (const m of MISSIONS) {
      const tasks = m.tasks()
      for (const t of tasks) expect(t.options, `${m.id}/${t.id}`).toContain(t.answer)
      expect(scoreMission(tasks, Object.fromEntries(tasks.map((t) => [t.id, t.answer]))).score).toBe(100)
    }
  })
})
