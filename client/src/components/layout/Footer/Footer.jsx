import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from '../../ui'
import { ROUTES } from '../../../config/routes'
import styles from './Footer.module.css'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { path: ROUTES.PRICING, label: t('nav.pricing') },
      { path: ROUTES.SIMULATION, label: t('footer.simulation') },
      { path: ROUTES.BLOG, label: t('nav.blog') },
    ],
    resources: [
      { path: ROUTES.AIDES, label: t('footer.aides') },
      { path: ROUTES.PROCEDURES, label: t('footer.procedures') },
      { path: ROUTES.HOUSING, label: t('footer.housing') },
    ],
    legal: [
      { path: ROUTES.PRIVACY, label: t('footer.privacy') },
      { path: ROUTES.TERMS, label: t('footer.terms') },
      { path: ROUTES.COOKIES, label: t('footer.cookies') },
    ],
  }

  const socialLinks = [
    { icon: 'ri-twitter-x-line', url: 'https://twitter.com', label: 'Twitter' },
    { icon: 'ri-linkedin-fill', url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: 'ri-facebook-fill', url: 'https://facebook.com', label: 'Facebook' },
  ]

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.brand}>
            <Logo size="md" linkTo={null} />
            <p className={styles.description}>
              {t('footer.description')}
            </p>
            <div className={styles.socialLinks}>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={social.label}
                >
                  <i className={social.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.product')}</h4>
            <ul className={styles.linkList}>
              {footerLinks.product.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.resources')}</h4>
            <ul className={styles.linkList}>
              {footerLinks.resources.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.legal')}</h4>
            <ul className={styles.linkList}>
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} AIDE+. {t('footer.allRightsReserved')}
          </p>
          <p className={styles.madeWith}>
            AIDE+
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
