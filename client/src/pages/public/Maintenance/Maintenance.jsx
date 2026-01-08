import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Clock, Mail } from 'lucide-react'
import styles from './Maintenance.module.css'

export default function Maintenance() {
  const { t } = useTranslation()
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Settings className={styles.icon} />
        </div>
        
        <h1 className={styles.title}>
          {t('maintenance.title', 'Site en maintenance')}
        </h1>
        
        <p className={styles.message}>
          {t('maintenance.message', 'Nous effectuons actuellement des travaux de maintenance pour améliorer votre expérience. Nous serons de retour très bientôt !')}
        </p>

        <div className={styles.status}>
          <Clock className={styles.statusIcon} />
          <span>{t('maintenance.inProgress', 'Maintenance en cours')}{dots}</span>
        </div>

        <div className={styles.contact}>
          <Mail className={styles.contactIcon} />
          <span>
            {t('maintenance.contact', 'Pour toute question urgente :')}{' '}
            <a href="mailto:support@aideplus.eu">support@aideplus.eu</a>
          </span>
        </div>

        <div className={styles.brand}>
          <span className={styles.brandName}>AIDE+</span>
          <span className={styles.brandTagline}>
            {t('maintenance.tagline', 'Votre assistant pour les aides gouvernementales')}
          </span>
        </div>
      </div>
    </div>
  )
}
