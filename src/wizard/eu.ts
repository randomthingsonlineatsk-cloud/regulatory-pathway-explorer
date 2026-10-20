// EU pack: Regulation (EU) 2017/745 (MDR) Annex VIII rules 1 to 22, and Regulation (EU)
// 2017/746 (IVDR) Annex VIII rules 1 to 7, with the conformity assessment routes of MDR
// Article 52 and IVDR Article 48. Rule wording is paraphrased; the rule numbers and the
// classes are as in the regulations.
import type { Answers } from './questions'
import type { RegionPack, RegionResult, RuleHit, RouteStep } from './types'
import { n12Category, N12_TEXT, notDevice, changeControl } from './sw'

const MDR_ORDER = ['I', 'IIa', 'IIb', 'III']
const IVDR_ORDER = ['A', 'B', 'C', 'D']
const pick = (a: Answers, q: string): string[] => (Array.isArray(a[q]) ? (a[q] as string[]) : [])
const highest = (hits: RuleHit[], order: string[]) => hits.reduce<RuleHit | undefined>((m, h) => (!m || order.indexOf(h.cls) > order.indexOf(m.cls) ? h : m), undefined)

export function mdrHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (rule: string, cls: string, text: string) => hits.push({ rule, cls, text })
  if (a.active === undefined || !a.invasive) return { hits, missing: 'Say whether the device is active and how it contacts the body.' }
  const inv = a.invasive as string
  const dur = a.duration as string | undefined
  const special = pick(a, 'special')

  // Non-invasive (rules 1 to 4)
  if (inv === 'non') {
    if (!a.active) {
      if (a.noninv === 'channel') {
        const r2 = a.r2 as string | undefined
        if (r2 === 'blood_bag') add('Rule 2', 'IIb', 'Blood bags are class IIb.')
        else if (r2 === 'blood_organs') add('Rule 2', 'IIa', 'Non-invasive devices for channelling blood, or storing or channelling other body liquids, or storing organs, cells or tissues, are class IIa.')
        else if (r2 === 'connect_active') add('Rule 2', 'IIa', 'Non-invasive channelling or storing devices that may be connected to a class IIa, IIb or III active device are class IIa.')
        else if (r2 === 'other') add('Rule 2', 'I', 'Other non-invasive devices for channelling or storing liquids or gases for eventual administration are class I.')
      } else if (a.noninv === 'modify') {
        if (a.r3 === 'physical') add('Rule 3', 'IIa', 'Modifying the composition of blood or other liquids only by filtration, centrifugation or exchange of gas or heat is class IIa.')
        else if (a.r3 === 'other') add('Rule 3', 'IIb', 'Non-invasive devices modifying the biological or chemical composition of blood, body liquids or other liquids for administration are class IIb.')
        else if (a.r3 === 'in_vitro_cells') add('Rule 3', 'III', 'Substances used in vitro in direct contact with human cells, tissues or organs, or with embryos before implantation, are class III.')
      } else if (a.noninv === 'skin') {
        if (a.r4 === 'barrier') add('Rule 4', 'I', 'Devices in contact with injured skin used as a mechanical barrier, for compression or to absorb exudate are class I.')
        else if (a.r4 === 'dermis') add('Rule 4', 'IIb', 'Devices principally for wounds that breach the dermis or mucous membrane and can heal only by secondary intent are class IIb.')
        else if (a.r4 === 'micro') add('Rule 4', 'IIa', 'Devices principally intended to manage the micro-environment of injured skin or mucous membrane are class IIa.')
        else if (a.r4 === 'other') add('Rule 4', 'IIa', 'All other devices in contact with injured skin or mucous membrane are class IIa.')
      } else if (a.noninv === 'other') add('Rule 1', 'I', 'All non-invasive devices are class I unless another rule applies.')
    } else add('Rule 1', 'I', 'All non-invasive devices are class I unless another rule applies.')
  }

  // Body orifice (rule 5)
  if (inv === 'orifice') {
    if (!dur) return { hits, missing: 'Give the duration of use.' }
    if (a.connect_active === true) add('Rule 5', 'IIa', 'Devices invasive through a body orifice and intended for connection to a class IIa, IIb or III active device are class IIa.')
    else if (dur === 'transient') add('Rule 5', 'I', 'Transient-use devices invasive through a body orifice are class I.')
    else if (dur === 'short') add('Rule 5', a.orifice_site === 'oral_ear_nasal' ? 'I' : 'IIa', a.orifice_site === 'oral_ear_nasal' ? 'Short-term orifice devices used in the oral cavity as far as the pharynx, in an ear canal up to the eardrum or in the nasal cavity are class I.' : 'Short-term devices invasive through a body orifice are class IIa.')
    else if (dur === 'long') add('Rule 5', a.orifice_site === 'oral_ear_nasal' && a.absorbed_mucosa === false ? 'IIa' : 'IIb', a.orifice_site === 'oral_ear_nasal' && a.absorbed_mucosa === false ? 'Long-term orifice devices in the oral cavity, ear canal or nasal cavity that are not liable to be absorbed by the mucous membrane are class IIa.' : 'Long-term devices invasive through a body orifice are class IIb.')
    if (a.injured_mucosa === true && a.r4) {
      const r4cls = a.r4 === 'barrier' ? 'I' : a.r4 === 'dermis' ? 'IIb' : 'IIa'
      add('Rule 4', r4cls, 'Rule 4 also applies to invasive devices in contact with injured mucous membrane.')
    }
  }

  // Surgically invasive, transient (rule 6) and short term (rule 7)
  if (inv === 'surgical' && dur !== 'long') {
    if (!dur) return { hits, missing: 'Give the duration of use.' }
    const s = pick(a, 'surg')
    const r = dur === 'transient' ? 'Rule 6' : 'Rule 7'
    const base = dur === 'transient' ? 'Surgically invasive devices for transient use are class IIa' : 'Surgically invasive devices for short-term use are class IIa'
    let any = false
    if (s.includes('heart_defect')) { add(r, 'III', 'Devices specifically intended to control, diagnose, monitor or correct a defect of the heart or central circulatory system through direct contact are class III.'); any = true }
    if (s.includes('heart_cns')) { add(r, 'III', 'Devices specifically for use in direct contact with the heart, the central circulatory system or the central nervous system are class III.'); any = true }
    if (s.includes('reusable') && dur === 'transient') { add(r, 'I', 'Reusable surgical instruments are class I (Ir).'); any = true }
    if (s.includes('ionizing')) { add(r, 'IIb', 'Devices supplying energy as ionising radiation are class IIb.'); any = true }
    if (s.includes('biological')) { add(r, dur === 'transient' ? 'IIb' : 'III', dur === 'transient' ? 'Transient devices with a biological effect, or wholly or mainly absorbed, are class IIb.' : 'Short-term devices with a biological effect, or wholly or mainly absorbed, are class III.'); any = true }
    if (s.includes('chemical') && dur === 'short') { add(r, 'IIb', 'Short-term devices that undergo chemical change in the body (except in the teeth) are class IIb.'); any = true }
    if (s.includes('medicine')) { add(r, 'IIb', 'Devices administering medicinal products through a delivery system in a potentially hazardous manner are class IIb.'); any = true }
    if (!any) add(r, 'IIa', `${base}.`)
  }

  // Implants and long-term surgically invasive (rule 8)
  if (inv === 'implant' || (inv === 'surgical' && dur === 'long')) {
    const s = pick(a, 'impl')
    let any = false
    if (s.includes('teeth')) { add('Rule 8', 'IIa', 'Implants and long-term surgically invasive devices placed in the teeth are class IIa.'); any = true }
    if (s.includes('heart_cns')) { add('Rule 8', 'III', 'Those used in direct contact with the heart, the central circulatory system or the central nervous system are class III.'); any = true }
    if (s.includes('biological')) { add('Rule 8', 'III', 'Those with a biological effect, or wholly or mainly absorbed, are class III.'); any = true }
    if (s.includes('chemical_medicine')) { add('Rule 8', 'III', 'Those that undergo chemical change in the body (except in the teeth) or administer medicinal products are class III.'); any = true }
    if (s.includes('active_implant')) { add('Rule 8', 'III', 'Active implantable devices and their accessories are class III.'); any = true }
    if (s.includes('breast')) { add('Rule 8', 'III', 'Breast implants are class III.'); any = true }
    if (s.includes('mesh')) { add('Rule 8', 'III', 'Surgical meshes are class III.'); any = true }
    if (s.includes('joint')) { add('Rule 8', 'III', 'Total or partial joint replacements are class III (ancillary screws, wedges, plates and instruments are not).'); any = true }
    if (s.includes('spine')) { add('Rule 8', 'III', 'Spinal disc replacements and implants in contact with the spinal column are class III (screws, wedges, plates and instruments are not).'); any = true }
    if (!any) add('Rule 8', 'IIb', 'All implantable devices and long-term surgically invasive devices are class IIb unless an exception applies.')
  }

  // Active devices (rules 9, 10, 12, 13)
  if (a.active === true && inv !== 'implant') {
    if (a.active_fn === 'therapy') {
      const s = pick(a, 'r9')
      add('Rule 9', s.includes('hazardous') ? 'IIb' : 'IIa', s.includes('hazardous') ? 'Active therapeutic devices that may give or exchange energy in a potentially hazardous way are class IIb.' : 'Active therapeutic devices intended to give or exchange energy are class IIa.')
      if (s.includes('controls_iib')) add('Rule 9', 'IIb', 'Active devices controlling, monitoring or directly influencing an active therapeutic class IIb device are class IIb.')
      if (s.includes('ionizing')) add('Rule 9', 'IIb', 'Active devices emitting ionising radiation for therapy are class IIb.')
      if (s.includes('controls_aimd')) add('Rule 9', 'III', 'Active devices controlling, monitoring or directly influencing an active implantable device are class III.')
    } else if (a.active_fn === 'diagnose') {
      const s = pick(a, 'r10')
      if (s.includes('illuminate')) add('Rule 10', 'I', 'Active diagnostic devices that only illuminate the body in the visible spectrum are class I.')
      if (s.includes('energy')) add('Rule 10', 'IIa', 'Active diagnostic devices supplying energy absorbed by the body are class IIa.')
      if (s.includes('radiopharm')) add('Rule 10', 'IIa', 'Active devices imaging the in vivo distribution of radiopharmaceuticals are class IIa.')
      if (s.includes('vital')) add('Rule 10', 'IIa', 'Active devices for direct diagnosis or monitoring of vital physiological processes are class IIa.')
      if (s.includes('vital_danger')) add('Rule 10', 'IIb', 'Monitoring vital parameters whose variation could mean immediate danger, or diagnosis when the patient is in immediate danger, is class IIb.')
      if (s.includes('xray')) add('Rule 10', 'IIb', 'Active devices emitting ionising radiation for diagnostic or interventional radiology are class IIb.')
      if (!s.length) add('Rule 13', 'I', 'All other active devices are class I.')
    } else if (a.active_fn === 'administer') {
      add('Rule 12', a.r12_hazard === true ? 'IIb' : 'IIa', a.r12_hazard === true ? 'Active devices administering or removing substances in a potentially hazardous way are class IIb.' : 'Active devices administering or removing medicinal products, body liquids or other substances are class IIa.')
    } else if (a.active_fn === 'other') add('Rule 13', 'I', 'All other active devices are class I.')
  }

  // Special rules (14 to 22)
  const isLongInvasive = inv === 'implant' || dur === 'long'
  if (special.includes('r14')) add('Rule 14', 'III', 'Devices incorporating a substance that would be a medicinal product on its own, with an ancillary action, are class III.')
  if (special.includes('r15')) add('Rule 15', isLongInvasive ? 'III' : 'IIb', isLongInvasive ? 'Implantable or long-term invasive devices for contraception or STD prevention are class III.' : 'Devices for contraception or preventing transmission of sexually transmitted diseases are class IIb.')
  if (special.includes('r16_lens')) add('Rule 16', 'IIb', 'Devices for disinfecting, cleaning, rinsing or hydrating contact lenses are class IIb.')
  if (special.includes('r16_disinfect') || special.includes('r16_sterilise')) add('Rule 16', 'IIa', 'Devices for disinfecting or sterilising medical devices are class IIa.')
  if (special.includes('r16_invasive')) add('Rule 16', 'IIb', 'Disinfecting solutions or washer-disinfectors for invasive devices, as the end point of processing, are class IIb.')
  if (special.includes('r17')) add('Rule 17', 'IIa', 'Devices for recording diagnostic images generated by X-ray radiation are class IIa.')
  if (special.includes('r18') && a.r18_skin !== true) add('Rule 18', 'III', 'Devices made using non-viable human or animal tissues or cells, or their derivatives, are class III.')
  if (special.includes('r19')) add('Rule 19', a.r19_level === 'high' ? 'III' : a.r19_level === 'low' ? 'IIb' : 'IIa', 'Devices with nanomaterial are class III, IIb or IIa for high or medium, low, or negligible potential for internal exposure.')
  if (special.includes('r20')) add('Rule 20', a.r20_critical === true ? 'IIb' : 'IIa', a.r20_critical === true ? 'Orifice devices for inhaled medicines with an essential impact on efficacy and safety, or for life-threatening conditions, are class IIb.' : 'Orifice devices for administering medicinal products by inhalation are class IIa.')
  if (special.includes('r21')) {
    const s = a.r21_site
    add('Rule 21', s === 'systemic' || s === 'gi_systemic' ? 'III' : s === 'skin_nose_mouth' ? 'IIa' : 'IIb', 'Substance-based devices are class III if systemically absorbed to achieve their purpose, IIa if they act on the skin or in the nasal or oral cavity, and IIb otherwise.')
  }
  if (special.includes('r22')) add('Rule 22', 'III', 'Active therapeutic devices with an integrated diagnostic function that significantly decides patient management are class III.')

  if (!hits.length) return { hits, missing: 'Answer the questions for this kind of device.' }
  return { hits }
}

