import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, Card, Input, Badge } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import styles from './Profile.module.css';

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

export function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    birthDate: user?.user_metadata?.birth_date || '',
    nationality: user?.user_metadata?.nationality || '',
    residenceStatus: user?.user_metadata?.residence_status || '',
    address: user?.user_metadata?.address || '',
    city: user?.user_metadata?.city || '',
    postalCode: user?.user_metadata?.postal_code || '',
    region: user?.user_metadata?.region || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setIsEditing(false);
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getSubscriptionBadge = () => {
    // Mock subscription status
    const plan = 'free'; // Could be 'free', 'premium', 'pro'
    const colors = { free: 'default', premium: 'primary', pro: 'warning' };
    return { plan, color: colors[plan] };
  };

  const subscription = getSubscriptionBadge();

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className={styles.header} variants={itemVariants}>
        <h1 className={styles.title}>{t('dashboard.profile.title')}</h1>
        <p className={styles.subtitle}>{t('dashboard.profile.subtitle')}</p>
      </motion.div>

      <div className={styles.mainGrid}>
        {/* Left Column - Profile Card */}
        <motion.div className={styles.leftColumn} variants={itemVariants}>
          <Card className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                <span>{getInitials()}</span>
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>
                  {formData.firstName && formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`
                    : t('dashboard.profile.noName')
                  }
                </h2>
                <p className={styles.profileEmail}>{formData.email}</p>
                <Badge variant={subscription.color}>
                  {t(`pricing.plans.${subscription.plan}.name`)}
                </Badge>
              </div>
            </div>

            <div className={styles.profileStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>5</span>
                <span className={styles.statLabel}>{t('dashboard.profile.stats.aidesFound')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>2</span>
                <span className={styles.statLabel}>{t('dashboard.profile.stats.applications')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>€350</span>
                <span className={styles.statLabel}>{t('dashboard.profile.stats.savings')}</span>
              </div>
            </div>

            <div className={styles.profileActions}>
              <Button variant="outline" fullWidth>
                <i className="ri-upload-2-line" />
                {t('dashboard.profile.uploadPhoto')}
              </Button>
            </div>
          </Card>

          {/* Subscription Card */}
          <Card className={styles.subscriptionCard}>
            <div className={styles.subscriptionHeader}>
              <i className="ri-vip-crown-line" />
              <h3>{t('dashboard.profile.subscription.title')}</h3>
            </div>
            <p className={styles.subscriptionPlan}>
              {t(`pricing.plans.${subscription.plan}.name`)}
            </p>
            {subscription.plan === 'free' && (
              <>
                <p className={styles.subscriptionText}>
                  {t('dashboard.profile.subscription.upgradeText')}
                </p>
                <Button variant="primary" fullWidth>
                  <i className="ri-rocket-line" />
                  {t('dashboard.profile.subscription.upgrade')}
                </Button>
              </>
            )}
          </Card>
        </motion.div>

        {/* Right Column - Personal Information */}
        <motion.div className={styles.rightColumn} variants={itemVariants}>
          <Card className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3>{t('dashboard.profile.personalInfo')}</h3>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <i className="ri-edit-line" />
                  {t('common.edit')}
                </Button>
              ) : (
                <div className={styles.editActions}>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.infoGrid}>
              <Input
                label={t('dashboard.profile.fields.firstName')}
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.firstName')}
              />
              <Input
                label={t('dashboard.profile.fields.lastName')}
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.lastName')}
              />
              <Input
                type="email"
                label={t('dashboard.profile.fields.email')}
                value={formData.email}
                disabled
                leftIcon={<i className="ri-mail-line" />}
              />
              <Input
                type="tel"
                label={t('dashboard.profile.fields.phone')}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.phone')}
                leftIcon={<i className="ri-phone-line" />}
              />
              <Input
                type="date"
                label={t('dashboard.profile.fields.birthDate')}
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                disabled={!isEditing}
              />
              <Input
                label={t('dashboard.profile.fields.nationality')}
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.nationality')}
              />
            </div>
          </Card>

          <Card className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3>{t('dashboard.profile.addressInfo')}</h3>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.fullWidth}>
                <Input
                  label={t('dashboard.profile.fields.address')}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.address')}
                  leftIcon={<i className="ri-map-pin-line" />}
                />
              </div>
              <Input
                label={t('dashboard.profile.fields.city')}
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.city')}
              />
              <Input
                label={t('dashboard.profile.fields.postalCode')}
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.postalCode')}
              />
              <Input
                label={t('dashboard.profile.fields.region')}
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.region')}
              />
            </div>
          </Card>

          <Card className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3>{t('dashboard.profile.residenceInfo')}</h3>
            </div>

            <div className={styles.infoGrid}>
              <Input
                label={t('dashboard.profile.fields.residenceStatus')}
                value={formData.residenceStatus}
                onChange={(e) => handleChange('residenceStatus', e.target.value)}
                disabled={!isEditing}
                placeholder={t('dashboard.profile.placeholders.residenceStatus')}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Profile;
