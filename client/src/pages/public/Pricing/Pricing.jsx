import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Crown, 
  Sparkles,
  MessageSquare,
  Calculator,
  Home,
  FileText,
  BookOpen,
  Headphones,
  Shield,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button, Card } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import { PRICING } from '../../../config/constants';
import { API_ENDPOINTS, api } from '../../../config/api';
import styles from './Pricing.module.css';

// Professional tier configurations with marketing copy
const getTierConfig = (isEnglish) => ({
  free: {
    id: 'free',
    name: isEnglish ? 'Starter' : 'Découverte',
    tagline: isEnglish ? 'Perfect for getting started' : 'Idéal pour commencer',
    icon: Sparkles,
    color: 'gray',
    features: [
      { 
        category: isEnglish ? 'Benefits Discovery' : 'Découverte des aides',
        icon: Calculator,
        items: [
          { text: isEnglish ? '3 government benefits' : '3 aides gouvernementales', included: true },
          { text: isEnglish ? '5 simulations per day' : '5 simulations par jour', included: true },
        ]
      },
      {
        category: isEnglish ? 'Housing Search' : 'Recherche de logement',
        icon: Home,
        items: [
          { text: isEnglish ? '1 guarantor service' : '1 service de garant', included: true },
          { text: isEnglish ? '5 housing platforms' : '5 plateformes de logement', included: true },
          { text: isEnglish ? '4 saved favorites' : '4 favoris sauvegardés', included: true },
        ]
      },
      {
        category: isEnglish ? 'Procedure Tracking' : 'Suivi des démarches',
        icon: FileText,
        items: [
          { text: isEnglish ? '2 active procedures' : '2 démarches actives', included: true },
        ]
      },
      {
        category: isEnglish ? 'Learning Resources' : 'Ressources d\'apprentissage',
        icon: BookOpen,
        items: [
          { text: isEnglish ? '5 tutorials & guides daily' : '5 tutoriels & guides par jour', included: true },
        ]
      },
      {
        category: isEnglish ? 'AI Assistant' : 'Assistant IA',
        icon: MessageSquare,
        items: [
          { text: isEnglish ? '3 AI messages per day' : '3 messages IA par jour', included: true },
        ]
      },
      {
        category: isEnglish ? 'Support & Export' : 'Support & Export',
        icon: Headphones,
        items: [
          { text: isEnglish ? 'Community support' : 'Support communautaire', included: true },
          { text: isEnglish ? 'Data export' : 'Export des données', included: false },
        ]
      },
    ],
    cta: isEnglish ? 'Get Started Free' : 'Commencer gratuitement',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    tagline: isEnglish ? 'For serious benefit seekers' : 'Pour les demandeurs sérieux',
    icon: Zap,
    color: 'blue',
    features: [
      { 
        category: isEnglish ? 'Benefits Discovery' : 'Découverte des aides',
        icon: Calculator,
        items: [
          { text: isEnglish ? 'All government benefits' : 'Toutes les aides gouvernementales', included: true, highlight: true },
          { text: isEnglish ? 'Unlimited simulations' : 'Simulations illimitées', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Housing Search' : 'Recherche de logement',
        icon: Home,
        items: [
          { text: isEnglish ? 'All guarantor services' : 'Tous les services de garant', included: true, highlight: true },
          { text: isEnglish ? '15 housing platforms' : '15 plateformes de logement', included: true },
          { text: isEnglish ? '10 saved favorites' : '10 favoris sauvegardés', included: true },
        ]
      },
      {
        category: isEnglish ? 'Procedure Tracking' : 'Suivi des démarches',
        icon: FileText,
        items: [
          { text: isEnglish ? '10 active procedures' : '10 démarches actives', included: true },
        ]
      },
      {
        category: isEnglish ? 'Learning Resources' : 'Ressources d\'apprentissage',
        icon: BookOpen,
        items: [
          { text: isEnglish ? '15 tutorials & guides daily' : '15 tutoriels & guides par jour', included: true },
        ]
      },
      {
        category: isEnglish ? 'AI Assistant' : 'Assistant IA',
        icon: MessageSquare,
        items: [
          { text: isEnglish ? '20 AI messages per day' : '20 messages IA par jour', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Support & Export' : 'Support & Export',
        icon: Headphones,
        items: [
          { text: isEnglish ? 'Community support' : 'Support communautaire', included: true },
          { text: isEnglish ? 'Data export' : 'Export des données', included: false },
        ]
      },
    ],
    cta: isEnglish ? 'Start Basic Plan' : 'Choisir Basic',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: isEnglish ? 'Most popular for full access' : 'Le plus populaire pour un accès complet',
    icon: Star,
    color: 'purple',
    popular: true,
    features: [
      { 
        category: isEnglish ? 'Benefits Discovery' : 'Découverte des aides',
        icon: Calculator,
        items: [
          { text: isEnglish ? 'All government benefits' : 'Toutes les aides gouvernementales', included: true },
          { text: isEnglish ? 'Unlimited simulations' : 'Simulations illimitées', included: true },
        ]
      },
      {
        category: isEnglish ? 'Housing Search' : 'Recherche de logement',
        icon: Home,
        items: [
          { text: isEnglish ? 'All guarantor services' : 'Tous les services de garant', included: true },
          { text: isEnglish ? 'All housing platforms' : 'Toutes les plateformes', included: true, highlight: true },
          { text: isEnglish ? 'Unlimited favorites' : 'Favoris illimités', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Procedure Tracking' : 'Suivi des démarches',
        icon: FileText,
        items: [
          { text: isEnglish ? 'Unlimited procedures' : 'Démarches illimitées', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Learning Resources' : 'Ressources d\'apprentissage',
        icon: BookOpen,
        items: [
          { text: isEnglish ? 'All tutorials & guides' : 'Tous les tutoriels & guides', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'AI Assistant' : 'Assistant IA',
        icon: MessageSquare,
        items: [
          { text: isEnglish ? '60 AI messages per day' : '60 messages IA par jour', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Support & Export' : 'Support & Export',
        icon: Headphones,
        items: [
          { text: isEnglish ? 'Priority support' : 'Support prioritaire', included: true, highlight: true },
          { text: isEnglish ? 'Data export' : 'Export des données', included: false },
        ]
      },
    ],
    cta: isEnglish ? 'Go Premium' : 'Passer Premium',
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate',
    tagline: isEnglish ? 'Maximum power for professionals' : 'Puissance maximale pour les pros',
    icon: Crown,
    color: 'amber',
    features: [
      { 
        category: isEnglish ? 'Benefits Discovery' : 'Découverte des aides',
        icon: Calculator,
        items: [
          { text: isEnglish ? 'All government benefits' : 'Toutes les aides gouvernementales', included: true },
          { text: isEnglish ? 'Unlimited simulations' : 'Simulations illimitées', included: true },
        ]
      },
      {
        category: isEnglish ? 'Housing Search' : 'Recherche de logement',
        icon: Home,
        items: [
          { text: isEnglish ? 'All guarantor services' : 'Tous les services de garant', included: true },
          { text: isEnglish ? 'All housing platforms' : 'Toutes les plateformes', included: true },
          { text: isEnglish ? 'Unlimited favorites' : 'Favoris illimités', included: true },
        ]
      },
      {
        category: isEnglish ? 'Procedure Tracking' : 'Suivi des démarches',
        icon: FileText,
        items: [
          { text: isEnglish ? 'Unlimited procedures' : 'Démarches illimitées', included: true },
        ]
      },
      {
        category: isEnglish ? 'Learning Resources' : 'Ressources d\'apprentissage',
        icon: BookOpen,
        items: [
          { text: isEnglish ? 'All tutorials & guides' : 'Tous les tutoriels & guides', included: true },
        ]
      },
      {
        category: isEnglish ? 'AI Assistant' : 'Assistant IA',
        icon: MessageSquare,
        items: [
          { text: isEnglish ? '300 AI messages per day' : '300 messages IA par jour', included: true, highlight: true },
        ]
      },
      {
        category: isEnglish ? 'Support & Export' : 'Support & Export',
        icon: Headphones,
        items: [
          { text: isEnglish ? 'Priority support' : 'Support prioritaire', included: true },
          { text: isEnglish ? 'Full data export' : 'Export complet des données', included: true, highlight: true },
        ]
      },
    ],
    cta: isEnglish ? 'Go Ultimate' : 'Passer Ultimate',
  },
});

// Color mapping for tier cards
const tierColors = {
  gray: {
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-300',
  },
};

export function Pricing() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const [billingPeriod, setBillingPeriod] = useState(searchParams.get('interval') || 'monthly');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const isEnglish = i18n.language === 'en';
  
  const tierConfig = getTierConfig(isEnglish);
  const plans = [tierConfig.free, tierConfig.basic, tierConfig.premium, tierConfig.ultimate];

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      navigate(user ? ROUTES.DASHBOARD : ROUTES.REGISTER);
      return;
    }
    
    // For paid plans, user must be logged in
    if (!user) {
      // Redirect to register with plan info
      navigate(`${ROUTES.REGISTER}?plan=${planId}&interval=${billingPeriod}`);
      return;
    }
    
    // User is logged in, create checkout session
    setLoadingPlan(planId);
    try {
      const response = await api.post(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT, { 
        tier: planId, 
        interval: billingPeriod 
      });
      
      const data = response.data || response;
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(
        isEnglish 
          ? 'Failed to start checkout. Please try again.' 
          : 'Échec du démarrage du paiement. Veuillez réessayer.'
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const faqs = [
    {
      question: isEnglish ? 'Can I switch plans at any time?' : 'Puis-je changer de forfait à tout moment ?',
      answer: isEnglish 
        ? 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the difference.'
        : 'Oui ! Vous pouvez passer à un forfait supérieur ou inférieur à tout moment. Les changements prennent effet immédiatement et nous calculons au prorata.',
    },
    {
      question: isEnglish ? 'Is my payment secure?' : 'Mon paiement est-il sécurisé ?',
      answer: isEnglish
        ? 'Absolutely. We use Stripe, a PCI-compliant payment processor trusted by millions of businesses worldwide. Your payment information is encrypted and never stored on our servers.'
        : 'Absolument. Nous utilisons Stripe, un processeur de paiement certifié PCI, utilisé par des millions d\'entreprises dans le monde. Vos informations de paiement sont chiffrées et jamais stockées sur nos serveurs.',
    },
    {
      question: isEnglish ? 'What\'s the difference between monthly and yearly billing?' : 'Quelle est la différence entre la facturation mensuelle et annuelle ?',
      answer: isEnglish
        ? 'Yearly billing saves you approximately 17% compared to monthly billing. You\'ll be charged once per year instead of monthly, and you can cancel anytime with a prorated refund.'
        : 'La facturation annuelle vous fait économiser environ 17% par rapport à la facturation mensuelle. Vous êtes facturé une fois par an au lieu de chaque mois, et vous pouvez annuler à tout moment avec un remboursement au prorata.',
    },
    {
      question: isEnglish ? 'What happens to my data if I cancel?' : 'Qu\'advient-il de mes données si j\'annule ?',
      answer: isEnglish
        ? 'Your data belongs to you. If you cancel, you can export all your data before your subscription ends. After cancellation, your data is retained for 30 days before permanent deletion.'
        : 'Vos données vous appartiennent. Si vous annulez, vous pouvez exporter toutes vos données avant la fin de votre abonnement. Après annulation, vos données sont conservées 30 jours avant suppression définitive.',
    },
    {
      question: isEnglish ? 'Do you offer refunds?' : 'Proposez-vous des remboursements ?',
      answer: isEnglish
        ? 'Yes, we offer a 14-day money-back guarantee. If you\'re not satisfied with your subscription, contact us within 14 days for a full refund.'
        : 'Oui, nous offrons une garantie de remboursement de 14 jours. Si vous n\'êtes pas satisfait de votre abonnement, contactez-nous dans les 14 jours pour un remboursement complet.',
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{isEnglish ? 'Pricing Plans' : 'Nos Tarifs'} | AIDE+</title>
        <meta name="description" content={isEnglish 
          ? 'Choose the perfect plan for your needs. Start free and upgrade to unlock unlimited benefits simulation, AI assistance, and priority support.'
          : 'Choisissez le forfait parfait pour vos besoins. Commencez gratuitement et passez à un forfait supérieur pour des simulations illimitées, l\'assistant IA et le support prioritaire.'
        } />
      </Helmet>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>
            {isEnglish ? 'Simple, Transparent Pricing' : 'Tarification simple et transparente'}
          </span>
          <h1 className={styles.title}>
            {isEnglish ? 'Choose Your Plan' : 'Choisissez Votre Forfait'}
          </h1>
          <p className={styles.subtitle}>
            {isEnglish 
              ? 'Start free and scale as you grow. All plans include core features with no hidden fees.'
              : 'Commencez gratuitement et évoluez selon vos besoins. Tous les forfaits incluent les fonctionnalités essentielles, sans frais cachés.'
            }
          </p>

          {/* Billing Toggle */}
          <div className={styles.billingToggle}>
            <button
              className={`${styles.toggleBtn} ${billingPeriod === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {isEnglish ? 'Monthly' : 'Mensuel'}
            </button>
            <button
              className={`${styles.toggleBtn} ${billingPeriod === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              {isEnglish ? 'Yearly' : 'Annuel'}
              <span className={styles.saveBadge}>-17%</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className={styles.plansSection}>
        <div className={styles.plansGrid}>
          {plans.map((plan, index) => {
            const TierIcon = plan.icon;
            const colors = tierColors[plan.color];
            const price = PRICING[plan.id];
            const displayPrice = billingPeriod === 'monthly' ? price.monthly : price.yearly;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={styles.planWrapper}
              >
                <Card className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}>
                  {plan.popular && (
                    <span className={styles.popularBadge}>
                      {isEnglish ? 'Most Popular' : 'Plus populaire'}
                    </span>
                  )}
                  
                  <div className={styles.planHeader}>
                    <div className={`${styles.planIcon} ${colors.badge}`}>
                      <TierIcon className="w-5 h-5" />
                    </div>
                    <h2 className={styles.planName}>{plan.name}</h2>
                    <p className={styles.planTagline}>{plan.tagline}</p>
                  </div>

                  <div className={styles.planPrice}>
                    <span className={styles.currency}>€</span>
                    <span className={styles.amount}>{displayPrice.toFixed(2)}</span>
                    {price.monthly > 0 && (
                      <span className={styles.period}>
                        /{billingPeriod === 'monthly' 
                          ? (isEnglish ? 'mo' : 'mois') 
                          : (isEnglish ? 'yr' : 'an')}
                      </span>
                    )}
                  </div>

                  {billingPeriod === 'yearly' && price.monthly > 0 && (
                    <p className={styles.yearlyNote}>
                      {isEnglish 
                        ? `Save €${((price.monthly * 12) - price.yearly).toFixed(2)} per year`
                        : `Économisez ${((price.monthly * 12) - price.yearly).toFixed(2)}€ par an`
                      }
                    </p>
                  )}

                  <div className={styles.featuresContainer}>
                    {plan.features.map((category, catIdx) => {
                      const CategoryIcon = category.icon;
                      return (
                        <div key={catIdx} className={styles.featureCategory}>
                          <div className={styles.categoryHeader}>
                            <CategoryIcon className="w-4 h-4 text-gray-500" />
                            <span className={styles.categoryName}>{category.category}</span>
                          </div>
                          <ul className={styles.featuresList}>
                            {category.items.map((feature, idx) => (
                              <li 
                                key={idx} 
                                className={`${styles.feature} ${!feature.included ? styles.disabled : ''} ${feature.highlight ? styles.highlight : ''}`}
                              >
                                {feature.included ? (
                                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span>{feature.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className={styles.planCta}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loadingPlan !== null}
                    fullWidth
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEnglish ? 'Loading...' : 'Chargement...'}
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trust Badges */}
      <section className={styles.trustSection}>
        <div className={styles.trustBadges}>
          <div className={styles.trustBadge}>
            <Shield className="w-5 h-5 text-green-500" />
            <span>{isEnglish ? 'Secure Payment' : 'Paiement sécurisé'}</span>
          </div>
          <div className={styles.trustBadge}>
            <Check className="w-5 h-5 text-green-500" />
            <span>{isEnglish ? '14-Day Money Back' : 'Remboursement 14 jours'}</span>
          </div>
          <div className={styles.trustBadge}>
            <Zap className="w-5 h-5 text-green-500" />
            <span>{isEnglish ? 'Cancel Anytime' : 'Annulation à tout moment'}</span>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.sectionTitle}>
          {isEnglish ? 'Compare All Features' : 'Comparer toutes les fonctionnalités'}
        </h2>
        <div className={styles.comparisonTableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>{isEnglish ? 'Feature' : 'Fonctionnalité'}</th>
                <th>Starter</th>
                <th>Basic</th>
                <th className={styles.popularColumn}>Premium</th>
                <th>Ultimate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{isEnglish ? 'Government Benefits Access' : 'Accès aux aides'}</td>
                <td>3</td>
                <td>{isEnglish ? 'All' : 'Toutes'}</td>
                <td className={styles.popularColumn}>{isEnglish ? 'All' : 'Toutes'}</td>
                <td>{isEnglish ? 'All' : 'Toutes'}</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Daily Simulations' : 'Simulations par jour'}</td>
                <td>5</td>
                <td>∞</td>
                <td className={styles.popularColumn}>∞</td>
                <td>∞</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Guarantor Services' : 'Services de garant'}</td>
                <td>1</td>
                <td>{isEnglish ? 'All' : 'Tous'}</td>
                <td className={styles.popularColumn}>{isEnglish ? 'All' : 'Tous'}</td>
                <td>{isEnglish ? 'All' : 'Tous'}</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Housing Platforms' : 'Plateformes de logement'}</td>
                <td>5</td>
                <td>15</td>
                <td className={styles.popularColumn}>{isEnglish ? 'All' : 'Toutes'}</td>
                <td>{isEnglish ? 'All' : 'Toutes'}</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Saved Favorites' : 'Favoris sauvegardés'}</td>
                <td>4</td>
                <td>10</td>
                <td className={styles.popularColumn}>∞</td>
                <td>∞</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Active Procedures' : 'Démarches actives'}</td>
                <td>2</td>
                <td>10</td>
                <td className={styles.popularColumn}>∞</td>
                <td>∞</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Tutorials & Guides' : 'Tutoriels & Guides'}</td>
                <td>5/{isEnglish ? 'day' : 'jour'}</td>
                <td>15/{isEnglish ? 'day' : 'jour'}</td>
                <td className={styles.popularColumn}>{isEnglish ? 'All' : 'Tous'}</td>
                <td>{isEnglish ? 'All' : 'Tous'}</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'AI Messages' : 'Messages IA'}</td>
                <td>3/{isEnglish ? 'day' : 'jour'}</td>
                <td>20/{isEnglish ? 'day' : 'jour'}</td>
                <td className={styles.popularColumn}>60/{isEnglish ? 'day' : 'jour'}</td>
                <td>300/{isEnglish ? 'day' : 'jour'}</td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Data Export' : 'Export des données'}</td>
                <td><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td className={styles.popularColumn}><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td>{isEnglish ? 'Support Level' : 'Niveau de support'}</td>
                <td>{isEnglish ? 'Community' : 'Communauté'}</td>
                <td>{isEnglish ? 'Community' : 'Communauté'}</td>
                <td className={styles.popularColumn}>{isEnglish ? 'Priority' : 'Prioritaire'}</td>
                <td>{isEnglish ? 'Priority' : 'Prioritaire'}</td>
              </tr>
              <tr className={styles.priceRow}>
                <td>{isEnglish ? 'Monthly Price' : 'Prix mensuel'}</td>
                <td>€0</td>
                <td>€4.99</td>
                <td className={styles.popularColumn}>€9.99</td>
                <td>€14.99</td>
              </tr>
              <tr className={styles.priceRow}>
                <td>{isEnglish ? 'Yearly Price' : 'Prix annuel'}</td>
                <td>€0</td>
                <td>€49.99</td>
                <td className={styles.popularColumn}>€99.99</td>
                <td>€149.99</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>
          {isEnglish ? 'Frequently Asked Questions' : 'Questions fréquentes'}
        </h2>
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`${styles.faqItem} ${openFaq === idx ? styles.open : ''}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.question}</span>
                <i className={openFaq === idx ? 'ri-subtract-line' : 'ri-add-line'} />
              </button>
              {openFaq === idx && (
                <motion.div
                  className={styles.faqAnswer}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Card className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>
            {isEnglish ? 'Ready to Discover Your Benefits?' : 'Prêt à découvrir vos aides ?'}
          </h2>
          <p className={styles.ctaDescription}>
            {isEnglish 
              ? 'Start your free simulation now and find out which government benefits you\'re eligible for. No credit card required.'
              : 'Commencez votre simulation gratuite maintenant et découvrez les aides auxquelles vous avez droit. Aucune carte bancaire requise.'
            }
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(ROUTES.SIMULATION)}
          >
            {isEnglish ? 'Start Free Simulation' : 'Commencer la simulation gratuite'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </section>
    </div>
  );
}

export default Pricing;
