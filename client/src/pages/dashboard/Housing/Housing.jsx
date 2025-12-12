import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Input, Badge, Loading, Modal } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import { api, API_ENDPOINTS } from '../../../config/api';
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

// Category icons mapping
const CATEGORY_ICONS = {
  majorPortals: 'ri-building-2-line',
  directOwner: 'ri-user-heart-line',
  studentHousing: 'ri-graduation-cap-line',
  privateStudentResidences: 'ri-community-line',
  colocation: 'ri-team-line',
  furnished: 'ri-sofa-line',
  socialHousing: 'ri-government-line',
  temporary: 'ri-time-line',
  relocation: 'ri-truck-line',
  luxury: 'ri-vip-crown-2-line',
  apps: 'ri-smartphone-line',
  guarantorServices: 'ri-shield-check-line',
  depositHelp: 'ri-money-euro-circle-line'
};

// Price range display
const PRICE_DISPLAY = {
  '€': { label: 'Budget', color: 'success' },
  '€€': { label: 'Moderate', color: 'warning' },
  '€€€': { label: 'Premium', color: 'primary' },
  '€€€€': { label: 'Luxury', color: 'danger' }
};

export function Housing() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  // State
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedPlatforms, setSavedPlatforms] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [tips, setTips] = useState({ general: [], forForeigners: [] });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(null);

  // Fetch all housing data
  const fetchHousingData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [platformsRes, categoriesRes, guarantorsRes, tipsRes] = await Promise.all([
        api.get(API_ENDPOINTS.HOUSING.PLATFORMS),
        api.get(API_ENDPOINTS.HOUSING.CATEGORIES),
        api.get(API_ENDPOINTS.HOUSING.GUARANTORS),
        api.get(API_ENDPOINTS.HOUSING.TIPS)
      ]);

      setPlatforms(platformsRes.data || []);
      setCategories(categoriesRes.data || []);
      setGuarantors(guarantorsRes.data || []);
      setTips(tipsRes.data || { general: [], forForeigners: [] });

      // Fetch saved platforms (requires auth)
      try {
        const savedRes = await api.get(API_ENDPOINTS.HOUSING.SAVED);
        setSavedPlatforms(savedRes.data || []);
      } catch (err) {
        // User not logged in or no saved platforms
        setSavedPlatforms([]);
      }
    } catch (error) {
      console.error('Error fetching housing data:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHousingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter platforms based on category and search
  const filteredPlatforms = useMemo(() => {
    let result = [];
    
    // Flatten platforms from categories
    platforms.forEach(cat => {
      if (cat.platforms) {
        cat.platforms.forEach(platform => {
          result.push({
            ...platform,
            categoryId: cat.category,
            categoryName: cat.name
          });
        });
      }
    });

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.features?.some(f => f.toLowerCase().includes(query))
      );
    }

    return result;
  }, [platforms, selectedCategory, searchQuery]);

  // Check if platform is saved
  const isPlatformSaved = (platformId) => {
    return savedPlatforms.some(p => p.id === platformId);
  };

  // Save/unsave platform
  const handleSavePlatform = async (platform, e) => {
    e?.stopPropagation();
    setSavingPlatform(platform.id);

    try {
      if (isPlatformSaved(platform.id)) {
        await api.delete(API_ENDPOINTS.HOUSING.UNSAVE(platform.id));
        setSavedPlatforms(prev => prev.filter(p => p.id !== platform.id));
        toast.success(t('dashboard.housing.platformUnsaved'));
      } else {
        await api.post(API_ENDPOINTS.HOUSING.SAVE, {
          platformId: platform.id,
          category: platform.categoryId
        });
        setSavedPlatforms(prev => [...prev, platform]);
        toast.success(t('dashboard.housing.platformSaved'));
      }
    } catch (error) {
      console.error('Error saving platform:', error);
      toast.error(t('common.error'));
    } finally {
      setSavingPlatform(null);
    }
  };

  // Open platform details
  const handleOpenPlatform = (platform) => {
    // Normalize the platform object to ensure it has categoryId and categoryName
    const normalizedPlatform = {
      ...platform,
      categoryId: platform.categoryId || platform.category,
      categoryName: platform.categoryName || { 
        en: platform.category, 
        fr: platform.category 
      }
    };
    setSelectedPlatform(normalizedPlatform);
    setShowPlatformModal(true);
  };

  // Visit platform website
  const handleVisitPlatform = (url, e) => {
    e?.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Get category name in current language
  const getCategoryName = (cat) => {
    if (!cat) return '';
    if (typeof cat === 'string') return cat;
    if (typeof cat.name === 'object') {
      return cat.name[currentLang] || cat.name.en || cat.category || '';
    }
    return cat.name || cat.category || '';
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
          <h1 className={styles.title}>{t('dashboard.housing.title')}</h1>
          <p className={styles.subtitle}>{t('dashboard.housing.subtitle')}</p>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div className={styles.statsBar} variants={itemVariants}>
        <div className={styles.statItem}>
          <i className="ri-building-2-line" />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{filteredPlatforms.length}</span>
            <span className={styles.statLabel}>{t('dashboard.housing.platformsAvailable')}</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <i className="ri-bookmark-line" />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{savedPlatforms.length}</span>
            <span className={styles.statLabel}>{t('dashboard.housing.savedPlatforms')}</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <i className="ri-shield-check-line" />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{guarantors.length}</span>
            <span className={styles.statLabel}>{t('dashboard.housing.guarantorServices')}</span>
          </div>
        </div>
      </motion.div>

      <div className={styles.mainGrid}>
        {/* Left Column - Platforms */}
        <div className={styles.leftColumn}>
          {/* Search & Filter */}
          <motion.div variants={itemVariants}>
            <Card className={styles.filterCard}>
              <div className={styles.searchRow}>
                <Input
                  type="text"
                  placeholder={t('dashboard.housing.searchPlatforms')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon="ri-search-line"
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.categoryTabs}>
                <button
                  className={`${styles.categoryTab} ${selectedCategory === 'all' ? styles.active : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <i className="ri-apps-line" />
                  <span>{t('common.all')}</span>
                </button>
                {categories.slice(0, 8).map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <i className={CATEGORY_ICONS[cat.id] || cat.icon || 'ri-home-line'} />
                    <span>{getCategoryName(cat)}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Platforms List */}
          <motion.div variants={itemVariants}>
            <div className={styles.platformsGrid}>
              {filteredPlatforms.length === 0 ? (
                <Card className={styles.emptyCard}>
                  <div className={styles.emptyState}>
                    <i className="ri-search-line" />
                    <p>{t('dashboard.housing.noPlatformsFound')}</p>
                  </div>
                </Card>
              ) : (
                filteredPlatforms.map(platform => (
                  <Card
                    key={`${platform.categoryId}-${platform.id}`}
                    className={styles.platformCard}
                    onClick={() => handleOpenPlatform(platform)}
                  >
                    <div className={styles.platformHeader}>
                      <div className={styles.platformIcon}>
                        <i className={CATEGORY_ICONS[platform.categoryId] || 'ri-home-line'} />
                      </div>
                      <div className={styles.platformInfo}>
                        <h3 className={styles.platformName}>{platform.name}</h3>
                        <span className={styles.platformCategory}>
                          {getCategoryName(platform.categoryName)}
                        </span>
                      </div>
                      <button
                        className={`${styles.saveBtn} ${isPlatformSaved(platform.id) ? styles.saved : ''}`}
                        onClick={(e) => handleSavePlatform(platform, e)}
                        disabled={savingPlatform === platform.id}
                      >
                        <i className={isPlatformSaved(platform.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                      </button>
                    </div>

                    <p className={styles.platformDescription}>
                      {platform.description}
                    </p>

                    <div className={styles.platformMeta}>
                      {platform.priceRange && PRICE_DISPLAY[platform.priceRange] && (
                        <Badge variant={PRICE_DISPLAY[platform.priceRange].color} size="sm">
                          {platform.priceRange}
                        </Badge>
                      )}
                      {platform.languages?.length > 0 && (
                        <Badge variant="default" size="sm">
                          {platform.languages.join(', ')}
                        </Badge>
                      )}
                      {platform.hasApp && (
                        <Badge variant="primary" size="sm">
                          <i className="ri-smartphone-line" /> App
                        </Badge>
                      )}
                      {platform.agencyFees === false && (
                        <Badge variant="success" size="sm">
                          {t('dashboard.housing.noFees')}
                        </Badge>
                      )}
                    </div>

                    <div className={styles.platformActions}>
                      {platform.url && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleVisitPlatform(platform.url, e)}
                        >
                          <i className="ri-external-link-line" />
                          {t('dashboard.housing.visitSite')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Sidebar */}
        <div className={styles.rightColumn}>
          {/* Guarantor Services */}
          <motion.div variants={itemVariants}>
            <Card className={styles.guarantorsCard}>
              <h3>
                <i className="ri-shield-check-line" />
                {t('dashboard.housing.guarantorServices')}
              </h3>
              <p className={styles.cardDescription}>
                {t('dashboard.housing.guarantorDescription')}
              </p>
              
              <div className={styles.guarantorsList}>
                {guarantors.slice(0, 4).map(guarantor => (
                  <div 
                    key={guarantor.id} 
                    className={styles.guarantorItem}
                    onClick={() => handleOpenPlatform(guarantor)}
                  >
                    <div className={styles.guarantorInfo}>
                      <span className={styles.guarantorName}>{guarantor.name}</span>
                      {guarantor.cost && (
                        <Badge 
                          variant={guarantor.cost === 'Free' ? 'success' : 'default'} 
                          size="sm"
                        >
                          {guarantor.cost}
                        </Badge>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line" />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Tips & Advice */}
          <motion.div variants={itemVariants}>
            <Card className={styles.tipsCard}>
              <h3>
                <i className="ri-lightbulb-line" />
                {t('dashboard.housing.tipsTitle')}
              </h3>
              
              <div className={styles.tipsList}>
                {(tips.general?.general || []).slice(0, 5).map((tip, index) => (
                  <div key={index} className={styles.tipItem}>
                    <i className="ri-check-line" />
                    <span>{tip}</span>
                  </div>
                ))}
                {tips.general?.forForeigners && tips.general.forForeigners.length > 0 && (
                  <div className={styles.foreignerTips}>
                    <h4>{t('dashboard.housing.forForeigners')}</h4>
                    {tips.general.forForeigners.slice(0, 3).map((tip, index) => (
                      <div key={index} className={styles.tipItem}>
                        <i className="ri-global-line" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Saved Platforms */}
          {savedPlatforms.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className={styles.savedCard}>
                <h3>
                  <i className="ri-bookmark-line" />
                  {t('dashboard.housing.savedPlatforms')}
                </h3>
                
                <div className={styles.savedList}>
                  {savedPlatforms.slice(0, 5).map(platform => (
                    <div 
                      key={platform.id} 
                      className={styles.savedItem}
                      onClick={() => handleOpenPlatform(platform)}
                    >
                      <span className={styles.savedName}>{platform.name}</span>
                      <button
                        className={styles.unsaveBtn}
                        onClick={(e) => handleSavePlatform(platform, e)}
                      >
                        <i className="ri-close-line" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Need Help */}
          <motion.div variants={itemVariants}>
            <Card className={styles.helpCard}>
              <div className={styles.helpContent}>
                <i className="ri-questionnaire-line" />
                <h3>{t('dashboard.housing.needHelp')}</h3>
                <p>{t('dashboard.housing.needHelpDescription')}</p>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => navigate('/dashboard/chat')}
                >
                  <i className="ri-message-3-line" />
                  {t('dashboard.housing.askAssistant')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Platform Detail Modal */}
      <Modal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        title={selectedPlatform?.name}
        size="lg"
      >
        {selectedPlatform && (
          <div className={styles.platformModal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <i className={CATEGORY_ICONS[selectedPlatform.categoryId] || 'ri-home-line'} />
              </div>
              <div className={styles.modalTitleSection}>
                <h2>{selectedPlatform.name}</h2>
                <span className={styles.modalCategory}>
                  {getCategoryName(selectedPlatform.categoryName)}
                </span>
              </div>
            </div>

            <p className={styles.modalDescription}>
              {selectedPlatform.description}
            </p>

            <div className={styles.modalBadges}>
              {selectedPlatform.priceRange && PRICE_DISPLAY[selectedPlatform.priceRange] && (
                <Badge variant={PRICE_DISPLAY[selectedPlatform.priceRange].color}>
                  {selectedPlatform.priceRange} - {PRICE_DISPLAY[selectedPlatform.priceRange].label}
                </Badge>
              )}
              {selectedPlatform.languages?.length > 0 && (
                <Badge variant="default">
                  <i className="ri-global-line" /> {selectedPlatform.languages.join(', ')}
                </Badge>
              )}
              {selectedPlatform.coverage && (
                <Badge variant="default">
                  <i className="ri-map-pin-line" /> {selectedPlatform.coverage}
                </Badge>
              )}
              {selectedPlatform.hasApp && (
                <Badge variant="primary">
                  <i className="ri-smartphone-line" /> {t('dashboard.housing.mobileApp')}
                </Badge>
              )}
              {selectedPlatform.agencyFees === false && (
                <Badge variant="success">
                  <i className="ri-money-euro-circle-line" /> {t('dashboard.housing.noAgencyFees')}
                </Badge>
              )}
            </div>

            {/* Features */}
            {selectedPlatform.features?.length > 0 && (
              <div className={styles.modalSection}>
                <h4>{t('dashboard.housing.features')}</h4>
                <ul className={styles.featureList}>
                  {selectedPlatform.features.map((feature, i) => (
                    <li key={i}>
                      <i className="ri-check-line" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pros */}
            {selectedPlatform.pros?.length > 0 && (
              <div className={styles.modalSection}>
                <h4>{t('dashboard.housing.pros')}</h4>
                <ul className={styles.prosList}>
                  {selectedPlatform.pros.map((pro, i) => (
                    <li key={i}>
                      <i className="ri-thumb-up-line" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {selectedPlatform.cons?.length > 0 && (
              <div className={styles.modalSection}>
                <h4>{t('dashboard.housing.cons')}</h4>
                <ul className={styles.consList}>
                  {selectedPlatform.cons.map((con, i) => (
                    <li key={i}>
                      <i className="ri-thumb-down-line" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {selectedPlatform.tips?.length > 0 && (
              <div className={styles.modalSection}>
                <h4>{t('dashboard.housing.tips')}</h4>
                <ul className={styles.tipsList}>
                  {selectedPlatform.tips.map((tip, i) => (
                    <li key={i}>
                      <i className="ri-lightbulb-line" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eligibility for guarantor services */}
            {selectedPlatform.eligibility && (
              <div className={styles.modalSection}>
                <h4>{t('dashboard.housing.eligibility')}</h4>
                {Array.isArray(selectedPlatform.eligibility) ? (
                  <ul className={styles.eligibilityList}>
                    {selectedPlatform.eligibility.map((item, i) => (
                      <li key={i}>
                        <i className="ri-user-line" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{selectedPlatform.eligibility}</p>
                )}
              </div>
            )}

            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                onClick={() => handleSavePlatform(selectedPlatform)}
              >
                <i className={isPlatformSaved(selectedPlatform.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                {isPlatformSaved(selectedPlatform.id) 
                  ? t('dashboard.housing.unsave') 
                  : t('dashboard.housing.save')
                }
              </Button>
              {selectedPlatform.url && (
                <Button
                  variant="primary"
                  onClick={() => handleVisitPlatform(selectedPlatform.url)}
                >
                  <i className="ri-external-link-line" />
                  {t('dashboard.housing.visitSite')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

export default Housing;
