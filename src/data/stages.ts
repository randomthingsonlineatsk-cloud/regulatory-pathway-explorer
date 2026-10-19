// Copied from the Macaly version of the Global Regulatory Pathway Explorer (October 2026).
import type { RegulatorParams, ProductCategory, Stage } from './types'
import { CATEGORY_META } from './regulators'

// ---------------------------------------------------------------------------
// Stage generation
// ---------------------------------------------------------------------------

function finalizeStages(stages: Stage[]): Stage[] {
  const result = [...stages]
  const gmpStage: Stage = {
    id: 'gmp',
    title: 'Manufacturing (GMP) Inspection',
    detail: 'Manufacturing facilities are inspected for Good Manufacturing Practice (GMP) compliance before approval — in practice, one of the most common sources of real-world delay even after clinical or technical review is otherwise complete.',
    documents: ['GMP compliance certificate', 'Facility inspection report'],
  }
  result.splice(Math.max(0, result.length - 1), 0, gmpStage)
  const variationsStage: Stage = {
    id: 'variations',
    title: 'Post-Approval Variations & Renewals',
    detail: 'Changing the formulation, manufacturing site, indication, or labeling after approval typically requires its own variation/supplement filing (e.g., an EU Type IA/IB/II variation, or a US Prior-Approval Supplement) rather than a brand-new application. Regulatory approval also isn\u2019t the same as market access — pricing and reimbursement decisions (e.g., a health technology assessment body like NICE) happen separately, afterward, and are outside this app\u2019s scope.',
    documents: ['Variation/supplement application', 'Comparability data (for manufacturing changes)'],
  }
  result.push(variationsStage)
  return result
}

