import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button, Input, Card } from '../../../components/ui';
import { api, API_ENDPOINTS } from '../../../config/api';
import styles from './Contact.module.css';

export function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(API_ENDPOINTS.CONTACT.SEND, formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || t('contact.error'));
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: 'ri-mail-line',
      title: t('contact.methods.email.title'),
      description: t('contact.methods.email.description'),
      value: 'contact@aideplus.fr',
      action: 'mailto:contact@aideplus.fr',
    },
    {
      icon: 'ri-chat-3-line',
      title: t('contact.methods.chat.title'),
      description: t('contact.methods.chat.description'),
      value: t('contact.methods.chat.value'),
      action: null,
    },
    {
      icon: 'ri-question-line',
      title: t('contact.methods.faq.title'),
      description: t('contact.methods.faq.description'),
      value: t('contact.methods.faq.value'),
      action: '/faq',
    },
  ];

  if (success) {
    return (
      <div className={styles.container}>
        <Helmet>
          <title>{t('contact.seo.title')} | AIDE+</title>
        </Helmet>
        
        <motion.div
          className={styles.successWrapper}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={styles.successCard}>
            <div className={styles.successIcon}>
              <i className="ri-check-line" />
            </div>
            <h1 className={styles.successTitle}>{t('contact.success.title')}</h1>
            <p className={styles.successMessage}>{t('contact.success.message')}</p>
            <Button
              variant="outline"
              onClick={() => setSuccess(false)}
            >
              {t('contact.success.sendAnother')}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('contact.seo.title')} | AIDE+</title>
        <meta name="description" content={t('contact.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>{t('contact.badge')}</span>
          <h1 className={styles.title}>{t('contact.title')}</h1>
          <p className={styles.subtitle}>{t('contact.subtitle')}</p>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className={styles.methodsSection}>
        <div className={styles.methodsGrid}>
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={styles.methodCard}>
                <div className={styles.methodIcon}>
                  <i className={method.icon} />
                </div>
                <h3 className={styles.methodTitle}>{method.title}</h3>
                <p className={styles.methodDescription}>{method.description}</p>
                {method.action ? (
                  <a href={method.action} className={styles.methodLink}>
                    {method.value}
                    <i className="ri-arrow-right-line" />
                  </a>
                ) : (
                  <span className={styles.methodValue}>{method.value}</span>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className={styles.formSection}>
        <div className={styles.formWrapper}>
          <motion.div
            className={styles.formInfo}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={styles.formTitle}>{t('contact.form.title')}</h2>
            <p className={styles.formDescription}>{t('contact.form.description')}</p>
            
            <div className={styles.infoItems}>
              <div className={styles.infoItem}>
                <i className="ri-time-line" />
                <div>
                  <strong>{t('contact.info.response.title')}</strong>
                  <span>{t('contact.info.response.value')}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <i className="ri-shield-check-line" />
                <div>
                  <strong>{t('contact.info.privacy.title')}</strong>
                  <span>{t('contact.info.privacy.value')}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <i className="ri-global-line" />
                <div>
                  <strong>{t('contact.info.languages.title')}</strong>
                  <span>{t('contact.info.languages.value')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={styles.formCard}>
              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div className={styles.errorAlert}>
                    <i className="ri-error-warning-line" />
                    {error}
                  </div>
                )}

                <div className={styles.formRow}>
                  <Input
                    label={t('contact.form.name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('contact.form.namePlaceholder')}
                    required
                  />
                  <Input
                    label={t('contact.form.email')}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('contact.form.emailPlaceholder')}
                    required
                  />
                </div>

                <Input
                  label={t('contact.form.subject')}
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('contact.form.subjectPlaceholder')}
                  required
                />

                <div className={styles.textareaWrapper}>
                  <label className={styles.label}>{t('contact.form.message')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contact.form.messagePlaceholder')}
                    className={styles.textarea}
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  fullWidth
                >
                  {loading ? t('common.loading') : t('contact.form.submit')}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
