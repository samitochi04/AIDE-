import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useSimulation } from '../../../context/SimulationContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card, Input, Select, Logo } from '../../../components/ui';
import UpgradeModal from '../../../components/ui/UpgradeModal';
import { ROUTES } from '../../../config/routes';
import { REGIONS } from '../../../config/constants';
import { api, API_ENDPOINTS } from '../../../config/api';
import styles from './Simulation.module.css';

const STEPS = [
  'personal',
  'residence',
  'family',
  'income',
  'housing'
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

export function Simulation() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { answers, setAnswers, complete } = useSimulation();
  const { error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  // Redirect to dashboard for logged-in users, home for visitors
  const handleClose = () => {
    navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME);
  };

  const progress = useMemo(() => 
    ((currentStep + 1) / STEPS.length) * 100, 
    [currentStep]
  );

  const handleChange = (field, value) => {
    setAnswers({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    const step = STEPS[currentStep];
    
    switch (step) {
      case 'personal':
        if (!answers.age) newErrors.age = t('simulation.errors.required');
        if (!answers.nationality) newErrors.nationality = t('simulation.errors.required');
        break;
      case 'residence':
        if (!answers.region) newErrors.region = t('simulation.errors.required');
        if (!answers.residenceStatus) newErrors.residenceStatus = t('simulation.errors.required');
        break;
      case 'family':
        if (answers.hasChildren === undefined || answers.hasChildren === null) newErrors.hasChildren = t('simulation.errors.required');
        break;
      case 'income':
        if (answers.incomeBracket === undefined || answers.incomeBracket === null) newErrors.incomeBracket = t('simulation.errors.required');
        break;
      case 'housing':
        if (!answers.housingStatus) newErrors.housingStatus = t('simulation.errors.required');
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Call the real API
      const response = await api.post(API_ENDPOINTS.SIMULATION.RUN, {
        answers,
        language: i18n.language || 'fr',
      });
      
      const results = response.data || response;
      complete(results, true);
      navigate(ROUTES.SIMULATION_RESULTS);
    } catch (err) {
      console.error('Simulation error:', err);
      
      // Check for subscription limit exceeded
      const errorData = err.data?.data || err.data;
      if (err.status === 403 && errorData?.error === 'limit_exceeded') {
        setUpgradeInfo({
          current: errorData.current,
          limit: errorData.limit,
          tier: errorData.tier,
          feature: 'simulations',
          message: errorData.message || errorData.messageEn
        });
        setShowUpgradeModal(true);
      } else {
        showError(t('common.error') || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step) {
      case 'personal':
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t('simulation.steps.personal.title')}</h2>
            <p className={styles.stepDescription}>{t('simulation.steps.personal.description')}</p>
            
            <div className={styles.formGrid}>
              <Input
                type="number"
                label={t('simulation.fields.age')}
                placeholder={t('simulation.fields.agePlaceholder')}
                value={answers.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || '')}
                error={errors.age}
                min={0}
                max={120}
              />
              
              <Select
                label={t('simulation.fields.nationality')}
                placeholder={t('simulation.fields.nationalityPlaceholder')}
                value={answers.nationality || ''}
                onChange={(e) => handleChange('nationality', e.target.value)}
                error={errors.nationality}
                options={[
                  { value: 'eu', label: t('simulation.options.eu') },
                  { value: 'non-eu', label: t('simulation.options.nonEu') },
                  { value: 'french', label: t('simulation.options.french') }
                ]}
              />
            </div>
          </div>
        );

      case 'residence':
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t('simulation.steps.residence.title')}</h2>
            <p className={styles.stepDescription}>{t('simulation.steps.residence.description')}</p>
            
            <div className={styles.formGrid}>
              <Select
                label={t('simulation.fields.region')}
                placeholder={t('simulation.fields.regionPlaceholder')}
                value={answers.region || ''}
                onChange={(e) => handleChange('region', e.target.value)}
                error={errors.region}
                options={REGIONS.map(r => ({ value: r.value, label: r.label }))}
              />
              
              <Select
                label={t('simulation.fields.residenceStatus')}
                placeholder={t('simulation.fields.residenceStatusPlaceholder')}
                value={answers.residenceStatus || ''}
                onChange={(e) => handleChange('residenceStatus', e.target.value)}
                error={errors.residenceStatus}
                options={[
                  { value: 'student', label: t('simulation.options.student') },
                  { value: 'worker', label: t('simulation.options.worker') },
                  { value: 'refugee', label: t('simulation.options.refugee') },
                  { value: 'family', label: t('simulation.options.familyVisa') },
                  { value: 'other', label: t('simulation.options.other') }
                ]}
              />
              
              <Input
                type="number"
                label={t('simulation.fields.yearsInFrance')}
                placeholder={t('simulation.fields.yearsInFrancePlaceholder')}
                value={answers.yearsInFrance || ''}
                onChange={(e) => handleChange('yearsInFrance', parseInt(e.target.value) || '')}
                min={0}
              />
            </div>
          </div>
        );

      case 'family':
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t('simulation.steps.family.title')}</h2>
            <p className={styles.stepDescription}>{t('simulation.steps.family.description')}</p>
            
            <div className={styles.optionCards}>
              <button
                className={`${styles.optionCard} ${answers.hasChildren === true ? styles.selected : ''}`}
                onClick={() => handleChange('hasChildren', true)}
              >
                <i className="ri-parent-line" />
                <span>{t('simulation.options.hasChildren')}</span>
              </button>
              
              <button
                className={`${styles.optionCard} ${answers.hasChildren === false ? styles.selected : ''}`}
                onClick={() => handleChange('hasChildren', false)}
              >
                <i className="ri-user-line" />
                <span>{t('simulation.options.noChildren')}</span>
              </button>
            </div>
            
            {answers.hasChildren && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={styles.conditionalField}
              >
                <Input
                  type="number"
                  label={t('simulation.fields.childrenCount')}
                  placeholder={t('simulation.fields.childrenCountPlaceholder')}
                  value={answers.numberOfChildren || ''}
                  onChange={(e) => handleChange('numberOfChildren', parseInt(e.target.value) || '')}
                  min={1}
                  max={20}
                />
              </motion.div>
            )}
            
            {errors.hasChildren && (
              <p className={styles.error}>{errors.hasChildren}</p>
            )}
          </div>
        );

      case 'income':
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t('simulation.steps.income.title')}</h2>
            <p className={styles.stepDescription}>{t('simulation.steps.income.description')}</p>
            
            <div className={styles.formGrid}>
              <Input
                type="number"
                label={t('simulation.fields.monthlyIncome')}
                placeholder={t('simulation.fields.monthlyIncomePlaceholder')}
                value={answers.incomeBracket || ''}
                onChange={(e) => handleChange('incomeBracket', parseFloat(e.target.value) || '')}
                error={errors.incomeBracket}
                icon="ri-money-euro-circle-line"
                min={0}
              />
              
              <Select
                label={t('simulation.fields.employmentStatus')}
                placeholder={t('simulation.fields.employmentStatusPlaceholder')}
                value={answers.employmentStatus || ''}
                onChange={(e) => handleChange('employmentStatus', e.target.value)}
                options={[
                  { value: 'employed', label: t('simulation.options.employed') },
                  { value: 'unemployed', label: t('simulation.options.unemployed') },
                  { value: 'student', label: t('simulation.options.student') },
                  { value: 'self-employed', label: t('simulation.options.selfEmployed') },
                  { value: 'retired', label: t('simulation.options.retired') }
                ]}
              />
            </div>
          </div>
        );

      case 'housing':
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{t('simulation.steps.housing.title')}</h2>
            <p className={styles.stepDescription}>{t('simulation.steps.housing.description')}</p>
            
            <div className={styles.optionCards}>
              <button
                className={`${styles.optionCard} ${answers.housingStatus === 'renter' ? styles.selected : ''}`}
                onClick={() => handleChange('housingStatus', 'renter')}
              >
                <i className="ri-home-line" />
                <span>{t('simulation.options.renter')}</span>
              </button>
              
              <button
                className={`${styles.optionCard} ${answers.housingStatus === 'owner' ? styles.selected : ''}`}
                onClick={() => handleChange('housingStatus', 'owner')}
              >
                <i className="ri-home-heart-line" />
                <span>{t('simulation.options.owner')}</span>
              </button>
              
              <button
                className={`${styles.optionCard} ${answers.housingStatus === 'hosted' ? styles.selected : ''}`}
                onClick={() => handleChange('housingStatus', 'hosted')}
              >
                <i className="ri-group-line" />
                <span>{t('simulation.options.hosted')}</span>
              </button>
              
              <button
                className={`${styles.optionCard} ${answers.housingStatus === 'homeless' ? styles.selected : ''}`}
                onClick={() => handleChange('housingStatus', 'homeless')}
              >
                <i className="ri-road-map-line" />
                <span>{t('simulation.options.homeless')}</span>
              </button>
            </div>
            
            {answers.housingStatus === 'renter' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={styles.conditionalField}
              >
                <Input
                  type="number"
                  label={t('simulation.fields.rent')}
                  placeholder={t('simulation.fields.rentPlaceholder')}
                  value={answers.rent || ''}
                  onChange={(e) => handleChange('rent', parseFloat(e.target.value) || '')}
                  icon="ri-money-euro-circle-line"
                  min={0}
                />
              </motion.div>
            )}
            
            {errors.housingStatus && (
              <p className={styles.error}>{errors.housingStatus}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('simulation.title')} | AIDE+</title>
      </Helmet>

      <div className={styles.header}>
        <Logo size="md" linkTo={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME} />
        <button
          className={styles.closeBtn}
          onClick={handleClose}
        >
          <i className="ri-close-line" />
        </button>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {t('simulation.step', { current: currentStep + 1, total: STEPS.length })}
        </span>
      </div>

      <div className={styles.content}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card className={styles.card}>
              <Card.Body>
                {renderStepContent()}
              </Card.Body>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.navigation}>
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <i className="ri-arrow-left-line" />
          {t('common.previous')}
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          loading={loading}
        >
          {currentStep === STEPS.length - 1 ? t('simulation.seeResults') : t('common.next')}
          {currentStep < STEPS.length - 1 && <i className="ri-arrow-right-line" />}
        </Button>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="simulations"
        currentUsage={upgradeInfo?.current}
        limit={upgradeInfo?.limit}
        currentTier={upgradeInfo?.tier}
      />
    </div>
  );
}

export default Simulation;
