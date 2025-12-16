import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  ArrowRight,
  MessageSquare,
  Calculator,
  Bookmark,
  FileText,
  Home,
  Download,
  Check,
  Star
} from 'lucide-react'
import { TIERS, PRICING, TIER_LIMITS, YEARLY_SAVINGS } from '../../config/constants'

/**
 * Feature icons mapping
 */
const featureIcons = {
  aiMessages: MessageSquare,
  simulations: Calculator,
  savedAides: Bookmark,
  procedures: FileText,
  housing: Home,
  export: Download,
  content: FileText,
}

/**
 * Tier icons
 */
const tierIcons = {
  basic: Zap,
  premium: Star,
  ultimate: Crown,
}

/**
 * Tier colors
 */
const tierColors = {
  basic: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  },
  premium: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    popular: true,
  },
  ultimate: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
  },
}

/**
 * Upgrade Modal Component
 * Professional marketing modal shown when users hit subscription limits
 */
export function UpgradeModal({ 
  isOpen, 
  onClose, 
  feature = null,
  currentTier = 'free',
  usage = null,
  recommendedTier = null,
  message = null,
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [billingInterval, setBillingInterval] = useState('monthly')
  const isEnglish = i18n.language === 'en'

  // Determine which tier to recommend
  const suggestedTier = recommendedTier || (currentTier === 'free' ? 'basic' : 
    currentTier === 'basic' ? 'premium' : 'ultimate')

  // Get available tiers to upgrade to
  const getAvailableTiers = () => {
    const order = ['free', 'basic', 'premium', 'ultimate']
    const currentIndex = order.indexOf(currentTier)
    return order.slice(currentIndex + 1)
  }

  const availableTiers = getAvailableTiers()

  // Handle upgrade click
  const handleUpgrade = (tier) => {
    onClose()
    navigate(`/pricing?tier=${tier}&interval=${billingInterval}`)
  }

  // Get feature-specific messages
  const getFeatureMessage = () => {
    if (message) return message

    const messages = {
      aiMessages: {
        fr: "Vous avez utilisé tous vos messages IA pour aujourd'hui. Passez à un forfait supérieur pour continuer à discuter avec notre assistant intelligent.",
        en: "You've used all your AI messages for today. Upgrade to continue chatting with our intelligent assistant.",
      },
      simulations: {
        fr: "Vous avez atteint votre limite de simulations quotidiennes. Passez au niveau supérieur pour des simulations illimitées.",
        en: "You've reached your daily simulation limit. Upgrade for unlimited simulations.",
      },
      savedAides: {
        fr: "Votre liste de favoris est pleine. Passez à un forfait supérieur pour sauvegarder plus d'aides.",
        en: "Your favorites list is full. Upgrade to save more aides.",
      },
      procedures: {
        fr: "Vous suivez le maximum de procédures autorisé. Passez au niveau supérieur pour en suivre plus.",
        en: "You're tracking the maximum allowed procedures. Upgrade to track more.",
      },
      housing: {
        fr: "Vous avez atteint la limite de sites de logement sauvegardés. Passez à un forfait supérieur pour accéder à plus de plateformes.",
        en: "You've reached the housing sites limit. Upgrade to access more platforms.",
      },
      content: {
        fr: "Vous avez accédé à tous les contenus disponibles aujourd'hui. Passez à un forfait supérieur pour un accès illimité.",
        en: "You've accessed all available content today. Upgrade for unlimited access.",
      },
      export: {
        fr: "L'export de données est une fonctionnalité exclusive du plan Ultimate. Passez à Ultimate pour exporter toutes vos données.",
        en: "Data export is an Ultimate plan exclusive. Upgrade to Ultimate to export all your data.",
      },
    }

    return messages[feature]?.[isEnglish ? 'en' : 'fr'] || messages.aiMessages[isEnglish ? 'en' : 'fr']
  }

  // Get title based on feature
  const getTitle = () => {
    const titles = {
      aiMessages: { fr: "Limite de messages IA atteinte", en: "AI Message Limit Reached" },
      simulations: { fr: "Limite de simulations atteinte", en: "Simulation Limit Reached" },
      savedAides: { fr: "Limite de sauvegardes atteinte", en: "Save Limit Reached" },
      procedures: { fr: "Limite de procédures atteinte", en: "Procedure Limit Reached" },
      housing: { fr: "Limite de logements atteinte", en: "Housing Limit Reached" },
      content: { fr: "Limite de contenus atteinte", en: "Content Limit Reached" },
      export: { fr: "Fonctionnalité Premium", en: "Premium Feature" },
    }

    return titles[feature]?.[isEnglish ? 'en' : 'fr'] || 
      (isEnglish ? "Upgrade Your Plan" : "Passez au niveau supérieur")
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header with gradient */}
          <div className="relative overflow-hidden px-6 pt-8 pb-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 dark:bg-primary-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {isEnglish ? 'Unlock More' : 'Débloquez plus'}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {getTitle()}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 max-w-lg">
                {getFeatureMessage()}
              </p>

              {/* Usage indicator */}
              {usage && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isEnglish 
                      ? `${usage.current} / ${usage.limit} used`
                      : `${usage.current} / ${usage.limit} utilisés`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {isEnglish ? 'Monthly' : 'Mensuel'}
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  billingInterval === 'yearly'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {isEnglish ? 'Yearly' : 'Annuel'}
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                  -17%
                </span>
              </button>
            </div>

            {/* Tier cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {availableTiers.map((tier) => {
                const TierIcon = tierIcons[tier]
                const colors = tierColors[tier]
                const limits = TIER_LIMITS[tier]
                const price = billingInterval === 'monthly' 
                  ? PRICING[tier].monthly 
                  : PRICING[tier].yearly
                const savings = YEARLY_SAVINGS[tier]
                const isRecommended = tier === suggestedTier

                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative p-5 rounded-xl border-2 ${colors.border} ${colors.bg} ${
                      isRecommended ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                    }`}
                  >
                    {/* Popular badge */}
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full shadow-lg">
                          {isEnglish ? 'RECOMMENDED' : 'RECOMMANDÉ'}
                        </span>
                      </div>
                    )}

                    {/* Tier header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg ${colors.badge}`}>
                        <TierIcon className="w-4 h-4" />
                      </div>
                      <h3 className={`font-bold ${colors.text}`}>
                        {isEnglish ? limits.nameEn : limits.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {price.toFixed(2)}€
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /{billingInterval === 'monthly' 
                          ? (isEnglish ? 'mo' : 'mois') 
                          : (isEnglish ? 'year' : 'an')}
                      </span>
                      {billingInterval === 'yearly' && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                          {isEnglish ? `Save ${savings}%` : `Économisez ${savings}%`}
                        </span>
                      )}
                    </div>

                    {/* Key features */}
                    <ul className="space-y-2 mb-4">
                      {(isEnglish ? limits.featuresEn : limits.features).slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    <button
                      onClick={() => handleUpgrade(tier)}
                      className={`w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${colors.button}`}
                    >
                      {isEnglish ? 'Choose' : 'Choisir'} {isEnglish ? limits.nameEn : limits.name}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {/* View all plans link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  onClose()
                  navigate('/pricing')
                }}
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
              >
                {isEnglish ? 'View all plans and features' : 'Voir tous les forfaits et fonctionnalités'}
                <ArrowRight className="w-4 h-4 inline-block ml-1" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  {isEnglish ? 'Cancel anytime' : 'Annulation à tout moment'}
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  {isEnglish ? 'Secure payment' : 'Paiement sécurisé'}
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  {isEnglish ? '14-day refund' : 'Remboursement 14 jours'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default UpgradeModal
