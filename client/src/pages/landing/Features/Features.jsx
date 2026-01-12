import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '../../../components/ui'
import styles from './Features.module.css'

const Features = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: 'ri-search-eye-line',
      title: t('landing.features.discover.title'),
      description: t('landing.features.discover.description'),
      color: 'primary',
    },
    {
      icon: 'ri-robot-2-line',
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description'),
      color: 'accent',
    },
    {
      icon: 'ri-file-list-3-line',
      title: t('landing.features.procedures.title'),
      description: t('landing.features.procedures.description'),
      color: 'success',
    },
    {
      icon: 'ri-home-smile-line',
      title: t('landing.features.housing.title'),
      description: t('landing.features.housing.description'),
      color: 'warning',
    },
    {
      icon: 'ri-translate-2',
      title: t('landing.features.bilingual.title'),
      description: t('landing.features.bilingual.description'),
      color: 'primary',
    },
    {
      icon: 'ri-shield-check-line',
      title: t('landing.features.secure.title'),
      description: t('landing.features.secure.description'),
      color: 'accent',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.label}>{t('landing.features.label')}</span>
          <h2 className={styles.title}>{t('landing.features.title')}</h2>
          <p className={styles.subtitle}>{t('landing.features.subtitle')}</p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card variant="outlined" padding="lg" hoverable className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles[feature.color]}`}>
                  <i className={feature.icon} />
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
