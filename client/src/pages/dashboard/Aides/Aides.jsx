import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Badge, Loading } from '../../../components/ui';
import { api, API_ENDPOINTS } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import styles from './Aides.module.css';

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

const CATEGORIES = [
  { value: 'all', icon: 'ri-apps-line' },
  { value: 'housing', icon: 'ri-home-line' },
  { value: 'logement', icon: 'ri-home-line' },
  { value: 'family', icon: 'ri-parent-line' },
  { value: 'famille', icon: 'ri-parent-line' },
  { value: 'employment', icon: 'ri-briefcase-line' },
  { value: 'emploi', icon: 'ri-briefcase-line' },
  { value: 'social', icon: 'ri-hand-heart-line' },
  { value: 'health', icon: 'ri-heart-pulse-line' },
  { value: 'santé', icon: 'ri-heart-pulse-line' },
  { value: 'education', icon: 'ri-graduation-cap-line' },
  { value: 'éducation', icon: 'ri-graduation-cap-line' },
  { value: 'transport', icon: 'ri-bus-line' },
];

// Normalize category for display
const normalizeCategory = (category) => {
  if (!category) return 'social';
  const cat = category.toLowerCase();
  const mapping = {
    'logement': 'housing',
    'famille': 'family',
    'emploi': 'employment',
    'santé': 'health',
    'éducation': 'education',
  };
  return mapping[cat] || cat;
};

const STATUS_CONFIG = {
  saved: { color: 'primary', icon: 'ri-bookmark-fill' },
  applied: { color: 'warning', icon: 'ri-file-list-line' },
  received: { color: 'success', icon: 'ri-check-double-line' },
  rejected: { color: 'danger', icon: 'ri-close-line' },
};

