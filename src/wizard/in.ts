// India pack: Medical Devices Rules, 2017 (G.S.R. 78(E)). Classes A to D under the First
// Schedule (Part I for devices, Part II for IVDs), and the licence that each class needs: the
// application and licence forms, the licensing authority and the time limits in the Rules.
// The First Schedule follows the GHTF rules, so its wording differs from the EU MDR in places
// (transient orifice devices, breast implants, near-patient glucose tests, for example).
// Rule wording is paraphrased. CDSCO's published classification lists by product prevail for
// a listed device.
import type { Answers } from './questions'
import type { RegionPack, RegionResult, RuleHit, RouteStep } from './types'

const ORDER = ['A', 'B', 'C', 'D']
const pick = (a: Answers, q: string): string[] => (Array.isArray(a[q]) ? (a[q] as string[]) : [])
const highest = (hits: RuleHit[]) => hits.reduce<RuleHit | undefined>((m, h) => (!m || ORDER.indexOf(h.cls) > ORDER.indexOf(m.cls) ? h : m), undefined)
const P1 = 'First Schedule Part I'
const P2 = 'First Schedule Part II'

export function inDeviceHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (rule: string, cls: string, text: string) => hits.push({ rule: `${P1}: ${rule}`, cls, text })
  if (a.active === undefined || !a.invasive) return { hits, missing: 'Say whether the device is active and how it contacts the body.' }
  const inv = a.invasive as string
  const dur = a.duration as string | undefined
  const special = pick(a, 'special')

  if (inv === 'non' && !a.active) {
    if (a.noninv === 'skin') {
      if (a.r4 === 'barrier') add('non-invasive, injured skin', 'A', 'Devices in contact with injured skin used as a mechanical barrier, for compression or to absorb exudate are class A.')
      else if (a.r4 === 'dermis') add('non-invasive, injured skin', 'C', 'Devices for wounds that have breached the dermis and can heal only by secondary intent are class C.')
      else if (a.r4) add('non-invasive, injured skin', 'B', 'Other devices in contact with injured skin, including those that manage its micro-environment, are class B.')
    } else if (a.noninv === 'channel') {
      if (a.r2 === 'blood_bag') add('non-invasive, channelling or storing', 'C', 'A blood bag that does not incorporate a medicinal product is class C.')
      else if (a.r2 === 'blood_organs') add('non-invasive, channelling or storing', 'B', 'Devices channelling blood, or storing or channelling other body liquids, or storing organs, are class B.')
      else if (a.r2 === 'connect_active') add('non-invasive, channelling or storing', 'B', 'Channelling or storing devices that may be connected to an active device of class B, C or D are class B.')
      else if (a.r2 === 'other') add('non-invasive, channelling or storing', 'A', 'Other non-invasive devices for channelling or storing liquids or gases for later administration are class A.')
    } else if (a.noninv === 'modify') {
      if (a.r3 === 'physical') add('non-invasive, modifying composition', 'B', 'Modification only by filtration, centrifugation or exchange of gas or heat is class B.')
      else if (a.r3) add('non-invasive, modifying composition', 'C', 'Non-invasive devices modifying the biological or chemical composition of blood, body liquids or other liquids for administration are class C.')
    } else if (a.noninv === 'other') add('other non-invasive devices', 'A', 'All other non-invasive devices are class A.')
  } else if (inv === 'non') add('other non-invasive devices', 'A', 'Non-invasive devices are class A unless another rule applies.')

  if (inv === 'orifice') {
    if (!dur) return { hits, missing: 'Give the duration of use.' }
    const cavity = a.orifice_site === 'oral_ear_nasal' && a.absorbed_mucosa === false
    if (dur === 'transient') {
      if (a.orifice_transient_flag === undefined) return { hits, missing: 'Say whether it is used on the eye or absorbed by the mucous membrane.' }
      add('body orifice, transient use', a.orifice_transient_flag ? 'B' : 'A', a.orifice_transient_flag ? 'Transient orifice devices used on the external surface of the eyeball, or liable to be absorbed by the mucous membrane, are class B.' : 'Transient-use devices invasive through a body orifice are class A.')
    } else if (dur === 'short') add('body orifice, short-term use', cavity ? 'A' : 'B', cavity ? 'Short-term orifice devices in the oral cavity as far as the pharynx, an ear canal up to the eardrum or the nasal cavity, not liable to be absorbed by the mucous membrane, are class A.' : 'Short-term devices invasive through a body orifice are class B.')
    else add('body orifice, long-term use', cavity ? 'B' : 'C', cavity ? 'Long-term orifice devices in the oral cavity, ear canal or nasal cavity, not liable to be absorbed by the mucous membrane, are class B.' : 'Long-term devices invasive through a body orifice are class C.')
    if (a.connect_active === true) add('body orifice, connected to an active device', 'B', 'Orifice devices intended for connection to an active device of class B, C or D are class B, whatever the duration.')
  }

  if (inv === 'surgical' && dur !== 'long') {
    if (!dur) return { hits, missing: 'Give the duration of use.' }
    const s = pick(a, 'surg')
    const r = dur === 'transient' ? 'surgically invasive, transient use' : 'surgically invasive, short-term use'
    let any = false
    if (s.includes('heart_defect') || s.includes('heart_cns')) { add(r, 'D', 'Devices for direct contact with the heart, the central circulatory system or the central nervous system, including those that control, diagnose, monitor or correct a defect of the heart or central circulation, are class D.'); any = true }
    if (s.includes('reusable') && dur === 'transient') { add(r, 'A', 'Reusable surgical instruments are class A.'); any = true }
    if (s.includes('ionizing')) { add(r, 'C', 'Devices supplying energy as ionising radiation are class C.'); any = true }
    if (s.includes('biological')) { add(r, dur === 'transient' ? 'C' : 'D', dur === 'transient' ? 'Transient devices with a biological effect, or wholly or mainly absorbed, are class C.' : 'Short-term devices with a biological effect, or wholly or mainly absorbed, are class D.'); any = true }
    if (s.includes('chemical') && dur === 'short') { add(r, 'C', 'Short-term devices that undergo chemical change in the body (except in the teeth) are class C.'); any = true }
    if (s.includes('medicine')) { add(r, 'C', 'Devices administering medicines in a potentially hazardous manner are class C.'); any = true }
    if (!any) add(r, 'B', `Surgically invasive devices for ${dur === 'transient' ? 'transient' : 'short-term'} use are class B.`)
  }

  if (inv === 'implant' || (inv === 'surgical' && dur === 'long')) {
    const s = pick(a, 'impl')
    const r = 'implantable and long-term surgically invasive'
    let any = false
    if (s.includes('teeth')) { add(r, 'B', 'Those placed in the teeth are class B.'); any = true }
    const d: [string, string][] = [['heart_cns', 'in direct contact with the heart, the central circulatory system or the central nervous system'], ['life_support', 'life-supporting or life-sustaining'], ['active_implant', 'active'], ['biological', 'with a biological effect, or wholly or mainly absorbed'], ['chemical_medicine', 'undergoing chemical change in the body or administering medicines'], ['breast', 'a breast implant']]
    for (const [k, t] of d) if (s.includes(k)) { add(r, 'D', `Implants and long-term surgically invasive devices ${t.startsWith('a ') ? 'that are ' : ''}${t} are class D.`); any = true }
    if (!any) add(r, 'C', 'Implantable and long-term surgically invasive devices are class C unless an exception applies.' + (s.includes('mesh') || s.includes('joint') || s.includes('spine') ? ' India has no separate rule for surgical meshes, joint replacements or spinal implants.' : ''))
  }

  if (a.active === true && inv !== 'implant') {
    if (a.active_fn === 'therapy') {
      const s = pick(a, 'r9')
      const hazardous = s.includes('hazardous') || s.includes('ionizing')
      add('active therapeutic devices', hazardous ? 'C' : 'B', hazardous ? 'Active therapeutic devices that may exchange energy in a potentially hazardous way, including ionising radiation, are class C.' : 'Active therapeutic devices that give or exchange energy are class B.')
      if (s.includes('controls_iib') || s.includes('controls_aimd')) add('active therapeutic devices', 'C', 'Active devices that control, monitor or directly influence a class C active therapeutic device are class C.')
    } else if (a.active_fn === 'diagnose') {
      const s = pick(a, 'r10')
      if (s.includes('vital_danger') || s.includes('xray')) add('active diagnostic devices', 'C', 'Monitoring vital parameters whose variation could mean immediate danger, diagnosis in immediate danger, and ionising radiation for diagnostic or interventional radiology, are class C.')
      else if (s.some((x) => ['energy', 'radiopharm', 'vital'].includes(x))) add('active diagnostic devices', 'B', 'Active diagnostic devices supplying energy absorbed by the body, imaging radiopharmaceuticals or directly diagnosing or monitoring vital processes are class B.')
      else if (s.includes('illuminate')) add('active diagnostic devices', 'A', 'Active devices that only illuminate the body with visible or near-infrared light are class A.')
      else add('other active devices', 'A', 'All other active devices are class A.')
    } else if (a.active_fn === 'administer') add('active devices administering or removing substances', a.r12_hazard === true ? 'C' : 'B', a.r12_hazard === true ? 'Administering or removing substances in a potentially hazardous way is class C.' : 'Active devices administering or removing medicines, body liquids or other substances are class B.')
    else if (a.active_fn === 'other') add('other active devices', 'A', 'All other active devices are class A.')
  }

  const longInvasive = inv === 'implant' || dur === 'long'
  if (special.includes('r14')) add('devices incorporating a medicinal product', 'D', 'Devices incorporating a substance that would be a drug on its own, with an action ancillary to the device, are class D.')
  if (special.includes('r18') && a.r18_skin !== true) add('devices incorporating animal or human cells or tissues', 'D', 'Devices made from non-viable animal or human cells or tissues, or their derivatives, are class D.')
  if (special.includes('r18') && a.r18_skin === true) add('devices incorporating animal or human cells or tissues', 'A', 'Non-viable animal tissue that touches intact skin only is class A.')
  if (special.includes('r16_sterilise') || special.includes('r16_invasive') || special.includes('r16_lens')) add('sterilisation and disinfection', 'C', 'Devices for sterilising devices, for disinfection as the end point of processing, and for disinfecting, cleaning, rinsing or hydrating contact lenses are class C.')
  if (special.includes('r16_disinfect')) add('sterilisation and disinfection', 'B', 'Devices for disinfecting devices before they are sterilised are class B.')
  if (special.includes('r15')) add('contraception and prevention of sexually transmitted diseases', longInvasive ? 'D' : 'C', longInvasive ? 'Implantable or long-term invasive devices for contraception or preventing sexually transmitted diseases are class D.' : 'Devices for contraception or preventing sexually transmitted diseases are class C.')

  if (!hits.length) return { hits, missing: 'Answer the questions for this kind of device.' }
  return { hits }
}

