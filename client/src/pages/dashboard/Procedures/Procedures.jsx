import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Loading } from '../../../components/ui';
import styles from './Procedures.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock procedures data
const MOCK_PROCEDURES = [
  {
    id: 1,
    name: 'APL Application',
    aide: 'APL - Aide Personnalisée au Logement',
    status: 'in-progress',
    progress: 60,
    currentStep: 3,
    totalSteps: 5,
    steps: [
      { name: 'Create CAF account', completed: true, date: '2024-01-10' },
      { name: 'Fill personal information', completed: true, date: '2024-01-11' },
      { name: 'Upload documents', completed: true, date: '2024-01-12' },
      { name: 'Submit application', completed: false },
      { name: 'Wait for decision', completed: false }
    ],
    requiredDocuments: [
      { name: 'ID / Residence permit', uploaded: true },
      { name: 'Proof of residence', uploaded: true },
      { name: 'Rental agreement', uploaded: true },
      { name: 'Bank details (RIB)', uploaded: false },
      { name: 'Last 3 pay slips', uploaded: false }
    ],
    deadline: '2024-02-15',
    estimatedCompletion: '20 min',
    provider: 'CAF'
  },
  {
    id: 2,
    name: 'Prime d\'Activité',
    aide: 'Prime d\'Activité',
    status: 'pending',
    progress: 100,
    currentStep: 5,
    totalSteps: 5,
    steps: [
      { name: 'Create CAF account', completed: true, date: '2024-01-05' },
      { name: 'Fill personal information', completed: true, date: '2024-01-05' },
      { name: 'Declare income', completed: true, date: '2024-01-06' },
      { name: 'Upload documents', completed: true, date: '2024-01-06' },
      { name: 'Submit application', completed: true, date: '2024-01-07' }
    ],
    requiredDocuments: [],
    deadline: null,
    estimatedDecision: '2024-01-25',
    provider: 'CAF'
  },
  {
    id: 3,
    name: 'Social Housing Application',
    aide: 'HLM - Habitation à Loyer Modéré',
    status: 'not-started',
    progress: 0,
    currentStep: 0,
    totalSteps: 6,
    steps: [
      { name: 'Create account on demande-logement-social.gouv.fr', completed: false },
      { name: 'Fill application form', completed: false },
      { name: 'Select preferred areas', completed: false },
      { name: 'Upload documents', completed: false },
      { name: 'Submit application', completed: false },
      { name: 'Wait for allocation', completed: false }
    ],
    requiredDocuments: [
      { name: 'ID documents for all household members', uploaded: false },
      { name: 'Tax notice', uploaded: false },
      { name: 'Proof of current residence', uploaded: false },
      { name: 'Family record book (if applicable)', uploaded: false }
    ],
    deadline: null,
    estimatedCompletion: '45 min',
    provider: 'Government'
  },
  {
    id: 4,
    name: 'CSS Health Coverage',
    aide: 'Complémentaire Santé Solidaire',
    status: 'completed',
    progress: 100,
    currentStep: 4,
    totalSteps: 4,
    steps: [
      { name: 'Check eligibility', completed: true, date: '2023-12-01' },
      { name: 'Fill application', completed: true, date: '2023-12-03' },
      { name: 'Submit documents', completed: true, date: '2023-12-05' },
      { name: 'Receive confirmation', completed: true, date: '2023-12-20' }
    ],
    requiredDocuments: [],
    completedDate: '2023-12-20',
    provider: 'CPAM'
  }
];

const STATUS_CONFIG = {
  'not-started': { color: 'default', icon: 'ri-draft-line', label: 'Not Started' },
  'in-progress': { color: 'primary', icon: 'ri-loader-4-line', label: 'In Progress' },
  'pending': { color: 'warning', icon: 'ri-time-line', label: 'Pending Review' },
  'completed': { color: 'success', icon: 'ri-check-line', label: 'Completed' },
  'rejected': { color: 'danger', icon: 'ri-close-line', label: 'Rejected' }
};

const FILTERS = ['all', 'in-progress', 'pending', 'not-started', 'completed'];

