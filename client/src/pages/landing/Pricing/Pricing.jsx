import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button, Card } from '../../../components/ui'
import { ROUTES } from '../../../config/routes'
import { SUBSCRIPTION_TIERS } from '../../../config/constants'
import styles from './Pricing.module.css'

const Pricing = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const plans = [
    {
      id: SUBSCRIPTION_TIERS.FREE,
      name: t('pricing.free.name'),
      price: 0,
      description: t('pricing.free.description'),
      features: [
        t('pricing.free.feature1'),
        t('pricing.free.feature2'),
        t('pricing.free.feature3'),
        t('pricing.free.feature4'),
      ],
      cta: t('pricing.free.cta'),
      popular: false,
    },
    {
      id: SUBSCRIPTION_TIERS.PREMIUM,
      name: t('pricing.premium.name'),
      price: 9.99,
      description: t('pricing.premium.description'),
      features: [
        t('pricing.premium.feature1'),
        t('pricing.premium.feature2'),
        t('pricing.premium.feature3'),
        t('pricing.premium.feature4'),
        t('pricing.premium.feature5'),
        t('pricing.premium.feature6'),
      ],
      cta: t('pricing.premium.cta'),
      popular: true,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.label}>{t('pricing.label')}</span>
          <h2 className={styles.title}>{t('pricing.title')}</h2>
          <p className={styles.subtitle}>{t('pricing.subtitle')}</p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={itemVariants}>
              <Card
                variant={plan.popular ? 'elevated' : 'outlined'}
                padding="none"
                className={`${styles.card} ${plan.popular ? styles.popular : ''}`}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>
                    {t('pricing.popular')}
                  </div>
                )}
                
                <div className={styles.cardHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDescription}>{plan.description}</p>
                  <div className={styles.price}>
                    <span className={styles.currency}>€</span>
                    <span className={styles.amount}>{plan.price}</span>
                    <span className={styles.period}>/{t('pricing.month')}</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  <ul className={styles.features}>
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <i className="ri-check-line" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.cardFooter}>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    fullWidth
                    onClick={() => navigate(plan.id === SUBSCRIPTION_TIERS.FREE ? ROUTES.REGISTER : ROUTES.CHECKOUT)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing
