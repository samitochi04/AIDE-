import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Loading, Modal } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import api from '../../../config/api';
import { API_ENDPOINTS } from '../../../config/api';
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

const STATUS_CONFIG = {
  'not-started': { color: 'default', icon: 'ri-draft-line', labelKey: 'notStarted' },
  'in-progress': { color: 'primary', icon: 'ri-loader-4-line', labelKey: 'inProgress' },
  'pending': { color: 'warning', icon: 'ri-time-line', labelKey: 'pending' },
  'completed': { color: 'success', icon: 'ri-check-line', labelKey: 'completed' },
  'rejected': { color: 'danger', icon: 'ri-close-line', labelKey: 'rejected' }
};

const FILTERS = ['all', 'in-progress', 'pending', 'not-started', 'completed'];

const PROCEDURE_TYPES = [
  { value: 'aide_application', labelKey: 'aideApplication' },
  { value: 'document_request', labelKey: 'documentRequest' },
  { value: 'account_creation', labelKey: 'accountCreation' },
  { value: 'renewal', labelKey: 'renewal' },
  { value: 'appeal', labelKey: 'appeal' },
  { value: 'other', labelKey: 'other' }
];

// Default steps for common procedure types
const DEFAULT_STEPS = {
  aide_application: [
    { name: 'Check eligibility requirements', completed: false },
    { name: 'Create account on provider website', completed: false },
    { name: 'Fill application form', completed: false },
    { name: 'Gather required documents', completed: false },
    { name: 'Submit application', completed: false },
    { name: 'Wait for decision', completed: false }
  ],
  document_request: [
    { name: 'Identify required document', completed: false },
    { name: 'Access official portal', completed: false },
    { name: 'Submit request', completed: false },
    { name: 'Receive document', completed: false }
  ],
  account_creation: [
    { name: 'Go to provider website', completed: false },
    { name: 'Create account', completed: false },
    { name: 'Verify email/phone', completed: false },
    { name: 'Complete profile', completed: false }
  ],
  renewal: [
    { name: 'Review current status', completed: false },
    { name: 'Update information if needed', completed: false },
    { name: 'Submit renewal request', completed: false },
    { name: 'Confirmation received', completed: false }
  ],
  appeal: [
    { name: 'Review rejection reason', completed: false },
    { name: 'Gather supporting documents', completed: false },
    { name: 'Write appeal letter', completed: false },
    { name: 'Submit appeal', completed: false },
    { name: 'Wait for response', completed: false }
  ],
  other: [
    { name: 'Step 1', completed: false },
    { name: 'Step 2', completed: false },
    { name: 'Step 3', completed: false }
  ]
};

