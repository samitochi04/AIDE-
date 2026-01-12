import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import Hero from './Hero'
import Features from './Features'
import SimulationCTA from './SimulationCTA'
import Pricing from './Pricing'
import FAQ from './FAQ'

const LandingPage = () => {
  const { t } = useTranslation()

  return (
    <>
      <Helmet>
        <title>{t('seo.home.title')}</title>
        <meta name="description" content={t('seo.home.description')} />
        <meta name="keywords" content={t('seo.home.keywords')} />
        <meta property="og:title" content={t('seo.home.title')} />
        <meta property="og:description" content={t('seo.home.description')} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Hero />
      <Features />
      <SimulationCTA />
      <Pricing />
      <FAQ />
    </>
  )
}

export default LandingPage
