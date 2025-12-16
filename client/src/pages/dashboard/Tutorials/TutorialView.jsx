import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { Button, Loading, Card } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import { apiFetch, API_ENDPOINTS } from '../../../config/api';
import styles from './TutorialView.module.css';

export function TutorialView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const videoRef = useRef(null);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      tutorial: t('content.types.tutorial', 'Tutorial'),
      article: t('content.types.article', 'Article'),
      guide: t('content.types.guide', 'Guide'),
      video: t('content.types.video', 'Video'),
      image: t('content.types.image', 'Image'),
      infographic: t('content.types.infographic', 'Infographic'),
    };
    return labels[type] || type;
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Handle youtu.be short URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle youtube.com URLs
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const videoId = urlParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Handle already embedded URLs
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return url;
  };

  // Handle video play/pause
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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
        <h2>{t('tutorials.notFound', 'Content not found')}</h2>
        <p>{t('tutorials.notFoundDesc', 'The content you are looking for does not exist or has been removed.')}</p>
        <Link to={ROUTES.TUTORIALS}>
          <Button variant="primary">
            <i className="ri-arrow-left-line" />
            {t('tutorials.backToTutorials', 'Back to Tutorials')}
          </Button>
        </Link>
      </div>
    );
  }

  const isVideo = content.content_type === 'video' || content.content_type === 'tutorial';
  const isImage = content.content_type === 'image' || content.content_type === 'infographic';

  return (
    <>
      <Helmet>
        <title>{content.title} | AIDE+ {t('tutorials.title', 'Tutorials')}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to={ROUTES.DASHBOARD}>{t('nav.dashboard', 'Dashboard')}</Link>
          <i className="ri-arrow-right-s-line" />
          <Link to={ROUTES.TUTORIALS}>{t('nav.tutorials', 'Tutorials')}</Link>
          <i className="ri-arrow-right-s-line" />
          <span>{content.title}</span>
        </nav>

        {/* Main Content */}
        <div className={styles.contentWrapper}>
          {/* Media Section */}
          <div className={styles.mediaSection}>
            {isVideo && content.media_url && (
              <div className={styles.videoContainer}>
                {isYouTubeUrl(content.media_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(content.media_url)}
                    title={content.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={styles.videoEmbed}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={content.media_url}
                    controls
                    poster={content.thumbnail_url}
                    className={styles.videoPlayer}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    {t('tutorials.videoNotSupported', 'Your browser does not support the video tag.')}
                  </video>
                )}
              </div>
            )}

            {isImage && content.media_url && (
              <div className={styles.imageContainer}>
                <img src={content.media_url} alt={content.title} className={styles.contentImage} />
              </div>
            )}

            {!content.media_url && content.thumbnail_url && (
              <div className={styles.imageContainer}>
                <img src={content.thumbnail_url} alt={content.title} className={styles.contentImage} />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <Card className={styles.infoCard}>
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.meta}>
                  <span className={styles.type}>
                    <i className={getTypeIcon(content.content_type)} />
                    {getTypeLabel(content.content_type)}
                  </span>
                  <span className={styles.language}>
                    {content.language === 'fr' ? '🇫🇷' : '🇬🇧'}
                  </span>
                </div>
                <h1 className={styles.title}>{content.title}</h1>
              </div>

              {/* Stats */}
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <i className="ri-eye-line" />
                  <span>{content.view_count || 0} {t('tutorials.views', 'views')}</span>
                </div>
                <div className={styles.stat}>
                  <i className="ri-calendar-line" />
                  <span>{formatDate(content.published_at || content.created_at)}</span>
                </div>
                {content.duration_seconds && (
                  <div className={styles.stat}>
                    <i className="ri-time-line" />
                    <span>{formatDuration(content.duration_seconds)}</span>
                  </div>
                )}
                {content.reading_time_minutes && (
                  <div className={styles.stat}>
                    <i className="ri-book-read-line" />
                    <span>{content.reading_time_minutes} min</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {content.description && (
                <div className={styles.description}>
                  <h3>{t('tutorials.description', 'Description')}</h3>
                  <p>{content.description}</p>
                </div>
              )}

              {/* Body Content (for articles/guides) */}
              {content.body && (
                <div 
                  className={styles.body}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
                />
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className={styles.tags}>
                  {content.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <Link to={ROUTES.TUTORIALS}>
                  <Button variant="ghost">
                    <i className="ri-arrow-left-line" />
                    {t('tutorials.backToTutorials', 'Back to Tutorials')}
                  </Button>
                </Link>
                {content.media_url && !isYouTubeUrl(content.media_url) && (
                  <a href={content.media_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <i className="ri-external-link-line" />
                      {t('tutorials.openInNewTab', 'Open in new tab')}
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default TutorialView;