export function inIvdHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (para: string, cls: string, text: string) => hits.push({ rule: `${P2}, para ${para}`, cls, text })
  if (!Array.isArray(a.ivd_d) || !a.ivd_grouping || !Array.isArray(a.ivd_c) || !a.ivd_user || !a.ivd_a) return { hits, missing: 'Answer the IVD questions.' }
  const d = a.ivd_d as string[], c = a.ivd_c as string[]
  if (d.includes('blood_safety')) add('2(i)(a)', 'D', 'Tests detecting transmissible agents in blood, blood components, cells, tissues or organs, to assess whether they are suitable for transfusion or transplantation, are class D.')
  if (d.includes('life_threatening')) add('2(i)(a)', 'D', 'Tests detecting a transmissible agent that causes a life-threatening disease with a high risk of propagation are class D.')
  if (d.includes('load')) add('2(i)(b)', 'C', 'India has no class D rule for infectious load: managing patients with a life-threatening infectious disease (for example viral load) is class C.')
  if (a.ivd_grouping === 'listed') add('2(ii)', 'D', 'Blood grouping for the ABO, Rhesus, Kell, Kidd and Duffy systems is class D.')
  if (a.ivd_grouping === 'other') add('2(ii)', 'C', 'Other blood grouping and tissue typing tests are class C.')
  const cText: Record<string, string> = {
    sti: 'detecting a sexually transmitted agent', csf_blood: 'detecting an infectious agent with limited propagation in cerebrospinal fluid or blood', erroneous_death: 'detecting an infectious agent where an erroneous result could cause death or severe disability', prenatal_infection: 'prenatal screening of immune status', immune_status: 'determining infective disease or immune status where an erroneous result could lead to an imminent life-threatening situation', companion: 'selecting patients for selective therapy and management (a companion diagnostic)', staging: 'screening for disease stages', cancer: 'diagnosing cancer, or screening or staging it', genetic: 'human genetic testing', drug_level: 'monitoring levels of medicines, substances or biological components where an erroneous result could cause an immediately life-threatening situation', life_threatening_mgmt: 'managing patients with a life-threatening infectious disease', embryo: 'screening for congenital disorders in the foetus',
  }
  for (const k of c) if (cText[k]) add('2(i)(b)', 'C', `Tests for ${cText[k]} are class C.`)
  if (a.ivd_user === 'self') {
    if (a.ivd_self_b === 'listed' || a.ivd_self_b === 'not_critical') add('2(iii)', 'B', 'Self-tests whose result does not determine a medically critical status, or is preliminary and needs laboratory confirmation, are class B. India has no named list; pregnancy, fertility, cholesterol and urine strip tests are treated this way in CDSCO’s list.')
    else add('2(iii)', 'C', 'Self-tests are class C.')
  }
  if (a.ivd_user === 'near_patient' && a.ivd_np_gas_glucose === true) add('2(iv)', 'C', 'Near-patient tests for blood gas analysis or blood glucose are class C.')
  if (['lab_product', 'instrument', 'receptacle'].includes(a.ivd_a as string)) add('2(v)', 'A', 'Reagents and articles with specific characteristics intended for IVD procedures, instruments for IVD procedures and specimen receptacles are class A.')
  if (a.ivd_a === 'control') add('2(vi)', 'B', 'Controls without an assigned value are class B.')
  if (!hits.length) add('2(vi)', 'B', 'IVDs not covered by the other paragraphs are class B.')
  if (c.includes('newborn') && !c.some((k) => cText[k])) hits[hits.length - 1].text += ' Newborn screening has no separate paragraph in India.'
  return { hits }
}

