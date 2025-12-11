import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useSimulation } from '../../../context/SimulationContext';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card, Loading, Logo } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './Results.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Results() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { results, resultsPreview, completed } = useSimulation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  // Use results if logged in, otherwise use preview
  const simulationResults = results || resultsPreview;

  useEffect(() => {
    if (!completed && !simulationResults) {
      navigate(ROUTES.SIMULATION);
    }
  }, [completed, simulationResults, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
        <p>{t('simulation.calculating')}</p>
      </div>
    );
  }

  if (!simulationResults) {
    return null;
  }

  // Handle both array format and object format
  const eligibleAides = Array.isArray(simulationResults) 
    ? simulationResults 
    : simulationResults.eligibleAides || [];

  const totalMonthly = eligibleAides.reduce(
    (sum, aide) => sum + (aide.monthlyAmount || 0), 
    0
  );

  const totalAnnual = totalMonthly * 12;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('simulation.results.title')} | AIDE+</title>
      </Helmet>

      <div className={styles.header}>
        <Logo size="md" linkTo={ROUTES.HOME} />
        <div className={styles.headerActions}>
          {!user && (
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="sm">
                {t('simulation.results.saveResults')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Summary Card */}
        <motion.div variants={itemVariants}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <div className={styles.summaryIcon}>
                <i className="ri-money-euro-circle-line" />
              </div>
              <h1 className={styles.summaryTitle}>
                {t('simulation.results.youCouldReceive')}
              </h1>
              <div className={styles.summaryAmount}>
                <span className={styles.amountValue}>
                  {formatCurrency(totalMonthly)}
                </span>
                <span className={styles.amountPeriod}>
                  /{t('pricing.month')}
                </span>
              </div>
              <p className={styles.annualAmount}>
                {t('simulation.results.annually', { amount: formatCurrency(totalAnnual) })}
              </p>
              <p className={styles.eligibleCount}>
                {t('simulation.results.eligibleFor', { count: eligibleAides.length })}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Eligible Aides */}
        <motion.div variants={itemVariants} className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="ri-check-double-line" />
            {t('simulation.results.eligibleAides')}
          </h2>
          
          <div className={styles.aidesList}>
            {eligibleAides.map((aide, index) => (
              <motion.div
                key={aide.id || index}
                variants={itemVariants}
              >
                <Card className={styles.aideCard}>
                  <div className={styles.aideHeader}>
                    <div className={styles.aideInfo}>
                      <span className={styles.aideName}>{aide.name}</span>
                      <span className={styles.aideCategory}>{aide.category}</span>
                    </div>
                    <div className={styles.aideAmount}>
                      <span className={styles.aideValue}>
                        {formatCurrency(aide.monthlyAmount)}
                      </span>
                      <span className={styles.aidePeriod}>/{t('pricing.month')}</span>
                    </div>
                  </div>
                  <p className={styles.aideDescription}>{aide.description}</p>
                  
                  {/* Preview for free users, full details for premium */}
                  {!user ? (
                    <div className={styles.premiumOverlay}>
                      <i className="ri-lock-line" />
                      <span>{t('simulation.results.createAccountToSee')}</span>
                    </div>
                  ) : (
                    <div className={styles.aideActions}>
                      {aide.sourceUrl ? (
                        <a href={aide.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <i className="ri-external-link-line" />
                            {t('simulation.results.learnMore')}
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          {t('simulation.results.learnMore')}
                        </Button>
                      )}
                      {aide.applicationUrl ? (
                        <a href={aide.applicationUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="primary" size="sm">
                            <i className="ri-arrow-right-line" />
                            {t('simulation.results.startProcedure')}
                          </Button>
                        </a>
                      ) : (
                        <Button variant="primary" size="sm" disabled>
                          {t('simulation.results.startProcedure')}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants}>
          <Card className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              {!user ? (
                <>
                  <i className="ri-user-add-line" />
                  <h3>{t('simulation.results.ctaTitle')}</h3>
                  <p>{t('simulation.results.ctaDescription')}</p>
                  <div className={styles.ctaButtons}>
                    <Link to={ROUTES.REGISTER}>
                      <Button variant="primary">
                        {t('simulation.results.createFreeAccount')}
                      </Button>
                    </Link>
                    <Link to={ROUTES.LOGIN}>
                      <Button variant="outline">
                        {t('auth.loginLink')}
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <i className="ri-dashboard-line" />
                  <h3>{t('simulation.results.goToDashboard')}</h3>
                  <p>{t('simulation.results.dashboardDescription')}</p>
                  <Link to={ROUTES.DASHBOARD}>
                    <Button variant="primary">
                      {t('nav.dashboard')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* New Simulation */}
        <motion.div variants={itemVariants} className={styles.newSimulation}>
          <Link to={ROUTES.SIMULATION}>
            <Button variant="ghost">
              <i className="ri-restart-line" />
              {t('simulation.results.newSimulation')}
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Results;
