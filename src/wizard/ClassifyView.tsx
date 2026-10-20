import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { visibleQuestions, isAnswered, type Answers, type Question } from './questions'
import { US_OPTIONS } from './us'
import { classifyAll, PACKS, MDR_CLASSES, IVDR_CLASSES, IN_CLASSES } from './engine'
import { LIBRARY, type LibraryDevice } from './library'
import { MISSIONS, scoreMission, usRouteKey, type Level, type Task } from './missions'
import { loadAttempts, saveAttempt, loadProfiles, saveProfile, deleteProfile, loadLessons, saveLesson, userId } from './store'
import { eligibility, verificationCode, PASS, MISSIONS_NEEDED } from './cert'
import type { RegionResult } from './types'
import { LESSONS } from './learn'

const REGION_COLOR: Record<string, string> = { EU: 'hsl(258 70% 65%)', US: 'hsl(208 85% 58%)', IN: 'hsl(30 80% 55%)', UK: 'hsl(220 70% 60%)', CA: 'hsl(0 70% 62%)', AU: 'hsl(152 55% 48%)', JP: 'hsl(340 65% 60%)', CN: 'hsl(38 92% 55%)', CH: 'hsl(0 65% 55%)' }
const classLabel = (c: string) => (/^Class |^[IVX]+[a-z]*$|^[ABCD]$/.test(c) ? `Class ${c.replace(/^Class /, '')}` : c)
const chip = (on: boolean, color = 'hsl(var(--lab-text))') => (on ? { borderColor: color, color } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' })

function download(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------------- results
function ResultCard({ r, hidden }: { r: RegionResult; hidden?: boolean }) {
  const pack = PACKS.find((p) => p.id === r.region)!
  const color = REGION_COLOR[r.region]
  return (
    <Card className="border-2 bg-lab-panel gap-3" style={{ borderColor: color }}>
      <CardHeader className="pb-0">
        <CardDescription className="font-mono text-[11px] text-lab-text-muted">{pack.name} · {r.regulation}</CardDescription>
        <CardTitle className="font-mono text-lg" style={{ color }}>{hidden ? 'Class hidden until you check' : r.incomplete ? 'Not enough answers yet' : classLabel(r.cls)}{!hidden && !r.incomplete && pack.basis === 'estimate' && <span className="text-[10px] font-mono text-lab-amber align-middle"> estimate</span>}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {r.incomplete && <p className="text-lab-text-muted">{r.incomplete}</p>}
        {!hidden && r.hits.length > 0 && (
          <div>
            <p className="text-xs font-mono text-lab-text-muted mb-1">Rules applied</p>
            <ul className="space-y-1.5">
              {r.hits.map((h, i) => (
                <li key={i} className="rounded border p-2 text-xs" style={{ borderColor: h === r.decisive ? color : 'hsl(var(--lab-line))' }}>
                  <span className="font-mono font-bold text-lab-text">{h.rule} → {h.cls}</span>{h === r.decisive && r.hits.length > 1 && <span className="font-mono" style={{ color }}> · decides the class</span>}
                  <span className="block text-lab-text-muted mt-0.5">{h.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!hidden && !r.incomplete && (
          <>
            {r.facts && r.facts.length > 0 && (
              <dl className="space-y-1.5 text-xs rounded border border-lab-line p-2">
                {r.facts.map((f, i) => <div key={i}><dt className="font-mono text-lab-text-muted">{f.label}</dt><dd className="text-lab-text">{f.value}</dd></div>)}
              </dl>
            )}
            <div>
              <p className="text-xs font-mono text-lab-text-muted">Route</p>
              <p className="text-lab-text">{r.route}</p>
              <p className="text-xs text-lab-text-muted mt-0.5">Reviewed by: {r.reviewer}</p>
            </div>
            {r.steps.length > 0 && (
              <ol className="space-y-1 list-decimal pl-5 text-xs text-lab-text">
                {r.steps.map((s, i) => <li key={i}><span className="font-semibold">{s.step}.</span> <span className="text-lab-text-muted">{s.detail}</span></li>)}
              </ol>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer font-mono text-lab-text-muted">Documents needed ({r.documents.length})</summary>
              <ul className="mt-1 space-y-0.5">{r.documents.map((d, i) => <li key={i} className="text-lab-text-muted before:content-['—'] before:mr-2">{d}</li>)}</ul>
            </details>
            <p className="rounded bg-lab-panel-strong p-2 text-xs text-lab-text">⏱ {r.timeline.label} <span className="text-lab-text-muted">({r.timeline.source})</span></p>
            {r.notes.map((n, i) => <p key={i} className="text-xs text-lab-amber">{n}</p>)}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------- wizard
function QuestionCard({ q, answers, setAnswer, onNext }: { q: Question; answers: Answers; setAnswer: (id: string, v: Answers[string]) => void; onNext: () => void }) {
  const v = answers[q.id]
  const multi = Array.isArray(v) ? (v as string[]) : []
  return (
    <Card className="bg-lab-panel border-lab-line gap-3" style={{ animation: 'fadeInUp 0.25s ease-out' }}>
      <CardHeader className="pb-0">
        <CardDescription className="font-mono text-[11px] uppercase tracking-widest text-lab-text-muted">{q.section}</CardDescription>
        <CardTitle className="text-base text-lab-text leading-snug">{q.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.type === 'bool' && (
          <div className="flex gap-2">
            {[true, false].map((b) => <Button key={String(b)} variant="outline" className="border-2 font-mono flex-1" style={chip(v === b)} onClick={() => { setAnswer(q.id, b); onNext() }}>{b ? 'Yes' : 'No'}</Button>)}
          </div>
        )}
        {q.type === 'single' && q.options!.map((o) => (
          <Button key={o.id} variant="outline" className="w-full h-auto justify-start text-left border-2 whitespace-normal py-2" style={chip(v === o.id)} onClick={() => { setAnswer(q.id, o.id); onNext() }}>{o.label}</Button>
        ))}
        {q.type === 'multi' && (
          <>
            {q.options!.map((o) => {
              const on = multi.includes(o.id)
              return <Button key={o.id} variant="outline" aria-pressed={on} className="w-full h-auto justify-start text-left border-2 whitespace-normal py-2" style={chip(on)} onClick={() => setAnswer(q.id, on ? multi.filter((x) => x !== o.id) : [...multi, o.id])}>{on ? '☑ ' : '☐ '}{o.label}</Button>
            })}
            <div className="flex gap-2">
              <Button variant="outline" className="border-2 font-mono flex-1" style={chip(Array.isArray(v) && multi.length === 0)} onClick={() => { setAnswer(q.id, []); onNext() }}>None of these</Button>
              <Button className="flex-1 font-mono" disabled={!multi.length} onClick={onNext}>Next</Button>
            </div>
          </>
        )}
        <p className="text-xs text-lab-text-muted pt-1"><span className="font-mono text-lab-text">Why we ask: </span>{q.why}</p>
        {q.term && <p className="rounded bg-lab-panel-strong p-2 text-xs text-lab-text-muted"><span className="font-mono text-lab-amber">{q.term.word}: </span>{q.term.definition} <span className="font-mono">({q.term.source})</span></p>}
      </CardContent>
    </Card>
  )
}

function Wizard({ answers, setAnswers, title }: { answers: Answers; setAnswers: (a: Answers) => void; title: string }) {
  const questions = useMemo(() => visibleQuestions(answers, US_OPTIONS), [answers])
  const firstOpen = questions.findIndex((q) => !isAnswered(q, answers))
  const [idx, setIdx] = useState(firstOpen < 0 ? questions.length : firstOpen)
  const [guessMode, setGuessMode] = useState(false)
  const [guess, setGuess] = useState<{ EU?: string; US?: string; IN?: string }>({})
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [shown, setShown] = useState<string[]>(['EU', 'US', 'IN'])
  const results = useMemo(() => classifyAll(answers), [answers])
  const done = firstOpen < 0
  const cur = questions[Math.min(idx, questions.length - 1)]

  useEffect(() => { if (idx > questions.length) setIdx(questions.length) }, [questions.length, idx])

  function setAnswer(id: string, v: Answers[string]) {
    // Changing an answer can hide later questions; drop answers to questions that are no longer shown.
    const next = { ...answers, [id]: v }
    const shown = new Set(visibleQuestions(next, US_OPTIONS).map((q) => q.id))
    for (const k of Object.keys(next)) if (!shown.has(k)) delete next[k]
    setAnswers(next); setChecked(false)
  }
  const goNext = () => setIdx((i) => {
    const qs = questions
    for (let j = i + 1; j < qs.length; j++) if (!isAnswered(qs[j], answers)) return j
    return i + 1
  })

  function exportCsv() {
    const rows = [['Region', 'Regulation', 'Class', 'Deciding rule', 'Route', 'Reviewer', 'Timeline', 'Forms and other facts']]
    for (const r of results) rows.push([r.region, r.regulation, r.cls, r.decisive?.rule ?? '', r.route, r.reviewer, r.timeline.label, (r.facts ?? []).map((f) => `${f.label}: ${f.value}`).join('; ')])
    download(`classification-${(name || title || 'device').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\nTraining use only. Not a regulatory determination.\n')
  }
  const euOpts = answers.kind === 'ivd' ? IVDR_CLASSES : answers.kind === 'software' ? ['Not a device', 'I', 'IIa', 'IIb', 'III'] : answers.kind === 'combination' ? ['III', 'Medicinal product'] : MDR_CLASSES
  const inOpts = answers.kind === 'software' ? ['Not a device', ...IN_CLASSES] : answers.kind === 'combination' ? ['D', 'New drug'] : IN_CLASSES
  const usRoutes = ['Not a device', 'Exempt: register and list', 'Traditional 510(k)', 'Special 510(k)', 'De Novo', 'Premarket approval (PMA)', 'Humanitarian Device Exemption', 'Biologics License Application (CBER)', 'NDA or BLA (CDER lead)']
  const eu = results.find((r) => r.region === 'EU')!, us = results.find((r) => r.region === 'US')!, ind = results.find((r) => r.region === 'IN')!

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-mono text-lab-text-muted">{title ? <span className="text-lab-text">{title} · </span> : null}{done ? `All ${questions.length} questions answered` : `Question ${Math.min(idx + 1, questions.length)} of ${questions.length}`}</p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="border-2 font-mono text-[11px] h-7" style={chip(guessMode, 'hsl(var(--lab-amber))')} onClick={() => { setGuessMode(!guessMode); setChecked(false) }}>Expert: guess first</Button>
          <Button size="sm" variant="outline" className="border-2 font-mono text-[11px] h-7" onClick={() => { setAnswers({}); setIdx(0); setChecked(false) }}>Start over</Button>
        </div>
      </div>

      {!done && cur && <QuestionCard q={cur} answers={answers} setAnswer={setAnswer} onNext={goNext} />}
      {!done && idx > 0 && <Button size="sm" variant="ghost" className="font-mono text-lab-text-muted" onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Previous question</Button>}

      {guessMode && done && !checked && (
        <Card className="bg-lab-panel border-2 border-lab-amber gap-3">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-lab-text">Before you see the answer: what is the EU class, the US route and the India class?</p>
            <div className="flex flex-wrap gap-1.5">{euOpts.map((c) => <Button key={c} size="sm" variant="outline" className="border-2 font-mono h-7" style={chip(guess.EU === c, REGION_COLOR.EU)} onClick={() => setGuess({ ...guess, EU: c })}>EU {c}</Button>)}</div>
            <div className="flex flex-wrap gap-1.5">{usRoutes.map((c) => <Button key={c} size="sm" variant="outline" className="border-2 font-mono h-7 text-[11px]" style={chip(guess.US === c, REGION_COLOR.US)} onClick={() => setGuess({ ...guess, US: c })}>{c}</Button>)}</div>
            <div className="flex flex-wrap gap-1.5">{inOpts.map((c) => <Button key={c} size="sm" variant="outline" className="border-2 font-mono h-7" style={chip(guess.IN === c, REGION_COLOR.IN)} onClick={() => setGuess({ ...guess, IN: c })}>India {c}</Button>)}</div>
            <Button className="font-mono" disabled={!guess.EU || !guess.US || !guess.IN} onClick={() => setChecked(true)}>Check my answer</Button>
          </CardContent>
        </Card>
      )}
      {guessMode && checked && (
        <p className="rounded border-2 border-lab-amber bg-lab-panel-strong p-2 text-sm font-mono">
          EU: {guess.EU === eu.cls ? '✓ correct' : `✗ you said ${guess.EU}, it is ${eu.cls}`} · US: {guess.US === usRouteKey(us) ? '✓ correct' : `✗ you said ${guess.US}, it is ${usRouteKey(us)}`} · India: {guess.IN === ind.cls ? '✓ correct' : `✗ you said ${guess.IN}, it is ${ind.cls}`}
        </p>
      )}

      {done && !(guessMode && !checked) && (
        <div className="overflow-x-auto rounded border border-lab-line bg-lab-panel">
          <table className="w-full text-xs">
            <thead><tr className="text-left font-mono text-lab-text-muted"><th className="p-2">Region</th><th className="p-2">Class</th><th className="p-2">Route</th><th className="p-2 hidden md:table-cell">Timeline</th></tr></thead>
            <tbody>{results.map((r) => (
              <tr key={r.region} className="border-t border-lab-line align-top">
                <td className="p-2 font-mono whitespace-nowrap"><button className="hover:underline" style={{ color: REGION_COLOR[r.region] }} onClick={() => setShown(shown.includes(r.region) ? shown.filter((x) => x !== r.region) : [...shown, r.region])}>{PACKS.find((p) => p.id === r.region)!.name}</button></td>
                <td className="p-2 font-mono text-lab-text whitespace-nowrap">{r.incomplete ? '…' : classLabel(r.cls)}{PACKS.find((p) => p.id === r.region)!.basis === 'estimate' && !r.incomplete ? ' (est.)' : ''}</td>
                <td className="p-2 text-lab-text-muted">{r.incomplete ? r.incomplete : r.route}</td>
                <td className="p-2 text-lab-text-muted hidden md:table-cell">{r.timeline.label}</td>
              </tr>
            ))}</tbody>
          </table>
          <p className="p-2 text-[10px] text-lab-text-muted">Click a region to show or hide its full card below. (est.) = the region assigns class by a product list; the pack estimates it from the rules.</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {results.filter((r) => shown.includes(r.region)).map((r) => <ResultCard key={r.region} r={r} hidden={guessMode && !checked} />)}
      </div>

      {Object.keys(answers).length > 0 && (
        <details className="rounded border border-lab-line bg-lab-panel p-3">
          <summary className="cursor-pointer font-mono text-xs text-lab-text-muted">Your answers: change any one to see how the class moves</summary>
          <ul className="mt-2 space-y-1">
            {questions.filter((q) => isAnswered(q, answers)).map((q) => {
              const v = answers[q.id]
              const label = q.type === 'bool' ? (v ? 'Yes' : 'No') : q.type === 'multi' ? ((v as string[]).map((x) => q.options!.find((o) => o.id === x)?.label).join('; ') || 'None') : q.options!.find((o) => o.id === v)?.label
              return (
                <li key={q.id} className="text-xs flex gap-2 items-start">
                  <button className="font-mono text-lab-fda shrink-0 hover:underline" onClick={() => setIdx(questions.indexOf(q))}>Change</button>
                  <span className="text-lab-text-muted">{q.text} <span className="text-lab-text">{label}</span></span>
                </li>
              )
            })}
          </ul>
        </details>
      )}

      {done && (
        <div className="flex flex-wrap gap-2 items-center">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this device profile" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono max-w-xs" />
          <Button variant="outline" className="border-2 font-mono" disabled={!name.trim()} onClick={() => { saveProfile(name.trim(), answers); setName('') }}>Save profile</Button>
          <Button variant="outline" className="border-2 font-mono" onClick={exportCsv}>Download CSV</Button>
        </div>
      )}
      <p className="text-xs text-lab-text-muted">Training use only: the wizard applies the rules as written to your answers and is not a regulatory determination. {PACKS.map((p) => `${p.name} pack ${p.version}`).join(', ')}, as of {PACKS[0].asOf}.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------- library
function Library({ onOpen }: { onOpen: (d: LibraryDevice) => void }) {
  const groups = Array.from(new Set(LIBRARY.map((d) => d.group)))
  const [profiles, setProfiles] = useState(loadProfiles)
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g} className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-mono text-lab-text-muted">{g}</p>
          {LIBRARY.filter((d) => d.group === g).map((d) => (
            <Card key={d.id} className="bg-lab-panel border-lab-line gap-2 py-4">
              <CardHeader className="pb-0"><CardTitle className="font-mono text-sm text-lab-text">{d.name} <span className="text-lab-text-muted font-normal">· {d.maker} (fictional)</span></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-lab-text">{d.purpose}</p>
                <p className="text-xs text-lab-text-muted">{d.description}</p>
                <Button size="sm" variant="outline" className="border-2 font-mono h-7 text-[11px]" onClick={() => onOpen(d)}>Open in the wizard</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-mono text-lab-text-muted">Your saved profiles</p>
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <button className="font-mono text-lab-fda hover:underline" onClick={() => onOpen({ id: p.id, name: p.name, maker: 'You', group: 'Non-invasive', purpose: '', description: '', answers: p.answers, expect: { EU: '', US: '', IN: '' } })}>{p.name}</button>
              <span className="text-xs text-lab-text-muted">{new Date(p.savedAt).toLocaleDateString()}</span>
              <button className="text-xs text-lab-red" onClick={() => { deleteProfile(p.id); setProfiles(loadProfiles()) }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------- missions
function MissionPlay({ missionId, level, onExit }: { missionId: string; level: Level; onExit: () => void }) {
  const mission = MISSIONS.find((m) => m.id === missionId)!
  const tasks = useMemo<Task[]>(() => mission.tasks(), [mission])
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [i, setI] = useState(0)
  const [start] = useState(() => Date.now())
  const [result, setResult] = useState<ReturnType<typeof scoreMission> & { seconds: number } | null>(null)
  const t = tasks[i]
  const dev = LIBRARY.find((d) => d.id === t?.deviceId)

  function finish() {
    const s = scoreMission(tasks, picks); const seconds = Math.round((Date.now() - start) / 1000)
    saveAttempt({ missionId, level, score: s.score, correct: s.correct, total: s.total, seconds })
    setResult({ ...s, seconds })
  }

  if (result) {
    return (
      <div className="space-y-3">
        <Card className="bg-lab-panel border-2 border-lab-cdsco gap-2"><CardContent className="pt-4"><p className="font-mono text-lg text-lab-cdsco">{result.score}% · {result.correct} of {result.total} correct · {result.seconds} s</p><p className="text-xs text-lab-text-muted">Level: {level}</p></CardContent></Card>
        {tasks.map((x) => (
          <div key={x.id} className="rounded border p-2 text-sm" style={{ borderColor: picks[x.id] === x.answer ? 'hsl(var(--lab-cdsco))' : 'hsl(var(--lab-red))' }}>
            <p className="text-lab-text">{x.prompt}</p>
            <p className="text-xs font-mono">{picks[x.id] === x.answer ? <span className="text-lab-cdsco">✓ {x.answer}</span> : <span className="text-lab-red">✗ you said {picks[x.id] ?? 'nothing'}; answer: {x.answer}</span>}</p>
            <p className="text-xs text-lab-text-muted mt-1">{x.explain}</p>
          </div>
        ))}
        <Button className="font-mono" onClick={onExit}>Back to missions</Button>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-lab-text-muted">{mission.title} · task {i + 1} of {tasks.length} · {level}</p>
      {dev && level !== 'expert' && (
        <Card className="bg-lab-panel border-lab-line gap-1 py-3"><CardContent><p className="text-sm text-lab-text"><span className="font-mono">{dev.name}</span>: {dev.purpose}</p><p className="text-xs text-lab-text-muted">{dev.description}</p></CardContent></Card>
      )}
      <Card className="bg-lab-panel border-lab-line gap-3">
        <CardHeader className="pb-0"><CardTitle className="text-base text-lab-text">{t.prompt}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {t.options.map((o) => <Button key={o} variant="outline" className="w-full h-auto justify-start text-left border-2 whitespace-normal py-2 font-mono" style={chip(picks[t.id] === o)} onClick={() => setPicks({ ...picks, [t.id]: o })}>{o}</Button>)}
          {level === 'guided' && <p className="text-xs text-lab-amber">Hint: {t.hint}</p>}
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" className="border-2 font-mono" onClick={() => setI(i - 1)}>Back</Button>}
            {i < tasks.length - 1 ? <Button className="font-mono flex-1" disabled={!picks[t.id]} onClick={() => setI(i + 1)}>Next</Button> : <Button className="font-mono flex-1" disabled={!picks[t.id]} onClick={finish}>Finish and score</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Missions() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [level, setLevel] = useState<Level>('guided')
  const attempts = loadAttempts()
  if (playing) return <MissionPlay missionId={playing} level={level} onExit={() => setPlaying(null)} />
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-xs font-mono text-lab-text-muted">Level:</span>
        {(['guided', 'standard', 'expert'] as Level[]).map((l) => <Button key={l} size="sm" variant="outline" className="border-2 font-mono h-7 text-[11px] capitalize" style={chip(level === l)} onClick={() => setLevel(l)}>{l}</Button>)}
        <span className="text-xs text-lab-text-muted">Guided shows hints; expert hides the device description.</span>
      </div>
      {MISSIONS.map((m) => {
        const best = attempts.filter((a) => a.missionId === m.id).reduce((x, a) => Math.max(x, a.score), -1)
        return (
          <Card key={m.id} className="bg-lab-panel border-lab-line gap-2 py-4">
            <CardHeader className="pb-0"><CardTitle className="font-mono text-sm text-lab-text">{m.title}{best >= 0 && <span className="text-lab-cdsco font-normal"> · best {best}%</span>}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-lab-text-muted">{m.brief}</p>
              <Button size="sm" className="font-mono" onClick={() => setPlaying(m.id)}>Start mission</Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------- learn
function Learn() {
  const [open, setOpen] = useState<string | null>(LESSONS[0].id)
  const [picks, setPicks] = useState<Record<string, string>>({})
  return (
    <div className="space-y-3">
      <p className="text-sm text-lab-text-muted">The IMDRF ideas behind most of the region packs. Each lesson ends with one check.</p>
      {LESSONS.map((l, i) => {
        const pick = picks[l.id]
        return (
          <Card key={l.id} className="bg-lab-panel border-lab-line gap-2 py-4">
            <CardHeader className="pb-0">
              <button className="text-left" onClick={() => setOpen(open === l.id ? null : l.id)}><CardTitle className="font-mono text-sm text-lab-text">{i + 1}. {l.title}{pick === l.check.answer && <span className="text-lab-cdsco font-normal"> · ✓</span>}</CardTitle></button>
            </CardHeader>
            {open === l.id && (
              <CardContent className="space-y-2">
                {l.body.map((b, k) => <p key={k} className="text-sm text-lab-text">{b}</p>)}
                <p className="text-xs font-mono text-lab-text-muted">Source: {l.source}</p>
                <p className="text-sm text-lab-text pt-1">{l.check.prompt}</p>
                {l.check.options.map((o) => <Button key={o} variant="outline" className="w-full h-auto justify-start text-left border-2 whitespace-normal py-2" style={chip(pick === o, pick === undefined ? undefined : o === l.check.answer ? 'hsl(var(--lab-cdsco))' : 'hsl(var(--lab-red))')} onClick={() => { setPicks({ ...picks, [l.id]: o }); saveLesson(l.id, o === l.check.answer) }}>{o}</Button>)}
                {pick && <p className="text-xs text-lab-text-muted">{pick === l.check.answer ? '✓ ' : '✗ '}{l.check.explain}</p>}
                {pick && i < LESSONS.length - 1 && <Button size="sm" className="font-mono" onClick={() => setOpen(LESSONS[i + 1].id)}>Next lesson</Button>}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------- certificate
function Certificate() {
  const [name, setName] = useState('')
  const e = eligibility(LESSONS.map((l) => l.id), loadLessons(), loadAttempts())
  const date = new Date().toISOString().slice(0, 10)
  const code = verificationCode(userId(), name, date, e.passed)
  return (
    <div className="space-y-3">
      <Card className="bg-lab-panel border-lab-line gap-2 py-4"><CardContent className="space-y-1 text-sm">
        <p className="text-lab-text">To earn the certificate: answer all {LESSONS.length} IMDRF lessons correctly, and pass at least {MISSIONS_NEEDED} different missions with {PASS}% or more.</p>
        <p className="font-mono text-xs text-lab-text-muted">Lessons: {e.lessonsDone.length} of {LESSONS.length} · Missions passed: {e.passed.length} of {MISSIONS_NEEDED} ({MISSIONS.length} available)</p>
      </CardContent></Card>
      {e.ok ? (
        <>
          <Input value={name} onChange={(x) => setName(x.target.value)} placeholder="Your name as it should appear" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono max-w-sm" />
          {name.trim() && (
            <div className="rounded border-4 border-double border-lab-cdsco bg-lab-panel p-6 text-center space-y-2 print:bg-white print:text-black">
              <p className="font-mono text-xs uppercase tracking-widest text-lab-text-muted">Certificate of completion · training only</p>
              <p className="text-xl text-lab-text">{name.trim()}</p>
              <p className="text-sm text-lab-text">has completed the Device and IVD Classification Wizard: {LESSONS.length} IMDRF lessons and {e.passed.length} missions across nine regions.</p>
              <p className="font-mono text-xs text-lab-text-muted">{date} · Verification code {code}</p>
              <p className="text-[10px] text-lab-text-muted">Educational practice with fictional devices; not a professional qualification. Built by Khan Gulrez Shagufa Fazal Ahmed.</p>
            </div>
          )}
          {name.trim() && <Button variant="outline" className="border-2 font-mono" onClick={() => window.print()}>Print or save as PDF</Button>}
        </>
      ) : <p className="text-sm text-lab-amber">Not yet: keep going in Learn and Missions.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------------- view
export default function ClassifyView({ startKind }: { startKind?: 'device' | 'ivd' }) {
  const [tab, setTab] = useState<'wizard' | 'library' | 'missions' | 'learn' | 'certificate'>('wizard')
  const [answers, setAnswers] = useState<Answers>(startKind ? { kind: startKind } : {})
  const [title, setTitle] = useState('')
  const [key, setKey] = useState(0)
  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel border-lab-line gap-2 py-4">
        <CardContent>
          <p className="text-sm text-lab-text">Describe a device, an IVD, software or a medicine-device combination once and see how nine regions classify it (the EU, the US, India, the UK, Canada, Australia, Japan, China and Switzerland), which rule decides, the route or licence, the documents and an indicative timeline.</p>
          <p className="text-xs text-lab-text-muted mt-1">Japan and China assign classes by product list; their results are estimates from the rules and are marked as such.</p>
        </CardContent>
      </Card>
      <div className="flex gap-2 flex-wrap">
        {(['wizard', 'library', 'missions', 'learn', 'certificate'] as const).map((t) => <Button key={t} variant="outline" size="sm" className="border-2 font-mono capitalize" style={chip(tab === t)} onClick={() => setTab(t)}>{t === 'library' ? 'Device library' : t === 'learn' ? 'Learn (IMDRF)' : t}</Button>)}
      </div>
      {tab === 'wizard' && <Wizard key={key} answers={answers} setAnswers={setAnswers} title={title} />}
      {tab === 'library' && <Library onOpen={(d) => { setAnswers(d.answers); setTitle(d.name); setKey((k) => k + 1); setTab('wizard') }} />}
      {tab === 'missions' && <Missions />}
      {tab === 'learn' && <Learn />}
      {tab === 'certificate' && <Certificate />}
    </div>
  )
}
