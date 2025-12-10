import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Badge, Loading } from '../../../components/ui';
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

// Mock aides data - replace with real API data
const MOCK_AIDES = [
  {
    id: 1,
    name: 'APL - Aide Personnalisée au Logement',
    category: 'housing',
    status: 'eligible',
    monthlyAmount: 350,
    description: 'Housing assistance to help pay your rent. Available for tenants with limited income.',
    requirements: ['Valid residence permit', 'Rental agreement', 'Income below threshold'],
    processingTime: '2-4 weeks',
    savedAt: '2024-01-15'
  },
  {
    id: 2,
    name: 'CAF - Allocations Familiales',
    category: 'family',
    status: 'eligible',
    monthlyAmount: 180,
    description: 'Family allowances for households with 2 or more children.',
    requirements: ['At least 2 dependent children', 'Residence in France'],
    processingTime: '3-6 weeks',
    savedAt: '2024-01-14'
  },
  {
    id: 3,
    name: 'Prime d\'Activité',
    category: 'employment',
    status: 'pending',
    monthlyAmount: 150,
    description: 'Activity bonus for workers with modest income.',
    requirements: ['Working status', 'Income between €1,000-€1,800/month', 'French residence'],
    processingTime: '1-2 weeks',
    savedAt: '2024-01-12'
  },
  {
    id: 4,
    name: 'RSA - Revenu de Solidarité Active',
    category: 'social',
    status: 'not-eligible',
    monthlyAmount: 565,
    description: 'Minimum income support for people with little or no resources.',
    requirements: ['Over 25 years old', 'No or very low income', '5 years residence in France'],
    processingTime: '4-8 weeks',
    savedAt: null
  },
  {
    id: 5,
    name: 'ALS - Allocation de Logement Social',
    category: 'housing',
    status: 'eligible',
    monthlyAmount: 200,
    description: 'Social housing allowance for those who do not qualify for APL.',
    requirements: ['Tenant status', 'Meet income criteria', 'Not eligible for APL'],
    processingTime: '2-4 weeks',
    savedAt: '2024-01-10'
  },
  {
    id: 6,
    name: 'CSS - Complémentaire Santé Solidaire',
    category: 'health',
    status: 'eligible',
    monthlyAmount: 0,
    description: 'Complementary health coverage for low-income individuals.',
    requirements: ['Resident in France', 'Income below threshold', 'Enrolled in social security'],
    processingTime: '2-3 weeks',
    savedAt: null
  },
  {
    id: 7,
    name: 'Bourse CROUS',
    category: 'education',
    status: 'not-eligible',
    monthlyAmount: 450,
    description: 'Student scholarship based on social criteria.',
    requirements: ['Student status', 'Under 28 years old', 'Parents\' income below threshold'],
    processingTime: '1-3 months',
    savedAt: null
  },
  {
    id: 8,
    name: 'Aide au Retour à l\'Emploi',
    category: 'employment',
    status: 'pending',
    monthlyAmount: 900,
    description: 'Unemployment benefits for job seekers.',
    requirements: ['Recently lost job', 'Registered with Pôle Emploi', 'Actively seeking work'],
    processingTime: '1-2 weeks',
    savedAt: null
  }
];

const CATEGORIES = [
  { value: 'all', icon: 'ri-apps-line' },
  { value: 'housing', icon: 'ri-home-line' },
  { value: 'family', icon: 'ri-parent-line' },
  { value: 'employment', icon: 'ri-briefcase-line' },
  { value: 'social', icon: 'ri-hand-heart-line' },
  { value: 'health', icon: 'ri-heart-pulse-line' },
  { value: 'education', icon: 'ri-graduation-cap-line' }
];

const STATUS_CONFIG = {
  eligible: { color: 'success', icon: 'ri-check-line' },
  'not-eligible': { color: 'danger', icon: 'ri-close-line' },
  pending: { color: 'warning', icon: 'ri-time-line' },
  applied: { color: 'primary', icon: 'ri-file-list-line' }
};