export function ivdrHits(a: Answers): { hits: RuleHit[]; missing?: string } {
  const hits: RuleHit[] = []
  const add = (rule: string, cls: string, text: string) => hits.push({ rule, cls, text })
  if (!Array.isArray(a.ivd_d) || !a.ivd_grouping || !Array.isArray(a.ivd_c) || !a.ivd_user || !a.ivd_a) return { hits, missing: 'Answer the IVD questions.' }
  const d = a.ivd_d as string[], c = a.ivd_c as string[]
  if (d.includes('blood_safety')) add('Rule 1', 'D', 'Tests detecting transmissible agents in blood, blood components, cells, tissues or organs to assess their suitability for transfusion, transplantation or cell administration are class D.')
  if (d.includes('life_threatening')) add('Rule 1', 'D', 'Tests detecting a life-threatening transmissible agent with a high or suspected high risk of propagation are class D.')
  if (d.includes('load')) add('Rule 1', 'D', 'Tests determining the infectious load of a life-threatening disease where monitoring is critical in patient management are class D.')
  if (a.ivd_grouping === 'listed') add('Rule 2', 'D', 'Blood grouping or tissue typing for the markers listed in rule 2 (ABO, Rh, Kell, Kidd, Duffy) is class D.')
  if (a.ivd_grouping === 'other') add('Rule 2', 'C', 'Blood grouping or tissue typing for other markers is class C.')
  const cText: Record<string, string> = {
    sti: 'detecting a sexually transmitted agent', csf_blood: 'detecting an infectious agent in cerebrospinal fluid or blood without a high risk of propagation', erroneous_death: 'detecting an infectious agent where an erroneous result could cause death or severe disability', prenatal_infection: 'prenatal screening of women for their immune status towards transmissible agents', immune_status: 'determining infective disease or immune status where an erroneous result could lead to a life-threatening decision', companion: 'use as a companion diagnostic', staging: 'disease staging where an erroneous result could lead to a life-threatening decision', cancer: 'screening, diagnosis or staging of cancer', genetic: 'human genetic testing', drug_level: 'monitoring levels of medicines or substances where an erroneous result could be immediately life-threatening', life_threatening_mgmt: 'managing patients with a life-threatening disease or condition', embryo: 'screening for congenital disorders in the embryo or foetus', newborn: 'screening for congenital disorders in newborn babies',
  }
  for (const k of c) add('Rule 3', 'C', `Tests intended for ${cText[k]} are class C.`)
  if (a.ivd_user === 'self') {
    if (a.ivd_self_b === 'listed' || a.ivd_self_b === 'not_critical') add('Rule 4', 'B', a.ivd_self_b === 'listed' ? 'Self-tests for pregnancy, fertility, cholesterol, and urine glucose, erythrocytes, leucocytes or bacteria are class B.' : 'Self-tests whose result does not determine a medically critical status, or is preliminary and needs a laboratory follow-up, are class B.')
    else add('Rule 4', 'C', 'Devices for self-testing are class C.')
  }
  if (a.ivd_user === 'near_patient' && !hits.length) add('Rule 4', 'B', 'Near-patient tests are classified in their own right; with no other rule applying, rule 6 gives class B.')
  if (a.ivd_a === 'control') add('Rule 7', 'B', 'Controls without a quantitative or qualitative assigned value are class B.')
  if (['lab_product', 'instrument', 'receptacle'].includes(a.ivd_a as string)) add('Rule 5', 'A', a.ivd_a === 'receptacle' ? 'Specimen receptacles are class A.' : a.ivd_a === 'instrument' ? 'Instruments intended specifically for IVD procedures are class A.' : 'General laboratory products and accessories with no critical characteristics, intended for IVD use, are class A.')
  if (!hits.length) add('Rule 6', 'B', 'Devices not covered by the other rules are class B.')
  return { hits }
}

