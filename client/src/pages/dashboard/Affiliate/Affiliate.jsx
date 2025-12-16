import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button, Card, Input, Spinner, Select, Badge } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { api, API_ENDPOINTS } from '../../../config/api';
import styles from './Affiliate.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Commission rates per subscription tier
const COMMISSION_RATES = {
  basic: 0.99,
  premium: 1.99,
  ultimate: 2.99
};

// Payout method options
const PAYOUT_METHODS = [
  { value: 'paypal', labelKey: 'dashboard.affiliate.payoutMethods.paypal' },
  { value: 'bank_transfer', labelKey: 'dashboard.affiliate.payoutMethods.bankTransfer' },
  { value: 'stripe', labelKey: 'dashboard.affiliate.payoutMethods.stripe' }
];

export function Affiliate() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const toast = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  
  // Affiliate data
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateStatus, setAffiliateStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [referralLink, setReferralLink] = useState('');
  const [payouts, setPayouts] = useState([]);
  
  // Form state for registration
  const [registrationForm, setRegistrationForm] = useState({
    companyName: '',
    website: '',
    contactEmail: '',
    description: ''
  });
  
  // Payout settings
  const [payoutSettings, setPayoutSettings] = useState({
    payoutMethod: 'paypal',
    paypalEmail: '',
    iban: '',
    bankName: '',
    accountHolder: ''
  });

  // Fetch affiliate data
  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      // Try to get dashboard data - if affiliate exists
      const dashboardRes = await api.get(API_ENDPOINTS.AFFILIATE.DASHBOARD);
      
      if (dashboardRes?.data) {
        setIsAffiliate(true);
        setAffiliateStatus(dashboardRes.data.status);
        setDashboard(dashboardRes.data);
        
        // If approved, get referral link and payouts
        if (dashboardRes.data.status === 'approved') {
          const [linkRes, payoutsRes] = await Promise.allSettled([
            api.get(API_ENDPOINTS.AFFILIATE.LINK),
            api.get(API_ENDPOINTS.AFFILIATE.PAYOUTS)
          ]);
          
          if (linkRes.status === 'fulfilled' && linkRes.value?.data) {
            setReferralLink(linkRes.value.data.link);
          }
          
          if (payoutsRes.status === 'fulfilled' && payoutsRes.value?.data) {
            setPayouts(payoutsRes.value.data.payouts || []);
          }
        }
      }
    } catch (error) {
      // 404 means user is not an affiliate yet - this is expected
      if (error.status !== 404) {
        console.error('Failed to load affiliate data:', error);
      }
      setIsAffiliate(false);
    } finally {
      setLoading(false);
    }
  };

  // Register as affiliate
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    
    try {
      await api.post(API_ENDPOINTS.AFFILIATE.REGISTER, registrationForm);
      toast.success(t('dashboard.affiliate.registerSuccess'));
      fetchAffiliateData();
    } catch (error) {
      toast.error(error.message || t('dashboard.affiliate.registerError'));
    } finally {
      setRegistering(false);
    }
  };

  // Copy referral link
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t('dashboard.affiliate.linkCopied'));
    } catch (error) {
      toast.error(t('dashboard.affiliate.copyError'));
    }
  };

  // Copy referral code
  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(dashboard?.referralCode || '');
      toast.success(t('dashboard.affiliate.codeCopied'));
    } catch (error) {
      toast.error(t('dashboard.affiliate.copyError'));
    }
  };

  // Save payout settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    
    try {
      const payoutDetails = {};
      
      if (payoutSettings.payoutMethod === 'paypal') {
        payoutDetails.paypalEmail = payoutSettings.paypalEmail;
      } else if (payoutSettings.payoutMethod === 'bank_transfer') {
        payoutDetails.iban = payoutSettings.iban;
        payoutDetails.bankName = payoutSettings.bankName;
        payoutDetails.accountHolder = payoutSettings.accountHolder;
      }
      
      await api.put(API_ENDPOINTS.AFFILIATE.SETTINGS, {
        payoutMethod: payoutSettings.payoutMethod,
        payoutDetails
      });
      
      toast.success(t('dashboard.affiliate.settingsSaved'));
    } catch (error) {
      toast.error(error.message || t('dashboard.affiliate.settingsError'));
    } finally {
      setSavingSettings(false);
    }
  };

  // Request payout
  const handleRequestPayout = async () => {
    setRequestingPayout(true);
    
    try {
      await api.post(API_ENDPOINTS.AFFILIATE.REQUEST_PAYOUT);
      toast.success(t('dashboard.affiliate.payoutRequested'));
      fetchAffiliateData();
    } catch (error) {
      toast.error(error.message || t('dashboard.affiliate.payoutError'));
    } finally {
      setRequestingPayout(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Not an affiliate - show registration
  if (!isAffiliate) {
    return (
      <motion.div 
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Helmet>
          <title>{t('dashboard.affiliate.title')} | AIDE+</title>
        </Helmet>
        
        <motion.div className={styles.header} variants={itemVariants}>
          <h1 className={styles.title}>{t('dashboard.affiliate.title')}</h1>
          <p className={styles.subtitle}>{t('dashboard.affiliate.subtitle')}</p>
        </motion.div>
        
        {/* Program Explanation */}
        <motion.div variants={itemVariants}>
          <Card className={styles.welcomeCard}>
            <div className={styles.welcomeIcon}>
              <i className="ri-gift-2-line" />
            </div>
            <h2 className={styles.welcomeTitle}>
              {t('dashboard.affiliate.joinProgram')}
            </h2>
            <p className={styles.welcomeText}>
              {t('dashboard.affiliate.programDescription')}
            </p>
            
            <div className={styles.commissionInfo}>
              <h3>{t('dashboard.affiliate.commissionRates')}</h3>
              <div className={styles.commissionGrid}>
                <div className={styles.commissionItem}>
                  <span className={styles.tierName}>Basic</span>
                  <span className={styles.tierAmount}>€{COMMISSION_RATES.basic}</span>
                  <span className={styles.perReferral}>{t('dashboard.affiliate.perReferral')}</span>
                </div>
                <div className={styles.commissionItem}>
                  <span className={styles.tierName}>Premium</span>
                  <span className={styles.tierAmount}>€{COMMISSION_RATES.premium}</span>
                  <span className={styles.perReferral}>{t('dashboard.affiliate.perReferral')}</span>
                </div>
                <div className={styles.commissionItem}>
                  <span className={styles.tierName}>Ultimate</span>
                  <span className={styles.tierAmount}>€{COMMISSION_RATES.ultimate}</span>
                  <span className={styles.perReferral}>{t('dashboard.affiliate.perReferral')}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.programBenefits}>
              <div className={styles.benefitItem}>
                <i className="ri-money-euro-circle-line" />
                <span>{t('dashboard.affiliate.benefit1')}</span>
              </div>
              <div className={styles.benefitItem}>
                <i className="ri-link" />
                <span>{t('dashboard.affiliate.benefit2')}</span>
              </div>
              <div className={styles.benefitItem}>
                <i className="ri-bar-chart-box-line" />
                <span>{t('dashboard.affiliate.benefit3')}</span>
              </div>
              <div className={styles.benefitItem}>
                <i className="ri-bank-card-line" />
                <span>{t('dashboard.affiliate.benefit4')}</span>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* Registration Form */}
        <motion.div variants={itemVariants}>
          <Card className={styles.formCard}>
            <h3 className={styles.formTitle}>{t('dashboard.affiliate.registerTitle')}</h3>
            <form onSubmit={handleRegister} className={styles.form}>
              <Input
                label={t('dashboard.affiliate.companyName')}
                placeholder={t('dashboard.affiliate.companyNamePlaceholder')}
                value={registrationForm.companyName}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, companyName: e.target.value }))}
              />
              
              <Input
                label={t('dashboard.affiliate.website')}
                placeholder={t('dashboard.affiliate.websitePlaceholder')}
                value={registrationForm.website}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, website: e.target.value }))}
              />
              
              <Input
                type="email"
                label={t('dashboard.affiliate.contactEmail')}
                placeholder={t('dashboard.affiliate.contactEmailPlaceholder')}
                value={registrationForm.contactEmail}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                required
              />
              
              <div className={styles.textareaGroup}>
                <label className={styles.label}>{t('dashboard.affiliate.description')}</label>
                <textarea
                  className={styles.textarea}
                  placeholder={t('dashboard.affiliate.descriptionPlaceholder')}
                  value={registrationForm.description}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                loading={registering}
                className={styles.submitBtn}
              >
                {t('dashboard.affiliate.registerBtn')}
              </Button>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Pending or rejected status
  if (affiliateStatus !== 'approved') {
    return (
      <motion.div 
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Helmet>
          <title>{t('dashboard.affiliate.title')} | AIDE+</title>
        </Helmet>
        
        <motion.div className={styles.header} variants={itemVariants}>
          <h1 className={styles.title}>{t('dashboard.affiliate.title')}</h1>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${styles[affiliateStatus]}`}>
              <i className={affiliateStatus === 'pending' ? 'ri-time-line' : 'ri-close-circle-line'} />
            </div>
            <h2 className={styles.statusTitle}>
              {affiliateStatus === 'pending' 
                ? t('dashboard.affiliate.pendingTitle')
                : t('dashboard.affiliate.rejectedTitle')}
            </h2>
            <p className={styles.statusText}>
              {affiliateStatus === 'pending'
                ? t('dashboard.affiliate.pendingText')
                : t('dashboard.affiliate.rejectedText')}
            </p>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Approved affiliate - show dashboard
  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Helmet>
        <title>{t('dashboard.affiliate.title')} | AIDE+</title>
      </Helmet>
      
      <motion.div className={styles.header} variants={itemVariants}>
        <h1 className={styles.title}>{t('dashboard.affiliate.title')}</h1>
        <p className={styles.subtitle}>{t('dashboard.affiliate.dashboardSubtitle')}</p>
      </motion.div>
      
      {/* Referral Link Section */}
      <motion.div variants={itemVariants}>
        <Card className={styles.linkCard}>
          <h3 className={styles.cardTitle}>
            <i className="ri-link" />
            {t('dashboard.affiliate.yourReferralLink')}
          </h3>
          <p className={styles.cardDescription}>
            {t('dashboard.affiliate.linkDescription')}
          </p>
          
          <div className={styles.linkContainer}>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{referralLink}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralLink}
                className={styles.copyBtn}
              >
                <i className="ri-file-copy-line" />
              </Button>
            </div>
            <Button variant="primary" onClick={copyReferralLink}>
              <i className="ri-file-copy-line" />
              {t('dashboard.affiliate.copyLink')}
            </Button>
          </div>
          
          <div className={styles.codeSection}>
            <span className={styles.codeLabel}>{t('dashboard.affiliate.yourCode')}</span>
            <div className={styles.codeBox}>
              <code className={styles.code}>{dashboard?.referralCode}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
              >
                <i className="ri-file-copy-line" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Stats Grid */}
      <motion.div className={styles.statsGrid} variants={itemVariants}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-cursor-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{dashboard?.stats?.totalClicks || 0}</span>
            <span className={styles.statLabel}>{t('dashboard.affiliate.totalClicks')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-user-add-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{dashboard?.stats?.totalReferrals || 0}</span>
            <span className={styles.statLabel}>{t('dashboard.affiliate.totalReferrals')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-checkbox-circle-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{dashboard?.stats?.convertedReferrals || 0}</span>
            <span className={styles.statLabel}>{t('dashboard.affiliate.conversions')}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-percent-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{dashboard?.stats?.conversionRate || 0}%</span>
            <span className={styles.statLabel}>{t('dashboard.affiliate.conversionRate')}</span>
          </div>
        </Card>
      </motion.div>
      
      {/* Earnings Section */}
      <motion.div className={styles.mainGrid} variants={itemVariants}>
        <Card className={styles.earningsCard}>
          <h3 className={styles.cardTitle}>
            <i className="ri-money-euro-circle-line" />
            {t('dashboard.affiliate.earnings')}
          </h3>
          
          <div className={styles.earningsGrid}>
            <div className={styles.earningItem}>
              <span className={styles.earningLabel}>{t('dashboard.affiliate.totalEarnings')}</span>
              <span className={styles.earningValue}>
                €{(dashboard?.stats?.totalEarnings || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.earningItem}>
              <span className={styles.earningLabel}>{t('dashboard.affiliate.pendingEarnings')}</span>
              <span className={`${styles.earningValue} ${styles.pending}`}>
                €{(dashboard?.stats?.pendingEarnings || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.earningItem}>
              <span className={styles.earningLabel}>{t('dashboard.affiliate.paidEarnings')}</span>
              <span className={`${styles.earningValue} ${styles.paid}`}>
                €{(dashboard?.stats?.paidEarnings || 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className={styles.payoutInfo}>
            <p className={styles.payoutNote}>
              {t('dashboard.affiliate.autoPayoutNote', { count: 10 })}
            </p>
            <p className={styles.minimumPayout}>
              {t('dashboard.affiliate.minimumPayout', { amount: 9.90 })}
            </p>
          </div>
          
          {(dashboard?.stats?.pendingEarnings || 0) >= 9.90 && (
            <Button
              variant="primary"
              onClick={handleRequestPayout}
              loading={requestingPayout}
              className={styles.payoutBtn}
            >
              <i className="ri-bank-card-line" />
              {t('dashboard.affiliate.requestPayout')}
            </Button>
          )}
        </Card>
        
        {/* Payout Settings */}
        <Card className={styles.settingsCard}>
          <h3 className={styles.cardTitle}>
            <i className="ri-bank-card-line" />
            {t('dashboard.affiliate.payoutSettings')}
          </h3>
          
          <div className={styles.settingsForm}>
            <Select
              label={t('dashboard.affiliate.payoutMethod')}
              value={payoutSettings.payoutMethod}
              onChange={(e) => setPayoutSettings(prev => ({ ...prev, payoutMethod: e.target.value }))}
              options={PAYOUT_METHODS.map(opt => ({
                value: opt.value,
                label: t(opt.labelKey)
              }))}
            />
            
            {payoutSettings.payoutMethod === 'paypal' && (
              <Input
                type="email"
                label={t('dashboard.affiliate.paypalEmail')}
                placeholder={t('dashboard.affiliate.paypalEmailPlaceholder')}
                value={payoutSettings.paypalEmail}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, paypalEmail: e.target.value }))}
              />
            )}
            
            {payoutSettings.payoutMethod === 'bank_transfer' && (
              <>
                <Input
                  label={t('dashboard.affiliate.accountHolder')}
                  placeholder={t('dashboard.affiliate.accountHolderPlaceholder')}
                  value={payoutSettings.accountHolder}
                  onChange={(e) => setPayoutSettings(prev => ({ ...prev, accountHolder: e.target.value }))}
                />
                <Input
                  label={t('dashboard.affiliate.iban')}
                  placeholder={t('dashboard.affiliate.ibanPlaceholder')}
                  value={payoutSettings.iban}
                  onChange={(e) => setPayoutSettings(prev => ({ ...prev, iban: e.target.value }))}
                />
                <Input
                  label={t('dashboard.affiliate.bankName')}
                  placeholder={t('dashboard.affiliate.bankNamePlaceholder')}
                  value={payoutSettings.bankName}
                  onChange={(e) => setPayoutSettings(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </>
            )}
            
            <Button
              variant="secondary"
              onClick={handleSaveSettings}
              loading={savingSettings}
            >
              {t('common.save')}
            </Button>
          </div>
        </Card>
      </motion.div>
      
      {/* Payout History */}
      {payouts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className={styles.historyCard}>
            <h3 className={styles.cardTitle}>
              <i className="ri-history-line" />
              {t('dashboard.affiliate.payoutHistory')}
            </h3>
            
            <div className={styles.historyList}>
              {payouts.map((payout) => (
                <div key={payout.id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <span className={styles.historyAmount}>€{payout.amount.toFixed(2)}</span>
                    <span className={styles.historyDate}>
                      {new Date(payout.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge 
                    variant={
                      payout.status === 'completed' ? 'success' : 
                      payout.status === 'requested' ? 'warning' : 'danger'
                    }
                  >
                    {t(`dashboard.affiliate.payoutStatus.${payout.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Commission Info */}
      <motion.div variants={itemVariants}>
        <Card className={styles.infoCard}>
          <h3 className={styles.cardTitle}>
            <i className="ri-information-line" />
            {t('dashboard.affiliate.howItWorks')}
          </h3>
          
          <div className={styles.howItWorks}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>{t('dashboard.affiliate.step1Title')}</h4>
                <p>{t('dashboard.affiliate.step1Text')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>{t('dashboard.affiliate.step2Title')}</h4>
                <p>{t('dashboard.affiliate.step2Text')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>{t('dashboard.affiliate.step3Title')}</h4>
                <p>{t('dashboard.affiliate.step3Text')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h4>{t('dashboard.affiliate.step4Title')}</h4>
                <p>{t('dashboard.affiliate.step4Text')}</p>
              </div>
            </div>
          </div>
          
          <div className={styles.commissionTable}>
            <h4>{t('dashboard.affiliate.commissionRates')}</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('dashboard.affiliate.subscriptionTier')}</th>
                  <th>{t('dashboard.affiliate.yourCommission')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic</td>
                  <td>€{COMMISSION_RATES.basic}</td>
                </tr>
                <tr>
                  <td>Premium</td>
                  <td>€{COMMISSION_RATES.premium}</td>
                </tr>
                <tr>
                  <td>Ultimate</td>
                  <td>€{COMMISSION_RATES.ultimate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Affiliate;