// Licence forms and authorities. Time limits are those in the Rules.
function licence(cls: string, a: Answers): { route: string; reviewer: string; steps: RouteStep[]; documents: string[]; timeline: RegionResult['timeline']; notes: string[]; facts: { label: string; value: string }[] } {
  const ivd = a.kind === 'ivd'
  const imp = a.in_activity === 'import'
  const flags = Array.isArray(a.class1_flags) ? (a.class1_flags as string[]) : []
  const novel = a.in_predicate === false
  const regOnly = cls === 'A' && !ivd && !flags.includes('sterile') && !flags.includes('measuring')
  const facts: { label: string; value: string }[] = []
  const steps: RouteStep[] = []
  const docs = ['Device master file (Fourth Schedule, Appendix II)', 'Plant master file (Fourth Schedule, Appendix I)', 'Quality management system as in the Fifth Schedule (aligned with ISO 13485)', 'Essential principles checklist and the standards met', 'Labelling as in Rule 44']
  const notes: string[] = []

  if (novel) {
    steps.push(ivd
      ? { step: 'Clinical performance evaluation of the new IVD', detail: 'Application in Form MD-24; permission in Form MD-25 within 90 days (Rule 59). The evaluation starts within one year of permission.' }
      : { step: 'Clinical investigation of the investigational device', detail: 'Application in Form MD-22; permission in Form MD-23 within 90 days (Rules 51 and 52), with ethics committee approval. The first participant is enrolled within one year.' })
    steps.push(ivd
      ? { step: 'Permission to import or manufacture the new IVD', detail: 'Application in Form MD-28; permission in Form MD-29 within 90 days, extendable by 30 days (Rule 64).' }
      : { step: 'Permission to import or manufacture a device without a predicate', detail: 'Application in Form MD-26; permission in Form MD-27 within 120 days, extendable by 30 days (Rule 63).' })
    facts.push({ label: 'No predicate', value: ivd ? 'MD-24 → MD-25, then MD-28 → MD-29' : 'MD-22 → MD-23, then MD-26 → MD-27' })
  }

  let route: string, reviewer: string, timeline: RegionResult['timeline']
  if (regOnly) {
    route = 'Registration: class A non-sterile, non-measuring devices are exempt from the licence and get a registration number'
    reviewer = 'Central Licensing Authority (CDSCO online system)'
    steps.push({ step: 'Register the device', detail: 'Self-certified undertaking that the device is non-sterile and non-measuring, with the essential principles checklist, on CDSCO’s online system for medical devices. The device must be on CDSCO’s list of such class A devices.' })
    timeline = { label: 'No pre-market review: a registration number is issued online.', source: 'CDSCO, class A non-sterile and non-measuring devices (2022 amendment and CDSCO list)' }
    facts.push({ label: 'Licence', value: 'Registration number (no licence)' })
  } else if (imp) {
    route = 'Import licence (Rule 36)'
    reviewer = 'Central Licensing Authority (CDSCO), through the authorised agent in India'
    steps.push({ step: 'Appoint an authorised agent in India', detail: 'The agent holds a manufacturing or wholesale licence, and applies with a power of attorney from the overseas manufacturer.' })
    steps.push({ step: 'Apply for the import licence', detail: 'Form MD-14 on CDSCO’s online system, with the free sale certificate from the country of origin, the device and plant master files and the QMS certificate.' })
    steps.push({ step: 'Review, and inspection of the overseas site if needed', detail: 'The CLA may have the overseas manufacturing site inspected before deciding.' })
    steps.push({ step: 'Import licence granted', detail: 'Form MD-15, within nine months of the application (Rule 36). It stays valid while the retention fee is paid.' })
    docs.push('Free sale certificate from the country of origin', 'Power of attorney to the authorised agent', 'ISO 13485 certificate of the overseas site')
    timeline = { label: 'The CLA decides within nine months of the application.', source: 'Medical Devices Rules, 2017, Rule 36' }
    facts.push({ label: 'Forms', value: 'MD-14 → MD-15' }, { label: 'Authority', value: 'Central Licensing Authority' })
  } else if (cls === 'A' || cls === 'B') {
    route = `Manufacturing licence from the State Licensing Authority (Rule 20)`
    reviewer = `State Licensing Authority, with an audit by a notified body registered under the Rules`
    steps.push({ step: 'Apply for the manufacturing licence', detail: 'Form MD-3 (or MD-4 for a loan licence) on the online system, with the device and plant master files.' })
    if (cls === 'A') {
      steps.push({ step: 'Licence granted without a prior audit', detail: 'Form MD-5 (loan licence MD-6), within 45 days of the application.' })
      steps.push({ step: 'Notified body audit after the grant', detail: 'Within 120 days of the licence, to verify the Fifth Schedule QMS.' })
      timeline = { label: 'The SLA decides within 45 days; the notified body audit follows within 120 days of the licence.', source: 'Medical Devices Rules, 2017, Rule 20' }
    } else {
      steps.push({ step: 'Notified body audit', detail: 'Within 90 days of the application; the report goes to the SLA within 30 days of the audit.' })
      steps.push({ step: 'Licence granted', detail: 'Form MD-5 (loan licence MD-6), within 20 days of the audit report.' })
      timeline = { label: 'About 140 days at most: audit within 90 days, report within 30 days, decision within 20 days.', source: 'Medical Devices Rules, 2017, Rule 20' }
    }
    facts.push({ label: 'Forms', value: 'MD-3 → MD-5 (loan licence MD-4 → MD-6)' }, { label: 'Authority', value: 'State Licensing Authority' })
  } else {
    route = 'Manufacturing licence from the Central Licensing Authority (Rules 21 to 25)'
    reviewer = 'Central Licensing Authority (CDSCO), with a CDSCO inspection'
    steps.push({ step: 'Apply for the manufacturing licence', detail: 'Form MD-7 (or MD-8 for a loan licence) on the online system; scrutiny within 45 days (Rule 21).' })
    steps.push({ step: 'Inspection of the manufacturing site', detail: 'By CDSCO medical device officers, with experts if needed, within 60 days of the application (Rule 23).' })
    steps.push({ step: 'Licence granted', detail: 'Form MD-9 (loan licence MD-10), within 45 days of the inspection report (Rule 25).' })
    timeline = { label: 'About 105 days at most: inspection within 60 days of the application, then a decision within 45 days of the report.', source: 'Medical Devices Rules, 2017, Rules 23 and 25' }
    facts.push({ label: 'Forms', value: 'MD-7 → MD-9 (loan licence MD-8 → MD-10)' }, { label: 'Authority', value: 'Central Licensing Authority' })
  }
  if (novel) timeline = { label: `${ivd ? 'Clinical performance evaluation permission within 90 days, MD-29 within 90 (+30) days' : 'Clinical investigation permission within 90 days, MD-27 within 120 (+30) days'}, then: ${timeline.label}`, source: `Medical Devices Rules, 2017, ${ivd ? 'Rules 59 and 64' : 'Rules 52 and 63'}; ${timeline.source}` }
  steps.push({ step: 'After the licence', detail: 'Report adverse events through the Materiovigilance Programme of India, keep the retention fee paid, and get prior approval for major changes.' })
  if (ivd && a.ivd_c && (a.ivd_c as string[]).includes('companion')) notes.push('A companion diagnostic for a new medicine is reviewed alongside the medicine under the New Drugs and Clinical Trials Rules, 2019; plan both applications together.')
  notes.push('Watch: draft G.S.R. 883(E) (December 2025) would add Form MD-44 for test reports and extend perpetual licences with a retention fee. Still a draft; the current Rules are applied.')
  return { route, reviewer, steps, documents: [...docs, ...(novel ? [ivd ? 'Clinical performance evaluation report' : 'Clinical investigation report'] : []), 'Post-market surveillance, complaint records and Periodic Safety Update Reports'], timeline, notes, facts }
}

function result(partial: Partial<RegionResult> & { cls: string; hits: RuleHit[] }): RegionResult {
  return { region: 'IN', regulation: 'Medical Devices Rules, 2017, First Schedule', route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, notes: [], ...partial }
}

export const IN_PACK: RegionPack = {
  id: 'IN', name: 'India', regulator: 'CDSCO', version: '1.0.0', asOf: '2026-10-20',
  classify(a) {
    const { hits, missing } = a.kind === 'ivd' ? inIvdHits(a) : inDeviceHits(a)
    const regulation = `Medical Devices Rules, 2017, ${a.kind === 'ivd' ? P2 : P1}`
    if (missing) return result({ cls: '?', hits, regulation, incomplete: missing })
    const decisive = highest(hits)!
    if (!a.in_activity || a.in_predicate === undefined) return result({ cls: decisive.cls, hits, decisive, regulation, incomplete: 'Answer the India questions (manufacture or import, and whether there is a predicate) to see the licence.' })
    const r = licence(decisive.cls, a)
    const notes = [...r.notes]
    if (hits.length > 1) notes.unshift(`${hits.length} rules apply; the higher class applies (First Schedule, basic principles).`)
    return result({ cls: decisive.cls, hits, decisive, regulation, ...r, notes })
  },
}
