import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Card, Button, Input } from '../../../components/ui';
import { ROUTES, generatePath } from '../../../config/routes';
import { apiFetch, API_ENDPOINTS } from '../../../config/api';
import styles from './Blog.module.css';

const CONTENT_TYPES = ['all', 'tutorial', 'article', 'guide', 'video', 'infographic'];

export function Blog() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  
  // State
  const [contents, setContents] = useState([]);
  const [featuredContent, setFeaturedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Fetch content
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      // Don't filter by language - show all content
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }

      const response = await apiFetch(`${API_ENDPOINTS.CONTENT.LIST}?${params}`);
      
      const allContents = response.data?.contents || [];
      
      // Filter by search locally (for client-side search)
      let filteredContents = allContents;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredContents = allContents.filter(c => 
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      setContents(filteredContents);
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 0,
      }));

      // Set featured content (first featured item or first item)
      const featured = allContents.find(c => c.is_featured) || allContents[0];
      setFeaturedContent(featured);

    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedType, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get content type icon
  const getTypeIcon = (type) => {
    const icons = {
      tutorial: 'ri-slideshow-line',
      article: 'ri-article-line',
      guide: 'ri-book-open-line',
      video: 'ri-video-line',
      image: 'ri-image-line',
      infographic: 'ri-bar-chart-box-line',
    };
    return icons[type] || 'ri-article-line';
  };

  // Get content type label
  const getTypeLabel = (type) => {
    const labels = {
      tutorial: t('blog.types.tutorial', 'Tutorial'),
      article: t('blog.types.article', 'Article'),
      guide: t('blog.types.guide', 'Guide'),
      video: t('blog.types.video', 'Video'),
      image: t('blog.types.image', 'Image'),
      infographic: t('blog.types.infographic', 'Infographic'),
    };
    return labels[type] || type;
  };

  // Handle page change
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track view when clicking on content
  const handleContentClick = async (content) => {
    try {
      await apiFetch(API_ENDPOINTS.CONTENT.TRACK_VIEW(content.id), {
        method: 'POST',
      });
    } catch {
      // Silent fail for view tracking
    }
  };

  // Generate structured data for SEO
  const generateStructuredData = () => {
    const articles = contents.map(content => ({
      '@type': 'Article',
      headline: content.title,
      description: content.description,
      image: content.thumbnail_url || '/images/default-blog.jpg',
      datePublished: content.published_at,
      author: {
        '@type': 'Organization',
        name: 'AIDE+',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AIDE+',
        logo: {
          '@type': 'ImageObject',
          url: 'https://aideplus.fr/logo.png',
        },
      },
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: t('blog.seo.title', 'Blog - AIDE+'),
      description: t('blog.seo.description', 'Guides, tutorials, and tips for navigating French administrative procedures'),
      blogPost: articles,
    };
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('blog.seo.title', 'Blog & Guides')} | AIDE+</title>
        <meta name="description" content={t('blog.seo.description', 'Discover guides, tutorials, and tips to help you navigate French administrative procedures and access government aid.')} />
        <meta name="keywords" content="French administration, CAF, APL, RSA, government aid, expatriate guide, student in France" />
        <link rel="canonical" href="https://aideplus.fr/blog" />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${t('blog.seo.title', 'Blog & Guides')} | AIDE+`} />
        <meta property="og:description" content={t('blog.seo.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aideplus.fr/blog" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t('blog.seo.title')} | AIDE+`} />
        <meta name="twitter:description" content={t('blog.seo.description')} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>{t('blog.badge', 'Resources')}</span>
          <h1 className={styles.title}>{t('blog.title', 'Blog & Guides')}</h1>
          <p className={styles.subtitle}>
            {t('blog.subtitle', 'Practical guides and tutorials to help you navigate French administration')}
          </p>
        </motion.div>
      </section>

      {/* Featured Post */}
      {featuredContent && !loading && (
        <section className={styles.featuredSection}>
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            itemScope
            itemType="https://schema.org/Article"
          >
            <Link 
              to={generatePath(ROUTES.BLOG_POST, { slug: featuredContent.slug })}
              className={styles.featuredCard}
              onClick={() => handleContentClick(featuredContent)}
            >
              <div className={styles.featuredImage}>
                {featuredContent.thumbnail_url ? (
                  <img 
                    src={featuredContent.thumbnail_url} 
                    alt={featuredContent.title}
                    itemProp="image"
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <i className={getTypeIcon(featuredContent.content_type)} />
                  </div>
                )}
                <span className={styles.featuredBadge}>{t('blog.featured', 'Featured')}</span>
              </div>
              <div className={styles.featuredContent}>
                <div className={styles.postMeta}>
                  <span className={styles.category}>
                    <i className={getTypeIcon(featuredContent.content_type)} />
                    {getTypeLabel(featuredContent.content_type)}
                  </span>
                  <span className={styles.dot}>•</span>
                  <time dateTime={featuredContent.published_at} itemProp="datePublished">
                    {formatDate(featuredContent.published_at)}
                  </time>
                  {featuredContent.view_count > 0 && (
                    <>
                      <span className={styles.dot}>•</span>
                      <span>{featuredContent.view_count} {t('blog.views', 'views')}</span>
                    </>
                  )}
                </div>
                <h2 className={styles.featuredTitle} itemProp="headline">{featuredContent.title}</h2>
                <p className={styles.featuredExcerpt} itemProp="description">{featuredContent.description}</p>
                <div className={styles.postTags}>
                  {featuredContent.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <span className={styles.readMore}>
                  {t('blog.readMore', 'Read more')}
                  <i className="ri-arrow-right-line" />
                </span>
              </div>
            </Link>
          </motion.article>
        </section>
      )}

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder={t('blog.searchPlaceholder', 'Search articles...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              icon="ri-search-line"
            />
          </div>
          <div className={styles.categories}>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                className={`${styles.categoryBtn} ${selectedType === type ? styles.active : ''}`}
                onClick={() => {
                  setSelectedType(type);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                {type === 'all' 
                  ? t('blog.types.all', 'All') 
                  : getTypeLabel(type)
                }
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <i className="ri-error-warning-line" />
          <p>{t('blog.error', 'Failed to load content')}</p>
          <Button variant="outline" onClick={fetchContent}>
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <i className="ri-loader-4-line ri-spin" />
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && (
        <section className={styles.postsSection}>
          {contents.length > 0 ? (
            <>
              <div className={styles.postsGrid}>
                {contents.filter(c => c.id !== featuredContent?.id).map((content, index) => (
                  <motion.article
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    itemScope
                    itemType="https://schema.org/Article"
                  >
                    <Link
                      to={generatePath(ROUTES.BLOG_POST, { slug: content.slug })}
                      className={styles.postCard}
                      onClick={() => handleContentClick(content)}
                    >
                      <Card className={styles.postCardInner}>
                        <div className={styles.postImage}>
                          {content.thumbnail_url ? (
                            <img 
                              src={content.thumbnail_url} 
                              alt={content.title}
                              itemProp="image"
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.imagePlaceholder}>
                              <i className={getTypeIcon(content.content_type)} />
                            </div>
                          )}
                          {content.content_type === 'video' && (
                            <div className={styles.playOverlay}>
                              <i className="ri-play-circle-fill" />
                            </div>
                          )}
                        </div>
                        <div className={styles.postContent}>
                          <div className={styles.postMeta}>
                            <span className={styles.category}>
                              {getTypeLabel(content.content_type)}
                            </span>
                            <span className={styles.dot}>•</span>
                            <span className={styles.langBadge}>
                              {content.language === 'fr' ? '🇫🇷' : '🇬🇧'}
                            </span>
                          </div>
                          <h3 className={styles.postTitle} itemProp="headline">{content.title}</h3>
                          <p className={styles.postExcerpt} itemProp="description">
                            {content.description?.substring(0, 120)}
                            {content.description?.length > 120 ? '...' : ''}
                          </p>
                          <div className={styles.postFooter}>
                            <time 
                              className={styles.postDate} 
                              dateTime={content.published_at}
                              itemProp="datePublished"
                            >
                              {formatDate(content.published_at)}
                            </time>
                            <span className={styles.readMore}>
                              {t('blog.readMore', 'Read more')}
                              <i className="ri-arrow-right-line" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Blog pagination">
                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    aria-label="Previous page"
                  >
                    <i className="ri-arrow-left-s-line" />
                    {t('common.previous', 'Previous')}
                  </button>
                  
                  <span className={styles.pageInfo}>
                    {t('blog.page', 'Page')} {pagination.page} {t('blog.of', 'of')} {pagination.totalPages}
                  </span>
                  
                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    aria-label="Next page"
                  >
                    {t('common.next', 'Next')}
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <i className="ri-file-search-line" />
              <h3>{t('blog.noResults.title', 'No content found')}</h3>
              <p>{t('blog.noResults.description', 'Try adjusting your search or filters')}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
              >
                {t('blog.noResults.reset', 'Reset filters')}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Newsletter CTA */}
      <section className={styles.newsletterSection}>
        <Card className={styles.newsletterCard}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterIcon}>
              <i className="ri-mail-open-line" />
            </div>
            <h2 className={styles.newsletterTitle}>
              {t('blog.newsletter.title', 'Stay informed')}
            </h2>
            <p className={styles.newsletterDescription}>
              {t('blog.newsletter.description', 'Subscribe to receive the latest guides and tips directly in your inbox.')}
            </p>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={t('blog.newsletter.placeholder', 'Your email address')}
                className={styles.newsletterInput}
              />
              <Button type="submit" variant="primary">
                {t('blog.newsletter.subscribe', 'Subscribe')}
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default Blog;