export function Aides() {
  const { t } = useTranslation();
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('amount');
  const [expandedAide, setExpandedAide] = useState(null);
  const [savedAides, setSavedAides] = useState(
    MOCK_AIDES.filter(a => a.savedAt).map(a => a.id)
  );

  const filteredAides = useMemo(() => {
    return MOCK_AIDES
      .filter(aide => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = aide.name.toLowerCase().includes(query);
          const matchesDesc = aide.description.toLowerCase().includes(query);
          if (!matchesName && !matchesDesc) return false;
        }
        
        // Category filter
        if (selectedCategory !== 'all' && aide.category !== selectedCategory) {
          return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && aide.status !== statusFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount':
            return b.monthlyAmount - a.monthlyAmount;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'status':
            const statusOrder = { eligible: 0, pending: 1, 'not-eligible': 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          default:
            return 0;
        }
      });
  }, [searchQuery, selectedCategory, statusFilter, sortBy]);

  const toggleSaveAide = (aideId) => {
    setSavedAides(prev => 
      prev.includes(aideId)
        ? prev.filter(id => id !== aideId)
        : [...prev, aideId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = useMemo(() => ({
    total: MOCK_AIDES.length,
    eligible: MOCK_AIDES.filter(a => a.status === 'eligible').length,
    totalPotential: MOCK_AIDES
      .filter(a => a.status === 'eligible')
      .reduce((sum, a) => sum + a.monthlyAmount, 0),
    saved: savedAides.length
  }), [savedAides]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('dashboard.aides.title')}</h1>
          <p className={styles.subtitle}>{t('dashboard.aides.subtitle')}</p>
        </div>
        <Button variant="primary">
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
            <span className={styles.statLabel}>{t('dashboard.aides.stats.total')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--success)' }}>
            <i className="ri-check-double-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.eligible}</span>
            <span className={styles.statLabel}>{t('dashboard.aides.stats.eligible')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--color': 'var(--warning)' }}>
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
              leftIcon={<i className="ri-search-line" />}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">{t('dashboard.aides.filters.allStatuses')}</option>
              <option value="eligible">{t('dashboard.aides.filters.eligible')}</option>
              <option value="pending">{t('dashboard.aides.filters.pending')}</option>
              <option value="not-eligible">{t('dashboard.aides.filters.notEligible')}</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="amount">{t('dashboard.aides.sort.byAmount')}</option>
              <option value="name">{t('dashboard.aides.sort.byName')}</option>
              <option value="status">{t('dashboard.aides.sort.byStatus')}</option>
            </select>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className={styles.categoryPills}>
          {CATEGORIES.map(cat => (
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
        className={styles.aidesList}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filteredAides.length === 0 ? (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <i className="ri-search-line" />
              <p>{t('dashboard.aides.noResults')}</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}>
                {t('dashboard.aides.clearFilters')}
              </Button>
            </motion.div>
          ) : (
            filteredAides.map((aide) => (
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
                        <Badge variant={STATUS_CONFIG[aide.status]?.color || 'default'}>
                          <i className={STATUS_CONFIG[aide.status]?.icon} />
                          {t(`dashboard.aides.status.${aide.status}`)}
                        </Badge>
                      </div>
                      <span className={styles.aideCategory}>
                        <i className={CATEGORIES.find(c => c.value === aide.category)?.icon} />
                        {t(`dashboard.aides.categories.${aide.category}`)}
                      </span>
                    </div>
                    
                    <div className={styles.aideAmount}>
                      {aide.monthlyAmount > 0 ? (
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
                        <div className={styles.detailSection}>
                          <h4>{t('dashboard.aides.requirements')}</h4>
                          <ul className={styles.requirementsList}>
                            {aide.requirements.map((req, idx) => (
                              <li key={idx}>
                                <i className="ri-checkbox-circle-line" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className={styles.detailSection}>
                          <h4>{t('dashboard.aides.processingTime')}</h4>
                          <p>
                            <i className="ri-time-line" />
                            {aide.processingTime}
                          </p>
                        </div>
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
                        className={`${styles.actionBtn} ${styles.saveBtn} ${savedAides.includes(aide.id) ? styles.saved : ''}`}
                        onClick={() => toggleSaveAide(aide.id)}
                        title={savedAides.includes(aide.id) ? t('dashboard.aides.unsave') : t('dashboard.aides.save')}
                      >
                        <i className={savedAides.includes(aide.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                      </button>
                      
                      {aide.status === 'eligible' && (
                        <Button variant="primary" size="sm">
                          {t('dashboard.aides.startApplication')}
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
    </div>
  );
}

export default Aides;
