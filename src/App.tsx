import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { RegulatorKey, RegulatorParams, ProductCategory, Stage } from './data/types'
import { REGULATORS, CATEGORY_META, CATEGORY_ORDER, SHAPE_META } from './data/regulators'
import { buildStages, totalTrialMonths } from './data/stages'
import { GLOSSARY } from './data/glossary'
import ClassifyView from './wizard/ClassifyView'

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({ stages, color, selectedId, onSelect }: { stages: Stage[]; color: string; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-0">
      {stages.map((s, i) => {
        const isSelected = s.id === selectedId
        return (
          <button key={s.id} onClick={() => onSelect(s.id)} className="w-full text-left flex gap-3 group">
            <div className="flex flex-col items-center">
              <div
                key={isSelected ? `${s.id}-active` : s.id}
                className="w-4 h-4 rounded-full border-2 shrink-0 mt-1"
                style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent', animation: isSelected ? 'stagePop 0.35s ease-out' : undefined }}
              />
              {i < stages.length - 1 && <div className="w-0.5 flex-1 min-h-6" style={{ backgroundColor: 'hsl(var(--lab-line))' }} />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-mono font-bold" style={{ color: isSelected ? color : 'hsl(var(--lab-text))' }}>{s.title}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compare table
// ---------------------------------------------------------------------------

function CompareTable({ category, selectedRegulators, onSelectCell }: { category: ProductCategory; selectedRegulators: RegulatorKey[]; onSelectCell: (r: RegulatorKey, id: string) => void }) {
  const regs = REGULATORS.filter((r) => selectedRegulators.includes(r.key))
  const stagesByReg = regs.map((r) => ({ r, stages: buildStages(r, category) }))
  const maxStages = Math.max(...stagesByReg.map((s) => s.stages.length))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 text-lab-text-muted">Stage #</th>
            {regs.map((r) => (
              <th key={r.key} className="text-left p-2" style={{ color: r.color }}>{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxStages }, (_, row) => (
            <tr key={row} className="border-t border-lab-line">
              <td className="p-2 text-lab-text-muted align-top">{row + 1}</td>
              {stagesByReg.map(({ r, stages }) => {
                const stage = stages[row]
                if (!stage) return <td key={r.key} className="p-2 align-top text-lab-text-muted">—</td>
                return (
                  <td key={r.key} className="p-2 align-top">
                    <button onClick={() => onSelectCell(r.key, stage.id)} className="text-left hover:underline">
                      <span className="block text-lab-text">{stage.title}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeline & ranking (trial-shape categories only)
// ---------------------------------------------------------------------------

function TimelineRanking({ category }: { category: ProductCategory }) {
  if (CATEGORY_META[category].shape !== 'trial') return null
  const rows = REGULATORS.map((r) => ({ r, months: totalTrialMonths(r) })).filter((x): x is { r: RegulatorParams; months: number } => x.months !== null).sort((a, b) => a.months - b.months)
  const maxMonths = Math.max(...rows.map((x) => x.months))

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-text-muted">Illustrative fastest-to-slowest ranking, {CATEGORY_META[category].label} (regulatory-clock stages only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.map(({ r, months }) => {
          const pct = (months / maxMonths) * 100
          return (
            <div key={r.key} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-24 shrink-0 text-lab-text-muted truncate">{r.name}</span>
              <div className="flex-1 h-4 rounded bg-lab-panel-strong overflow-hidden">
                <div style={{ width: `${pct}%`, backgroundColor: r.color, height: '100%', animation: 'barGrowWidth 0.6s ease-out' }} />
              </div>
              <span className="w-14 shrink-0 text-lab-text text-right">{(months / 12).toFixed(1)} yrs</span>
            </div>
          )
        })}
        <p className="text-xs text-lab-text-muted mt-2">Illustrative only — actual timelines vary widely by product and procedure (standard vs. expedited). Regulators without a comparable timeline (e.g., AMA, WHO PQ) are omitted here.</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

function DirectoryView() {
  return (
    <div className="grid gap-3">
      {REGULATORS.map((r) => (
        <Card key={r.key} className="border-2 bg-lab-panel" style={{ borderColor: r.color }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-base" style={{ color: r.color }}>{r.name} — {r.fullName}</CardTitle>
            <CardDescription className="text-lab-text-muted font-mono text-xs">{r.region}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Parent body: </span>{r.parentMinistry}</p>
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Key committees: </span>{r.keyCommittees}</p>
            <p className="text-lab-text-muted"><span className="text-lab-text font-mono text-xs">Scope note: </span>{r.notableScope}</p>
            <p className="rounded bg-lab-panel-strong p-2 text-xs text-lab-text mt-2">💡 <span className="font-mono text-lab-amber">Did you know:</span> {r.funFact}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Glossary view
// ---------------------------------------------------------------------------

function GlossaryView() {
  const [query, setQuery] = useState('')
  const filtered = GLOSSARY.filter((g) => g.term.toLowerCase().includes(query.toLowerCase()) || g.def.toLowerCase().includes(query.toLowerCase()))
  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardContent className="pt-4 space-y-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter glossary (e.g. PIP, ATMP, DSHEA, AMA)" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
        <div className="grid sm:grid-cols-2 gap-2">
          {filtered.map((g) => (
            <div key={g.term} className="text-sm">
              <span className="font-mono font-bold text-lab-text">{g.term}</span>
              <span className="block text-lab-text-muted text-xs">{g.def}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-lab-text-muted">No matching terms.</p>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Search view
// ---------------------------------------------------------------------------

interface SearchHit {
  regulator: RegulatorParams
  category: ProductCategory
  stage: Stage
}

function SearchView({ onJump }: { onJump: (r: RegulatorKey, category: ProductCategory, stageId: string) => void }) {
  const [query, setQuery] = useState('')

  const hits = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase()
    const results: SearchHit[] = []
    for (const r of REGULATORS) {
      for (const c of CATEGORY_ORDER) {
        const stages = buildStages(r, c)
        for (const s of stages) {
          const haystack = `${s.title} ${s.detail} ${s.authority ?? ''} ${s.documents.join(' ')}`.toLowerCase()
          if (haystack.includes(q)) results.push({ regulator: r, category: c, stage: s })
        }
      }
    }
    return results.slice(0, 50)
  }, [query])

  return (
    <Card className="bg-lab-panel border-lab-line">
      <CardContent className="pt-4 space-y-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every regulator × category (e.g. 'priority review', 'waiver', 'GMP')" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
        {query.trim().length >= 2 && (
          <p className="text-xs text-lab-text-muted font-mono">{hits.length}{hits.length === 50 ? '+' : ''} match{hits.length === 1 ? '' : 'es'}{hits.length === 50 ? ' (showing first 50)' : ''}</p>
        )}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hits.map((h, i) => (
            <button key={i} onClick={() => onJump(h.regulator.key, h.category, h.stage.id)} className="w-full text-left rounded border border-lab-line p-2 hover:border-lab-text-muted">
              <span className="font-mono text-xs" style={{ color: h.regulator.color }}>{h.regulator.name}</span>
              <span className="text-xs text-lab-text-muted"> · {CATEGORY_META[h.category].label} · </span>
              <span className="text-sm text-lab-text font-mono">{h.stage.title}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const REGIONS = Array.from(new Set(REGULATORS.map((r) => r.region)))

export default function App() {
  const [mode, setMode] = useState<'explore' | 'compare' | 'classify' | 'directory' | 'glossary' | 'search'>(() => (typeof location !== 'undefined' && location.hash === '#classify' ? 'classify' : 'explore'))
  const [category, setCategory] = useState<ProductCategory>('small-molecule')
  const [regulatorKey, setRegulatorKey] = useState<RegulatorKey>('FDA')
  const [selectedId, setSelectedId] = useState<string>('preclinical')
  const [compareSet, setCompareSet] = useState<RegulatorKey[]>(['FDA', 'EMA', 'CDSCO'])

  const regulator = REGULATORS.find((r) => r.key === regulatorKey)!
  const stages = useMemo(() => buildStages(regulator, category), [regulator, category])
  const stage = useMemo(() => stages.find((s) => s.id === selectedId) ?? stages[0], [stages, selectedId])
  const catMeta = CATEGORY_META[category]
  const shapeMeta = SHAPE_META[catMeta.shape]

  function selectCell(r: RegulatorKey, id: string) {
    setRegulatorKey(r)
    setSelectedId(id)
    setMode('explore')
  }

  function jumpFromSearch(r: RegulatorKey, cat: ProductCategory, stageId: string) {
    setRegulatorKey(r)
    setCategory(cat)
    setSelectedId(stageId)
    setMode('explore')
  }

  function toggleCompare(key: RegulatorKey) {
    setCompareSet((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 4) return prev
      return [...prev, key]
    })
  }

  return (
    <div className="min-h-screen bg-lab-bg text-lab-text">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-lab-text-muted">Global Regulatory Pathway Explorer</p>
          <h1 className="text-xl font-mono font-bold text-lab-text">21 regulators · 13 product categories · device classification wizard</h1>
          <p className="text-sm text-lab-text-muted">How a health product moves from discovery to approval, across every major world region and product type.</p>
        </header>

        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1">Product category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => (
              <Button key={c} onClick={() => setCategory(c)} variant="outline" size="sm" className="border-2 font-mono text-[11px] px-2 h-7" style={category === c ? { borderColor: 'hsl(var(--lab-text))', color: 'hsl(var(--lab-text))' } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}>
                {CATEGORY_META[c].label}
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-lab-panel border-lab-line">
          <CardContent className="pt-4 flex items-start gap-2">
            <span className="text-lg shrink-0" style={{ color: shapeMeta.color }} title={shapeMeta.label}>{shapeMeta.icon}</span>
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: shapeMeta.color }}>{shapeMeta.label} pathway</p>
              <p className="text-sm text-lab-text">{catMeta.note}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 flex-wrap">
          {(['explore', 'compare', 'classify', 'directory', 'glossary', 'search'] as const).map((m) => (
            <Button key={m} onClick={() => setMode(m)} variant="outline" size="sm" className="border-2 font-mono capitalize" style={mode === m ? { borderColor: 'hsl(var(--lab-text))', color: 'hsl(var(--lab-text))' } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}>
              {m === 'compare' ? 'Compare up to 4' : m === 'classify' ? 'Classify a device' : m}
            </Button>
          ))}
        </div>

        {mode === 'explore' && (
          <>
            {REGIONS.map((region) => (
              <div key={region} className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-mono text-lab-text-muted">{region}</p>
                <div className="flex flex-wrap gap-1.5">
                  {REGULATORS.filter((r) => r.region === region).map((r) => (
                    <Button
                      key={r.key}
                      onClick={() => { setRegulatorKey(r.key); setSelectedId('preclinical') }}
                      variant="outline"
                      size="sm"
                      className="border-2 font-mono text-[11px] px-2 h-7"
                      style={regulatorKey === r.key ? { borderColor: r.color, color: r.color } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}
                    >
                      {r.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div key={regulator.key} style={{ animation: 'regionFade 0.3s ease-out' }} className="space-y-2">
              <p className="text-xs font-mono text-lab-text-muted">
                {regulator.fullName} — {regulator.region}
                {regulator.confidence === 'moderate' && <span className="text-lab-amber"> · illustrative detail, general/ICH-aligned where agency-specific sourcing is thinner</span>}
              </p>
              <div className="rounded-md border border-lab-amber-soft bg-lab-panel-strong p-2.5 text-xs text-lab-text" style={{ animation: 'factReveal 0.4s ease-out' }}>
                💡 <span className="font-mono text-lab-amber">Did you know:</span> {regulator.funFact}
              </div>
            </div>

            {(category === 'device' || category === 'diagnostic') && (
              <Card className="bg-lab-panel border-2 border-lab-ema">
                <CardContent className="pt-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-lab-text">Work out the exact class of a {category === 'diagnostic' ? 'diagnostic' : 'device'} under the EU and US rules, with the route and documents.</p>
                  <Button size="sm" className="font-mono" onClick={() => setMode('classify')}>Open the classification wizard →</Button>
                </CardContent>
              </Card>
            )}

            <TimelineRanking category={category} />

            <div className="grid sm:grid-cols-[220px_1fr] gap-4">
              <Card className="bg-lab-panel border-lab-line">
                <CardContent className="pt-4">
                  <Stepper stages={stages} color={regulator.color} selectedId={stage.id} onSelect={setSelectedId} />
                </CardContent>
              </Card>

              <Card className="border-2" style={{ borderColor: regulator.color, backgroundColor: 'hsl(var(--lab-panel))' }} key={stage.id}>
                <CardHeader>
                  <CardTitle className="font-mono text-lg" style={{ color: regulator.color }}>{stage.title}</CardTitle>
                  {stage.authority && <CardDescription className="text-lab-text-muted font-mono text-xs">{stage.authority}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                  <p className="text-sm text-lab-text">{stage.detail}</p>
                  {stage.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-mono text-lab-text-muted mb-1">Key documents</p>
                      <ul className="space-y-1">
                        {stage.documents.map((d, i) => (
                          <li key={i} className="text-sm text-lab-text-muted before:content-['—'] before:mr-2">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {mode === 'compare' && (
          <>
            <div>
              <p className="text-xs font-mono text-lab-text-muted mb-1">Choose up to 4 regulators to compare</p>
              <div className="flex flex-wrap gap-1.5">
                {REGULATORS.map((r) => (
                  <Button
                    key={r.key}
                    onClick={() => toggleCompare(r.key)}
                    variant="outline"
                    size="sm"
                    className="border-2 font-mono text-[11px] px-2 h-7"
                    style={compareSet.includes(r.key) ? { borderColor: r.color, color: r.color } : { borderColor: 'hsl(var(--lab-line))', color: 'hsl(var(--lab-text-muted))' }}
                  >
                    {r.name}
                  </Button>
                ))}
              </div>
            </div>
            <Card className="bg-lab-panel border-lab-line">
              <CardContent className="pt-4">
                <CompareTable category={category} selectedRegulators={compareSet} onSelectCell={selectCell} />
                <p className="text-xs text-lab-text-muted mt-3">Click any cell to open its full detail in Explore mode.</p>
              </CardContent>
            </Card>
          </>
        )}

        {mode === 'classify' && <ClassifyView startKind={category === 'diagnostic' ? 'ivd' : category === 'device' ? 'device' : undefined} />}
        {mode === 'directory' && <DirectoryView />}
        {mode === 'glossary' && <GlossaryView />}
        {mode === 'search' && <SearchView onJump={jumpFromSearch} />}

        <p className="text-center text-xs text-lab-text-muted font-mono">Educational overview only, not regulatory or legal advice — always consult current official agency guidance for a specific product. Detail depth varies by agency based on available public documentation. Regulatory approval is separate from pricing/reimbursement (health technology assessment), which is outside this app’s scope.</p>
        <p className="text-center text-xs text-lab-text-muted font-mono">built by Khan Gulrez Shagufa Fazal Ahmed</p>
      </div>
    </div>
  )
}
