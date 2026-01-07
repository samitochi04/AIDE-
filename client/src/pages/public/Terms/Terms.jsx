import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import styles from './Terms.module.css'

const Terms = () => {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{t('terms.seo.title')}</title>
        <meta name="description" content={t('terms.seo.description')} />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{t('terms.title')}</h1>
          <p className={styles.lastUpdated}>{t('terms.lastUpdated')}: 22/12/2024</p>

          <section className={styles.section}>
            <h2>{t('terms.sections.acceptance.title')}</h2>
            <p>{t('terms.sections.acceptance.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.services.title')}</h2>
            <p>{t('terms.sections.services.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.accounts.title')}</h2>
            <p>{t('terms.sections.accounts.intro')}</p>
            <ul>
              <li>{t('terms.sections.accounts.item1')}</li>
              <li>{t('terms.sections.accounts.item2')}</li>
              <li>{t('terms.sections.accounts.item3')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.subscriptions.title')}</h2>
            <p>{t('terms.sections.subscriptions.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.prohibitedUse.title')}</h2>
            <p>{t('terms.sections.prohibitedUse.intro')}</p>
            <ul>
              <li>{t('terms.sections.prohibitedUse.item1')}</li>
              <li>{t('terms.sections.prohibitedUse.item2')}</li>
              <li>{t('terms.sections.prohibitedUse.item3')}</li>
              <li>{t('terms.sections.prohibitedUse.item4')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.intellectualProperty.title')}</h2>
            <p>{t('terms.sections.intellectualProperty.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.disclaimer.title')}</h2>
            <p>{t('terms.sections.disclaimer.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.liability.title')}</h2>
            <p>{t('terms.sections.liability.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.modifications.title')}</h2>
            <p>{t('terms.sections.modifications.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('terms.sections.contact.title')}</h2>
            <p>{t('terms.sections.contact.content')}</p>
            <p className={styles.email}>legal@aideplus.eu</p>
          </section>
        </div>
      </div>
    </>
  )
}

export default Terms
