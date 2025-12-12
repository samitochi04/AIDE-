// Application constants

export const APP_NAME = 'AIDE+'
export const APP_DESCRIPTION = 'Votre guide pour les aides en France'

// API endpoints
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
}

// Also export as TIERS for compatibility
export const TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PLUS: 'plus',
  PREMIUM: 'premium',
}

// Tier limits
export const TIER_LIMITS = {
  [TIERS.FREE]: {
    aidesPerDay: 5,
    chatMessagesPerDay: 3,
    favorites: 3,
    simulationResults: 5,
  },
  [TIERS.BASIC]: {
    aidesPerDay: Infinity,
    chatMessagesPerDay: 20,
    favorites: Infinity,
    simulationResults: Infinity,
  },
  [TIERS.PLUS]: {
    aidesPerDay: Infinity,
    chatMessagesPerDay: Infinity,
    favorites: Infinity,
    simulationResults: Infinity,
  },
  [TIERS.PREMIUM]: {
    aidesPerDay: Infinity,
    chatMessagesPerDay: Infinity,
    favorites: Infinity,
    simulationResults: Infinity,
  },
}

// Pricing (in EUR)
export const PRICING = {
  [TIERS.BASIC]: { monthly: 4.99, yearly: 49.99 },
  [TIERS.PLUS]: { monthly: 9.99, yearly: 99.99 },
  [TIERS.PREMIUM]: { monthly: 14.99, yearly: 149.99 },
}

// Breakpoints (match CSS)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

// Animation durations
export const DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
}

// Languages
export const LANGUAGES = {
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  en: { code: 'en', name: 'English', flag: '🇬🇧' },
}

export const DEFAULT_LANGUAGE = 'fr'

// Residence statuses
export const RESIDENCE_STATUSES = [
  { value: 'french_citizen', labelKey: 'profile.residenceStatus.frenchCitizen' },
  { value: 'eu_citizen', labelKey: 'profile.residenceStatus.euCitizen' },
  { value: 'non_eu_with_permit', labelKey: 'profile.residenceStatus.nonEuWithPermit' },
  { value: 'non_eu_student', labelKey: 'profile.residenceStatus.nonEuStudent' },
  { value: 'refugee', labelKey: 'profile.residenceStatus.refugee' },
  { value: 'other', labelKey: 'profile.residenceStatus.other' },
]

// Employment statuses
export const EMPLOYMENT_STATUSES = [
  { value: 'employed', labelKey: 'profile.employmentStatus.employed' },
  { value: 'self_employed', labelKey: 'profile.employmentStatus.selfEmployed' },
  { value: 'unemployed', labelKey: 'profile.employmentStatus.unemployed' },
  { value: 'student', labelKey: 'profile.employmentStatus.student' },
  { value: 'retired', labelKey: 'profile.employmentStatus.retired' },
  { value: 'other', labelKey: 'profile.employmentStatus.other' },
]

// Family situations
export const FAMILY_SITUATIONS = [
  { value: 'single', labelKey: 'profile.familySituation.single' },
  { value: 'married', labelKey: 'profile.familySituation.married' },
  { value: 'pacs', labelKey: 'profile.familySituation.pacs' },
  { value: 'divorced', labelKey: 'profile.familySituation.divorced' },
  { value: 'widowed', labelKey: 'profile.familySituation.widowed' },
]

// Income brackets
export const INCOME_BRACKETS = [
  { value: 'low', labelKey: 'profile.incomeBracket.low', max: 15000 },
  { value: 'medium', labelKey: 'profile.incomeBracket.medium', max: 30000 },
  { value: 'high', labelKey: 'profile.incomeBracket.high', max: Infinity },
]

// French regions
export const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
]

// Regions with value/label for Select component
export const REGIONS = FRENCH_REGIONS.map((region) => ({
  // Normalize accented characters first, then convert to slug format
  value: region
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // Replace non-alphanumeric sequences with single dash
    .replace(/^-|-$/g, ''),          // Remove leading/trailing dashes
  label: region,
}))
