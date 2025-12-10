import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui'
import { ROUTES } from '../../../config/routes'
import styles from './Hero.module.css'

const Hero = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.grid} />
      </div>

      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.badge} variants={itemVariants}>
          <span className={styles.badgeIcon}>🇫🇷</span>
          <span>{t('landing.hero.badge')}</span>
        </motion.div>

        <motion.h1 className={styles.title} variants={itemVariants}>
          {t('landing.hero.title')}
          <span className={styles.highlight}> {t('landing.hero.titleHighlight')}</span>
        </motion.h1>

        <motion.p className={styles.subtitle} variants={itemVariants}>
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div className={styles.actions} variants={itemVariants}>
          <Button
            size="lg"
            onClick={() => navigate(ROUTES.SIMULATION)}
            icon="ri-play-circle-line"
          >
            {t('landing.hero.cta')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(ROUTES.PRICING)}
          >
            {t('landing.hero.secondaryCta')}
          </Button>
        </motion.div>

        <motion.div className={styles.stats} variants={itemVariants}>
          <div className={styles.stat}>
            <span className={styles.statValue}>500+</span>
            <span className={styles.statLabel}>{t('landing.hero.stats.aides')}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>10k+</span>
            <span className={styles.statLabel}>{t('landing.hero.stats.users')}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>98%</span>
            <span className={styles.statLabel}>{t('landing.hero.stats.satisfaction')}</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
