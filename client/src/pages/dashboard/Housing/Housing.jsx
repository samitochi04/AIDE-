import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, Card, Input, Badge, Loading } from '../../../components/ui';
import styles from './Housing.module.css';

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

// Mock housing assistance data
const HOUSING_AIDES = [
  {
    id: 1,
    name: 'APL',
    fullName: 'Aide Personnalisée au Logement',
    status: 'active',
    monthlyAmount: 350,
    nextPayment: '2024-02-05',
    lastUpdated: '2024-01-15',
    provider: 'CAF'
  },
  {
    id: 2,
    name: 'ALS',
    fullName: 'Allocation de Logement Social',
    status: 'pending',
    monthlyAmount: 200,
    applicationDate: '2024-01-10',
    estimatedDecision: '2024-02-01',
    provider: 'CAF'
  }
];

const HOUSING_RESOURCES = [
  {
    id: 1,
    title: 'How to Find an Apartment in France',
    type: 'guide',
    icon: 'ri-book-open-line',
    readTime: '8 min'
  },
  {
    id: 2,
    title: 'Understanding Your Rental Agreement',
    type: 'guide',
    icon: 'ri-file-text-line',
    readTime: '5 min'
  },
  {
    id: 3,
    title: 'Social Housing (HLM) Application',
    type: 'procedure',
    icon: 'ri-building-line',
    readTime: '10 min'
  },
  {
    id: 4,
    title: 'Tenant Rights in France',
    type: 'guide',
    icon: 'ri-shield-check-line',
    readTime: '6 min'
  }
];

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  pending: { color: 'warning', label: 'Pending' },
  rejected: { color: 'danger', label: 'Rejected' },
  expired: { color: 'default', label: 'Expired' }
};

