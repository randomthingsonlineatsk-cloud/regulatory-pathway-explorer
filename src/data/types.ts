// Copied from the Macaly version of the Global Regulatory Pathway Explorer (October 2026).
export type RegulatorKey =
  | 'FDA' | 'HC' | 'EMA' | 'MHRA' | 'SWISSMEDIC' | 'TGA' | 'PMDA' | 'NMPA'
  | 'CDSCO' | 'HSA' | 'MFDS' | 'ANVISA' | 'COFEPRIS' | 'SFDA' | 'SAHPRA' | 'WHO_PQ'
  | 'AMA' | 'NAFDAC' | 'ANMAT' | 'BPOM' | 'UAE_MOHAP'

export type ProductCategory =
  | 'small-molecule' | 'biologic' | 'vaccine' | 'cell-gene' | 'pediatric' | 'orphan'
  | 'generic' | 'biosimilar' | 'device' | 'diagnostic' | 'herbal' | 'homeopathy' | 'cosmetic'

export type PathwayShape = 'trial' | 'abbreviated' | 'device' | 'herbal' | 'cosmetic' | 'homeopathy'

export interface RegulatorParams {
  key: RegulatorKey
  name: string
  fullName: string
  region: string
  color: string
  confidence: 'high' | 'moderate'
  ctaName: string
  ctaAuthority: string
  ctaTimeline: string
  ctaMonths: number | null
  maName: string
  maAuthority: string
  maTimeline: string
  maMonths: number | null
  deviceClasses: string
  deviceRoute: string
  deviceAuthority: string
  ivdNote: string
  herbalRoute: string
  herbalAuthority: string
  herbalNote: string
  homeopathyRoute: string
  homeopathyAuthority: string
  genericRoute: string
  biosimilarRoute: string
  pediatricProgram: string
  orphanProgram: string
  cosmeticRoute: string
  cosmeticAuthority: string
  parentMinistry: string
  keyCommittees: string
  notableScope: string
  funFact: string
}

export interface Stage {
  id: string
  title: string
  detail: string
  authority?: string
  documents: string[]
}
