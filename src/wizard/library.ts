// Fictional devices and makers. Each carries the answers to the wizard's questions, so the
// same device can be classified in every region. Expected results are checked in the tests.
import type { Answers } from './questions'

export interface LibraryDevice {
  id: string
  name: string
  maker: string
  group: 'Non-invasive' | 'Invasive' | 'Implant' | 'Active' | 'IVD' | 'Companion diagnostic'
  purpose: string
  description: string
  answers: Answers
  expect: { EU: string; US: string; IN: string }
}

const base = { special: [], class1_flags: [] }
const india = { in_activity: 'import', in_predicate: true }

export const LIBRARY: LibraryDevice[] = [
  {
    id: 'softline-strip', name: 'Softline Strip', maker: 'Tessaly Health', group: 'Non-invasive',
    purpose: 'A sterile adhesive strip that covers and protects minor cuts and grazes.',
    description: 'A woven fabric strip with an absorbent pad, supplied sterile in single packs. It acts only as a barrier and absorbs exudate.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'non', noninv: 'skin', r4: 'barrier', class1_flags: ['sterile'], us_type: 'adhesive_bandage' },
    expect: { EU: 'Is', US: 'Class I (510(k) exempt)', IN: 'A' },
  },
  {
    id: 'frostwell-pack', name: 'Frostwell Gel Pack', maker: 'Tessaly Health', group: 'Non-invasive',
    purpose: 'A reusable gel pack, cooled in a freezer, applied over clothing or intact skin to relieve swelling in adults.',
    description: 'A sealed gel pouch with a fabric sleeve. Not for use on infants.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'non', noninv: 'other', us_type: 'cold_pack' },
    expect: { EU: 'I', US: 'Class I (510(k) exempt)', IN: 'A' },
  },
  {
    id: 'rolvane-chair', name: 'Rolvane Transit Chair', maker: 'Quillon Mobility', group: 'Non-invasive',
    purpose: 'A manual, attendant-propelled wheelchair for moving patients within a hospital.',
    description: 'A folding steel frame with four wheels and push handles. No motor or battery.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'non', noninv: 'other', us_type: 'wheelchair' },
    expect: { EU: 'I', US: 'Class I (510(k) exempt)', IN: 'A' },
  },
  {
    id: 'keenedge-scalpel', name: 'Keenedge Single-Use Scalpel', maker: 'Quillon Surgical', group: 'Invasive',
    purpose: 'A sterile, single-use scalpel for cutting tissue during general surgery.',
    description: 'A stainless steel blade fixed to a plastic handle, used for minutes and then discarded. Not reusable.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'surgical', duration: 'transient', surg: [], class1_flags: ['sterile'], us_type: 'scalpel' },
    expect: { EU: 'IIa', US: 'Class I (510(k) exempt)', IN: 'B' },
  },
  {
    id: 'clearsight-lens', name: 'Clearsight Daily Lens', maker: 'Marrowbridge Optics', group: 'Invasive',
    purpose: 'A soft hydrogel contact lens to correct short-sightedness, worn during the day and removed at night.',
    description: 'Daily wear only; not for overnight or extended wear. Not connected to any active device.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'orifice', duration: 'short', orifice_site: 'other', connect_active: false, injured_mucosa: false, us_type: 'contact_lens', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II', IN: 'B' },
  },
  {
    id: 'uriflow-catheter', name: 'Uriflow Foley Catheter', maker: 'Quillon Surgical', group: 'Invasive',
    purpose: 'A silicone urinary catheter for bladder drainage for up to 14 days.',
    description: 'Inserted through the urethra and held by a balloon. Drains by gravity into a bag; no pump.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'orifice', duration: 'short', orifice_site: 'other', connect_active: false, injured_mucosa: false, us_type: 'urinary_catheter', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II', IN: 'B' },
  },
  {
    id: 'osteanchor-implant', name: 'Osteanchor Dental Implant', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'A titanium screw implant placed in the jawbone to support a dental crown.',
    description: 'Placed surgically in the bone (not in a tooth) and left in place permanently.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'implant', impl: [], us_type: 'dental_implant', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II', IN: 'C' },
  },
  {
    id: 'stridewell-hip', name: 'Stridewell Hip System', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'A total hip replacement: a porous-coated, uncemented femoral stem and acetabular cup with a polyethylene liner.',
    description: 'Replaces the hip joint. Supplied with screws and instruments, which are classified separately.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'implant', impl: ['joint'], us_type: 'hip', us_predicate: true, us_own_change: false },
    expect: { EU: 'III', US: 'Class II', IN: 'C' },
  },
  {
    id: 'dosaline-pump', name: 'Dosaline Volumetric Pump', maker: 'Tessaly Health', group: 'Active',
    purpose: 'A mains and battery powered pump that infuses medicines and fluids into a vein at a set rate.',
    description: 'Used with a separate infusion set. An over-infusion of some medicines could seriously harm the patient.',
    answers: { ...india, ...base, kind: 'device', active: true, invasive: 'non', active_fn: 'administer', r12_hazard: true, us_type: 'infusion_pump', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II', IN: 'C' },
  },
  {
    id: 'calmpulse-tens', name: 'Calmpulse TENS', maker: 'Marrowbridge Medical', group: 'Active',
    purpose: 'A battery-powered nerve stimulator that relieves chronic back pain through skin electrodes.',
    description: 'Low-level pulses at the skin surface; output limited so it cannot deliver energy in a hazardous way.',
    answers: { ...india, ...base, kind: 'device', active: true, invasive: 'non', active_fn: 'therapy', r9: [], us_type: 'tens', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIa', US: 'Class II', IN: 'B' },
  },
  {
    id: 'cardiorhythm-pacer', name: 'Cardiorhythm Pacer', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'An implantable pacemaker that paces the heart in patients with bradycardia.',
    description: 'A battery-powered pulse generator implanted under the skin, connected to leads in the heart.',
    answers: { ...india, ...base, kind: 'device', active: true, invasive: 'implant', impl: ['active_implant', 'heart_cns'], us_type: 'pacemaker' },
    expect: { EU: 'III', US: 'Class III', IN: 'D' },
  },
  {
    id: 'bloomline-test', name: 'Bloomline Pregnancy Self-Test', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A urine test strip that detects hCG to show pregnancy, used at home.',
    description: 'Lay users read two lines on a strip. Instructions advise confirming the result with a doctor.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'self', ivd_self_b: 'listed', ivd_a: 'no', us_type: 'hcg', us_predicate: true, us_own_change: false },
    expect: { EU: 'B', US: 'Class II', IN: 'B' },
  },
  {
    id: 'novaglyx-meter', name: 'Novaglyx Self-Monitoring Meter', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A blood glucose meter and strips for people with diabetes to monitor glucose at home and adjust insulin.',
    description: 'Capillary blood from a finger prick. Results guide insulin doses.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'self', ivd_self_b: 'other', ivd_a: 'no', us_type: 'glucose', us_predicate: true, us_own_change: false },
    expect: { EU: 'C', US: 'Class II', IN: 'C' },
  },
  {
    id: 'donorscreen-hiv', name: 'Halvern DonorScreen HIV-1/2', maker: 'Halvern Diagnostics', group: 'IVD',
    purpose: 'An automated assay that screens blood and plasma donations for antibodies to HIV-1 and HIV-2 and p24 antigen.',
    description: 'Used by blood establishments before donations are released for transfusion.',
    answers: { ...india, kind: 'ivd', ivd_d: ['blood_safety', 'life_threatening'], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'no', us_type: 'hiv_donor' },
    expect: { EU: 'D', US: 'Licensed biologic (BLA)', IN: 'D' },
  },
  {
    id: 'halvern-cup', name: 'Halvern Urine Collection Cup', maker: 'Halvern Diagnostics', group: 'IVD',
    purpose: 'A plastic container for collecting and sending urine specimens to the laboratory.',
    description: 'Supplied clean but not sterile, with a screw cap and a label area.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'lab', ivd_a: 'receptacle', ivd_sterile: false, us_type: 'specimen_container' },
    expect: { EU: 'A', US: 'Class I (510(k) exempt)', IN: 'A' },
  },
  {
    id: 'lumirinse-solution', name: 'Lumirinse Multipurpose Solution', maker: 'Marrowbridge Optics', group: 'Non-invasive',
    purpose: 'A solution to clean, rinse, disinfect and store soft contact lenses.',
    description: 'Used on the lenses, not in the eye. Sold with a lens case. The disinfecting claim is what decides its class.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'non', noninv: 'other', special: ['r16_lens'], us_type: 'lens_care', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II', IN: 'C' },
  },
  {
    id: 'sutrafix-mesh', name: 'Sutrafix Hernia Mesh', maker: 'Quillon Surgical', group: 'Implant',
    purpose: 'A knitted polypropylene mesh implanted to reinforce the abdominal wall in inguinal hernia repair.',
    description: 'Permanent, non-absorbable, placed surgically. Not for transvaginal use.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'implant', impl: ['mesh'], class1_flags: ['sterile'], us_type: 'surgical_mesh', us_predicate: true, us_own_change: false },
    expect: { EU: 'III', US: 'Class II', IN: 'C' },
  },
  {
    id: 'veloura-implant', name: 'Veloura Breast Implant', maker: 'Halvern Medtech', group: 'Implant',
    purpose: 'A silicone gel-filled breast implant for augmentation and reconstruction.',
    description: 'A textured silicone shell filled with cohesive gel, implanted long term.',
    answers: { ...india, ...base, kind: 'device', active: false, invasive: 'implant', impl: ['breast'], class1_flags: ['sterile'], us_type: 'breast_implant' },
    expect: { EU: 'III', US: 'Class III', IN: 'D' },
  },
  {
    id: 'aerivo-ventilator', name: 'Aerivo ICU Ventilator', maker: 'Tessaly Health', group: 'Active',
    purpose: 'A mains-powered critical care ventilator that delivers breaths of an oxygen and air mixture to patients who cannot breathe adequately.',
    description: 'Connected to the patient through a breathing circuit and tube, which are separate devices. Incorrect delivery could quickly harm the patient.',
    answers: { ...india, ...base, kind: 'device', active: true, invasive: 'non', active_fn: 'administer', r12_hazard: true, us_type: 'ventilator', us_predicate: true, us_own_change: false },
    expect: { EU: 'IIb', US: 'Class II', IN: 'C' },
  },
  {
    id: 'novaglyx-ward', name: 'Novaglyx Ward Meter', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A blood glucose meter used by nurses at the bedside to check glucose in hospital patients.',
    description: 'Professional use only, on capillary or venous blood. Same sensor as the home meter, but a different user and setting.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: [], ivd_user: 'near_patient', ivd_np_gas_glucose: true, ivd_a: 'no', us_type: 'glucose', us_predicate: true, us_own_change: false },
    expect: { EU: 'B', US: 'Class II', IN: 'C' },
  },
  {
    id: 'typesure-abd', name: 'TypeSure Anti-A, Anti-B, Anti-D', maker: 'Halvern Diagnostics', group: 'IVD',
    purpose: 'Monoclonal reagents that determine a patient’s or donor’s ABO group and RhD type before transfusion.',
    description: 'Used by blood banks and transfusion laboratories in tube and microplate methods.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'listed', ivd_c: [], ivd_user: 'lab', ivd_a: 'no', us_type: 'blood_grouping' },
    expect: { EU: 'D', US: 'Licensed biologic (BLA)', IN: 'D' },
  },
  {
    id: 'oncomap-panel', name: 'OncoMap 300 Tumour Panel', maker: 'Marrowbridge Diagnostics', group: 'IVD',
    purpose: 'A next generation sequencing test that reports somatic mutations in 300 genes from solid tumour tissue, for patients already diagnosed with cancer.',
    description: 'Run in a central laboratory. It reports mutations with evidence of clinical significance, but makes no claim to select patients for a named medicine.',
    answers: { ...india, kind: 'ivd', ivd_d: [], ivd_grouping: 'no', ivd_c: ['cancer', 'genetic'], ivd_user: 'lab', ivd_a: 'no', us_type: 'ngs_tumor', us_predicate: true, us_own_change: false },
    expect: { EU: 'C', US: 'Class II', IN: 'C' },
  },
  {
    id: 'ktb-select', name: 'KTB-Select Mutation Test', maker: 'Halvern Diagnostics', group: 'Companion diagnostic',
    purpose: 'A PCR test on tumour tissue that selects patients with pancreatic cancer for treatment with Kestrenib (KTB-204), a fictional kinase inhibitor in development.',
    description: 'Used to enrol patients in the pivotal Kestrenib trial; the medicine’s label will require a positive result. Kestrenib is a programme in the Clinical Trial Simulator. No test of this type has been approved in India.',
    answers: { kind: 'ivd', in_activity: 'import', in_predicate: false, ivd_d: [], ivd_grouping: 'no', ivd_c: ['companion', 'cancer'], cdx_stage: 'codev', ivd_user: 'lab', ivd_a: 'no', us_type: 'novel', us_risk: 'high', us_hud: false },
    expect: { EU: 'C', US: 'Class III', IN: 'C' },
  },
]