export function buildStages(r: RegulatorParams, category: ProductCategory): Stage[] {
  const shape = CATEGORY_META[category].shape

  if (shape === 'trial') {
    const stages: Stage[] = [
      { id: 'preclinical', title: 'Discovery & Preclinical', detail: 'Lab and animal studies establish basic safety pharmacology and toxicology before human testing. This sits outside the regulatory clock — length depends on the science, not the agency.', documents: ['Preclinical study reports', 'Toxicology data', 'CMC/manufacturing summary'] },
    ]
    if (category === 'orphan') {
      stages.push({ id: 'orphan-designation', title: 'Orphan Drug Designation (sponsor-requested)', detail: r.orphanProgram, documents: ['Prevalence/epidemiology data', 'Scientific rationale', 'Designation request form'] })
    }
    stages.push({ id: 'cta', title: r.ctaName, detail: r.ctaTimeline, authority: r.ctaAuthority, documents: ['Investigator\u2019s brochure', 'Clinical protocol', 'Preclinical data package'] })
    if (category === 'pediatric') {
      stages.push({ id: 'pip', title: 'Pediatric Study Plan / Investigation Plan', detail: r.pediatricProgram, documents: ['Proposed pediatric study plan', 'Waiver/deferral justification (if applicable)'] })
    }
    stages.push(
      { id: 'phase1', title: 'Phase I Trials', detail: 'Small trials assessing safety, tolerability, and pharmacokinetics, typically in tens of participants.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Site-level ethics approval', 'Informed consent documents'] },
      { id: 'phase2', title: 'Phase II Trials', detail: 'Larger controlled trials exploring efficacy, dosing, and further safety characterization.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Interim safety reports', 'Draft statistical analysis plan'] },
      { id: 'phase3', title: 'Phase III Trials', detail: 'Large, often multi-site confirmatory trials establishing efficacy and monitoring safety at scale.', authority: `${r.ctaAuthority}; local ethics committees`, documents: ['Final statistical analysis plan', 'Data safety monitoring board reports'] },
      { id: 'ma', title: r.maName, detail: r.maTimeline, authority: r.maAuthority, documents: ['Full quality/safety/efficacy dossier', 'Proposed labeling', 'Risk management plan'] },
      { id: 'post', title: 'Approval & Post-Market', detail: 'Ongoing pharmacovigilance, periodic safety reporting, and any post-marketing study commitments required by the agency.', documents: ['Periodic safety update reports', 'Post-marketing study reports'] },
    )
    return finalizeStages(stages)
  }

  if (shape === 'abbreviated') {
    const isBiosimilar = category === 'biosimilar'
    const stages: Stage[] = [
      { id: 'reference', title: 'Reference Product Selection & Gap Analysis', detail: 'Identify the approved reference product and map out what comparative data will be needed to demonstrate equivalence or similarity.', documents: ['Reference product labeling', 'Patent/exclusivity landscape review'] },
      { id: 'comparability', title: isBiosimilar ? 'Analytical & Functional Comparability Studies' : 'Formulation & Bioequivalence Study Design', detail: isBiosimilar ? 'Extensive analytical, structural, and functional testing establishing high similarity to the reference biologic.' : 'Formulation development followed by a pharmacokinetic bioequivalence study against the reference product.', documents: isBiosimilar ? ['Analytical comparability report'] : ['Bioequivalence study protocol'] },
    ]
    if (isBiosimilar) {
      stages.push({ id: 'clinical', title: 'Confirmatory Clinical Study (often waivable)', detail: 'A targeted PK/PD or comparative efficacy study, which recent guidance in several jurisdictions increasingly allows to be waived when analytical data are sufficiently robust.', documents: ['Comparative clinical study report'] })
    }
    stages.push(
      { id: 'application', title: `${isBiosimilar ? r.biosimilarRoute : r.genericRoute} — Filing & Review`, detail: 'Abbreviated dossier submitted and reviewed against the reference product\u2019s established safety/efficacy record.', authority: r.maAuthority, documents: ['Abbreviated dossier', 'Proposed labeling matching reference'] },
      { id: 'post', title: 'Approval & Post-Market', detail: 'Ongoing pharmacovigilance; interchangeability/substitution designations (where applicable) may require additional evidence.', documents: ['Periodic safety reporting'] },
    )
    return finalizeStages(stages)
  }

  if (shape === 'device') {
    const isIVD = category === 'diagnostic'
    const stages: Stage[] = [
      { id: 'classify', title: 'Intended Use & Risk Classification', detail: `Classified under: ${r.deviceClasses}. ${isIVD ? r.ivdNote : ''}`, documents: ['Intended use statement', 'Risk classification rationale'] },
      { id: 'qms', title: 'Design Controls & Quality Management System', detail: 'Establish a quality management system (typically ISO 13485-aligned) and design/development documentation.', documents: ['Quality management system certificate', 'Design history file'] },
      { id: 'evaluation', title: 'Preclinical/Analytical & Clinical Evaluation', detail: 'Bench, analytical, and (for higher-risk devices) clinical performance data demonstrating safety and performance.', documents: ['Clinical/performance evaluation report', 'Risk management file'] },
      { id: 'conformity', title: 'Conformity Assessment / Premarket Submission', detail: r.deviceRoute, authority: r.deviceAuthority, documents: ['Technical file / Device Master Record', 'Declaration of conformity'] },
      { id: 'post', title: 'Market Authorization & Post-Market Surveillance', detail: 'Ongoing vigilance reporting, periodic safety updates, and field-safety-corrective-action obligations once on the market.', documents: ['Post-market surveillance plan', 'Vigilance/adverse-event reports'] },
    ]
    return finalizeStages(stages)
  }

  if (shape === 'cosmetic') {
    const stages: Stage[] = [
      { id: 'formulation', title: 'Formulation & Ingredient Safety Assessment', detail: 'A cosmetic safety assessor evaluates the formulation and each ingredient\u2019s safety profile at the intended concentration.', documents: ['Cosmetic Product Safety Report', 'Ingredient (INCI) list'] },
      { id: 'restricted', title: 'Restricted / Banned Substance Compliance', detail: 'Checked against the jurisdiction\u2019s restricted- and banned-ingredient lists — these lists differ significantly between regions.', documents: ['Restricted-substance compliance check'] },
      { id: 'notify', title: 'Notification or Registration', detail: r.cosmeticRoute, authority: r.cosmeticAuthority, documents: ['Notification/registration filing', 'Responsible Person appointment (where required)'] },
      { id: 'labeling', title: 'Labeling & Claims Substantiation', detail: 'Ingredient labeling, usage warnings, and evidence backing any cosmetic claims made (e.g., "reduces wrinkles") must be substantiated and are frequently the subject of enforcement action.', documents: ['Label proof', 'Claims substantiation dossier'] },
      { id: 'post', title: 'Market Placement & Post-Market Surveillance', detail: 'Ongoing adverse-event/cosmetovigilance monitoring; market surveillance rather than clinical-style pharmacovigilance.', documents: ['Cosmetovigilance / adverse-event log'] },
    ]
    return finalizeStages(stages)
  }

  if (shape === 'homeopathy') {
    const stages: Stage[] = [
      { id: 'classify', title: 'Product Classification & Pharmacopeia Compliance', detail: 'Determine whether the product is formulated according to an official homeopathic pharmacopeia monograph (e.g., HPUS in the US, homeopathic monographs in the European Pharmacopoeia, or the Homoeopathic Pharmacopoeia of India).', documents: ['Pharmacopeia monograph reference'] },
      { id: 'potency', title: 'Potency & Dilution Documentation', detail: 'Manufacturing documentation for the specific dilution/potency claimed (e.g., 6C, 30C), following the pharmacopeial preparation method rather than a novel-drug specification.', documents: ['Manufacturing/dilution process record'] },
      { id: 'quality', title: 'Safety & Quality Documentation', detail: 'Good manufacturing practice compliance and quality control, generally without the toxicology package required for a novel active ingredient given the extreme dilutions typically involved.', documents: ['GMP compliance evidence', 'Quality control specifications'] },
      { id: 'filing', title: 'Registration or Notification', detail: r.homeopathyRoute, authority: r.homeopathyAuthority, documents: ['Registration/notification filing (where one exists)'] },
      { id: 'post', title: 'Market Placement & Post-Market Vigilance', detail: 'Ongoing adverse-event monitoring; regulatory attention has been increasing in some jurisdictions for higher-risk or high-concentration homeopathic products.', documents: ['Adverse-event monitoring reports'] },
    ]
    return finalizeStages(stages)
  }

  // herbal
  const stages: Stage[] = [
    { id: 'classify', title: 'Product Classification', detail: 'Determine whether the product is treated as a traditional medicine, a food/dietary supplement, or a full drug requiring the standard pathway.', documents: ['Product classification rationale'] },
    { id: 'quality', title: 'Quality & Manufacturing Documentation', detail: 'Good manufacturing practice compliance and quality/specification documentation for the herbal material and finished product.', documents: ['GMP certificate', 'Quality specifications'] },
    { id: 'evidence', title: 'Traditional-Use Evidence Compilation', detail: 'Bibliographic and historical-use evidence substituting for full clinical efficacy trials, per: ' + r.herbalRoute, documents: ['Bibliographic traditional-use evidence', 'Safety literature review'] },
    { id: 'filing', title: 'Simplified Registration Filing & Review', detail: r.herbalNote, authority: r.herbalAuthority, documents: ['Simplified registration dossier', 'Proposed labeling'] },
    { id: 'post', title: 'Registration & Post-Market Vigilance', detail: 'Ongoing adverse-event reporting; scope is typically narrower than for full pharmaceutical pharmacovigilance.', documents: ['Adverse-event monitoring reports'] },
  ]
  return finalizeStages(stages)
}

export function totalTrialMonths(r: RegulatorParams): number | null {
  if (r.ctaMonths === null || r.maMonths === null) return null
  return r.ctaMonths + 12 + 24 + 36 + r.maMonths
}
