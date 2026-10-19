// Phase 0: the move from Macaly keeps the Explorer's data and pathways unchanged.
import { describe, expect, it } from 'vitest'
import { REGULATORS, CATEGORY_ORDER, CATEGORY_META } from '../src/data/regulators'
import { buildStages, totalTrialMonths } from '../src/data/stages'
import { GLOSSARY } from '../src/data/glossary'

describe('Explorer data after the move', () => {
  it('has 21 regulators with unique keys and 13 categories', () => {
    expect(REGULATORS).toHaveLength(21)
    expect(new Set(REGULATORS.map((r) => r.key)).size).toBe(21)
    expect(CATEGORY_ORDER).toHaveLength(13)
    for (const c of CATEGORY_ORDER) expect(CATEGORY_META[c]).toBeTruthy()
  })
  it('builds a pathway for every regulator and category, with GMP and variations stages', () => {
    for (const r of REGULATORS) for (const c of CATEGORY_ORDER) {
      const s = buildStages(r, c)
      expect(s.length).toBeGreaterThan(3)
      expect(s.some((x) => x.id === 'gmp')).toBe(true)
      expect(s.at(-1)!.id).toBe('variations')
      expect(new Set(s.map((x) => x.id)).size).toBe(s.length)
    }
  })
  it('keeps the device and IVD fields the wizard will link to', () => {
    for (const r of REGULATORS) { expect(r.deviceClasses).toBeTruthy(); expect(r.deviceRoute).toBeTruthy(); expect(r.ivdNote).toBeTruthy() }
  })
  it('computes trial timelines and has a glossary', () => {
    const fda = REGULATORS.find((r) => r.key === 'FDA')!
    expect(totalTrialMonths(fda)).toBe(1 + 12 + 24 + 36 + 10)
    expect(GLOSSARY.length).toBeGreaterThan(40)
  })
})
