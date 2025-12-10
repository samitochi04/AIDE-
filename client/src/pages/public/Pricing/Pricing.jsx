import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './Pricing.module.css';

export function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: t('pricing.free.name'),
      description: t('pricing.free.description'),
      price: { monthly: 0, yearly: 0 },
      features: [
        { text: t('pricing.free.feature1'), included: true },
        { text: t('pricing.free.feature2'), included: true },
        { text: t('pricing.free.feature3'), included: true },
        { text: t('pricing.free.feature4'), included: true },
        { text: t('pricing.premium.feature2'), included: false },
        { text: t('pricing.premium.feature4'), included: false },
      ],
      cta: t('pricing.free.cta'),
      popular: false,
    },
    {
      id: 'premium',
      name: t('pricing.premium.name'),
      description: t('pricing.premium.description'),
      price: { monthly: 9.99, yearly: 99.99 },
      features: [
        { text: t('pricing.premium.feature1'), included: true },
        { text: t('pricing.premium.feature2'), included: true },
        { text: t('pricing.premium.feature3'), included: true },
        { text: t('pricing.premium.feature4'), included: true },
        { text: t('pricing.premium.feature5'), included: true },
        { text: t('pricing.premium.feature6'), included: true },
      ],
      cta: t('pricing.premium.cta'),
      popular: true,
    },
  ];

  const handleSelectPlan = (planId) => {
    if (planId === 'free') {
      navigate(user ? ROUTES.DASHBOARD : ROUTES.REGISTER);
    } else {
      navigate(user ? ROUTES.CHECKOUT : ROUTES.REGISTER);
    }
  };

  const faqs = [
    {
      question: t('pricingPage.faq.q1'),
      answer: t('pricingPage.faq.a1'),
    },
    {
      question: t('pricingPage.faq.q2'),
      answer: t('pricingPage.faq.a2'),
    },
    {
      question: t('pricingPage.faq.q3'),
      answer: t('pricingPage.faq.a3'),
    },
    {
      question: t('pricingPage.faq.q4'),
      answer: t('pricingPage.faq.a4'),
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('pricingPage.seo.title')} | AIDE+</title>
        <meta name="description" content={t('pricingPage.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>{t('pricingPage.badge')}</span>
          <h1 className={styles.title}>{t('pricing.title')}</h1>
          <p className={styles.subtitle}>{t('pricing.subtitle')}</p>

          {/* Billing Toggle */}
          <div className={styles.billingToggle}>
            <button
              className={`${styles.toggleBtn} ${billingPeriod === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {t('pricingPage.monthly')}
            </button>
            <button
              className={`${styles.toggleBtn} ${billingPeriod === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              {t('pricingPage.yearly')}
              <span className={styles.saveBadge}>{t('pricingPage.save')}</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className={styles.plansSection}>
        <div className={styles.plansGrid}>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}>
                {plan.popular && (
                  <span className={styles.popularBadge}>{t('pricing.popular')}</span>
                )}
                
                <div className={styles.planHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>

                <div className={styles.planPrice}>
                  <span className={styles.currency}>€</span>
                  <span className={styles.amount}>
                    {plan.price[billingPeriod]}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className={styles.period}>/{t('pricing.month')}</span>
                  )}
                </div>

                {billingPeriod === 'yearly' && plan.price.monthly > 0 && (
                  <p className={styles.yearlyNote}>
                    {t('pricingPage.billedYearly', { amount: plan.price.yearly })}
                  </p>
                )}

                <ul className={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`${styles.feature} ${!feature.included ? styles.disabled : ''}`}>
                      <i className={feature.included ? 'ri-check-line' : 'ri-close-line'} />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className={styles.planCta}
                  onClick={() => handleSelectPlan(plan.id)}
                  fullWidth
                >
                  {plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Comparison */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.sectionTitle}>{t('pricingPage.comparison.title')}</h2>
        <div className={styles.comparisonTable}>
          <div className={styles.tableHeader}>
            <div className={styles.featureCol}>{t('pricingPage.comparison.feature')}</div>
            <div className={styles.planCol}>{t('pricing.free.name')}</div>
            <div className={styles.planCol}>{t('pricing.premium.name')}</div>
          </div>
          
          {[
            { feature: t('pricingPage.comparison.simulation'), free: t('pricingPage.comparison.basic'), premium: t('pricingPage.comparison.complete') },
            { feature: t('pricingPage.comparison.aiMessages'), free: '3/day', premium: t('pricingPage.comparison.unlimited') },
            { feature: t('pricingPage.comparison.guides'), free: true, premium: true },
            { feature: t('pricingPage.comparison.alerts'), free: false, premium: true },
            { feature: t('pricingPage.comparison.support'), free: t('pricingPage.comparison.community'), premium: t('pricingPage.comparison.priority') },
            { feature: t('pricingPage.comparison.export'), free: false, premium: true },
          ].map((row, idx) => (
            <div key={idx} className={styles.tableRow}>
              <div className={styles.featureCol}>{row.feature}</div>
              <div className={styles.planCol}>
                {typeof row.free === 'boolean' ? (
                  <i className={row.free ? 'ri-check-line' : 'ri-close-line'} />
                ) : (
                  row.free
                )}
              </div>
              <div className={styles.planCol}>
                {typeof row.premium === 'boolean' ? (
                  <i className={row.premium ? 'ri-check-line' : 'ri-close-line'} />
                ) : (
                  row.premium
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>{t('pricingPage.faq.title')}</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`${styles.faqItem} ${openFaq === idx ? styles.open : ''}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.question}</span>
                <i className={openFaq === idx ? 'ri-subtract-line' : 'ri-add-line'} />
              </button>
              {openFaq === idx && (
                <motion.div
                  className={styles.faqAnswer}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Card className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>{t('pricingPage.cta.title')}</h2>
          <p className={styles.ctaDescription}>{t('pricingPage.cta.description')}</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(ROUTES.SIMULATION)}
          >
            {t('pricingPage.cta.button')}
          </Button>
        </Card>
      </section>
    </div>
  );
}

export default Pricing;
