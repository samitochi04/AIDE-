import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, Logo } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './Register.module.css';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, signInWithOAuth } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('auth.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordTooShort');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const { error: authError } = await signUp(formData.email, formData.password, { 
        full_name: formData.fullName 
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('auth.errors.registrationFailed'));
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

  if (success) {
    return (
      <div className={styles.container}>
        <Helmet>
          <title>{t('auth.verifyEmail')} | AIDE+</title>
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
              <h1 className={styles.title}>{t('auth.verifyEmail')}</h1>
              <p className={styles.description}>
                {t('auth.verificationSent', { email: formData.email })}
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                {t('auth.goToLogin')}
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
        <title>{t('auth.register.title')} | AIDE+</title>
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
              <h1 className={styles.title}>{t('auth.register.title')}</h1>
              <p className={styles.subtitle}>{t('auth.register.subtitle')}</p>
            </div>

            {error && (
              <div className={styles.error}>
                <i className="ri-error-warning-line" />
                {error}
              </div>
            )}

            {/* Social Login - Commented out until Google Cloud Platform OAuth is configured */}
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
            </button>

            <div className={styles.divider}>
              <span>{t('common.or')}</span>
            </div> */}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <Input
                  type="text"
                  name="fullName"
                  label={t('auth.fullName')}
                  placeholder={t('auth.fullNamePlaceholder')}
                  value={formData.fullName}
                  onChange={handleChange}
                  icon="ri-user-line"
                  error={errors.fullName}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Input
                  type="email"
                  name="email"
                  label={t('auth.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                  icon="ri-mail-line"
                  error={errors.email}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Input
                  type="password"
                  name="password"
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  icon="ri-lock-line"
                  hint={t('auth.passwordHint')}
                  error={errors.password}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Input
                  type="password"
                  name="confirmPassword"
                  label={t('auth.confirmPassword')}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon="ri-lock-line"
                  error={errors.confirmPassword}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {t('auth.registerBtn')}
              </Button>
            </form>

            <p className={styles.footer}>
              {t('auth.hasAccount')}{' '}
              <Link to={ROUTES.LOGIN}>{t('auth.loginLink')}</Link>
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

export default Register;
