import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button, Select, Card } from '../../../components/ui'
import { ROUTES } from '../../../config/routes'
import { REGIONS } from '../../../config/constants'
import styles from './SimulationCTA.module.css'

const SimulationCTA = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedRegion, setSelectedRegion] = useState('')

  const regionOptions = REGIONS.map(region => ({
    value: region.id,
    label: i18n.language === 'fr' ? region.nameFr : region.nameEn,
  }))

  const handleStartSimulation = () => {
    navigate(ROUTES.SIMULATION, { state: { region: selectedRegion } })
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.textContent}>
            <span className={styles.label}>{t('landing.simulation.label')}</span>
            <h2 className={styles.title}>{t('landing.simulation.title')}</h2>
            <p className={styles.description}>{t('landing.simulation.description')}</p>
            
            <ul className={styles.benefits}>
              <li>
                <i className="ri-check-line" />
                <span>{t('landing.simulation.benefit1')}</span>
              </li>
              <li>
                <i className="ri-check-line" />
                <span>{t('landing.simulation.benefit2')}</span>
              </li>
              <li>
                <i className="ri-check-line" />
                <span>{t('landing.simulation.benefit3')}</span>
              </li>
            </ul>
          </div>

          <Card variant="elevated" padding="lg" className={styles.card}>
            <h3 className={styles.cardTitle}>{t('landing.simulation.cardTitle')}</h3>
            <p className={styles.cardDescription}>{t('landing.simulation.cardDescription')}</p>
            
            <div className={styles.form}>
              <Select
                label={t('landing.simulation.regionLabel')}
                options={regionOptions}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                placeholder={t('landing.simulation.regionPlaceholder')}
                fullWidth
                icon="ri-map-pin-line"
              />
              
              <Button
                size="lg"
                fullWidth
                onClick={handleStartSimulation}
                icon="ri-arrow-right-line"
                iconPosition="right"
              >
                {t('landing.simulation.startButton')}
              </Button>
            </div>

            <p className={styles.cardNote}>
              <i className="ri-shield-check-line" />
              {t('landing.simulation.note')}
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

export default SimulationCTA
