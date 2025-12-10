import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../context/AuthContext';
import { Card, Button } from '../../../components/ui';
import { ROUTES } from '../../../config/routes';
import styles from './Overview.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock data - replace with real API calls
const mockStats = {
  eligibleAides: 12,
  potentialSavings: 2450,
  completedProcedures: 3,
  savedHousing: 5
};

const mockRecentAides = [
  { id: 1, name: 'APL', category: 'housing', amount: 350, status: 'eligible' },
  { id: 2, name: 'CAF Allocation', category: 'family', amount: 180, status: 'eligible' },
  { id: 3, name: 'Prime d\'activité', category: 'employment', amount: 150, status: 'pending' },
];

const mockUpcomingTasks = [
  { id: 1, title: 'Submit CAF documents', deadline: '2024-02-15', priority: 'high' },
  { id: 2, title: 'Update housing situation', deadline: '2024-02-20', priority: 'medium' },
  { id: 3, title: 'Complete visa renewal', deadline: '2024-03-01', priority: 'low' },
];

export function Overview() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || t('dashboard.user');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      default: return styles.priorityLow;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.overview.title')} | AIDE+</title>
      </Helmet>

      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.div className={styles.welcomeHeader} variants={itemVariants}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>
              {t('dashboard.overview.welcome', { name: firstName })}
            </h1>
            <p className={styles.welcomeSubtitle}>
              {t('dashboard.overview.subtitle')}
            </p>
          </div>
          <Link to={ROUTES.SIMULATION}>
            <Button variant="primary" size="md">
              <i className="ri-calculator-line" />
              {t('dashboard.overview.newSimulation')}
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div className={styles.statsGrid} variants={itemVariants}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
              <i className="ri-hand-coin-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{mockStats.eligibleAides}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.eligibleAides')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <i className="ri-money-euro-circle-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatCurrency(mockStats.potentialSavings)}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.potentialSavings')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <i className="ri-checkbox-circle-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{mockStats.completedProcedures}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.completedProcedures')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <i className="ri-home-heart-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{mockStats.savedHousing}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.savedHousing')}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Recent Aides */}
          <motion.div variants={itemVariants}>
            <Card>
              <Card.Header>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <i className="ri-hand-coin-line" />
                    {t('dashboard.overview.recentAides')}
                  </h2>
                  <Link to={ROUTES.AIDES} className={styles.viewAll}>
                    {t('common.viewAll')}
                    <i className="ri-arrow-right-line" />
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                <div className={styles.aidesList}>
                  {mockRecentAides.map((aide) => (
                    <div key={aide.id} className={styles.aideItem}>
                      <div className={styles.aideInfo}>
                        <span className={styles.aideName}>{aide.name}</span>
                        <span className={styles.aideCategory}>{aide.category}</span>
                      </div>
                      <div className={styles.aideRight}>
                        <span className={styles.aideAmount}>
                          {formatCurrency(aide.amount)}/mois
                        </span>
                        <span className={`${styles.aideStatus} ${styles[aide.status]}`}>
                          {t(`dashboard.status.${aide.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div variants={itemVariants}>
            <Card>
              <Card.Header>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <i className="ri-task-line" />
                    {t('dashboard.overview.upcomingTasks')}
                  </h2>
                  <Link to={ROUTES.PROCEDURES} className={styles.viewAll}>
                    {t('common.viewAll')}
                    <i className="ri-arrow-right-line" />
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                <div className={styles.tasksList}>
                  {mockUpcomingTasks.map((task) => (
                    <div key={task.id} className={styles.taskItem}>
                      <div className={`${styles.taskPriority} ${getPriorityColor(task.priority)}`} />
                      <div className={styles.taskInfo}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={styles.taskDeadline}>
                          <i className="ri-calendar-line" />
                          {new Date(task.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <Card.Header>
              <h2 className={styles.cardTitle}>
                <i className="ri-flashlight-line" />
                {t('dashboard.overview.quickActions')}
              </h2>
            </Card.Header>
            <Card.Body>
              <div className={styles.quickActions}>
                <Link to={ROUTES.CHAT} className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.iconBlue}`}>
                    <i className="ri-chat-3-line" />
                  </div>
                  <span className={styles.actionLabel}>{t('dashboard.overview.askAI')}</span>
                </Link>

                <Link to={ROUTES.HOUSING} className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.iconGreen}`}>
                    <i className="ri-home-search-line" />
                  </div>
                  <span className={styles.actionLabel}>{t('dashboard.overview.findHousing')}</span>
                </Link>

                <Link to={ROUTES.PROCEDURES} className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.iconPurple}`}>
                    <i className="ri-file-list-3-line" />
                  </div>
                  <span className={styles.actionLabel}>{t('dashboard.overview.startProcedure')}</span>
                </Link>

                <Link to={ROUTES.PROFILE} className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.iconOrange}`}>
                    <i className="ri-user-settings-line" />
                  </div>
                  <span className={styles.actionLabel}>{t('dashboard.overview.updateProfile')}</span>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}

export default Overview;
