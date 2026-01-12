import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ArrowRight, Loader2, Crown, Sparkles } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import { api, API_ENDPOINTS } from '../../../config/api';
import styles from './CheckoutSuccess.module.css';

export function CheckoutSuccess() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const isEnglish = i18n.language === 'en';
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // Give Stripe webhook time to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fetch subscription status
        const response = await api.get(API_ENDPOINTS.STRIPE.GET_SUBSCRIPTION);
        setSubscription(response.data.data);
      } catch (err) {
        console.error('Failed to verify subscription:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId]);

  const getTierName = (tier) => {
    const names = {
      basic: 'Basic',
      premium: 'Premium',
      ultimate: 'Ultimate',
    };
    return names[tier] || tier;
  };

  const getTierIcon = (tier) => {
    if (tier === 'ultimate') return Crown;
    return Sparkles;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h2 className={styles.title}>
            {isEnglish ? 'Confirming your subscription...' : 'Confirmation de votre abonnement...'}
          </h2>
          <p className={styles.subtitle}>
            {isEnglish ? 'Please wait a moment.' : 'Veuillez patienter un instant.'}
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.errorIcon}>!</div>
          <h2 className={styles.title}>
            {isEnglish ? 'Something went wrong' : 'Une erreur s\'est produite'}
          </h2>
          <p className={styles.subtitle}>
            {isEnglish 
              ? 'We couldn\'t verify your subscription. Please contact support if you were charged.'
              : 'Nous n\'avons pas pu vérifier votre abonnement. Veuillez contacter le support si vous avez été débité.'
            }
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
            {isEnglish ? 'Go to Dashboard' : 'Aller au tableau de bord'}
          </Button>
        </Card>
      </div>
    );
  }

  const TierIcon = getTierIcon(subscription?.tier);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{isEnglish ? 'Subscription Confirmed' : 'Abonnement confirmé'} | AIDE+</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={styles.card}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={styles.successIcon}
          >
            <CheckCircle className="w-16 h-16 text-green-500" />
          </motion.div>

          <h1 className={styles.title}>
            {isEnglish ? 'Welcome to' : 'Bienvenue sur'} AIDE+ {getTierName(subscription?.tier)}!
          </h1>

          <p className={styles.subtitle}>
            {isEnglish 
              ? 'Your subscription is now active. You have access to all the features of your plan.'
              : 'Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités de votre forfait.'
            }
          </p>

          {subscription && (
            <div className={styles.planInfo}>
              <div className={styles.planBadge}>
                <TierIcon className="w-5 h-5" />
                <span>{getTierName(subscription.tier)}</span>
              </div>
              {subscription.current_period_end && (
                <p className={styles.renewalInfo}>
                  {isEnglish ? 'Next billing date:' : 'Prochaine facturation :'}{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className={styles.highlights}>
            <h3>{isEnglish ? 'What you can do now:' : 'Ce que vous pouvez faire maintenant :'}</h3>
            <ul>
              {subscription?.tier === 'basic' && (
                <>
                  <li>{isEnglish ? '✓ Access all government benefits' : '✓ Accédez à toutes les aides'}</li>
                  <li>{isEnglish ? '✓ Unlimited simulations' : '✓ Simulations illimitées'}</li>
                  <li>{isEnglish ? '✓ 20 AI messages per day' : '✓ 20 messages IA par jour'}</li>
                </>
              )}
              {subscription?.tier === 'premium' && (
                <>
                  <li>{isEnglish ? '✓ All benefits & unlimited simulations' : '✓ Toutes les aides & simulations illimitées'}</li>
                  <li>{isEnglish ? '✓ 60 AI messages per day' : '✓ 60 messages IA par jour'}</li>
                  <li>{isEnglish ? '✓ Priority support' : '✓ Support prioritaire'}</li>
                </>
              )}
              {subscription?.tier === 'ultimate' && (
                <>
                  <li>{isEnglish ? '✓ Everything in Premium' : '✓ Tout ce qui est dans Premium'}</li>
                  <li>{isEnglish ? '✓ 300 AI messages per day' : '✓ 300 messages IA par jour'}</li>
                  <li>{isEnglish ? '✓ Data export' : '✓ Export de données'}</li>
                </>
              )}
            </ul>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              {isEnglish ? 'Go to Dashboard' : 'Aller au tableau de bord'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(ROUTES.SIMULATION)}
            >
              {isEnglish ? 'Start a Simulation' : 'Commencer une simulation'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default CheckoutSuccess;
