// Software and combination-product helpers shared by the region packs.
import type { Answers } from './questions'
import type { RegionResult } from './types'

// IMDRF/SaMD WG/N12 FINAL:2014, section 7.2: category by the state of the healthcare situation
// and the significance of the information. A teaching aid: it is not itself a legal class.
const N12: Record<string, Record<string, 'I' | 'II' | 'III' | 'IV'>> = {
  critical: { treat_diagnose: 'IV', drive: 'III', inform: 'II' },
  serious: { treat_diagnose: 'III', drive: 'II', inform: 'I' },
  non_serious: { treat_diagnose: 'II', drive: 'I', inform: 'I' },
}
export function n12Category(a: Answers): 'I' | 'II' | 'III' | 'IV' | undefined {
  if (a.kind !== 'software' || a.sw_purpose !== 'clinical') return undefined
  return N12[a.sw_situation as string]?.[a.sw_significance as string]
}
export const N12_TEXT: Record<string, string> = {
  IV: 'Category IV: treats or diagnoses in a critical situation. The highest impact.',
  III: 'Category III: treats or diagnoses in a serious situation, or drives management in a critical one.',
  II: 'Category II: treats or diagnoses in a non-serious situation, drives management in a serious one, or informs it in a critical one.',
  I: 'Category I: informs management, or drives it in a non-serious situation. The lowest impact.',
}

export const notDevice = (region: RegionResult['region'], regulation: string, cls: string, reason: string, notes: string[] = []): RegionResult => ({
  region, regulation, cls, hits: [{ rule: regulation, cls, text: reason }], decisive: { rule: regulation, cls, text: reason },
  route: 'Not regulated as a medical device', reviewer: 'No device review', steps: [], documents: [], timeline: { label: 'No premarket review as a device.', source: regulation }, notes,
})

// Change control for software that is retrained or learns after release.
export function changeControl(region: RegionResult['region'], a: Answers): { label: string; value: string }[] {
  if (a.kind !== 'software' || a.sw_learns !== 'adaptive') return []
  if (region === 'US') return [{ label: 'AI change control', value: 'A predetermined change control plan (PCCP, FD&C Act section 515C) authorised with the device lets planned model changes ship without a new submission, if they follow the plan’s modification protocol and impact assessment (FDA final guidance on PCCPs for AI-enabled device software functions, December 2024).' }]
  if (region === 'EU') return [
    { label: 'AI change control', value: 'A significant change to the design or intended purpose needs the notified body’s approval before release (MDR Annex IX section 4.10; MDCG 2020-3). Retraining that changes performance is usually significant unless the change was assessed and agreed in advance.' },
    { label: 'Watch: EU AI Act', value: 'AI that is a safety component of a device needing a notified body is high-risk AI (Regulation (EU) 2024/1689, Article 6(1)). The obligations for AI in such products were due from 2 August 2027; the Digital Omnibus agreed in May 2026 moves them to 2 August 2028 once published.' },
  ]
  return [{ label: 'AI change control (draft)', value: 'CDSCO’s draft guidance on medical device software (October 2025) proposes an algorithm change protocol: document and validate each model update, including retraining, and inform the regulator.' }]
}
