import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { TIER_LIMITS, PRICING, YEARLY_SAVINGS } from '../../../config/constants'
import styles from './UpgradeModal.module.css'

/**
 * Upgrade Modal Component
 * Professional marketing modal shown when users hit subscription limits
 */
export function UpgradeModal({ 
  isOpen, 
  onClose, 
  feature = null,
  currentTier = 'free',
  currentUsage = null,
  limit = null,
  recommendedTier = null,
  message = null,
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [billingInterval, setBillingInterval] = useState('monthly')
  const isEnglish = i18n.language === 'en'

  // Determine which tier to recommend - Premium is always the best value
  const suggestedTier = recommendedTier || 'premium'

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
  // Always use built-in translations based on feature type, ignoring server message
  // This ensures proper i18n support
  const getFeatureMessage = () => {
    const messages = {
      aiMessages: {
        fr: "Vous avez utilisé tous vos messages IA pour aujourd'hui. Passez à un forfait supérieur pour continuer à discuter avec notre assistant intelligent.",
        en: "You've used all your AI messages for today. Upgrade to continue chatting with our intelligent assistant.",
      },
      simulations: {
        fr: "Vous avez atteint votre limite de simulations. Passez au niveau supérieur pour des simulations illimitées.",
        en: "You've reached your simulation limit. Upgrade for unlimited simulations.",
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
        fr: "Vous avez atteint la limite de sites de logement. Passez à un forfait supérieur pour accéder à plus de plateformes.",
        en: "You've reached the housing sites limit. Upgrade to access more platforms.",
      },
      content: {
        fr: "Vous avez accédé à tous les contenus disponibles. Passez à un forfait supérieur pour un accès illimité.",
        en: "You've accessed all available content. Upgrade for unlimited access.",
      },
      export: {
        fr: "L'export de données est une fonctionnalité exclusive du plan Ultimate. Passez à Ultimate pour exporter toutes vos données.",
        en: "Data export is an Ultimate plan exclusive. Upgrade to Ultimate to export all your data.",
      },
    }

    return messages[feature]?.[isEnglish ? 'en' : 'fr'] || messages.simulations[isEnglish ? 'en' : 'fr']
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

  // Tier icons
  const tierIcons = {
    basic: 'ri-flashlight-line',
    premium: 'ri-star-line',
    ultimate: 'ri-vip-crown-line',
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.backdrop}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={styles.modal}
          >
            {/* Close button */}
            <button onClick={onClose} className={styles.closeButton}>
              <i className="ri-close-line" style={{ fontSize: '1.25rem' }} />
            </button>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerGlow} />
              <div className={styles.headerContent}>
                <div className={styles.badge}>
                  <i className="ri-sparkle-line" />
                  {isEnglish ? 'Unlock More' : 'Débloquez plus'}
                </div>
                
                <h2 className={styles.title}>{getTitle()}</h2>
                <p className={styles.description}>{getFeatureMessage()}</p>

                {/* Usage indicator */}
                {currentUsage !== null && limit !== null && (
                  <div className={styles.usageIndicator}>
                    <div className={styles.usageDot} />
                    <span>
                      {isEnglish 
                        ? `${currentUsage} / ${limit} used`
                        : `${currentUsage} / ${limit} utilisés`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {/* Billing toggle */}
              <div className={styles.billingToggle}>
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`${styles.billingButton} ${billingInterval === 'monthly' ? styles.active : ''}`}
                >
                  {isEnglish ? 'Monthly' : 'Mensuel'}
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`${styles.billingButton} ${billingInterval === 'yearly' ? styles.active : ''}`}
                >
                  {isEnglish ? 'Yearly' : 'Annuel'}
                  <span className={styles.savingsBadge}>-17%</span>
                </button>
              </div>

              {/* Tier cards */}
              <div className={styles.tiersGrid}>
                {availableTiers.map((tier) => {
                  const limits = TIER_LIMITS[tier]
                  const price = billingInterval === 'monthly' 
                    ? PRICING[tier]?.monthly 
                    : PRICING[tier]?.yearly
                  const savings = YEARLY_SAVINGS?.[tier]
                  const isRecommended = tier === suggestedTier

                  if (!limits || !PRICING[tier]) return null

                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${styles.tierCard} ${styles[tier]} ${isRecommended ? styles.recommended : ''}`}
                    >
                      {/* Recommended badge */}
                      {isRecommended && (
                        <div className={styles.recommendedBadge}>
                          {isEnglish ? 'RECOMMENDED' : 'RECOMMANDÉ'}
                        </div>
                      )}

                      {/* Tier header */}
                      <div className={styles.tierHeader}>
                        <div className={`${styles.tierIcon} ${styles[tier]}`}>
                          <i className={tierIcons[tier]} />
                        </div>
                        <h3 className={`${styles.tierName} ${styles[tier]}`}>
                          {isEnglish ? limits.nameEn : limits.name}
                        </h3>
                      </div>

                      {/* Price */}
                      <div className={styles.priceWrapper}>
                        <span className={styles.price}>{price?.toFixed(2)}€</span>
                        <span className={styles.pricePeriod}>
                          /{billingInterval === 'monthly' 
                            ? (isEnglish ? 'mo' : 'mois') 
                            : (isEnglish ? 'year' : 'an')}
                        </span>
                        {billingInterval === 'yearly' && savings && (
                          <span className={styles.yearlySavings}>
                            {isEnglish ? `Save ${savings}%` : `-${savings}%`}
                          </span>
                        )}
                      </div>

                      {/* Key features */}
                      <ul className={styles.featuresList}>
                        {(isEnglish ? limits.featuresEn : limits.features)?.slice(0, 4).map((feat, idx) => (
                          <li key={idx} className={styles.featureItem}>
                            <i className="ri-check-line" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <button
                        onClick={() => handleUpgrade(tier)}
                        className={`${styles.ctaButton} ${styles[tier]}`}
                      >
                        {isEnglish ? 'Choose' : 'Choisir'} {isEnglish ? limits.nameEn : limits.name}
                        <i className="ri-arrow-right-line" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* View all plans link */}
              <button
                onClick={() => {
                  onClose()
                  navigate('/pricing')
                }}
                className={styles.viewAllLink}
              >
                {isEnglish ? 'View all plans and features' : 'Voir tous les forfaits et fonctionnalités'}
                <i className="ri-arrow-right-line" />
              </button>

              {/* Trust badges */}
              <div className={styles.trustBadges}>
                <span className={styles.trustItem}>
                  <i className="ri-check-line" />
                  {isEnglish ? 'Cancel anytime' : 'Annulation à tout moment'}
                </span>
                <span className={styles.trustItem}>
                  <i className="ri-check-line" />
                  {isEnglish ? 'Secure payment' : 'Paiement sécurisé'}
                </span>
                <span className={styles.trustItem}>
                  <i className="ri-check-line" />
                  {isEnglish ? '14-day refund' : 'Remboursement 14 jours'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

export default UpgradeModal
