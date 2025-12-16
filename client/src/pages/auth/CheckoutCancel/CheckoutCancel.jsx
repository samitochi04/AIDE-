import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { XCircle, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './CheckoutCancel.module.css';

export function CheckoutCancel() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEnglish = i18n.language === 'en';

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{isEnglish ? 'Checkout Cancelled' : 'Paiement annulé'} | AIDE+</title>
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
            className={styles.cancelIcon}
          >
            <XCircle className="w-16 h-16 text-gray-400" />
          </motion.div>

          <h1 className={styles.title}>
            {isEnglish ? 'Checkout Cancelled' : 'Paiement annulé'}
          </h1>

          <p className={styles.subtitle}>
            {isEnglish 
              ? 'No worries! Your subscription was not activated and you were not charged. You can continue using the free plan or try again when you\'re ready.'
              : 'Pas de souci ! Votre abonnement n\'a pas été activé et vous n\'avez pas été débité. Vous pouvez continuer à utiliser le plan gratuit ou réessayer quand vous serez prêt.'
            }
          </p>

          <div className={styles.reasons}>
            <h3>
              <HelpCircle className="w-4 h-4" />
              {isEnglish ? 'Need help deciding?' : 'Besoin d\'aide pour décider ?'}
            </h3>
            <ul>
              <li>
                {isEnglish 
                  ? 'Compare plans on our pricing page'
                  : 'Comparez les forfaits sur notre page tarifs'
                }
              </li>
              <li>
                {isEnglish 
                  ? '14-day money-back guarantee on all plans'
                  : 'Garantie de remboursement de 14 jours sur tous les forfaits'
                }
              </li>
              <li>
                {isEnglish 
                  ? 'Cancel anytime with no questions asked'
                  : 'Annulez à tout moment sans justification'
                }
              </li>
            </ul>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.PRICING)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isEnglish ? 'Back to Pricing' : 'Retour aux tarifs'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              {isEnglish ? 'Continue with Free Plan' : 'Continuer avec le plan gratuit'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className={styles.contact}>
            {isEnglish ? 'Have questions? ' : 'Des questions ? '}
            <a href={ROUTES.CONTACT}>
              {isEnglish ? 'Contact our support team' : 'Contactez notre équipe support'}
            </a>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

export default CheckoutCancel;
