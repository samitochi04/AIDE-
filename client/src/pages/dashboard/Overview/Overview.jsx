import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../../context/AuthContext';
import { Card, Button, Loading } from '../../../components/ui';
import { ROUTES, generatePath } from '../../../config/routes';
import { api, API_ENDPOINTS } from '../../../config/api';
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

export function Overview() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    eligibleAides: 0,
    potentialSavings: 0,
    completedProcedures: 0,
    savedHousing: 0
  });
  const [recentAides, setRecentAides] = useState([]);
  const [userProcedures, setUserProcedures] = useState([]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || t('dashboard.user');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [
          simulationRes,
          proceduresRes,
          savedHousingRes
        ] = await Promise.allSettled([
          api.get(API_ENDPOINTS.SIMULATION.LATEST),
          api.get(API_ENDPOINTS.PROCEDURES.LIST),
          api.get(API_ENDPOINTS.HOUSING.SAVED)
        ]);

        // Process latest simulation
        if (simulationRes.status === 'fulfilled' && simulationRes.value?.data) {
          const simulation = simulationRes.value.data;
          
          // Calculate stats from simulation results
          const results = simulation.results || {};
          
          // Handle both flat eligibleAides array and categorized arrays
          let allAides = [];
          if (results.eligibleAides && Array.isArray(results.eligibleAides)) {
            allAides = results.eligibleAides;
          } else {
            allAides = [
              ...(results.national || []),
              ...(results.regional || []),
              ...(results.municipal || [])
            ];
          }
          
          // Filter for eligible only
          allAides = allAides.filter(aide => aide.eligible !== false);

          setRecentAides(allAides.slice(0, 5).map(aide => ({
            id: aide.id,
            name: aide.name?.[currentLang] || aide.name?.fr || aide.name || 'Aide',
            category: aide.category || 'general',
            amount: aide.estimatedAmount?.monthly || (aide.estimatedAmount?.yearly || 0) / 12 || 0,
            status: aide.eligible === true ? 'eligible' : 'pending'
          })));

          // Calculate potential monthly savings - use stored values or calculate
          const totalMonthly = simulation.total_monthly || results.totalMonthly || allAides.reduce((sum, aide) => {
            const monthly = aide.estimatedAmount?.monthly || (aide.estimatedAmount?.yearly || 0) / 12;
            return sum + monthly;
          }, 0);

          setStats(prev => ({
            ...prev,
            eligibleAides: simulation.eligible_aides_count || allAides.length,
            potentialSavings: Math.round(totalMonthly)
          }));
        } else if (simulationRes.status === 'rejected') {
          console.error('Simulation API error:', simulationRes.reason);
        }

        // Process procedures
        if (proceduresRes.status === 'fulfilled' && proceduresRes.value?.data) {
          // Handle both old format (array) and new format (object with procedures array)
          const data = proceduresRes.value.data;
          const procedures = Array.isArray(data) ? data : (data?.procedures || []);
          const completed = procedures.filter(p => p.status === 'completed').length;
          
          // Get upcoming/in-progress tasks
          const activeProcedures = procedures
            .filter(p => p.status !== 'completed')
            .slice(0, 5)
            .map(p => ({
              id: p.id,
              title: p.name || p.procedure_name,
              deadline: p.estimated_completion || p.created_at,
              priority: p.priority || 'medium',
              progress: p.progress || 0
            }));

          setUserProcedures(activeProcedures);
          setStats(prev => ({
            ...prev,
            completedProcedures: completed
          }));
        } else if (proceduresRes.status === 'rejected') {
          console.error('Procedures API error:', proceduresRes.reason);
        }

        // Process saved housing
        if (savedHousingRes.status === 'fulfilled' && savedHousingRes.value?.data) {
          const savedHousing = savedHousingRes.value.data || [];
          setStats(prev => ({
            ...prev,
            savedHousing: savedHousing.length
          }));
        } else if (savedHousingRes.status === 'rejected') {
          console.error('Housing API error:', savedHousingRes.reason);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentLang]);

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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading.Spinner size="lg" />
      </div>
    );
  }

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
          <div 
            className={styles.statCard}
            onClick={() => navigate(ROUTES.AIDES)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
              <i className="ri-hand-coin-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.eligibleAides}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.eligibleAides')}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <i className="ri-money-euro-circle-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatCurrency(stats.potentialSavings)}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.potentialSavings')}</span>
            </div>
          </div>

          <div 
            className={styles.statCard}
            onClick={() => navigate(ROUTES.PROCEDURES)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <i className="ri-checkbox-circle-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.completedProcedures}</span>
              <span className={styles.statLabel}>{t('dashboard.overview.completedProcedures')}</span>
            </div>
          </div>

          <div 
            className={styles.statCard}
            onClick={() => navigate(ROUTES.HOUSING)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <i className="ri-home-heart-line" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.savedHousing}</span>
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
                {recentAides.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="ri-file-search-line" />
                    <p>{t('dashboard.overview.noAidesYet')}</p>
                    <Link to={ROUTES.SIMULATION}>
                      <Button variant="outline" size="sm">
                        {t('dashboard.overview.runFirstSimulation')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.aidesList}>
                    {recentAides.map((aide) => (
                      <Link 
                        key={aide.id} 
                        to={ROUTES.AIDES} 
                        className={styles.aideItem}
                      >
                        <div className={styles.aideInfo}>
                          <span className={styles.aideName}>{aide.name}</span>
                          <span className={styles.aideCategory}>{aide.category}</span>
                        </div>
                        <span className={styles.aideLearnMore}>
                          {t('common.learnMore')}
                          <i className="ri-arrow-right-line" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
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
                {userProcedures.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="ri-checkbox-circle-line" />
                    <p>{t('dashboard.overview.noProceduresYet')}</p>
                    <Link to={ROUTES.PROCEDURES}>
                      <Button variant="outline" size="sm">
                        {t('dashboard.overview.exploreProcedures')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.tasksList}>
                    {userProcedures.map((task) => (
                      <div 
                        key={task.id} 
                        className={styles.taskItem}
                        onClick={() => navigate(ROUTES.PROCEDURES)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`${styles.taskPriority} ${getPriorityColor(task.priority)}`} />
                        <div className={styles.taskInfo}>
                          <span className={styles.taskTitle}>{task.title}</span>
                          <div className={styles.taskMeta}>
                            {task.deadline && (
                              <span className={styles.taskDeadline}>
                                <i className="ri-calendar-line" />
                                {new Date(task.deadline).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                            {task.progress > 0 && (
                              <span className={styles.taskProgress}>
                                {task.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                        <i className="ri-arrow-right-s-line" />
                      </div>
                    ))}
                  </div>
                )}
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
                    <i className="ri-home-4-line" />
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