function mdrRoute(cls: string, a: Answers): { route: string; reviewer: string; steps: RouteStep[]; documents: string[]; timeline: RegionResult['timeline']; notes: string[] } {
  const flags = Array.isArray(a.class1_flags) ? (a.class1_flags as string[]) : []
  const implant = a.invasive === 'implant'
  const common = ['Technical documentation (MDR Annex II) and post-market surveillance documentation (Annex III)', 'Clinical evaluation report (Article 61, Annex XIV)', 'Risk management file (ISO 14971)', 'Quality management system (Article 10(9); ISO 13485)', 'EU declaration of conformity (Article 19, Annex IV)', 'Labelling and instructions for use (Annex I, Chapter III)', 'Basic UDI-DI and UDI-DI; actor registration (SRN) and device registration in EUDAMED']
  const pms = cls === 'I' ? 'Post-market surveillance report (Article 85)' : 'Periodic safety update report: every 2 years for class IIa, every year for class IIb and III (Article 86)'
  const timeline = { label: 'No legal review clock for notified bodies; certification commonly takes many months and depends on notified body capacity. Indicative only.', source: 'MDR Articles 52 and 53' }
  if (cls === 'I') {
    const nb = flags.length > 0
    return {
      route: nb ? `Self-declaration plus notified body for the ${flags.join(', ')} aspects (Article 52(7))` : 'Self-declaration (Article 52(7))',
      reviewer: nb ? 'Notified body (limited to those aspects)' : 'Manufacturer; no notified body',
      steps: [
        { step: 'Draw up the technical documentation', detail: 'Annex II and III.' },
        ...(nb ? [{ step: 'Notified body assessment of the limited aspects', detail: 'Annex IX Chapters I and III, or Annex XI Part A, limited to sterility, metrology or reprocessing (Article 52(7)).' }] : []),
        { step: 'Sign the EU declaration of conformity', detail: 'Annex IV; affix the CE mark' + (nb ? ' with the notified body number.' : '.') },
        { step: 'Register in EUDAMED', detail: 'Actor registration (SRN), then UDI and device registration (Articles 29 and 31).' },
      ],
      documents: [...common, pms],
      timeline: nb ? timeline : { label: 'No external review; the manufacturer can place the device on the market once the documentation and registration are complete.', source: 'MDR Article 52(7)' },
      notes: nb ? [] : ['A class I device without sterile, measuring or reusable surgical aspects needs no notified body.'],
    }
  }
  const nbSteps: RouteStep[] = [
    { step: 'Choose a notified body designated for the device code', detail: 'Check its scope in NANDO.' },
    { step: cls === 'III' ? 'Quality management system audit and technical documentation assessment of every device' : cls === 'IIb' && implant ? 'Quality management system audit and technical documentation assessment of every implantable device' : `Quality management system audit and technical documentation assessment of representative devices per ${cls === 'IIa' ? 'category' : 'generic device group'}`, detail: 'Annex IX Chapters I and III' + (cls === 'III' || (cls === 'IIb' && implant) ? ' and Chapter II.' : ', with sampled Chapter II assessments.') },
  ]
  const consult = (cls === 'III' && implant) || (cls === 'IIb' && a.active === true && a.active_fn === 'administer')
  if (consult) nbSteps.push({ step: 'Clinical evaluation consultation procedure', detail: `For ${cls === 'III' ? 'class III implantable devices' : 'class IIb active devices that administer or remove medicinal products'} the notified body sends its clinical evaluation assessment report to an expert panel, which may give an opinion within 60 days (Article 54(1), Annex IX section 5.1).` })
  nbSteps.push({ step: 'EU technical documentation assessment certificate and QMS certificate', detail: 'Annex XII certificates.' })
  nbSteps.push({ step: 'Declaration of conformity, CE mark with the notified body number, EUDAMED registration', detail: 'Articles 19, 20, 29 and 31.' })
  const docs = [...common, pms]
  if (cls === 'III' || implant) docs.push('Summary of safety and clinical performance (SSCP) for implantable and class III devices (Article 32)')
  if (implant) docs.push('Implant card and patient information (Article 18)')
  docs.push('Post-market clinical follow-up plan and report (Annex XIV Part B)')
  return {
    route: `Annex IX conformity assessment (quality management system and technical documentation), or Annex X type-examination with Annex XI production quality assurance`,
    reviewer: 'Notified body',
    steps: nbSteps,
    documents: docs,
    timeline,
    notes: consult ? ['The clinical evaluation consultation procedure applies unless an exemption in Article 54(2) applies (for example, a modification of a device already marketed by the same manufacturer).'] : [],
  }
}

