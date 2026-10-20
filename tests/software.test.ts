// Phase 3: software and AI, combination products, IMDRF lessons and missions.
import { describe, expect, it } from 'vitest'
import { EU_PACK } from '../src/wizard/eu'
import { US_PACK } from '../src/wizard/us'
import { IN_PACK } from '../src/wizard/in'
import { n12Category } from '../src/wizard/sw'
import { usSoftwareStatus, visibleQuestions, isAnswered, type Answers } from '../src/wizard/questions'
import { US_OPTIONS } from '../src/wizard/us'
import { LESSONS } from '../src/wizard/learn'
import { MISSIONS, scoreMission } from '../src/wizard/missions'

const sw: Answers = { kind: 'software', sw_purpose: 'clinical', sw_input: 'medical_info', sw_significance: 'inform', sw_situation: 'serious', sw_impact: 'other', sw_monitor: 'none', sw_user: 'hcp', sw_review: true, sw_learns: 'locked', in_activity: 'manufacture', in_predicate: true }

describe('IMDRF N12', () => {
  it('the matrix', () => {
    const c = (sw_situation: string, sw_significance: string) => n12Category({ ...sw, sw_situation, sw_significance })
    expect([c('critical', 'treat_diagnose'), c('critical', 'drive'), c('critical', 'inform')]).toEqual(['IV', 'III', 'II'])
    expect([c('serious', 'treat_diagnose'), c('serious', 'drive'), c('serious', 'inform')]).toEqual(['III', 'II', 'I'])
    expect([c('non_serious', 'treat_diagnose'), c('non_serious', 'drive'), c('non_serious', 'inform')]).toEqual(['II', 'I', 'I'])
  })
})

describe('EU rule 11', () => {
  it('decisions and monitoring; the highest applies', () => {
    expect(EU_PACK.classify({ ...sw, sw_impact: 'other' }).cls).toBe('IIa')
    expect(EU_PACK.classify({ ...sw, sw_impact: 'serious' }).cls).toBe('IIb')
    expect(EU_PACK.classify({ ...sw, sw_impact: 'death' }).cls).toBe('III')
    expect(EU_PACK.classify({ ...sw, sw_monitor: 'vital_danger' }).cls).toBe('IIb')
    expect(EU_PACK.classify({ ...sw, sw_purpose: 'wellness' }).cls).toBe('Not a device')
  })
})

describe('US: device status of software (520(o))', () => {
  it('the four CDS criteria', () => {
    expect(usSoftwareStatus(sw)).toBe('cds')
    expect(usSoftwareStatus({ ...sw, sw_input: 'image_signal' })).toBe('device')
    expect(usSoftwareStatus({ ...sw, sw_user: 'patient' })).toBe('device')
    expect(usSoftwareStatus({ ...sw, sw_significance: 'treat_diagnose' })).toBe('device')
    expect(usSoftwareStatus({ ...sw, sw_review: false })).toBe('device')
    expect(usSoftwareStatus({ ...sw, sw_purpose: 'admin' })).toBe('admin')
    expect(US_PACK.classify(sw).cls).toBe('Not a device (CDS)')
    expect(US_PACK.classify({ ...sw, sw_purpose: 'wellness' }).decisive!.rule).toBe('FD&C Act section 520(o)(1)(B)')
  })
  it('a device needs a device type; the CDS question only shows when it matters', () => {
    const a = { ...sw, sw_input: 'image_signal' }
    const ids = visibleQuestions(a, US_OPTIONS).map((q) => q.id)
    expect(ids).toContain('us_type'); expect(ids).not.toContain('sw_review')
    expect(visibleQuestions(sw, US_OPTIONS).map((q) => q.id)).not.toContain('us_type')
  })
  it('adaptive AI adds change control in every region, with the AI Act as Watch', () => {
    const a = { ...sw, sw_input: 'image_signal', sw_learns: 'adaptive', us_type: 'cadt', us_predicate: true, us_own_change: false }
    expect(US_PACK.classify(a).facts!.some((f) => /515C/.test(f.value))).toBe(true)
    expect(EU_PACK.classify(a).facts!.some((f) => f.label === 'Watch: EU AI Act')).toBe(true)
    expect(IN_PACK.classify(a).facts!.some((f) => /algorithm change protocol/.test(f.value))).toBe(true)
  })
})

describe('India: draft software classes', () => {
  it('N12 category IV to class D, down to I to class A', () => {
    expect(IN_PACK.classify({ ...sw, sw_situation: 'critical', sw_significance: 'treat_diagnose' }).cls).toBe('D')
    expect(IN_PACK.classify({ ...sw, sw_situation: 'critical', sw_significance: 'drive' }).cls).toBe('C')
    expect(IN_PACK.classify(sw).cls).toBe('A')
    expect(IN_PACK.classify(sw).notes[0]).toMatch(/Draft guidance/)
  })
})

describe('combination products', () => {
  const c: Answers = { kind: 'combination', combo_pmoa: 'device', combo_form: 'single', combo_implant: true, combo_heart: false, in_activity: 'import' }
  it('device-led: EU rule 14 class III with a 210-day consultation, US CDRH lead, India class D', () => {
    expect(EU_PACK.classify(c).cls).toBe('III')
    expect(EU_PACK.classify(c).steps.some((s) => /210 days/.test(s.detail))).toBe(true)
    expect(US_PACK.classify(c).facts!.find((f) => f.label === 'Lead')!.value).toBe('CDRH')
    expect(IN_PACK.classify(c).cls).toBe('D')
  })
  it('drug-led integral: EU medicine with an Article 117 opinion; US CDER lead; India new drug', () => {
    const d = { ...c, combo_pmoa: 'drug' }
    expect(EU_PACK.classify(d).steps[0].detail).toMatch(/Article 117/)
    expect(US_PACK.classify(d).route).toMatch(/CDER lead/)
    expect(IN_PACK.classify(d).cls).toBe('New drug')
    expect(EU_PACK.classify({ ...d, combo_form: 'copackaged' }).route).toMatch(/CE-marked on its own/)
  })
  it('no unanswered questions for a complete combination', () => {
    expect(visibleQuestions(c, US_OPTIONS).filter((q) => !isAnswered(q, c)).map((q) => q.id)).toEqual([])
  })
})

describe('Phase 3 lessons and missions', () => {
  it('five IMDRF lessons; four new missions that score 100 with the right answers', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['ghtf', 'ep', 'mdsap', 'n12', 'n81'])
    for (const l of LESSONS) expect(l.check.options).toContain(l.check.answer)
    for (const id of ['is-it-device', 'rule-11', 'ai-change', 'combo-lead']) {
      const m = MISSIONS.find((x) => x.id === id)!
      const tasks = m.tasks()
      for (const t of tasks) expect(t.options, `${id}/${t.id}`).toContain(t.answer)
      expect(scoreMission(tasks, Object.fromEntries(tasks.map((t) => [t.id, t.answer]))).score).toBe(100)
    }
  })
})
