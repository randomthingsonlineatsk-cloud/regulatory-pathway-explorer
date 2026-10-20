// Short IMDRF lessons: the ideas behind most of the region packs. Each ends with one check.
export interface Lesson { id: string; title: string; body: string[]; check: { prompt: string; options: string[]; answer: string; explain: string }; source: string }

export const LESSONS: Lesson[] = [
  {
    id: 'ghtf', title: 'From GHTF to IMDRF: one way to classify',
    body: [
      'The Global Harmonization Task Force (1992 to 2012) brought the device regulators of the US, the EU, Japan, Canada and Australia together. Its successor, the International Medical Device Regulators Forum (IMDRF), has worked since 2011.',
      'The GHTF classification principles sort devices into four classes, A (lowest risk) to D (highest), by rules on how invasive a device is, how long it is used, whether it is active and what special features it has. IVDs have their own rules, driven by the risk to the patient and to public health.',
      'Many regulators copied this scheme: India’s First Schedule uses classes A to D and the GHTF rules almost word for word. The EU kept its own class names (I to III) but uses similar rules.',
    ],
    check: { prompt: 'India’s First Schedule follows which scheme most closely?', options: ['The GHTF classification principles', 'The US classification regulations', 'Japan’s JMDN codes', 'None: it is unique'], answer: 'The GHTF classification principles', explain: 'Classes A to D and rules on invasiveness, duration and active function come from the GHTF principles.' },
    source: 'GHTF/SG1/N77:2012, Principles of Medical Devices Classification',
  },
  {
    id: 'ep', title: 'Essential principles of safety and performance',
    body: [
      'Every class must meet the same essential principles: the device is safe, performs as intended, and its benefits outweigh its risks, through its design, manufacture, labelling and life cycle.',
      'The class decides how much a third party checks this, not whether it applies. The EU calls them the general safety and performance requirements (MDR Annex I); India asks for an essential principles checklist with each licence application.',
    ],
    check: { prompt: 'Does a class I or class A device have to meet the essential principles?', options: ['Yes: the class changes who checks, not what must be met', 'No: only higher classes', 'Only if it is sterile', 'Only in the EU'], answer: 'Yes: the class changes who checks, not what must be met', explain: 'The principles apply to every device; the class sets the conformity assessment route.' },
    source: 'IMDRF/GRRP WG/N47 FINAL:2018, Essential Principles of Safety and Performance of Medical Devices and IVD Medical Devices',
  },
  {
    id: 'mdsap', title: 'MDSAP: one audit, five regulators',
    body: [
      'The Medical Device Single Audit Program lets one recognised auditing organisation audit a manufacturer’s quality management system once, against ISO 13485 and the extra requirements of five regulators: Australia’s TGA, Brazil’s ANVISA, Health Canada, Japan’s MHLW and PMDA, and the US FDA.',
      'Health Canada requires an MDSAP certificate for class II to IV device licences. The FDA accepts MDSAP audit reports in place of routine inspections, and the TGA and Japan use them in their own assessments.',
    ],
    check: { prompt: 'Which regulator requires an MDSAP certificate for class II to IV device licences?', options: ['Health Canada', 'The FDA', 'CDSCO', 'The EU notified bodies'], answer: 'Health Canada', explain: 'Health Canada made MDSAP mandatory for class II to IV licences; the others accept or use MDSAP reports.' },
    source: 'IMDRF MDSAP documents; Health Canada MDSAP notice',
  },
  {
    id: 'n12', title: 'IMDRF N12: a risk matrix for software',
    body: [
      'N12 places software as a medical device on two axes: how significant its output is (it treats or diagnoses, drives clinical management, or informs it) and how serious the situation is (critical, serious, non-serious).',
      'The result is a category from I (lowest impact) to IV (highest). The categories are a common language, not a legal class: the EU uses rule 11, the US its device types and clinical decision support criteria, and India’s draft guidance builds on the matrix.',
    ],
    check: { prompt: 'Software that drives clinical management in a critical situation is in which N12 category?', options: ['I', 'II', 'III', 'IV'], answer: 'III', explain: 'Drive × critical = category III; treat or diagnose × critical = IV.' },
    source: 'IMDRF/SaMD WG/N12 FINAL:2014, Software as a Medical Device: Possible Framework for Risk Categorization',
  },
  {
    id: 'n81', title: 'IMDRF N81: characterising software and its own risks',
    body: [
      'N81 (January 2025) adds two things on top of N12, without replacing it: a structured way to characterise medical device software (what it does, its inputs and outputs, where it runs), and attention to risks that come from software itself, such as data quality, cybersecurity and changes after release.',
      'For AI, these are the questions that the US predetermined change control plan, the EU’s significant-change rules and India’s draft algorithm change protocol all ask in different words.',
    ],
    check: { prompt: 'What does N81 do to the N12 categories?', options: ['Builds on them without replacing them', 'Replaces them with five classes', 'Withdraws them', 'Makes them legally binding'], answer: 'Builds on them without replacing them', explain: 'N81 adds characterisation and software-specific risk; N12 remains.' },
    source: 'IMDRF/SaMD WG N81 (2025), Medical Device Software: Considerations for Device and Risk Characterization',
  },
]