function ivdrRoute(cls: string, a: Answers): { route: string; reviewer: string; steps: RouteStep[]; documents: string[]; timeline: RegionResult['timeline']; notes: string[] } {
  const common = ['Technical documentation (IVDR Annex II) and post-market surveillance documentation (Annex III)', 'Performance evaluation report: scientific validity, analytical performance and clinical performance (Article 56, Annex XIII)', 'Risk management file (ISO 14971)', 'Quality management system (Article 10(8); ISO 13485)', 'EU declaration of conformity (Article 17)', 'Labelling and instructions for use (Annex I, Chapter III)', 'UDI and EUDAMED registration']
  const timeline = { label: 'No legal review clock for notified bodies. For class D, the EU reference laboratory has 60 days to verify performance, and the expert panel consultation has 60 days. Indicative only.', source: 'IVDR Articles 48 and 100' }
  const sterileA = cls === 'A' && a.ivd_sterile === true
  if (cls === 'A' && !sterileA) return { route: 'Self-declaration (Article 48(10))', reviewer: 'Manufacturer; no notified body', steps: [{ step: 'Draw up the technical documentation', detail: 'Annex II and III.' }, { step: 'Sign the EU declaration of conformity and affix the CE mark', detail: 'Article 17.' }, { step: 'Register in EUDAMED', detail: 'Actor and device registration.' }], documents: [...common, 'Post-market surveillance report (Article 80)'], timeline: { label: 'No external review.', source: 'IVDR Article 48(10)' }, notes: [] }
  if (sterileA) return { route: 'Self-declaration plus notified body for the sterile aspects (Article 48(10))', reviewer: 'Notified body (limited to sterility)', steps: [{ step: 'Notified body assessment of the sterile aspects', detail: 'Annex IX or Annex XI, limited to sterile conditions.' }, { step: 'Declaration of conformity and CE mark with the notified body number', detail: 'Article 17.' }], documents: [...common], timeline, notes: [] }
  const steps: RouteStep[] = [
    { step: 'Quality management system audit', detail: 'Annex IX Chapter I.' },
    { step: cls === 'D' ? 'Technical documentation assessment of every device' : cls === 'C' ? 'Technical documentation assessment of representative devices per generic device group' : 'Technical documentation assessment of representative devices per category', detail: 'Annex IX Chapter II.' },
  ]
  if (a.ivd_user === 'self' || a.ivd_user === 'near_patient') steps.push({ step: 'Assessment of the design for self-testing or near-patient testing', detail: 'Annex IX section 5.1: usability by the intended user.' })
  if (Array.isArray(a.ivd_c) && (a.ivd_c as string[]).includes('companion')) steps.push({ step: 'Consultation of a medicines authority on the suitability of the companion diagnostic', detail: `Annex IX section 5.2: the notified body consults the EMA (for a centrally authorised medicine) or a national authority, which gives its opinion within 60 days, extendable once by 60 days.${a.cdx_stage === 'codev' ? ' For a new medicine, plan this so the certificate is ready when the medicine is authorised.' : ''}` })
  if (cls === 'D') steps.push({ step: 'EU reference laboratory verification and batch testing', detail: 'Performance claimed is verified by an EU reference laboratory (Article 100, Annex IX section 4.9); where no common specifications exist, the expert panel is consulted on the performance evaluation (Article 48(6)).' })
  steps.push({ step: 'Certificates, declaration of conformity, CE mark and EUDAMED registration', detail: 'Annex XII certificates; Article 17.' })
  return {
    route: 'Annex IX conformity assessment (quality management system and technical documentation), or Annex X type-examination with Annex XI production quality assurance',
    reviewer: 'Notified body' + (cls === 'D' ? ', EU reference laboratory and expert panel' : ''),
    steps,
    documents: [...common, cls === 'B' ? 'Post-market surveillance report (Article 80)' : 'Periodic safety update report, at least yearly (Article 81)', 'Post-market performance follow-up plan and report (Annex XIII Part B)', ...(cls === 'C' || cls === 'D' ? ['Summary of safety and performance (Article 29)'] : [])],
    timeline,
    notes: [],
  }
}

