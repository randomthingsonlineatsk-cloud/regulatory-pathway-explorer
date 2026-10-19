import { EU_PACK } from './eu'
import { US_PACK } from './us'
import { IN_PACK } from './in'
import type { Answers } from './questions'
import type { RegionPack, RegionResult } from './types'

export const PACKS: RegionPack[] = [EU_PACK, US_PACK, IN_PACK]

export function classifyAll(a: Answers): RegionResult[] {
  return PACKS.map((p) => p.classify(a))
}

export const MDR_CLASSES = ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III']
export const IVDR_CLASSES = ['A', 'B', 'C', 'D']
export const IN_CLASSES = ['A', 'B', 'C', 'D']
