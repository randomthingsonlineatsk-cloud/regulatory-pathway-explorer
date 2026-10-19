// Fictional devices and makers. Each carries the answers to the wizard's questions, so the
// same device can be classified in every region. Expected results are checked in the tests.
import type { Answers } from './questions'

export interface LibraryDevice {
  id: string
  name: string
  maker: string
  group: 'Non-invasive' | 'Invasive' | 'Implant' | 'Active' | 'IVD'
  purpose: string
  description: string
  answers: Answers
  expect: { EU: string; US: string }
}

const base = { special: [], class1_flags: [] }

export const LIBRARY: LibraryDevice[] = [
  {
    id: 'softline-strip', name: 'Softline Strip', maker: 'Tessaly Health', group: 'Non-invasive',
    purpose: 'A sterile adhesive strip that covers and protects minor cuts and grazes.',
    description: 'A woven fabric strip with an absorbent pad, supplied sterile in single packs. It acts only as a barrier and absorbs exudate.',
    answers: { ...base, kind: 'device', active: false, invasive: 'non', noninv: 'skin', r4: 'barrier', class1_flags: ['sterile'], us_type: 'adhesive_bandage' },
    expect: { EU: 'Is', US: 'Class I (510(k) exempt)' },
  },
  {
    id: 'frostwell-pack', name: 'Frostwell Gel Pack', maker: 'Tessaly Health', group: 'Non-invasive',
    purpose: 'A reusable gel pack, cooled in a freezer, applied over clothing or intact skin to relieve swelling in adults.',
    description: 'A sealed gel pouch with a fabric sleeve. Not for use on infants.',
    answers: { ...base, kind: 'device', active: false, invasive: 'non', noninv: 'other', us_type: 'cold_pack' },
    expect: { EU: 'I', US: 'Class I (510(k) exempt)' },
  },
  {
    id: 'rolvane-chair', name: 'Rolvane Transit Chair', maker: 'Quillon Mobility', group: 'Non-invasive',
    purpose: 'A manual, attendant-propelled wheelchair for moving patients within a hospital.',
    description: 'A folding steel frame with four wheels and push handles. No motor or battery.',
    answers: { ...base, kind: 'device', active: false, invasive: 'non', noninv: 'other', us_type: 'wheelchair' },
    expect: { EU: 'I', US: 'Class I (510(k) exempt)' },
  },
  {
    id: 'keenedge-scalpel', name: 'Keenedge Single-Use Scalpel', maker: 'Quillon Surgical', group: 'Invasive',
    purpose: 'A sterile, single-use scalpel for cutting tissue during general surgery.',
    description: 'A stainless steel blade fixed to a plastic handle, used for minutes and then discarded. Not reusable.',
    answers: { ...base, kind: 'device', active: false, invasive: 'surgical', duration: 'transient', surg: [], class1_flags: ['sterile'], us_type: 'scalpel' },
    expect: { EU: 'IIa', US: 'Class I (510(k) exempt)' },
  },
  {
    id: 'clearsight-lens', name: 'Clearsight Daily Lens', maker: 'Marrowbridge Optics', group: 'Invasive',
    purpose: 'A soft hydrogel contact lens to correct short-sightedness, worn during the day and removed at night.',
    description: 'Daily wear only; not for overnight or extended wear. Not connected to any active device.',
    answers: { ...base, kind: 'device', active: false, invasive: 'orifice', duration: 'short', orifice_site: 'other', connect_active: false, injured_mucosa: false, us_type: 'contact_lens', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II' },
  },
  {
    id: 'uriflow-catheter', name: 'Uriflow Foley Catheter', maker: 'Quillon Surgical', group: 'Invasive',
    purpose: 'A silicone urinary catheter for bladder drainage for up to 14 days.',
    description: 'Inserted through the urethra and held by a balloon. Drains by gravity into a bag; no pump.',
    answers: { ...base, kind: 'device', active: false, invasive: 'orifice', duration: 'short', orifice_site: 'other', connect_active: false, injured_mucosa: false, us_type: 'urinary_catheter', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II' },
  },
  {
    id: 'osteanchor-implant', name: 'Osteanchor Dental Implant', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'A titanium screw implant placed in the jawbone to support a dental crown.',
    description: 'Placed surgically in the bone (not in a tooth) and left in place permanently.',
    answers: { ...base, kind: 'device', active: false, invasive: 'implant', impl: [], us_type: 'dental_implant', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II' },
  },
  {
    id: 'stridewell-hip', name: 'Stridewell Hip System', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'A total hip replacement: a porous-coated, uncemented femoral stem and acetabular cup with a polyethylene liner.',
    description: 'Replaces the hip joint. Supplied with screws and instruments, which are classified separately.',
    answers: { ...base, kind: 'device', active: false, invasive: 'implant', impl: ['joint'], us_type: 'hip', us_predicate: true, us_own_change: false },
    expect: { EU: 'III', US: 'Class II' },
  },
  {
    id: 'dosaline-pump', name: 'Dosaline Volumetric Pump', maker: 'Tessaly Health', group: 'Active',
    purpose: 'A mains and battery powered pump that infuses medicines and fluids into a vein at a set rate.',
    description: 'Used with a separate infusion set. An over-infusion of some medicines could seriously harm the patient.',
    answers: { ...base, kind: 'device', active: true, invasive: 'non', active_fn: 'administer', r12_hazard: true, us_type: 'infusion_pump', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II' },
  },
  {
    id: 'calmpulse-tens', name: 'Calmpulse TENS', maker: 'Marrowbridge Medical', group: 'Active',
    purpose: 'A battery-powered nerve stimulator that relieves chronic back pain through skin electrodes.',
    description: 'Low-level pulses at the skin surface; output limited so it cannot deliver energy in a hazardous way.',
    answers: { ...base, kind: 'device', active: true, invasive: 'non', active_fn: 'therapy', r9: [], us_type: 'tens', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II' },
  },
  {
    id: 'cardiorhythm-pacer', name: 'Cardiorhythm Pacer', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'An implantable pacemaker that paces the heart in patients with bradycardia.',
    description: 'A battery-powered pulse generator implanted under the skin, connected to leads in the heart.',
    answers: { ...base, kind: 'device', active: true, invasive: 'implant', impl: ['active_implant', 'heart_cns'], us_type: 'pacemaker' },
    expect: { EU: 'III', US: 'Class III' },
  },
  {
    id: 'bloomline-test', name: 'Bloomline Pregnancy Self-Test', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A urine test strip that detects hCG to show pregnancy, used at home.',
    description: 'Lay users read two lines on a strip. Instructions advise confirming the result with a doctor.',
    answers: { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'self', ivd_self_b: 'listed', ivd_a: 'no', us_type: 'hcg', us_predicate: true, us_own_change: false },
    expect: { EU: 'B', US: 'Class II' },
  },
  {
    id: 'novaglyx-meter', name: 'Novaglyx Self-Monitoring Meter', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A blood glucose meter and strips for people with diabetes to monitor glucose at home and adjust insulin.',
    description: 'Capillary blood from a finger prick. Results guide insulin doses.',
    answers: { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'self', ivd_self_b: 'other', ivd_a: 'no', us_type: 'glucose', us_predicate: true, us_own_change: false },
    expect: { EU: 'C', US: 'Class II' },
  },
  {
    id: 'donorscreen-hiv', name: 'Halvern DonorScreen HIV-1/2', maker: 'Halvern Diagnostics', group: 'IVD',
    purpose: 'An automated assay that screens blood and plasma donations for antibodies to HIV-1 and HIV-2 and p24 antigen.',
    description: 'Used by blood establishments before donations are released for transfusion.',
    answers: { kind: 'ivd', ivd_d: ['blood_safety', 'life_threatening'], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'no', us_type: 'hiv_donor' },
    expect: { EU: 'D', US: 'Licensed biologic (BLA)' },
  },
  {
    id: 'halvern-cup', name: 'Halvern Urine Collection Cup', maker: 'Halvern Diagnostics', group: 'IVD',
    purpose: 'A plastic container for collecting and sending urine specimens to the laboratory.',
    description: 'Supplied clean but not sterile, with a screw cap and a label area.',
    answers: { kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'receptacle', ivd_sterile: false, us_type: 'specimen_container' },
    expect: { EU: 'A', US: 'Class I (510(k) exempt)' },
  },
]