export function Aides() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [latestSimulation, setLatestSimulation] = useState(null);
  const [savedAidesData, setSavedAidesData] = useState([]);
  const [savingAide, setSavingAide] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('eligible');
  const [sortBy, setSortBy] = useState('amount');
  const [expandedAide, setExpandedAide] = useState(null);

  // Handle view mode change - reset all filters
  const handleViewChange = useCallback((newMode) => {
    setViewMode(newMode);
    setSelectedCategory('all');
    setSearchQuery('');
    setExpandedAide(null);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const [simulationRes, savedRes] = await Promise.all([
        api.get(API_ENDPOINTS.SIMULATION.LATEST).catch(() => null),
        api.get(API_ENDPOINTS.SIMULATION.SAVED_AIDES).catch(() => ({ data: [] })),
      ]);
      
      if (simulationRes?.data) {
        setLatestSimulation(simulationRes.data);
      }
      
      setSavedAidesData(savedRes?.data || []);
    } catch (err) {
      console.error('Failed to fetch aides data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get eligible aides from latest simulation
  const eligibleAides = useMemo(() => {
    if (!latestSimulation?.results?.eligibleAides) return [];
    return latestSimulation.results.eligibleAides;
  }, [latestSimulation]);

  // Get saved aide IDs for quick lookup
  const savedAideIds = useMemo(() => {
    return new Set(savedAidesData.map(a => a.aide_id));
  }, [savedAidesData]);

  // Current list based on view mode
  const currentAides = useMemo(() => {
    if (viewMode === 'saved') {
      return savedAidesData.map(sa => ({
        id: sa.aide_id,
        name: sa.aide_name,
        description: sa.aide_description,
        category: sa.aide_category,
        monthlyAmount: sa.monthly_amount,
        sourceUrl: sa.source_url,
        applicationUrl: sa.application_url,
        savedStatus: sa.status,
        savedAt: sa.created_at,
        appliedAt: sa.applied_at,
        notes: sa.notes,
      }));
    }
    return eligibleAides;
  }, [viewMode, eligibleAides, savedAidesData]);

  // Filtered and sorted aides
  const filteredAides = useMemo(() => {
    return currentAides
      .filter(aide => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = (aide.name || '').toLowerCase().includes(query);
          const matchesDesc = (aide.description || '').toLowerCase().includes(query);
          if (!matchesName && !matchesDesc) return false;
        }
        
        if (selectedCategory !== 'all') {
          const aideCategory = normalizeCategory(aide.category || aide.categoryKey);
          if (aideCategory !== selectedCategory) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount':
            return (b.monthlyAmount || 0) - (a.monthlyAmount || 0);
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          default:
            return 0;
        }
      });
  }, [currentAides, searchQuery, selectedCategory, sortBy]);

  // Toggle save aide
  const toggleSaveAide = useCallback(async (aide) => {
    const aideId = aide.id;
    const isSaved = savedAideIds.has(aideId);
    
    setSavingAide(aideId);
    
    try {
      if (isSaved) {
        await api.delete(API_ENDPOINTS.SIMULATION.UNSAVE_AIDE(aideId));
        setSavedAidesData(prev => prev.filter(a => a.aide_id !== aideId));
      } else {
        const response = await api.post(API_ENDPOINTS.SIMULATION.SAVE_AIDE, {
          aide,
          simulationId: latestSimulation?.id,
        });
        if (response?.data) {
          setSavedAidesData(prev => [response.data, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to toggle save aide:', err);
    } finally {
      setSavingAide(null);
    }
  }, [savedAideIds, latestSimulation?.id]);

  // Update aide status
  const updateAideStatus = useCallback(async (aideId, newStatus) => {
    try {
      const response = await api.patch(API_ENDPOINTS.SIMULATION.UPDATE_AIDE_STATUS(aideId), {
        status: newStatus,
      });
      
      if (response?.data) {
        setSavedAidesData(prev => 
          prev.map(a => a.aide_id === aideId ? response.data : a)
        );
      }
    } catch (err) {
      console.error('Failed to update aide status:', err);
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: eligibleAides.length,
    totalPotential: eligibleAides.reduce((sum, a) => sum + (a.monthlyAmount || 0), 0),
    saved: savedAidesData.length,
    applied: savedAidesData.filter(a => a.status === 'applied').length,
  }), [eligibleAides, savedAidesData]);

  // Get unique categories from aides
  const availableCategories = useMemo(() => {
    const cats = new Set(['all']);
    currentAides.forEach(aide => {
      const cat = normalizeCategory(aide.category || aide.categoryKey);
      if (cat) cats.add(cat);
    });
    return CATEGORIES.filter(c => cats.has(c.value) || c.value === 'all');
  }, [currentAides]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // No simulation yet
  if (!latestSimulation && viewMode === 'eligible') {
    return (
      <div className={styles.container}>
        <div className={styles.emptyStateContainer}>
          <Card className={styles.emptyStateCard}>
            <i className="ri-search-eye-line" />
            <h2>{t('dashboard.aides.noSimulation')}</h2>
            <p>{t('dashboard.aides.noSimulationDesc')}</p>
            <Button variant="primary" onClick={() => navigate(ROUTES.SIMULATION)}>
              <i className="ri-play-circle-line" />
              {t('dashboard.aides.runFirstSimulation')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('dashboard.aides.title')}</h1>
          <p className={styles.subtitle}>
            {latestSimulation && (
              <>
                {t('dashboard.aides.lastSimulation')}: {formatDate(latestSimulation.created_at)}
              </>
            )}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(ROUTES.SIMULATION)}>
          <i className="ri-refresh-line" />
          {t('dashboard.aides.runNewSimulation')}
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--primary)' }}>
            <i className="ri-file-list-3-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>{t('dashboard.aides.stats.eligible')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--success)' }}>
            <i className="ri-money-euro-circle-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatCurrency(stats.totalPotential)}</span>
            <span className={styles.statLabel}>{t('dashboard.aides.stats.potential')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--accent)' }}>
            <i className="ri-bookmark-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.saved}</span>
            <span className={styles.statLabel}>{t('dashboard.aides.stats.saved')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--warning)' }}>
            <i className="ri-file-edit-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.applied}</span>
            <span className={styles.statLabel}>{t('dashboard.aides.stats.applied')}</span>
          </div>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewToggleBtn} ${viewMode === 'eligible' ? styles.active : ''}`}
          onClick={() => handleViewChange('eligible')}
        >
          <i className="ri-list-check-2" />
          {t('dashboard.aides.viewEligible')} ({eligibleAides.length})
        </button>
        <button
          className={`${styles.viewToggleBtn} ${viewMode === 'saved' ? styles.active : ''}`}
          onClick={() => handleViewChange('saved')}
        >
          <i className="ri-bookmark-line" />
          {t('dashboard.aides.viewSaved')} ({savedAidesData.length})
        </button>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Input
              type="text"
              placeholder={t('dashboard.aides.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="ri-search-line"
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="amount">{t('dashboard.aides.sort.byAmount')}</option>
              <option value="name">{t('dashboard.aides.sort.byName')}</option>
            </select>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className={styles.categoryPills}>
          {availableCategories.map(cat => (
            <button
              key={cat.value}
              className={`${styles.categoryPill} ${selectedCategory === cat.value ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <i className={cat.icon} />
              <span>{t(`dashboard.aides.categories.${cat.value}`)}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Aides List */}
      <motion.div
        key={viewMode}
        className={styles.aidesList}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="sync">
          {filteredAides.length === 0 ? (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <i className="ri-search-line" />
              <p>
                {viewMode === 'saved' 
                  ? t('dashboard.aides.noSavedAides')
                  : t('dashboard.aides.noResults')
                }
              </p>
              {searchQuery || selectedCategory !== 'all' ? (
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}>
                  {t('dashboard.aides.clearFilters')}
                </Button>
              ) : viewMode === 'saved' ? (
                <Button variant="outline" onClick={() => setViewMode('eligible')}>
                  {t('dashboard.aides.browseEligible')}
                </Button>
              ) : null}
            </motion.div>
          ) : (
            filteredAides.map((aide) => {
              const isSaved = savedAideIds.has(aide.id);
              const categoryKey = normalizeCategory(aide.category || aide.categoryKey);
              const categoryIcon = CATEGORIES.find(c => c.value === categoryKey)?.icon || 'ri-hand-heart-line';
              
              return (
                <motion.div
                  key={aide.id}
                  variants={itemVariants}
                  layout
                >
                  <Card 
                    className={`${styles.aideCard} ${expandedAide === aide.id ? styles.expanded : ''}`}
                  >
                    <div className={styles.aideHeader}>
                      <div className={styles.aideInfo}>
                        <div className={styles.aideTitleRow}>
                          <h3 className={styles.aideName}>{aide.name}</h3>
                          {viewMode === 'saved' && aide.savedStatus && (
                            <Badge variant={STATUS_CONFIG[aide.savedStatus]?.color || 'default'}>
                              <i className={STATUS_CONFIG[aide.savedStatus]?.icon} />
                              {t(`dashboard.aides.savedStatus.${aide.savedStatus}`)}
                            </Badge>
                          )}
                        </div>
                        <span className={styles.aideCategory}>
                          <i className={categoryIcon} />
                          {t(`dashboard.aides.categories.${categoryKey}`)}
                        </span>
                      </div>
                      
                      <div className={styles.aideAmount}>
                        {(aide.monthlyAmount || 0) > 0 ? (
                          <>
                            <span className={styles.amountValue}>
                              {formatCurrency(aide.monthlyAmount)}
                            </span>
                            <span className={styles.amountPeriod}>/{t('pricing.month')}</span>
                          </>
                        ) : (
                          <span className={styles.freeTag}>{t('dashboard.aides.free')}</span>
                        )}
                      </div>
                    </div>
                    
                    <p className={styles.aideDescription}>{aide.description}</p>
                    
                    <AnimatePresence>
                      {expandedAide === aide.id && (
                        <motion.div
                          className={styles.aideDetails}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {/* Status Update for saved aides */}
                          {viewMode === 'saved' && (
                            <div className={styles.detailSection}>
                              <h4>{t('dashboard.aides.updateStatus')}</h4>
                              <div className={styles.statusButtons}>
                                {['saved', 'applied', 'received', 'rejected'].map(status => (
                                  <button
                                    key={status}
                                    className={`${styles.statusBtn} ${aide.savedStatus === status ? styles.active : ''}`}
                                    onClick={() => updateAideStatus(aide.id, status)}
                                  >
                                    <i className={STATUS_CONFIG[status].icon} />
                                    {t(`dashboard.aides.savedStatus.${status}`)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Dates */}
                          {viewMode === 'saved' && (
                            <div className={styles.detailSection}>
                              <h4>{t('dashboard.aides.dates')}</h4>
                              <p>
                                <i className="ri-bookmark-line" />
                                {t('dashboard.aides.savedOn')}: {formatDate(aide.savedAt)}
                              </p>
                              {aide.appliedAt && (
                                <p>
                                  <i className="ri-file-edit-line" />
                                  {t('dashboard.aides.appliedOn')}: {formatDate(aide.appliedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className={styles.aideActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.expandBtn}`}
                        onClick={() => setExpandedAide(expandedAide === aide.id ? null : aide.id)}
                      >
                        <i className={expandedAide === aide.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                        {expandedAide === aide.id 
                          ? t('dashboard.aides.showLess') 
                          : t('dashboard.aides.showMore')
                        }
                      </button>
                      
                      <div className={styles.actionBtnGroup}>
                        <button
                          className={`${styles.actionBtn} ${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
                          onClick={() => toggleSaveAide(aide)}
                          disabled={savingAide === aide.id}
                          title={isSaved ? t('dashboard.aides.unsave') : t('dashboard.aides.save')}
                        >
                          {savingAide === aide.id ? (
                            <Loading.Spinner size="sm" />
                          ) : (
                            <i className={isSaved ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                          )}
                        </button>
                        
                        {aide.sourceUrl && (
                          <a href={aide.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <i className="ri-external-link-line" />
                              {t('dashboard.aides.learnMore')}
                            </Button>
                          </a>
                        )}
                        
                        {aide.applicationUrl && (
                          <a href={aide.applicationUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm">
                              <i className="ri-arrow-right-line" />
                              {t('dashboard.aides.startApplication')}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Aides;