export const EU_PACK: RegionPack = {
  id: 'EU', name: 'European Union', regulator: 'EMA', version: '1.2.0', asOf: '2026-10-20',
  classify(a) {
    if (a.kind === 'software') return euSoftware(a)
    if (a.kind === 'combination') return euCombination(a)
    if (a.kind === 'ivd') {
      const { hits, missing } = ivdrHits(a)
      if (missing) return { region: 'EU', regulation: 'IVDR (EU) 2017/746', cls: '?', hits, route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, notes: [], incomplete: missing }
      const decisive = highest(hits, IVDR_ORDER)!
      const cls = decisive.cls
      return { region: 'EU', regulation: 'IVDR (EU) 2017/746, Annex VIII', cls, hits, decisive, ...ivdrRoute(cls, a) }
    }
    const { hits, missing } = mdrHits(a)
    if (missing) return { region: 'EU', regulation: 'MDR (EU) 2017/745', cls: '?', hits, route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, notes: [], incomplete: missing }
    const decisive = highest(hits, MDR_ORDER)!
    let cls = decisive.cls
    if (cls === 'I') {
      const f = Array.isArray(a.class1_flags) ? (a.class1_flags as string[]) : []
      const suffix = (f.includes('sterile') ? 's' : '') + (f.includes('measuring') ? 'm' : '') + (f.includes('reusable') ? 'r' : '')
      cls = 'I' + suffix
    }
    const r = mdrRoute(decisive.cls, a)
    const notes = [...r.notes]
    if (hits.length > 1) notes.unshift(`${hits.length} rules apply; the strictest rule sets the class (MDR Annex VIII, section 3.5).`)
    return { region: 'EU', regulation: 'MDR (EU) 2017/745, Annex VIII', cls, hits, decisive, ...r, notes }
  },
}

