import { EU_PACK } from './eu'
import { US_PACK } from './us'
import type { Answers } from './questions'
import type { RegionPack, RegionResult } from './types'

export const PACKS: RegionPack[] = [EU_PACK, US_PACK]

export function classifyAll(a: Answers): RegionResult[] {
  return PACKS.map((p) => p.classify(a))
}

export const MDR_CLASSES = ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III']
export const IVDR_CLASSES = ['A', 'B', 'C', 'D']