export function Procedures() {
  const { t } = useTranslation();
  const [loading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedProcedure, setExpandedProcedure] = useState(null);

  const filteredProcedures = useMemo(() => {
    if (statusFilter === 'all') return MOCK_PROCEDURES;
    return MOCK_PROCEDURES.filter(p => p.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(() => ({
    total: MOCK_PROCEDURES.length,
    inProgress: MOCK_PROCEDURES.filter(p => p.status === 'in-progress').length,
    pending: MOCK_PROCEDURES.filter(p => p.status === 'pending').length,
    completed: MOCK_PROCEDURES.filter(p => p.status === 'completed').length
  }), []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
          <h1 className={styles.title}>{t('dashboard.procedures.title')}</h1>
          <p className={styles.subtitle}>{t('dashboard.procedures.subtitle')}</p>
        </div>
        <Button variant="primary">
          <i className="ri-add-line" />
          {t('dashboard.procedures.startNew')}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div className={styles.statsGrid} variants={itemVariants}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--primary)' }}>
            <i className="ri-file-list-3-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>{t('dashboard.procedures.stats.total')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--info)' }}>
            <i className="ri-loader-4-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.inProgress}</span>
            <span className={styles.statLabel}>{t('dashboard.procedures.stats.inProgress')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--warning)' }}>
            <i className="ri-time-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>{t('dashboard.procedures.stats.pending')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--success)' }}>
            <i className="ri-check-double-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>{t('dashboard.procedures.stats.completed')}</span>
          </div>
        </Card>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div className={styles.filterTabs} variants={itemVariants}>
        {FILTERS.map(filter => (
          <button
            key={filter}
            className={`${styles.filterTab} ${statusFilter === filter ? styles.active : ''}`}
            onClick={() => setStatusFilter(filter)}
          >
            {t(`dashboard.procedures.filters.${filter}`)}
            {filter !== 'all' && (
              <span className={styles.filterCount}>
                {MOCK_PROCEDURES.filter(p => filter === 'all' || p.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Procedures List */}
      <motion.div className={styles.proceduresList} variants={containerVariants}>
        <AnimatePresence mode="popLayout">
          {filteredProcedures.length === 0 ? (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <i className="ri-file-list-3-line" />
              <p>{t('dashboard.procedures.noResults')}</p>
            </motion.div>
          ) : (
            filteredProcedures.map((procedure) => (
              <motion.div
                key={procedure.id}
                variants={itemVariants}
                layout
              >
                <Card 
                  className={`${styles.procedureCard} ${expandedProcedure === procedure.id ? styles.expanded : ''}`}
                >
                  {/* Main Info */}
                  <div className={styles.procedureHeader}>
                    <div className={styles.procedureInfo}>
                      <div className={styles.procedureTitleRow}>
                        <h3 className={styles.procedureName}>{procedure.name}</h3>
                        <Badge variant={STATUS_CONFIG[procedure.status]?.color}>
                          <i className={STATUS_CONFIG[procedure.status]?.icon} />
                          {STATUS_CONFIG[procedure.status]?.label}
                        </Badge>
                      </div>
                      <p className={styles.procedureAide}>{procedure.aide}</p>
                      
                      <div className={styles.procedureMeta}>
                        <span>
                          <i className="ri-building-line" />
                          {procedure.provider}
                        </span>
                        {procedure.deadline && (
                          <span>
                            <i className="ri-calendar-line" />
                            {t('dashboard.procedures.deadline')}: {formatDate(procedure.deadline)}
                          </span>
                        )}
                        {procedure.estimatedDecision && (
                          <span>
                            <i className="ri-time-line" />
                            {t('dashboard.procedures.expectedDecision')}: {formatDate(procedure.estimatedDecision)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Circle */}
                    <div className={styles.progressCircle}>
                      <svg viewBox="0 0 36 36">
                        <path
                          className={styles.progressBg}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={styles.progressFill}
                          strokeDasharray={`${procedure.progress}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className={styles.progressText}>{procedure.progress}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={styles.stepsProgress}>
                    <div className={styles.stepsTrack}>
                      {procedure.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`${styles.stepDot} ${step.completed ? styles.completed : ''} ${idx === procedure.currentStep - 1 && !step.completed ? styles.current : ''}`}
                          title={step.name}
                        >
                          {step.completed ? (
                            <i className="ri-check-line" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className={styles.stepsText}>
                      {t('dashboard.procedures.step')} {procedure.currentStep} / {procedure.totalSteps}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedProcedure === procedure.id && (
                      <motion.div
                        className={styles.procedureDetails}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {/* Steps List */}
                        <div className={styles.detailSection}>
                          <h4>{t('dashboard.procedures.stepsOverview')}</h4>
                          <div className={styles.stepsList}>
                            {procedure.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className={`${styles.stepItem} ${step.completed ? styles.completed : ''}`}
                              >
                                <div className={styles.stepIndicator}>
                                  {step.completed ? (
                                    <i className="ri-check-line" />
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </div>
                                <div className={styles.stepContent}>
                                  <span className={styles.stepName}>{step.name}</span>
                                  {step.date && (
                                    <span className={styles.stepDate}>
                                      {formatDate(step.date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents */}
                        {procedure.requiredDocuments.length > 0 && (
                          <div className={styles.detailSection}>
                            <h4>{t('dashboard.procedures.requiredDocuments')}</h4>
                            <div className={styles.documentsList}>
                              {procedure.requiredDocuments.map((doc, idx) => (
                                <div
                                  key={idx}
                                  className={`${styles.documentItem} ${doc.uploaded ? styles.uploaded : ''}`}
                                >
                                  <i className={doc.uploaded ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} />
                                  <span>{doc.name}</span>
                                  {!doc.uploaded && (
                                    <Button variant="ghost" size="sm">
                                      <i className="ri-upload-2-line" />
                                      {t('common.upload')}
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className={styles.procedureActions}>
                    <button
                      className={styles.expandBtn}
                      onClick={() => setExpandedProcedure(
                        expandedProcedure === procedure.id ? null : procedure.id
                      )}
                    >
                      <i className={expandedProcedure === procedure.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                      {expandedProcedure === procedure.id 
                        ? t('dashboard.procedures.showLess') 
                        : t('dashboard.procedures.showMore')
                      }
                    </button>
                    
                    <div className={styles.actionBtns}>
                      {procedure.status === 'in-progress' && (
                        <Button variant="primary" size="sm">
                          {t('dashboard.procedures.continue')}
                        </Button>
                      )}
                      {procedure.status === 'not-started' && (
                        <Button variant="primary" size="sm">
                          {t('dashboard.procedures.start')}
                        </Button>
                      )}
                      {procedure.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          {t('dashboard.procedures.trackStatus')}
                        </Button>
                      )}
                      {procedure.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          {t('dashboard.procedures.viewDetails')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default Procedures;
