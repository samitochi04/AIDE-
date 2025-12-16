import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { TIER_LIMITS, PRICING, TIERS } from '../config/constants'
import api from '../config/api'

/**
 * Hook for managing subscription state and limit checking
 * @returns {Object} Subscription utilities and state
 */
export function useSubscription() {
  const { user, profile } = useAuth()
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState(null)

  // Get current tier from profile
  const currentTier = useMemo(() => {
    return profile?.subscription_tier || 'free'
  }, [profile])

  // Get tier limits
  const limits = useMemo(() => {
    return TIER_LIMITS[currentTier] || TIER_LIMITS.free
  }, [currentTier])

  // Get tier pricing
  const pricing = useMemo(() => {
    return PRICING[currentTier] || PRICING.free
  }, [currentTier])

  // Check if user is on free tier
  const isFree = useMemo(() => currentTier === 'free', [currentTier])

  // Check if user is on paid tier
  const isPaid = useMemo(() => ['basic', 'premium', 'ultimate'].includes(currentTier), [currentTier])

  // Check if user is on premium or higher
  const isPremiumPlus = useMemo(() => ['premium', 'ultimate'].includes(currentTier), [currentTier])

  // Check if user is on ultimate
  const isUltimate = useMemo(() => currentTier === 'ultimate', [currentTier])

  /**
   * Fetch current usage stats from server
   */
  const fetchUsage = useCallback(async () => {
    if (!user) return null
    
    setLoading(true)
    try {
      const response = await api.get('/subscription/usage')
      setUsage(response.data.data)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Check if a specific feature action is allowed
   * @param {string} feature - Feature name (aiMessages, simulations, savedAides, procedures, content, export)
   * @returns {Object} { allowed, current, limit, remaining }
   */
  const checkLimit = useCallback(async (feature) => {
    if (!user) {
      return { allowed: false, reason: 'auth_required' }
    }

    try {
      const response = await api.get(`/subscription/check/${feature}`)
      return response.data.data
    } catch (error) {
      // If API fails, use local limits as fallback
      console.error('Failed to check limit:', error)
      return { allowed: true }
    }
  }, [user])

  /**
   * Show upgrade modal with specific reason
   * @param {string} feature - Feature that triggered the upgrade prompt
   * @param {Object} usageInfo - Usage information { current, limit, tier }
   * @param {string} message - Custom message to display
   */
  const promptUpgrade = useCallback((feature, usageInfo = null, message = null) => {
    setUpgradeReason({
      feature,
      usage: usageInfo,
      message,
      currentTier,
    })
    setShowUpgradeModal(true)
  }, [currentTier])

  /**
   * Close upgrade modal
   */
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false)
    setUpgradeReason(null)
  }, [])

  /**
   * Handle API response that indicates limit exceeded
   * @param {Object} response - API error response
   * @returns {boolean} True if this was a limit error that was handled
   */
  const handleLimitError = useCallback((error) => {
    const data = error.response?.data
    
    if (data?.error === 'limit_exceeded') {
      promptUpgrade(
        data.feature || 'unknown',
        {
          current: data.current,
          limit: data.limit,
          tier: data.tier,
        },
        data.message
      )
      return true
    }
    
    return false
  }, [promptUpgrade])

  /**
   * Get recommended upgrade tier based on current usage
   */
  const getRecommendedTier = useCallback(async () => {
    if (!user) return 'basic'

    try {
      const response = await api.get('/subscription/recommend')
      return response.data.data.recommendedTier || 'basic'
    } catch (error) {
      // Default recommendation logic
      if (currentTier === 'free') return 'basic'
      if (currentTier === 'basic') return 'premium'
      return 'ultimate'
    }
  }, [user, currentTier])

  /**
   * Create checkout session for upgrade
   * @param {string} tier - Target tier
   * @param {string} interval - Billing interval (monthly/yearly)
   */
  const createCheckout = useCallback(async (tier, interval = 'monthly') => {
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      const response = await api.post('/subscription/checkout', { tier, interval })
      const data = response.data.data
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
      
      return data
    } catch (error) {
      console.error('Failed to create checkout:', error)
      throw error
    }
  }, [user])

  /**
   * Get tier comparison for upgrade decisions
   */
  const getTierComparison = useCallback((targetTier) => {
    const currentLimits = TIER_LIMITS[currentTier] || TIER_LIMITS.free
    const targetLimits = TIER_LIMITS[targetTier] || TIER_LIMITS.free

    return {
      current: {
        tier: currentTier,
        limits: currentLimits,
        pricing: PRICING[currentTier],
      },
      target: {
        tier: targetTier,
        limits: targetLimits,
        pricing: PRICING[targetTier],
      },
      improvements: {
        aiMessages: targetLimits.aiMessagesPerDay - currentLimits.aiMessagesPerDay,
        unlimitedSimulations: !currentLimits.unlimitedSimulations && targetLimits.unlimitedSimulations,
        unlimitedSaves: !currentLimits.unlimitedSaves && targetLimits.unlimitedSaves,
        dataExport: !currentLimits.dataExport && targetLimits.dataExport,
        prioritySupport: currentLimits.supportLevel !== 'priority' && targetLimits.supportLevel === 'priority',
      },
    }
  }, [currentTier])

  return {
    // State
    currentTier,
    limits,
    pricing,
    usage,
    loading,
    showUpgradeModal,
    upgradeReason,

    // Tier checks
    isFree,
    isPaid,
    isPremiumPlus,
    isUltimate,

    // Methods
    fetchUsage,
    checkLimit,
    promptUpgrade,
    closeUpgradeModal,
    handleLimitError,
    getRecommendedTier,
    createCheckout,
    getTierComparison,
  }
}

export default useSubscription
