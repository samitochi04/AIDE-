import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Card, Loading, Input } from '../../../components/ui';
import { API_ENDPOINTS, apiFetch } from '../../../config/api';
import { ROUTES, generatePath } from '../../../config/routes';
import styles from './Tutorials.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CONTENT_TYPES = ['all', 'tutorial', 'video', 'guide', 'article'];

export function Tutorials() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  // State
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (selectedType !== 'all') {
          params.append('type', selectedType);
        }

        // Don't filter by language - show all content regardless of language

        const response = await apiFetch(`${API_ENDPOINTS.CONTENT.LIST}?${params}`);

        if (response?.data) {
          setContents(response.data.contents || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.totalPages || 1
          }));
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedType, pagination.page]);

  // Update URL when type changes
  useEffect(() => {
    if (selectedType !== 'all') {
      setSearchParams({ type: selectedType });
    } else {
      setSearchParams({});
    }
  }, [selectedType, setSearchParams]);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tutorial': return 'ri-slideshow-line';
      case 'video': return 'ri-video-line';
      case 'guide': return 'ri-book-open-line';
      case 'article': return 'ri-article-line';
      case 'infographic': return 'ri-image-line';
      default: return 'ri-file-line';
    }
  };

  const getTypeLabel = (type) => {
    return t(`dashboard.tutorials.types.${type}`, type.charAt(0).toUpperCase() + type.slice(1));
  };

  // Filter contents by search query
  const filteredContents = searchQuery
    ? contents.filter(content =>
        content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contents;

  const handleContentClick = async (content) => {
    // Track view
    try {
      await apiFetch(API_ENDPOINTS.CONTENT.TRACK_VIEW(content.id), {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }

    // Navigate to tutorial detail page
    if (content.slug) {
      navigate(generatePath(ROUTES.TUTORIAL_VIEW, { slug: content.slug }));
    }
  };

  if (loading && contents.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('dashboard.tutorials.title', 'Tutorials')} | AIDE+</title>
      </Helmet>

      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className={styles.header} variants={itemVariants}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <i className="ri-play-circle-line" />
              {t('dashboard.tutorials.title', 'Tutorials & Resources')}
            </h1>
            <p className={styles.subtitle}>
              {t('dashboard.tutorials.subtitle', 'Watch tutorials and learn how to make the most of AIDE+')}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div className={styles.filters} variants={itemVariants}>
          <div className={styles.typeFilters}>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                className={`${styles.typeButton} ${selectedType === type ? styles.active : ''}`}
                onClick={() => {
                  setSelectedType(type);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <i className={type === 'all' ? 'ri-apps-line' : getTypeIcon(type)} />
                {type === 'all' ? t('common.all', 'All') : getTypeLabel(type)}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <Input
              type="text"
              placeholder={t('dashboard.tutorials.searchPlaceholder', 'Search tutorials...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="ri-search-line"
              className={styles.searchInput}
            />
          </div>
        </motion.div>

        {/* Content Grid */}
        {filteredContents.length === 0 ? (
          <motion.div className={styles.emptyState} variants={itemVariants}>
            <i className="ri-video-line" />
            <h3>{t('dashboard.tutorials.noContent', 'No content found')}</h3>
            <p>{t('dashboard.tutorials.noContentDesc', 'Try adjusting your filters or check back later.')}</p>
          </motion.div>
        ) : (
          <motion.div className={styles.contentGrid} variants={itemVariants}>
            {filteredContents.map((content) => (
              <motion.div
                key={content.id}
                className={styles.contentCard}
                variants={itemVariants}
                onClick={() => handleContentClick(content)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={styles.thumbnail}>
                  {content.thumbnail_url ? (
                    <img src={content.thumbnail_url} alt={content.title} />
                  ) : (
                    <div className={styles.placeholderThumbnail}>
                      <i className={getTypeIcon(content.content_type)} />
                    </div>
                  )}
                  
                  {content.content_type === 'video' && (
                    <div className={styles.playOverlay}>
                      <i className="ri-play-circle-fill" />
                    </div>
                  )}
                  
                  {content.duration_seconds && (
                    <span className={styles.duration}>
                      {formatDuration(content.duration_seconds)}
                    </span>
                  )}

                  <span className={styles.typeBadge}>
                    <i className={getTypeIcon(content.content_type)} />
                    {getTypeLabel(content.content_type)}
                  </span>
                </div>

                <div className={styles.contentInfo}>
                  <h3 className={styles.contentTitle}>{content.title}</h3>
                  {content.description && (
                    <p className={styles.contentDescription}>{content.description}</p>
                  )}
                  
                  <div className={styles.contentMeta}>
                    <span className={styles.views}>
                      <i className="ri-eye-line" />
                      {content.view_count || 0} {t('dashboard.tutorials.views', 'views')}
                    </span>
                    <span className={styles.language}>
                      {content.language === 'fr' ? '🇫🇷' : '🇬🇧'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div className={styles.pagination} variants={itemVariants}>
            <button
              className={styles.pageButton}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              <i className="ri-arrow-left-s-line" />
              {t('common.previous', 'Previous')}
            </button>
            
            <span className={styles.pageInfo}>
              {t('common.pageOf', 'Page {{current}} of {{total}}', {
                current: pagination.page,
                total: pagination.totalPages
              })}
            </span>
            
            <button
              className={styles.pageButton}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              {t('common.next', 'Next')}
              <i className="ri-arrow-right-s-line" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

export default Tutorials;
