import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button, Loading } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import { apiFetch, API_ENDPOINTS } from '../../../config/api';
import styles from './BlogPost.module.css';

export function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(API_ENDPOINTS.CONTENT.BY_SLUG(slug));
        
        if (response.data) {
          setContent(response.data);
          // Track view
          try {
            await apiFetch(API_ENDPOINTS.CONTENT.TRACK_VIEW(response.data.id), {
              method: 'POST'
            });
          } catch (e) {
            console.error('Failed to track view:', e);
          }
        }
      } catch (err) {
        console.error('Failed to fetch content:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug]);

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
    return icons[type] || 'ri-file-line';
  };

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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={styles.errorContainer}>
        <i className="ri-error-warning-line" />
        <h2>{t('blog.notFound', 'Content not found')}</h2>
        <p>{t('blog.notFoundDesc', 'The content you are looking for does not exist or has been removed.')}</p>
        <Link to={ROUTES.BLOG}>
          <Button variant="primary">
            <i className="ri-arrow-left-line" />
            {t('blog.backToBlog', 'Back to Blog')}
          </Button>
        </Link>
      </div>
    );
  }

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': content.content_type === 'video' ? 'VideoObject' : 'Article',
    headline: content.title,
    description: content.description,
    image: content.thumbnail_url,
    datePublished: content.published_at || content.created_at,
    dateModified: content.updated_at,
    author: {
      '@type': 'Organization',
      name: 'AIDE+',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIDE+',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/logo.png`,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{content.title} | AIDE+ Blog</title>
        <meta name="description" content={content.description} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description} />
        {content.thumbnail_url && <meta property="og:image" content={content.thumbnail_url} />}
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${window.location.origin}/blog/${content.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <motion.article
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to={ROUTES.HOME}>{t('nav.home', 'Home')}</Link>
          <i className="ri-arrow-right-s-line" />
          <Link to={ROUTES.BLOG}>{t('nav.blog', 'Blog')}</Link>
          <i className="ri-arrow-right-s-line" />
          <span>{content.title}</span>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.type}>
              <i className={getTypeIcon(content.content_type)} />
              {getTypeLabel(content.content_type)}
            </span>
            <span className={styles.date}>
              <i className="ri-calendar-line" />
              {formatDate(content.published_at || content.created_at)}
            </span>
            <span className={styles.views}>
              <i className="ri-eye-line" />
              {content.view_count || 0} {t('blog.views', 'views')}
            </span>
            <span className={styles.language}>
              {content.language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
            </span>
          </div>

          <h1 className={styles.title}>{content.title}</h1>
          
          {content.description && (
            <p className={styles.description}>{content.description}</p>
          )}

          {content.tags && content.tags.length > 0 && (
            <div className={styles.tags}>
              {content.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Media */}
        {(content.content_type === 'video' || content.content_type === 'tutorial') && content.media_url && (
          <div className={styles.videoContainer}>
            {content.media_url.includes('youtube.com') || content.media_url.includes('youtu.be') ? (
              <iframe
                src={content.media_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0].replace('youtu.be/', 'www.youtube.com/embed/')}
                title={content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className={styles.videoEmbed}
              />
            ) : (
              <video
                src={content.media_url}
                controls
                poster={content.thumbnail_url}
                className={styles.videoPlayer}
              >
                {t('blog.videoNotSupported', 'Your browser does not support the video tag.')}
              </video>
            )}
          </div>
        )}

        {(content.content_type === 'image' || content.content_type === 'infographic') && content.media_url && (
          <div className={styles.imageContainer}>
            <img src={content.media_url} alt={content.title} className={styles.contentImage} />
          </div>
        )}

        {content.thumbnail_url && (content.content_type === 'article' || content.content_type === 'guide') && (
          <div className={styles.featuredImage}>
            <img src={content.thumbnail_url} alt={content.title} />
          </div>
        )}

        {/* Content Body */}
        {content.body && (
          <div 
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        )}

        {/* CTA Section */}
        <section className={styles.cta}>
          <h3>{t('blog.ctaTitle', 'Ready to discover your benefits?')}</h3>
          <p>{t('blog.ctaDescription', 'Run a free simulation to find out which financial aids you are eligible for.')}</p>
          <Link to={ROUTES.SIMULATION}>
            <Button variant="primary" size="lg">
              <i className="ri-calculator-line" />
              {t('blog.ctaButton', 'Start Free Simulation')}
            </Button>
          </Link>
        </section>

        {/* Back to Blog */}
        <div className={styles.backLink}>
          <Link to={ROUTES.BLOG}>
            <Button variant="ghost">
              <i className="ri-arrow-left-line" />
              {t('blog.backToBlog', 'Back to Blog')}
            </Button>
          </Link>
        </div>
      </motion.article>
    </>
  );
}

export default BlogPost;