export function Procedures() {
  const { t } = useTranslation();
  const toast = useToast();
  const [procedures, setProcedures] = useState([]);
  const [savedAides, setSavedAides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedProcedure, setExpandedProcedure] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  
  // New procedure form state
  const [newProcedure, setNewProcedure] = useState({
    procedure_type: 'aide_application',
    procedure_name: '',
    related_aide_id: '',
    provider: '',
    deadline: '',
    notes: ''
  });

  // Fetch procedures from API
  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.PROCEDURES.LIST);
      setProcedures(response.data || []);
    } catch (error) {
      console.error('Error fetching procedures:', error);
      // Don't use toast here to avoid dependency issues
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch saved aides for the dropdown
  const fetchSavedAides = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SIMULATION.SAVED_AIDES);
      setSavedAides(response.data || []);
    } catch (error) {
      console.error('Error fetching saved aides:', error);
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
    fetchSavedAides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProcedures = useMemo(() => {
    if (statusFilter === 'all') return procedures;
    return procedures.filter(p => p.status === statusFilter);
  }, [statusFilter, procedures]);

  const stats = useMemo(() => ({
    total: procedures.length,
    inProgress: procedures.filter(p => p.status === 'in-progress').length,
    pending: procedures.filter(p => p.status === 'pending').length,
    completed: procedures.filter(p => p.status === 'completed').length
  }), [procedures]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Create new procedure
  const handleCreateProcedure = async () => {
    if (!newProcedure.procedure_name.trim()) {
      toast.error(t('dashboard.procedures.nameRequired'));
      return;
    }

    try {
      setActionLoading('create');
      const steps = DEFAULT_STEPS[newProcedure.procedure_type] || DEFAULT_STEPS.other;
      
      // Generate a unique procedure_id
      const procedureId = `${newProcedure.procedure_type}-${Date.now()}`;
      
      const payload = {
        ...newProcedure,
        procedure_id: procedureId,
        procedure_category: newProcedure.procedure_type,
        steps: steps,
        total_steps: steps.length,
        current_step: 0,
        status: 'not-started',
        related_aide_id: newProcedure.related_aide_id || null,
        deadline: newProcedure.deadline || null
      };

      const response = await api.post(API_ENDPOINTS.PROCEDURES.CREATE, payload);
      // Add new procedure to local state instead of refetching
      if (response.data) {
        setProcedures(prev => [response.data, ...prev]);
      }
      toast.success(t('dashboard.procedures.created'));
      setShowNewModal(false);
      setNewProcedure({
        procedure_type: 'aide_application',
        procedure_name: '',
        related_aide_id: '',
        provider: '',
        deadline: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating procedure:', error);
      toast.error(t('dashboard.procedures.errorCreating'));
    } finally {
      setActionLoading(null);
    }
  };

  // Update procedure status
  const handleUpdateStatus = async (procedureId, newStatus) => {
    try {
      setActionLoading(procedureId);
      await api.patch(API_ENDPOINTS.PROCEDURES.UPDATE(procedureId), { status: newStatus });
      // Update local state instead of refetching
      setProcedures(prev => prev.map(p => 
        p.id === procedureId ? { ...p, status: newStatus } : p
      ));
      toast.success(t('dashboard.procedures.statusUpdated'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('dashboard.procedures.errorUpdating'));
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle step completion
  const handleToggleStep = async (procedure, stepIndex) => {
    try {
      setActionLoading(procedure.id);
      const updatedSteps = [...procedure.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: !updatedSteps[stepIndex].completed,
        date: !updatedSteps[stepIndex].completed ? new Date().toISOString() : null
      };

      // Calculate new current step (first uncompleted step)
      const newCurrentStep = updatedSteps.findIndex(s => !s.completed);
      const currentStep = newCurrentStep === -1 ? updatedSteps.length : newCurrentStep;
      
      // Auto-update status based on progress
      let newStatus = procedure.status;
      if (currentStep === 0) {
        newStatus = 'not-started';
      } else if (currentStep === updatedSteps.length) {
        newStatus = 'pending'; // All steps done, waiting for result
      } else {
        newStatus = 'in-progress';
      }

      await api.patch(API_ENDPOINTS.PROCEDURES.UPDATE(procedure.id), {
        steps: updatedSteps,
        current_step: currentStep,
        status: newStatus
      });
      
      // Update local state instead of refetching
      setProcedures(prev => prev.map(p => 
        p.id === procedure.id 
          ? { ...p, steps: updatedSteps, current_step: currentStep, status: newStatus }
          : p
      ));
      toast.success(t('dashboard.procedures.stepUpdated'));
    } catch (error) {
      console.error('Error updating step:', error);
      toast.error(t('dashboard.procedures.errorUpdating'));
    } finally {
      setActionLoading(null);
    }
  };

  // Delete procedure
  const handleDeleteProcedure = async (procedureId) => {
    try {
      setActionLoading(procedureId);
      await api.delete(API_ENDPOINTS.PROCEDURES.DELETE(procedureId));
      // Update local state instead of refetching
      setProcedures(prev => prev.filter(p => p.id !== procedureId));
      toast.success(t('dashboard.procedures.deleted'));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting procedure:', error);
      toast.error(t('dashboard.procedures.errorDeleting'));
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate progress percentage
  const getProgress = (procedure) => {
    if (!procedure.steps || procedure.steps.length === 0) return 0;
    const completed = procedure.steps.filter(s => s.completed).length;
    return Math.round((completed / procedure.steps.length) * 100);
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
        <Button variant="primary" onClick={() => setShowNewModal(true)}>
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
            {t(`dashboard.procedures.filters.${filter.replace(/-/g, '')}`)}
            {filter !== 'all' && (
              <span className={styles.filterCount}>
                {procedures.filter(p => p.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Procedures List */}
      <div className={styles.proceduresList}>
        {filteredProcedures.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key="empty-state"
          >
            <i className="ri-file-list-3-line" />
            <p>{procedures.length === 0 
              ? t('dashboard.procedures.noProcedures') 
              : t('dashboard.procedures.noResults')
            }</p>
            {procedures.length === 0 && (
              <Button variant="primary" onClick={() => setShowNewModal(true)}>
                <i className="ri-add-line" />
                {t('dashboard.procedures.startFirst')}
              </Button>
            )}
          </motion.div>
        ) : (
          filteredProcedures.map((procedure) => {
            const progress = getProgress(procedure);
            const currentStep = procedure.current_step || 0;
            const totalSteps = procedure.total_steps || procedure.steps?.length || 0;
            
            return (
              <motion.div
                key={procedure.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={`${styles.procedureCard} ${expandedProcedure === procedure.id ? styles.expanded : ''}`}
                >
                    {/* Main Info */}
                    <div className={styles.procedureHeader}>
                      <div className={styles.procedureInfo}>
                        <div className={styles.procedureTitleRow}>
                          <h3 className={styles.procedureName}>{procedure.procedure_name}</h3>
                          <Badge variant={STATUS_CONFIG[procedure.status]?.color || 'default'}>
                            <i className={STATUS_CONFIG[procedure.status]?.icon || 'ri-question-line'} />
                            {t(`dashboard.procedures.status.${STATUS_CONFIG[procedure.status]?.labelKey || 'unknown'}`)}
                          </Badge>
                        </div>
                        <p className={styles.procedureType}>
                          {t(`dashboard.procedures.types.${procedure.procedure_category || procedure.procedure_type || 'other'}`)}
                        </p>
                        
                        <div className={styles.procedureMeta}>
                          {procedure.provider && (
                            <span>
                              <i className="ri-building-line" />
                              {procedure.provider}
                            </span>
                          )}
                          {procedure.deadline && (
                            <span>
                              <i className="ri-calendar-line" />
                              {t('dashboard.procedures.deadline')}: {formatDate(procedure.deadline)}
                            </span>
                          )}
                          <span>
                            <i className="ri-time-line" />
                            {t('dashboard.procedures.created')}: {formatDate(procedure.created_at)}
                          </span>
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
                            strokeDasharray={`${progress}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className={styles.progressText}>{progress}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {procedure.steps && procedure.steps.length > 0 && (
                      <div className={styles.stepsProgress}>
                        <div className={styles.stepsTrack}>
                          {procedure.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`${styles.stepDot} ${step.completed ? styles.completed : ''} ${idx === currentStep ? styles.current : ''}`}
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
                          {t('dashboard.procedures.step')} {currentStep} / {totalSteps}
                        </span>
                      </div>
                    )}

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
                          {procedure.steps && procedure.steps.length > 0 && (
                            <div className={styles.detailSection}>
                              <h4>{t('dashboard.procedures.stepsOverview')}</h4>
                              <div className={styles.stepsList}>
                                {procedure.steps.map((step, idx) => (
                                  <div
                                    key={idx}
                                    className={`${styles.stepItem} ${step.completed ? styles.completed : ''}`}
                                    onClick={() => handleToggleStep(procedure, idx)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div className={styles.stepIndicator}>
                                      {step.completed ? (
                                        <i className="ri-checkbox-circle-fill" />
                                      ) : (
                                        <i className="ri-checkbox-blank-circle-line" />
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
                          )}

                          {/* Notes */}
                          {procedure.notes && (
                            <div className={styles.detailSection}>
                              <h4>{t('dashboard.procedures.notes')}</h4>
                              <p className={styles.notesText}>{procedure.notes}</p>
                            </div>
                          )}

                          {/* Status Actions */}
                          <div className={styles.detailSection}>
                            <h4>{t('dashboard.procedures.changeStatus')}</h4>
                            <div className={styles.statusActions}>
                              {procedure.status !== 'completed' && (
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(procedure.id, 'completed')}
                                  disabled={actionLoading === procedure.id}
                                >
                                  <i className="ri-check-line" />
                                  {t('dashboard.procedures.markCompleted')}
                                </Button>
                              )}
                              {procedure.status !== 'pending' && (
                                <Button 
                                  variant="warning" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(procedure.id, 'pending')}
                                  disabled={actionLoading === procedure.id}
                                >
                                  <i className="ri-time-line" />
                                  {t('dashboard.procedures.markPending')}
                                </Button>
                              )}
                              {procedure.status !== 'rejected' && (
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(procedure.id, 'rejected')}
                                  disabled={actionLoading === procedure.id}
                                >
                                  <i className="ri-close-line" />
                                  {t('dashboard.procedures.markRejected')}
                                </Button>
                              )}
                            </div>
                          </div>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowDeleteModal(procedure)}
                          disabled={actionLoading === procedure.id}
                        >
                          <i className="ri-delete-bin-line" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )
        }
      </div>

      {/* New Procedure Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={t('dashboard.procedures.newProcedure')}
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>{t('dashboard.procedures.form.name')}</label>
            <input
              type="text"
              value={newProcedure.procedure_name}
              onChange={(e) => setNewProcedure(prev => ({ ...prev, procedure_name: e.target.value }))}
              placeholder={t('dashboard.procedures.form.namePlaceholder')}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('dashboard.procedures.form.type')}</label>
            <select
              value={newProcedure.procedure_type}
              onChange={(e) => setNewProcedure(prev => ({ ...prev, procedure_type: e.target.value }))}
              className={styles.select}
            >
              {PROCEDURE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {t(`dashboard.procedures.types.${type.value}`)}
                </option>
              ))}
            </select>
          </div>

          {savedAides.length > 0 && (
            <div className={styles.formGroup}>
              <label>{t('dashboard.procedures.form.relatedAide')}</label>
              <select
                value={newProcedure.related_aide_id}
                onChange={(e) => setNewProcedure(prev => ({ ...prev, related_aide_id: e.target.value }))}
                className={styles.select}
              >
                <option value="">{t('dashboard.procedures.form.noAide')}</option>
                {savedAides.map(aide => (
                  <option key={aide.id} value={aide.aide_id}>
                    {aide.aide_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>{t('dashboard.procedures.form.provider')}</label>
            <input
              type="text"
              value={newProcedure.provider}
              onChange={(e) => setNewProcedure(prev => ({ ...prev, provider: e.target.value }))}
              placeholder={t('dashboard.procedures.form.providerPlaceholder')}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('dashboard.procedures.form.deadline')}</label>
            <input
              type="date"
              value={newProcedure.deadline}
              onChange={(e) => setNewProcedure(prev => ({ ...prev, deadline: e.target.value }))}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('dashboard.procedures.form.notes')}</label>
            <textarea
              value={newProcedure.notes}
              onChange={(e) => setNewProcedure(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('dashboard.procedures.form.notesPlaceholder')}
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateProcedure}
              disabled={actionLoading === 'create'}
            >
              {actionLoading === 'create' ? (
                <Loading.Spinner size="sm" />
              ) : (
                <>
                  <i className="ri-add-line" />
                  {t('dashboard.procedures.create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title={t('dashboard.procedures.deleteConfirm.title')}
      >
        <div className={styles.modalContent}>
          <p>{t('dashboard.procedures.deleteConfirm.message', { name: showDeleteModal?.procedure_name })}</p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowDeleteModal(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteProcedure(showDeleteModal?.id)}
              disabled={actionLoading === showDeleteModal?.id}
            >
              {actionLoading === showDeleteModal?.id ? (
                <Loading.Spinner size="sm" />
              ) : (
                <>
                  <i className="ri-delete-bin-line" />
                  {t('common.delete')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default Procedures;
