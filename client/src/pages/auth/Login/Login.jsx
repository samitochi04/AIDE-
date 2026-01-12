import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, Logo } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './Login.module.css';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signInWithOAuth, signInWithMagicLink } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');
  const [showMagicLink, setShowMagicLink] = useState(false);

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signInWithPassword(email, password);
      if (authError) throw authError;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t('auth.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signInWithMagicLink(email);
      if (authError) throw authError;
      setMagicLinkSent(true);
    } catch (err) {
      setError(err.message || t('auth.errors.magicLinkFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error: authError } = await signInWithOAuth('google');
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || t('auth.errors.googleFailed'));
    }
  };

  if (magicLinkSent) {
    return (
      <div className={styles.container}>
        <Helmet>
          <title>{t('auth.checkEmail')} | AIDE+</title>
        </Helmet>
        
        <motion.div
          className={styles.wrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={styles.card}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>
                <i className="ri-mail-check-line" />
              </div>
              <h1 className={styles.title}>{t('auth.checkEmail')}</h1>
              <p className={styles.description}>
                {t('auth.magicLinkSent', { email })}
              </p>
              <Button
                variant="outline"
                onClick={() => setMagicLinkSent(false)}
              >
                {t('common.back')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('auth.login.title')} | AIDE+</title>
      </Helmet>

      <motion.div
        className={styles.wrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <Logo size="md" linkTo={ROUTES.HOME} />
        </div>

        <Card className={styles.card}>
          <Card.Body>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>{t('auth.login.title')}</h1>
              <p className={styles.subtitle}>{t('auth.login.subtitle')}</p>
            </div>

            {error && (
              <div className={styles.error}>
                <i className="ri-error-warning-line" />
                {error}
              </div>
            )}

            {/* Social Login */}
            {/* <button
              type="button"
              className={styles.socialBtn}
              onClick={handleGoogleLogin}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueWithGoogle')}
            </button> */}

            <div className={styles.divider}>
              <span>{t('common.or')}</span>
            </div>

            {/* Toggle Magic Link / Password */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${!showMagicLink ? styles.active : ''}`}
                onClick={() => setShowMagicLink(false)}
              >
                {t('auth.password')}
              </button>
              <button
                className={`${styles.tab} ${showMagicLink ? styles.active : ''}`}
                onClick={() => setShowMagicLink(true)}
              >
                {t('auth.magicLink')}
              </button>
            </div>

            <form onSubmit={showMagicLink ? handleMagicLink : handleSubmit}>
              <div className={styles.formGroup}>
                <Input
                  type="email"
                  label={t('auth.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon="ri-mail-line"
                  required
                />
              </div>

              {!showMagicLink && (
                <div className={styles.formGroup}>
                  <Input
                    type="password"
                    label={t('auth.password')}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon="ri-lock-line"
                    required
                  />
                  <div className={styles.forgotPassword}>
                    <Link to={ROUTES.FORGOT_PASSWORD}>
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {showMagicLink ? t('auth.sendMagicLink') : t('auth.loginBtn')}
              </Button>
            </form>

            <p className={styles.footer}>
              {t('auth.noAccount')}{' '}
              <Link to={ROUTES.REGISTER}>{t('auth.registerLink')}</Link>
            </p>
          </Card.Body>
        </Card>

        <p className={styles.terms}>
          {t('auth.termsNotice')}{' '}
          <Link to={ROUTES.TERMS}>{t('footer.terms')}</Link>{' '}
          {t('common.and')}{' '}
          <Link to={ROUTES.PRIVACY}>{t('footer.privacy')}</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
