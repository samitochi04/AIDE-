import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Card, Button, Input } from '../../../components/ui';
import { ROUTES, generatePath } from '../../../config/routes';
import styles from './Blog.module.css';

// Sample blog posts data - in production this would come from an API/CMS
const BLOG_POSTS = [
  {
    id: 1,
    slug: 'guide-apl-2024',
    titleKey: 'blog.posts.apl.title',
    excerptKey: 'blog.posts.apl.excerpt',
    category: 'guides',
    image: '/images/blog/apl-guide.jpg',
    date: '2024-12-01',
    readTime: 8,
  },
  {
    id: 2,
    slug: 'nouveautes-caf-2024',
    titleKey: 'blog.posts.caf.title',
    excerptKey: 'blog.posts.caf.excerpt',
    category: 'news',
    image: '/images/blog/caf-news.jpg',
    date: '2024-11-25',
    readTime: 5,
  },
  {
    id: 3,
    slug: 'prime-activite-conditions',
    titleKey: 'blog.posts.prime.title',
    excerptKey: 'blog.posts.prime.excerpt',
    category: 'guides',
    image: '/images/blog/prime-activite.jpg',
    date: '2024-11-20',
    readTime: 6,
  },
  {
    id: 4,
    slug: 'rsa-demande-etape-par-etape',
    titleKey: 'blog.posts.rsa.title',
    excerptKey: 'blog.posts.rsa.excerpt',
    category: 'tutorials',
    image: '/images/blog/rsa-guide.jpg',
    date: '2024-11-15',
    readTime: 10,
  },
  {
    id: 5,
    slug: 'aide-logement-etudiant',
    titleKey: 'blog.posts.student.title',
    excerptKey: 'blog.posts.student.excerpt',
    category: 'guides',
    image: '/images/blog/student-housing.jpg',
    date: '2024-11-10',
    readTime: 7,
  },
  {
    id: 6,
    slug: 'aspa-retraite-minimum',
    titleKey: 'blog.posts.aspa.title',
    excerptKey: 'blog.posts.aspa.excerpt',
    category: 'news',
    image: '/images/blog/aspa.jpg',
    date: '2024-11-05',
    readTime: 6,
  },
];

const CATEGORIES = ['all', 'guides', 'news', 'tutorials'];

export function Blog() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesSearch = searchQuery === '' || 
        t(post.titleKey).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(post.excerptKey).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, t]);

  const featuredPost = BLOG_POSTS[0];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(t('blog.locale'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('blog.seo.title')} | AIDE+</title>
        <meta name="description" content={t('blog.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>{t('blog.badge')}</span>
          <h1 className={styles.title}>{t('blog.title')}</h1>
          <p className={styles.subtitle}>{t('blog.subtitle')}</p>
        </motion.div>
      </section>

      {/* Featured Post */}
      <section className={styles.featuredSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link 
            to={generatePath(ROUTES.BLOG_POST, { slug: featuredPost.slug })}
            className={styles.featuredCard}
          >
            <div className={styles.featuredImage}>
              <div className={styles.imagePlaceholder}>
                <i className="ri-article-line" />
              </div>
              <span className={styles.featuredBadge}>{t('blog.featured')}</span>
            </div>
            <div className={styles.featuredContent}>
              <div className={styles.postMeta}>
                <span className={styles.category}>
                  {t(`blog.categories.${featuredPost.category}`)}
                </span>
                <span className={styles.dot}>•</span>
                <span>{formatDate(featuredPost.date)}</span>
                <span className={styles.dot}>•</span>
                <span>{t('blog.readTime', { minutes: featuredPost.readTime })}</span>
              </div>
              <h2 className={styles.featuredTitle}>{t(featuredPost.titleKey)}</h2>
              <p className={styles.featuredExcerpt}>{t(featuredPost.excerptKey)}</p>
              <span className={styles.readMore}>
                {t('blog.readMore')}
                <i className="ri-arrow-right-line" />
              </span>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder={t('blog.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon="ri-search-line"
            />
          </div>
          <div className={styles.categories}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {t(`blog.categories.${category}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className={styles.postsSection}>
        {filteredPosts.length > 0 ? (
          <div className={styles.postsGrid}>
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={generatePath(ROUTES.BLOG_POST, { slug: post.slug })}
                  className={styles.postCard}
                >
                  <Card className={styles.postCardInner}>
                    <div className={styles.postImage}>
                      <div className={styles.imagePlaceholder}>
                        <i className="ri-article-line" />
                      </div>
                    </div>
                    <div className={styles.postContent}>
                      <div className={styles.postMeta}>
                        <span className={styles.category}>
                          {t(`blog.categories.${post.category}`)}
                        </span>
                        <span className={styles.dot}>•</span>
                        <span>{t('blog.readTime', { minutes: post.readTime })}</span>
                      </div>
                      <h3 className={styles.postTitle}>{t(post.titleKey)}</h3>
                      <p className={styles.postExcerpt}>{t(post.excerptKey)}</p>
                      <div className={styles.postFooter}>
                        <span className={styles.postDate}>{formatDate(post.date)}</span>
                        <span className={styles.readMore}>
                          {t('blog.readMore')}
                          <i className="ri-arrow-right-line" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="ri-file-search-line" />
            <h3>{t('blog.noResults.title')}</h3>
            <p>{t('blog.noResults.description')}</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              {t('blog.noResults.reset')}
            </Button>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className={styles.newsletterSection}>
        <Card className={styles.newsletterCard}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterIcon}>
              <i className="ri-mail-open-line" />
            </div>
            <h2 className={styles.newsletterTitle}>{t('blog.newsletter.title')}</h2>
            <p className={styles.newsletterDescription}>{t('blog.newsletter.description')}</p>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={t('blog.newsletter.placeholder')}
                className={styles.newsletterInput}
              />
              <Button type="submit" variant="primary">
                {t('blog.newsletter.subscribe')}
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default Blog;
