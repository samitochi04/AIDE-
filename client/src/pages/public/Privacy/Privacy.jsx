import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import styles from './Privacy.module.css'

const Privacy = () => {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{t('privacy.seo.title')}</title>
        <meta name="description" content={t('privacy.seo.description')} />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{t('privacy.title')}</h1>
          <p className={styles.lastUpdated}>{t('privacy.lastUpdated')}: 22/12/2024</p>

          <section className={styles.section}>
            <h2>{t('privacy.sections.intro.title')}</h2>
            <p>{t('privacy.sections.intro.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.dataCollected.title')}</h2>
            <p>{t('privacy.sections.dataCollected.intro')}</p>
            <ul>
              <li>{t('privacy.sections.dataCollected.item1')}</li>
              <li>{t('privacy.sections.dataCollected.item2')}</li>
              <li>{t('privacy.sections.dataCollected.item3')}</li>
              <li>{t('privacy.sections.dataCollected.item4')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.dataUse.title')}</h2>
            <p>{t('privacy.sections.dataUse.intro')}</p>
            <ul>
              <li>{t('privacy.sections.dataUse.item1')}</li>
              <li>{t('privacy.sections.dataUse.item2')}</li>
              <li>{t('privacy.sections.dataUse.item3')}</li>
              <li>{t('privacy.sections.dataUse.item4')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.dataProtection.title')}</h2>
            <p>{t('privacy.sections.dataProtection.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.dataSharing.title')}</h2>
            <p>{t('privacy.sections.dataSharing.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.userRights.title')}</h2>
            <p>{t('privacy.sections.userRights.intro')}</p>
            <ul>
              <li>{t('privacy.sections.userRights.item1')}</li>
              <li>{t('privacy.sections.userRights.item2')}</li>
              <li>{t('privacy.sections.userRights.item3')}</li>
              <li>{t('privacy.sections.userRights.item4')}</li>
              <li>{t('privacy.sections.userRights.item5')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('privacy.sections.contact.title')}</h2>
            <p>{t('privacy.sections.contact.content')}</p>
            <p className={styles.email}>privacy@aideplus.eu</p>
          </section>
        </div>
      </div>
    </>
  )
}

export default Privacy
