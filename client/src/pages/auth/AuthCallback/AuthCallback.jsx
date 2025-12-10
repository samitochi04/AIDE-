import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../../lib/supabaseClient';
import { Loading, Card, Button, Logo } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './AuthCallback.module.css';

export function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the type from URL (recovery = password reset)
        const type = searchParams.get('type');
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session) {
          setStatus('success');
          
          // Handle different callback types
          if (type === 'recovery') {
            // Redirect to password reset page
            setTimeout(() => {
              navigate(ROUTES.RESET_PASSWORD || '/reset-password', { replace: true });
            }, 1500);
          } else {
            // Regular login - redirect to dashboard
            setTimeout(() => {
              navigate(ROUTES.DASHBOARD, { replace: true });
            }, 1500);
          }
        } else {
          // No session, might need to wait for the auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setStatus('success');
              setTimeout(() => {
                navigate(ROUTES.DASHBOARD, { replace: true });
              }, 1500);
              subscription.unsubscribe();
            }
          });

          // Set a timeout in case auth doesn't complete
          setTimeout(() => {
            if (status === 'loading') {
              setStatus('error');
              setErrorMessage(t('auth.errors.callbackTimeout'));
            }
          }, 10000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || t('auth.errors.callbackFailed'));
      }
    };

    handleCallback();
  }, [navigate, searchParams, t, status]);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('auth.verifying')} | AIDE+</title>
      </Helmet>

      <div className={styles.wrapper}>
        <Card className={styles.card}>
          <Logo size="lg" className={styles.logo} />
          
          {status === 'loading' && (
            <div className={styles.content}>
              <Loading.Spinner size="lg" />
              <h1 className={styles.title}>{t('auth.verifying')}</h1>
              <p className={styles.message}>{t('auth.pleaseWait')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.content}>
              <div className={styles.successIcon}>
                <i className="ri-check-line" />
              </div>
              <h1 className={styles.title}>{t('auth.verified')}</h1>
              <p className={styles.message}>{t('auth.redirecting')}</p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.content}>
              <div className={styles.errorIcon}>
                <i className="ri-error-warning-line" />
              </div>
              <h1 className={styles.title}>{t('auth.errors.verificationFailed')}</h1>
              <p className={styles.message}>{errorMessage}</p>
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  {t('auth.backToLogin')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AuthCallback;
