import type { Answers } from './questions'

export interface RuleHit {
  rule: string        // "Rule 8", "Rule 1", "21 CFR 880.5725"
  cls: string         // class this rule gives
  text: string        // plain-words statement of the rule part that applied
}

export type RegionId = 'EU' | 'US' | 'IN'

export interface RouteStep { step: string; detail: string }

export interface RegionResult {
  region: RegionId
  regulation: string
  cls: string                 // final class, e.g. "IIb", "Is", "C", "Class II"
  hits: RuleHit[]             // every rule that applied
  decisive?: RuleHit          // the rule that set the final class
  route: string               // conformity assessment or premarket route
  reviewer: string            // who reviews
  steps: RouteStep[]          // route, in order
  documents: string[]         // documents needed
  timeline: { label: string; source: string }
  notes: string[]
  facts?: { label: string; value: string }[]   // region-specific extras: licence forms, CLIA category
  incomplete?: string         // why a class cannot be given yet
}

export interface RegionPack {
  id: RegionId
  name: string
  regulator: string           // Explorer regulator key (links back to the regulator card)
  version: string
  asOf: string
  classify: (a: Answers) => RegionResult
}
