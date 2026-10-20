// Certificate: every IMDRF lesson answered correctly and at least 10 different missions passed
// at 70% or more. The verification code is a hash of the learner, the date and the results, so a
// teacher can recompute it from the same inputs; it is not a secure credential.
import type { Attempt } from './missions'

export const PASS = 70
export const MISSIONS_NEEDED = 10

export function bestScores(attempts: Attempt[]): Record<string, number> {
  const best: Record<string, number> = {}
  for (const a of attempts) best[a.missionId] = Math.max(best[a.missionId] ?? 0, a.score)
  return best
}

export function eligibility(lessonIds: string[], lessons: Record<string, boolean>, attempts: Attempt[]) {
  const best = bestScores(attempts)
  const passed = Object.keys(best).filter((k) => best[k] >= PASS).sort()
  const lessonsDone = lessonIds.filter((id) => lessons[id])
  return { passed, lessonsDone, ok: lessonsDone.length === lessonIds.length && passed.length >= MISSIONS_NEEDED }
}

// FNV-1a, 32 bit, as 8 hex characters grouped 4-4.
export function verificationCode(userId: string, name: string, date: string, passed: string[]): string {
  let h = 0x811c9dc5
  for (const ch of [userId, name.trim().toLowerCase(), date, ...passed].join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  const hex = h.toString(16).toUpperCase().padStart(8, '0')
  return `RPE-${hex.slice(0, 4)}-${hex.slice(4)}`
}
