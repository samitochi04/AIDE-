// Application constants

export const APP_NAME = 'AIDE+'
export const APP_DESCRIPTION = 'Votre guide pour les aides en France'

// API endpoints
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ULTIMATE: 'ultimate',
}

// Also export as TIERS for compatibility
export const TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ULTIMATE: 'ultimate',
}

/**
 * Subscription Tier Limits
 * These match the server-side limits in server/src/utils/constants.js
 */
export const TIER_LIMITS = {
  [TIERS.FREE]: {
    name: 'Gratuit',
    nameEn: 'Free',
    // Aides
    aides: 3, // Number of aides accessible
    allAides: false,
    // Simulations  
    simulationsPerDay: 5,
    unlimitedSimulations: false,
    // Guarantor services
    guarantorServices: 1,
    // Housing sites
    housingSites: 5,
    allHousingSites: false,
    // Saved aides
    savedAides: 4,
    unlimitedSaves: false,
    // Procedures
    procedures: 2,
    unlimitedProcedures: false,
    // Content/tutorials
    contentsAccess: 5,
    allContents: false,
    // AI assistant
    aiMessagesPerDay: 3,
    // Data export
    dataExport: false,
    // Support level
    supportLevel: 'community',
    // Features summary for display
    features: [
      '3 aides accessibles',
      '5 simulations par jour',
      '1 service de garant',
      '5 sites de logement',
      '4 aides sauvegardées',
      '2 procédures suivies',
      '5 contenus par jour',
      '3 messages IA par jour',
      'Support communautaire',
    ],
    featuresEn: [
      '3 accessible aides',
      '5 simulations per day',
      '1 guarantor service',
      '5 housing sites',
      '4 saved aides',
      '2 tracked procedures',
      '5 contents per day',
      '3 AI messages per day',
      'Community support',
    ],
  },
  [TIERS.BASIC]: {
    name: 'Basic',
    nameEn: 'Basic',
    aides: Infinity,
    allAides: true,
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    guarantorServices: Infinity,
    housingSites: 15,
    allHousingSites: false,
    savedAides: 10,
    unlimitedSaves: false,
    procedures: 10,
    unlimitedProcedures: false,
    contentsAccess: 15,
    allContents: false,
    aiMessagesPerDay: 20,
    dataExport: false,
    supportLevel: 'community',
    features: [
      'Toutes les aides',
      'Simulations illimitées',
      'Tous les services de garant',
      '15 sites de logement',
      '10 aides sauvegardées',
      '10 procédures suivies',
      '15 contenus par jour',
      '20 messages IA par jour',
      'Support communautaire',
    ],
    featuresEn: [
      'All aides',
      'Unlimited simulations',
      'All guarantor services',
      '15 housing sites',
      '10 saved aides',
      '10 tracked procedures',
      '15 contents per day',
      '20 AI messages per day',
      'Community support',
    ],
  },
  [TIERS.PREMIUM]: {
    name: 'Premium',
    nameEn: 'Premium',
    aides: Infinity,
    allAides: true,
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    guarantorServices: Infinity,
    housingSites: Infinity,
    allHousingSites: true,
    savedAides: Infinity,
    unlimitedSaves: true,
    procedures: Infinity,
    unlimitedProcedures: true,
    contentsAccess: Infinity,
    allContents: true,
    aiMessagesPerDay: 60,
    dataExport: false,
    supportLevel: 'priority',
    features: [
      'Toutes les aides',
      'Simulations illimitées',
      'Tous les services de garant',
      'Tous les sites de logement',
      'Sauvegardes illimitées',
      'Procédures illimitées',
      'Tous les contenus',
      '60 messages IA par jour',
      'Support prioritaire',
    ],
    featuresEn: [
      'All aides',
      'Unlimited simulations',
      'All guarantor services',
      'All housing sites',
      'Unlimited saves',
      'Unlimited procedures',
      'All contents',
      '60 AI messages per day',
      'Priority support',
    ],
  },
  [TIERS.ULTIMATE]: {
    name: 'Ultimate',
    nameEn: 'Ultimate',
    aides: Infinity,
    allAides: true,
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    guarantorServices: Infinity,
    housingSites: Infinity,
    allHousingSites: true,
    savedAides: Infinity,
    unlimitedSaves: true,
    procedures: Infinity,
    unlimitedProcedures: true,
    contentsAccess: Infinity,
    allContents: true,
    aiMessagesPerDay: 300,
    dataExport: true,
    supportLevel: 'priority',
    features: [
      'Toutes les aides',
      'Simulations illimitées',
      'Tous les services de garant',
      'Tous les sites de logement',
      'Sauvegardes illimitées',
      'Procédures illimitées',
      'Tous les contenus',
      '300 messages IA par jour',
      'Export de données',
      'Support prioritaire',
    ],
    featuresEn: [
      'All aides',
      'Unlimited simulations',
      'All guarantor services',
      'All housing sites',
      'Unlimited saves',
      'Unlimited procedures',
      'All contents',
      '300 AI messages per day',
      'Data export',
      'Priority support',
    ],
  },
}

// Pricing (in EUR)
export const PRICING = {
  [TIERS.FREE]: { monthly: 0, yearly: 0 },
  [TIERS.BASIC]: { monthly: 4.99, yearly: 49.99 },
  [TIERS.PREMIUM]: { monthly: 9.99, yearly: 99.99 },
  [TIERS.ULTIMATE]: { monthly: 14.99, yearly: 149.99 },
}

// Calculate yearly savings percentage
export const YEARLY_SAVINGS = {
  [TIERS.BASIC]: Math.round((1 - (49.99 / (4.99 * 12))) * 100),
  [TIERS.PREMIUM]: Math.round((1 - (99.99 / (9.99 * 12))) * 100),
  [TIERS.ULTIMATE]: Math.round((1 - (149.99 / (14.99 * 12))) * 100),
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