// Software: MDR rule 11 (Annex VIII, 6.3), read with MDCG 2019-11 on qualification.
function euSoftware(a: Answers): RegionResult {
  if (a.sw_purpose === 'wellness') return notDevice('EU', 'MDR Article 2(1); MDCG 2019-11', 'Not a device', 'Software for general wellness or lifestyle, with no medical purpose, is not a medical device.')
  if (a.sw_purpose === 'admin') return notDevice('EU', 'MDR Article 2(1); MDCG 2019-11', 'Not a device', 'Software that only stores, archives, communicates or searches, or serves administration, is not a medical device.')
  if (a.sw_purpose !== 'clinical' || !a.sw_impact || !a.sw_monitor) return { region: 'EU', regulation: 'MDR (EU) 2017/745', cls: '?', hits: [], route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, notes: [], incomplete: 'Answer the software questions.' }
  const hits: RuleHit[] = []
  const add = (cls: string, text: string) => hits.push({ rule: 'Rule 11', cls, text })
  if (a.sw_impact === 'death') add('III', 'Software providing information for diagnostic or therapeutic decisions, where those decisions could cause death or an irreversible deterioration of health, is class III.')
  else if (a.sw_impact === 'serious') add('IIb', 'Where those decisions could cause a serious deterioration of health or a surgical intervention, the software is class IIb.')
  else add('IIa', 'Software providing information used to take diagnostic or therapeutic decisions is class IIa.')
  if (a.sw_monitor === 'vital_danger') add('IIb', 'Software monitoring vital physiological parameters whose variations could mean immediate danger is class IIb.')
  if (a.sw_monitor === 'physiological') add('IIa', 'Software intended to monitor physiological processes is class IIa.')
  const decisive = highest(hits, MDR_ORDER)!
  const r = mdrRoute(decisive.cls, a)
  const cat = n12Category(a)
  return { region: 'EU', regulation: 'MDR (EU) 2017/745, Annex VIII, rule 11', cls: decisive.cls, hits, decisive, ...r, documents: [...r.documents, 'Software lifecycle (EN 62304), usability (EN 62366-1) and cybersecurity (MDCG 2019-16) documentation'], facts: [...(cat ? [{ label: 'IMDRF N12', value: `${N12_TEXT[cat]} A teaching aid, not a legal class.` }] : []), ...changeControl('EU', a)], notes: hits.length > 1 ? [`${hits.length} parts of rule 11 apply; the highest class applies.`, ...r.notes] : r.notes }
}

