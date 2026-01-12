import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button, Card, Input, Badge, Loading, Select } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { api, API_ENDPOINTS } from '../../../config/api';
import { REGIONS } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import { useNavigate } from 'react-router-dom';
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

// Status options matching database enum
const STATUS_OPTIONS = [
  { value: 'student', labelKey: 'dashboard.profile.statusOptions.student' },
  { value: 'employed', labelKey: 'dashboard.profile.statusOptions.employed' },
  { value: 'unemployed', labelKey: 'dashboard.profile.statusOptions.unemployed' },
  { value: 'retired', labelKey: 'dashboard.profile.statusOptions.retired' },
  { value: 'other', labelKey: 'dashboard.profile.statusOptions.other' }
];

// Nationality options matching database enum
const NATIONALITY_OPTIONS = [
  { value: 'french', labelKey: 'dashboard.profile.nationalityOptions.french' },
  { value: 'eu', labelKey: 'dashboard.profile.nationalityOptions.eu' },
  { value: 'non_eu', labelKey: 'dashboard.profile.nationalityOptions.nonEu' },
  { value: 'other', labelKey: 'dashboard.profile.nationalityOptions.other' }
];

export function Profile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    eligibleAides: 0,
    potentialSavings: 0,
    savedAides: 0,
    completedProcedures: 0,
    inProgressProcedures: 0,
    totalProcedures: 0
  });
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    status: 'other',
    nationality: 'other',
    country_of_origin: '',
    date_of_birth: '',
    region: '',
    department: '',
    city: '',
    postal_code: '',
    language: 'fr'
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.allSettled([
          api.get(API_ENDPOINTS.PROFILE.GET),
          api.get(API_ENDPOINTS.PROFILE.STATS)
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const profileData = profileRes.value.data;
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            status: profileData.status || 'other',
            nationality: profileData.nationality || 'other',
            country_of_origin: profileData.country_of_origin || '',
            date_of_birth: profileData.date_of_birth || '',
            region: profileData.region || '',
            department: profileData.department || '',
            city: profileData.city || '',
            postal_code: profileData.postal_code || '',
            language: profileData.language || 'fr'
          });
        }

        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setStats(statsRes.value.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(API_ENDPOINTS.PROFILE.UPDATE, formData);
      
      if (response?.data) {
        setProfile(response.data);
        toast.success(t('dashboard.profile.saved'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('dashboard.profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('dashboard.profile.invalidFileType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('dashboard.profile.fileTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const response = await api.upload(API_ENDPOINTS.PROFILE.UPLOAD_AVATAR, uploadFormData);
      
      if (response?.data?.avatar_url) {
        setProfile(prev => ({ ...prev, avatar_url: response.data.avatar_url }));
        toast.success(t('dashboard.profile.avatarUploaded'));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('dashboard.profile.avatarUploadError'));
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url) return;

    try {
      await api.delete(API_ENDPOINTS.PROFILE.DELETE_AVATAR);
      setProfile(prev => ({ ...prev, avatar_url: null }));
      toast.success(t('dashboard.profile.avatarDeleted'));
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error(t('dashboard.profile.avatarDeleteError'));
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      const parts = formData.full_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return formData.full_name[0]?.toUpperCase() || 'U';
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSubscriptionBadge = () => {
    const tier = profile?.subscription_tier || 'free';
    const colors = { 
      free: 'default', 
      basic: 'secondary',
      plus: 'primary', 
      premium: 'warning',
      enterprise: 'success'
    };
    return { tier, color: colors[tier] || 'default' };
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

  const subscription = getSubscriptionBadge();

  // Get translated status options
  const getStatusOptions = () => STATUS_OPTIONS.map(opt => ({
    value: opt.value,
    label: t(opt.labelKey)
  }));

  // Get translated nationality options
  const getNationalityOptions = () => NATIONALITY_OPTIONS.map(opt => ({
    value: opt.value,
    label: t(opt.labelKey)
  }));

  return (
    <>
      <Helmet>
        <title>{t('dashboard.profile.title')} | AIDE+</title>
      </Helmet>

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
                <div 
                  className={styles.avatar}
                  onClick={handleAvatarClick}
                  style={{ cursor: 'pointer' }}
                >
                  {uploadingAvatar ? (
                    <Loading.Spinner size="sm" />
                  ) : profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={formData.full_name || 'Avatar'} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                  <div className={styles.avatarOverlay}>
                    <i className="ri-camera-line" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                />
                <div className={styles.profileInfo}>
                  <h2 className={styles.profileName}>
                    {formData.full_name || t('dashboard.profile.noName')}
                  </h2>
                  <p className={styles.profileEmail}>{profile?.email}</p>
                  <Badge variant={subscription.color}>
                    {t(`dashboard.profile.subscriptionTiers.${subscription.tier}`)}
                  </Badge>
                </div>
              </div>

              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.eligibleAides}</span>
                  <span className={styles.statLabel}>{t('dashboard.profile.stats.aidesFound')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.totalProcedures}</span>
                  <span className={styles.statLabel}>{t('dashboard.profile.stats.procedures')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{formatCurrency(stats.potentialSavings)}</span>
                  <span className={styles.statLabel}>{t('dashboard.profile.stats.savings')}</span>
                </div>
              </div>

              <div className={styles.profileActions}>
                {profile?.avatar_url && (
                  <Button variant="ghost" fullWidth onClick={handleDeleteAvatar}>
                    <i className="ri-delete-bin-line" />
                    {t('dashboard.profile.removePhoto')}
                  </Button>
                )}
                {!profile?.avatar_url && (
                  <Button variant="outline" fullWidth onClick={handleAvatarClick}>
                    <i className="ri-upload-2-line" />
                    {t('dashboard.profile.uploadPhoto')}
                  </Button>
                )}
              </div>
            </Card>

            {/* Subscription Card */}
            <Card className={styles.subscriptionCard}>
              <div className={styles.subscriptionHeader}>
                <i className="ri-vip-crown-line" />
                <h3>{t('dashboard.profile.subscription.title')}</h3>
              </div>
              <p className={styles.subscriptionPlan}>
                {t(`dashboard.profile.subscriptionTiers.${subscription.tier}`)}
              </p>
              {subscription.tier === 'free' && (
                <>
                  <p className={styles.subscriptionText}>
                    {t('dashboard.profile.subscription.upgradeText')}
                  </p>
                  <Button variant="primary" fullWidth onClick={() => navigate(ROUTES.PRICING)}>
                    <i className="ri-rocket-line" />
                    {t('dashboard.profile.subscription.upgrade')}
                  </Button>
                </>
              )}
              {subscription.tier !== 'free' && (
                <p className={styles.subscriptionText}>
                  {t('dashboard.profile.subscription.activeText')}
                </p>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form to original profile data
                        if (profile) {
                          setFormData({
                            full_name: profile.full_name || '',
                            phone: profile.phone || '',
                            status: profile.status || 'other',
                            nationality: profile.nationality || 'other',
                            country_of_origin: profile.country_of_origin || '',
                            date_of_birth: profile.date_of_birth || '',
                            region: profile.region || '',
                            department: profile.department || '',
                            city: profile.city || '',
                            postal_code: profile.postal_code || '',
                            language: profile.language || 'fr'
                          });
                        }
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                      {t('common.save')}
                    </Button>
                  </div>
                )}
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.fullWidth}>
                  <Input
                    label={t('dashboard.profile.fields.fullName')}
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder={t('dashboard.profile.placeholders.fullName')}
                  />
                </div>
                <Input
                  type="email"
                  label={t('dashboard.profile.fields.email')}
                  value={profile?.email || ''}
                  disabled
                  icon="ri-mail-line"
                />
                <Input
                  type="tel"
                  label={t('dashboard.profile.fields.phone')}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.phone')}
                  icon="ri-phone-line"
                />
                <Input
                  type="date"
                  label={t('dashboard.profile.fields.birthDate')}
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  disabled={!isEditing}
                />
                <Select
                  label={t('dashboard.profile.fields.status')}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  options={getStatusOptions()}
                />
                <Select
                  label={t('dashboard.profile.fields.nationality')}
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  disabled={!isEditing}
                  options={getNationalityOptions()}
                />
                <Input
                  label={t('dashboard.profile.fields.countryOfOrigin')}
                  value={formData.country_of_origin}
                  onChange={(e) => handleChange('country_of_origin', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.countryOfOrigin')}
                />
              </div>
            </Card>

            <Card className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <h3>{t('dashboard.profile.addressInfo')}</h3>
              </div>

              <div className={styles.infoGrid}>
                <Select
                  label={t('dashboard.profile.fields.region')}
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: '', label: t('dashboard.profile.placeholders.selectRegion') },
                    ...REGIONS
                  ]}
                />
                <Input
                  label={t('dashboard.profile.fields.department')}
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.department')}
                />
                <Input
                  label={t('dashboard.profile.fields.city')}
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.city')}
                />
                <Input
                  label={t('dashboard.profile.fields.postalCode')}
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  disabled={!isEditing}
                  placeholder={t('dashboard.profile.placeholders.postalCode')}
                />
              </div>
            </Card>

            <Card className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <h3>{t('dashboard.profile.preferences')}</h3>
              </div>

              <div className={styles.infoGrid}>
                <Select
                  label={t('dashboard.profile.fields.language')}
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English' }
                  ]}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default Profile;
