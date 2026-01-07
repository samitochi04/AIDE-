import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import styles from './Cookies.module.css'

const Cookies = () => {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{t('cookies.seo.title')}</title>
        <meta name="description" content={t('cookies.seo.description')} />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{t('cookies.title')}</h1>
          <p className={styles.lastUpdated}>{t('cookies.lastUpdated')}: 22/12/2024</p>

          <section className={styles.section}>
            <h2>{t('cookies.sections.whatAreCookies.title')}</h2>
            <p>{t('cookies.sections.whatAreCookies.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.howWeUse.title')}</h2>
            <p>{t('cookies.sections.howWeUse.intro')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.essential.title')}</h2>
            <p>{t('cookies.sections.essential.content')}</p>
            <ul>
              <li>{t('cookies.sections.essential.item1')}</li>
              <li>{t('cookies.sections.essential.item2')}</li>
              <li>{t('cookies.sections.essential.item3')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.analytics.title')}</h2>
            <p>{t('cookies.sections.analytics.content')}</p>
            <ul>
              <li>{t('cookies.sections.analytics.item1')}</li>
              <li>{t('cookies.sections.analytics.item2')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.preferences.title')}</h2>
            <p>{t('cookies.sections.preferences.content')}</p>
            <ul>
              <li>{t('cookies.sections.preferences.item1')}</li>
              <li>{t('cookies.sections.preferences.item2')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.manageCookies.title')}</h2>
            <p>{t('cookies.sections.manageCookies.content')}</p>
          </section>

          <section className={styles.section}>
            <h2>{t('cookies.sections.contact.title')}</h2>
            <p>{t('cookies.sections.contact.content')}</p>
            <p className={styles.email}>privacy@aideplus.eu</p>
          </section>
        </div>
      </div>
    </>
  )
}

export default Cookies
