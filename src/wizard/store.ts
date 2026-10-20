// Browser storage for device profiles and mission attempts. Every record carries userId and
// classId so classroom mode can be added later without a migration.
import type { Answers } from './questions'
import type { Attempt } from './missions'

export interface DeviceProfile { id: string; userId: string; classId: string | null; name: string; answers: Answers; savedAt: string }

const get = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }

export function userId(): string {
  let id = get<string | null>('rpe_user', null)
  if (!id) { id = `u-${Math.random().toString(36).slice(2, 10)}`; set('rpe_user', id) }
  return id
}
export const classId = (): string | null => get<string | null>('rpe_class', null)

export const loadProfiles = () => get<DeviceProfile[]>('rpe_profiles', [])
export function saveProfile(name: string, answers: Answers): DeviceProfile {
  const p: DeviceProfile = { id: `d-${Date.now()}`, userId: userId(), classId: classId(), name, answers, savedAt: new Date().toISOString() }
  set('rpe_profiles', [p, ...loadProfiles()].slice(0, 50))
  return p
}
export function deleteProfile(id: string) { set('rpe_profiles', loadProfiles().filter((p) => p.id !== id)) }

export const loadAttempts = () => get<Attempt[]>('rpe_attempts', [])
export function saveAttempt(a: Omit<Attempt, 'userId' | 'classId' | 'at'>): Attempt {
  const full: Attempt = { ...a, userId: userId(), classId: classId(), at: new Date().toISOString() }
  set('rpe_attempts', [full, ...loadAttempts()].slice(0, 200))
  return full
}

// Lessons answered correctly, for the certificate.
export const loadLessons = () => get<Record<string, boolean>>('rpe_lessons', {})
export function saveLesson(id: string, correct: boolean) { set('rpe_lessons', { ...loadLessons(), [id]: correct || !!loadLessons()[id] }) }
