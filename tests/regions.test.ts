// Phase 4: the UK, Canada, Australia, Japan, China and Switzerland packs; missions; certificate.
import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../src/wizard/library'
import { PACKS } from '../src/wizard/engine'
import { EU_PACK } from '../src/wizard/eu'
import { UK_PACK, CA_PACK, AU_PACK, JP_PACK, CN_PACK, CH_PACK, caDeviceHits, caIvdHits } from '../src/wizard/packs4'
import { MISSIONS, scoreMission, type Attempt } from '../src/wizard/missions'
import { eligibility, verificationCode } from '../src/wizard/cert'
import type { Answers } from '../src/wizard/questions'

const lib = (id: string) => LIBRARY.find((d) => d.id === id)!.answers
const cls = (p: { classify: (a: Answers) => { cls: string } }, id: string) => p.classify(lib(id)).cls
const dev: Answers = { kind: 'device', special: [], class1_flags: [] }

describe('nine regions', () => {
  it('every library device gets a complete result in all nine packs', () => {
    expect(PACKS.map((p) => p.id)).toEqual(['EU', 'US', 'IN', 'UK', 'CA', 'AU', 'JP', 'CN', 'CH'])
    for (const d of LIBRARY) for (const p of PACKS) expect(p.classify(d.answers).incomplete, `${d.id} ${p.id}`).toBeUndefined()
  })
})

describe('Canada, Schedule 1', () => {
  it('Part 1 rules', () => {
    const c = (a: Answers) => caDeviceHits({ ...dev, ...a }).hits.reduce((m, h) => (['I', 'II', 'III', 'IV'].indexOf(h.cls) > ['I', 'II', 'III', 'IV'].indexOf(m) ? h.cls : m), 'I')
    expect(c({ active: false, invasive: 'surgical', duration: 'transient', surg: [] })).toBe('II')
    expect(c({ active: false, invasive: 'surgical', duration: 'transient', surg: ['instrument'] })).toBe('I')
    expect(c({ active: false, invasive: 'surgical', duration: 'transient', surg: ['heart_cns'] })).toBe('IV')
    expect(c({ active: false, invasive: 'implant', impl: [] })).toBe('III')
    expect(c({ active: false, invasive: 'implant', impl: ['breast'] })).toBe('IV')
    expect(c({ active: false, invasive: 'orifice', duration: 'long', orifice_site: 'other' })).toBe('III')
    expect(c({ active: false, invasive: 'orifice', duration: 'short', orifice_site: 'oral_ear_nasal' })).toBe('I')
    expect(c({ active: false, invasive: 'non', noninv: 'modify', r3: 'other' })).toBe('III')
    expect(c({ active: true, invasive: 'non', active_fn: 'administer', r12_hazard: true, special: ['r22'] })).toBe('IV')
    expect(c({ active: true, invasive: 'non', active_fn: 'diagnose', r10: ['xray'] })).toBe('II')
  })
  it('Part 2 rules and the licence', () => {
    const iv: Answers = { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'no' }
    const c = (a: Answers) => caIvdHits({ ...iv, ...a }).hits.map((h) => h.cls)
    expect(c({ ivd_d: ['blood_safety'] })).toContain('IV')
    expect(c({ ivd_user: 'near_patient' })).toEqual(['III'])
    expect(c({ ivd_user: 'self', ivd_self_b: 'listed' })).toEqual(['II'])
    expect(c({})).toEqual(['I'])
    expect(CA_PACK.classify(lib('stridewell-hip')).timeline.label).toMatch(/15 days of screening, then 60/)
    expect(CA_PACK.classify(lib('frostwell-pack')).route).toMatch(/MDEL/)
    expect(cls(CA_PACK, 'cardiorhythm-pacer')).toBe('IV')
    expect(cls(CA_PACK, 'velostent')).toBe('IV')
  })
})

describe('UK, Australia, Japan, China, Switzerland', () => {
  it('UK keeps the directive rules', () => {
    expect(cls(UK_PACK, 'sutrafix-mesh')).toBe('IIb')
    expect(cls(UK_PACK, 'stridewell-hip')).toBe('III')
    expect(cls(UK_PACK, 'cardiorhythm-pacer')).toBe('AIMD')
    expect(cls(UK_PACK, 'novaglyx-meter')).toBe('List B')
    expect(cls(UK_PACK, 'donorscreen-hiv')).toBe('List A')
    expect(UK_PACK.classify(lib('stridewell-hip')).steps[0].detail).toMatch(/30 June 2030/)
  })
  it('Australia: AIMD, reclassified mesh and joints, software rules', () => {
    expect(cls(AU_PACK, 'cardiorhythm-pacer')).toBe('AIMD')
    expect(cls(AU_PACK, 'sutrafix-mesh')).toBe('III')
    expect(cls(AU_PACK, 'heartnote')).toBe('IIa')
    expect(cls(AU_PACK, 'donorscreen-hiv')).toBe('Class 4')
  })
  it('Japan and China are labelled estimates, with known catalogue entries', () => {
    expect(JP_PACK.basis).toBe('estimate'); expect(CN_PACK.basis).toBe('estimate')
    expect(cls(JP_PACK, 'clearsight-lens')).toBe('III')
    expect(cls(CN_PACK, 'clearsight-lens')).toBe('III')
    expect(cls(JP_PACK, 'cardiorhythm-pacer')).toBe('IV')
    expect(cls(JP_PACK, 'heartnote')).toBe('II')
    expect(JP_PACK.classify(lib('stridewell-hip')).notes[0]).toMatch(/Estimate/)
  })
  it('Switzerland applies the EU class, with CH-REP and swissdamed', () => {
    for (const d of LIBRARY) expect(CH_PACK.classify(d.answers).cls, d.id).toBe(EU_PACK.classify(d.answers).cls)
    expect(CH_PACK.classify(lib('stridewell-hip')).steps.some((s) => /swissdamed/.test(s.step))).toBe(true)
  })
})

describe('missions and certificate', () => {
  it('fifteen missions, every one scorable', () => {
    expect(MISSIONS.length).toBe(15)
    for (const m of MISSIONS) { const t = m.tasks(); for (const x of t) expect(x.options, `${m.id}/${x.id}`).toContain(x.answer); expect(scoreMission(t, Object.fromEntries(t.map((x) => [x.id, x.answer]))).score).toBe(100) }
  })
  it('eligibility needs every lesson and ten missions at 70%; the code is stable', () => {
    const att = (missionId: string, score: number): Attempt => ({ userId: 'u', classId: null, missionId, level: 'standard', score, correct: 0, total: 0, seconds: 0, at: '' })
    const ten = MISSIONS.slice(0, 10).map((m) => att(m.id, 80))
    const ids = ['a', 'b']
    expect(eligibility(ids, { a: true, b: true }, ten).ok).toBe(true)
    expect(eligibility(ids, { a: true }, ten).ok).toBe(false)
    expect(eligibility(ids, { a: true, b: true }, [...ten.slice(0, 9), att(MISSIONS[9].id, 60)]).ok).toBe(false)
    const code = verificationCode('u', 'Khan', '2026-10-20', ['a', 'b'])
    expect(code).toMatch(/^RPE-[0-9A-F]{4}-[0-9A-F]{4}$/)
    expect(verificationCode('u', ' khan ', '2026-10-20', ['a', 'b'])).toBe(code)
  })
})