// Combination products: MDR rule 14 for device-led products with an ancillary medicine, and
// MDR Article 117 (Directive 2001/83/EC, Annex I, 3.2(12)) for integral medicine-led products.
function euCombination(a: Answers): RegionResult {
  const base = { region: 'EU' as const, hits: [] as RuleHit[], route: '', reviewer: '', steps: [], documents: [], timeline: { label: '', source: '' }, notes: [] }
  if (!a.combo_pmoa || !a.combo_form) return { ...base, regulation: 'MDR (EU) 2017/745', cls: '?', incomplete: 'Answer the combination questions.' }
  if (a.combo_pmoa === 'device') {
    const hit = { rule: 'Rule 14', cls: 'III', text: 'Devices incorporating, as an integral part, a substance that would be a medicinal product on its own, with an action ancillary to the device, are class III.' }
    const r = mdrRoute('III', { ...a, invasive: a.combo_implant ? 'implant' : 'non' })
    return { ...base, regulation: 'MDR (EU) 2017/745, Annex VIII, rule 14', cls: 'III', hits: [hit], decisive: hit, ...r,
      reviewer: 'Notified body, consulting a medicines authority on the substance',
      steps: [...r.steps.slice(0, -1), { step: 'Consultation on the ancillary medicinal substance', detail: 'The notified body asks a national medicines authority, or the EMA, for an opinion on the substance’s quality, safety and benefit-risk; the authority has 210 days (MDR Annex IX section 5.2).' }, r.steps[r.steps.length - 1]],
      timeline: { label: 'No legal clock for the notified body; the medicines authority’s opinion takes up to 210 days. Indicative only.', source: 'MDR Annex IX section 5.2' },
      facts: [{ label: 'Lead', value: 'Notified body under the MDR' }, { label: 'Second review', value: 'Medicines authority opinion on the ancillary substance' }] }
  }
  const hit = { rule: 'Directive 2001/83/EC', cls: 'Medicinal product', text: 'A product whose principal action is the medicine’s is regulated as a medicinal product; the device part must still meet the MDR’s general safety and performance requirements.' }
  if (a.combo_form === 'single') return { ...base, regulation: 'Directive 2001/83/EC and Regulation (EC) 726/2004; MDR Article 117', cls: 'Medicinal product', hits: [hit], decisive: hit,
    route: 'Marketing authorisation for the medicine, with a notified body opinion on the integral device part', reviewer: 'EMA (centralised procedure) or national competent authorities; a notified body for the device part',
    steps: [{ step: 'Notified body opinion on the device part', detail: 'For a single integral product, the marketing authorisation application includes a notified body’s opinion that the device part meets the MDR’s general safety and performance requirements (MDR Article 117, amending Annex I of Directive 2001/83/EC, section 3.2(12)).' }, { step: 'Marketing authorisation application', detail: 'Module 3 describes the device part; the medicines authority assesses the whole product.' }],
    documents: ['Marketing authorisation dossier (CTD)', 'Notified body opinion on the device part (Article 117)', 'Device part description, usability and human factors data in Module 3'],
    timeline: { label: 'Centralised procedure: 210 days of assessment, plus clock stops and the Commission decision. Indicative only.', source: 'Regulation (EC) 726/2004' },
    facts: [{ label: 'Lead', value: 'Medicines authority' }, { label: 'Second review', value: 'Notified body opinion on the device part (Article 117)' }] }
  return { ...base, regulation: 'Directive 2001/83/EC; MDR (EU) 2017/745', cls: 'Medicinal product', hits: [hit], decisive: hit,
    route: 'Marketing authorisation for the medicine; the device is CE-marked on its own under the MDR', reviewer: 'Medicines authority for the medicine; the device in its own MDR class',
    steps: [{ step: 'CE marking of the device', detail: 'The device is classified under MDR Annex VIII on its own, as for any device, and certified in that class.' }, { step: 'Marketing authorisation application', detail: 'The device is referred to in the product information.' }],
    documents: ['Marketing authorisation dossier (CTD)', 'Device CE certificate or declaration of conformity'], timeline: { label: 'Medicine and device on separate tracks. Indicative only.', source: 'Directive 2001/83/EC; MDR' },
    facts: [{ label: 'Lead', value: 'Medicines authority' }, { label: 'Second review', value: 'Separate MDR conformity assessment of the device' }] }
}