export function Housing() {
  const { t } = useTranslation();
  const [loading] = useState(false);
  const [housingInfo, setHousingInfo] = useState({
    type: 'renter',
    rent: 850,
    region: 'ile-de-france',
    surface: 35,
    hasLeaseContract: true
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalMonthlyAides = HOUSING_AIDES
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + a.monthlyAmount, 0);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('dashboard.housing.title')}</h1>
          <p className={styles.subtitle}>{t('dashboard.housing.subtitle')}</p>
        </div>
      </motion.div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Housing Summary Card */}
          <motion.div variants={itemVariants}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h2>{t('dashboard.housing.currentSituation')}</h2>
                <Button variant="ghost" size="sm">
                  <i className="ri-edit-line" />
                  {t('common.edit')}
                </Button>
              </div>
              
              <div className={styles.housingDetails}>
                <div className={styles.housingType}>
                  <i className={housingInfo.type === 'renter' ? 'ri-home-line' : 'ri-home-heart-line'} />
                  <span>
                    {housingInfo.type === 'renter' 
                      ? t('dashboard.housing.renter') 
                      : t('dashboard.housing.owner')
                    }
                  </span>
                </div>
                
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('dashboard.housing.monthlyRent')}</span>
                    <span className={styles.detailValue}>{formatCurrency(housingInfo.rent)}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('dashboard.housing.region')}</span>
                    <span className={styles.detailValue}>Île-de-France</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('dashboard.housing.surface')}</span>
                    <span className={styles.detailValue}>{housingInfo.surface} m²</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('dashboard.housing.leaseContract')}</span>
                    <span className={styles.detailValue}>
                      {housingInfo.hasLeaseContract ? (
                        <Badge variant="success" size="sm">
                          <i className="ri-check-line" /> {t('common.yes')}
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <i className="ri-close-line" /> {t('common.no')}
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.summaryFooter}>
                <div className={styles.savingsInfo}>
                  <span className={styles.savingsLabel}>{t('dashboard.housing.monthlyAides')}</span>
                  <span className={styles.savingsValue}>{formatCurrency(totalMonthlyAides)}</span>
                </div>
                <div className={styles.netRent}>
                  <span className={styles.netLabel}>{t('dashboard.housing.effectiveRent')}</span>
                  <span className={styles.netValue}>
                    {formatCurrency(housingInfo.rent - totalMonthlyAides)}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Housing Aides List */}
          <motion.div variants={itemVariants}>
            <Card className={styles.aidesCard}>
              <div className={styles.aidesHeader}>
                <h2>{t('dashboard.housing.yourAides')}</h2>
                <Button variant="outline" size="sm">
                  <i className="ri-add-line" />
                  {t('dashboard.housing.addAide')}
                </Button>
              </div>
              
              <div className={styles.aidesList}>
                {HOUSING_AIDES.map(aide => (
                  <div key={aide.id} className={styles.aideItem}>
                    <div className={styles.aideIcon}>
                      <i className="ri-home-heart-line" />
                    </div>
                    
                    <div className={styles.aideInfo}>
                      <div className={styles.aideTitleRow}>
                        <h3 className={styles.aideName}>{aide.name}</h3>
                        <Badge variant={STATUS_CONFIG[aide.status]?.color}>
                          {STATUS_CONFIG[aide.status]?.label}
                        </Badge>
                      </div>
                      <p className={styles.aideFullName}>{aide.fullName}</p>
                      
                      {aide.status === 'active' && (
                        <div className={styles.aideDetails}>
                          <span>
                            <i className="ri-calendar-line" />
                            {t('dashboard.housing.nextPayment')}: {formatDate(aide.nextPayment)}
                          </span>
                        </div>
                      )}
                      
                      {aide.status === 'pending' && (
                        <div className={styles.aideDetails}>
                          <span>
                            <i className="ri-time-line" />
                            {t('dashboard.housing.estimatedDecision')}: {formatDate(aide.estimatedDecision)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.aideAmount}>
                      <span className={styles.amountValue}>
                        {formatCurrency(aide.monthlyAmount)}
                      </span>
                      <span className={styles.amountPeriod}>/{t('pricing.month')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Quick Calculator */}
          <motion.div variants={itemVariants}>
            <Card className={styles.calculatorCard}>
              <h3>{t('dashboard.housing.rentCalculator')}</h3>
              <p className={styles.calculatorDesc}>
                {t('dashboard.housing.calculatorDescription')}
              </p>
              
              <div className={styles.calculatorForm}>
                <Input
                  type="number"
                  label={t('dashboard.housing.yourRent')}
                  value={housingInfo.rent}
                  onChange={(e) => setHousingInfo(prev => ({
                    ...prev,
                    rent: parseFloat(e.target.value) || 0
                  }))}
                  leftIcon={<span>€</span>}
                />
                
                <div className={styles.calculatorResult}>
                  <div className={styles.resultRow}>
                    <span>{t('dashboard.housing.grossRent')}</span>
                    <span>{formatCurrency(housingInfo.rent)}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span>{t('dashboard.housing.housingAides')}</span>
                    <span className={styles.deduction}>- {formatCurrency(totalMonthlyAides)}</span>
                  </div>
                  <div className={`${styles.resultRow} ${styles.totalRow}`}>
                    <span>{t('dashboard.housing.youPay')}</span>
                    <span className={styles.totalValue}>
                      {formatCurrency(Math.max(0, housingInfo.rent - totalMonthlyAides))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Resources */}
          <motion.div variants={itemVariants}>
            <Card className={styles.resourcesCard}>
              <h3>{t('dashboard.housing.helpfulResources')}</h3>
              
              <div className={styles.resourcesList}>
                {HOUSING_RESOURCES.map(resource => (
                  <button key={resource.id} className={styles.resourceItem}>
                    <div className={styles.resourceIcon}>
                      <i className={resource.icon} />
                    </div>
                    <div className={styles.resourceInfo}>
                      <span className={styles.resourceTitle}>{resource.title}</span>
                      <span className={styles.resourceMeta}>
                        <Badge variant="default" size="sm">{resource.type}</Badge>
                        <span>{resource.readTime}</span>
                      </span>
                    </div>
                    <i className="ri-arrow-right-s-line" />
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Need Help */}
          <motion.div variants={itemVariants}>
            <Card className={styles.helpCard}>
              <div className={styles.helpContent}>
                <i className="ri-questionnaire-line" />
                <h3>{t('dashboard.housing.needHelp')}</h3>
                <p>{t('dashboard.housing.needHelpDescription')}</p>
                <Button variant="outline" fullWidth>
                  <i className="ri-message-3-line" />
                  {t('dashboard.housing.askAssistant')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default Housing;
