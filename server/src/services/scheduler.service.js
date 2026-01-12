import { supabaseAdmin } from '../config/supabase.js';
import emailService from './email.service.js';
import logger from '../utils/logger.js';

/**
 * Scheduler Service - Handles all scheduled tasks
 */
class SchedulerService {
  constructor() {
    this.intervals = [];
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    logger.info('Starting scheduler service...');
    
    // Procedure reminders - every 4 weeks (28 days), check daily at 9am
    this.scheduleDaily(9, 0, this.sendProcedureReminders.bind(this));
    
    // Deadline alerts - daily at 8am (for procedures with deadlines in next 7 days)
    this.scheduleDaily(8, 0, this.sendDeadlineAlerts.bind(this));
    
    // Weekly digest - every Monday at 10am
    this.scheduleWeekly(1, 10, 0, this.sendWeeklyDigests.bind(this));
    
    // New aides check - daily at 7am
    this.scheduleDaily(7, 0, this.checkNewAidesForUsers.bind(this));
    
    logger.info('Scheduler service started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    logger.info('Scheduler service stopped');
  }

  /**
   * Schedule a daily task at a specific time
   */
  scheduleDaily(hour, minute, task) {
    const checkInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === hour && now.getMinutes() === minute) {
        task();
      }
    }, 60000); // Check every minute
    
    this.intervals.push(checkInterval);
  }

  /**
   * Schedule a weekly task on a specific day and time
   */
  scheduleWeekly(dayOfWeek, hour, minute, task) {
    const checkInterval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === dayOfWeek && now.getHours() === hour && now.getMinutes() === minute) {
        task();
      }
    }, 60000); // Check every minute
    
    this.intervals.push(checkInterval);
  }

  /**
   * Send procedure reminders every 4 weeks
   * Only sends if user hasn't been reminded in the last 28 days
   */
  async sendProcedureReminders() {
    try {
      logger.info('Running procedure reminders job...');
      
      // Get all users with in-progress procedures
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          last_procedure_reminder,
          user_procedures (
            id,
            procedure_id,
            status,
            current_step,
            created_at,
            updated_at
          )
        `)
        .eq('user_procedures.status', 'in_progress')
        .or(`last_procedure_reminder.is.null,last_procedure_reminder.lt.${new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()}`);
      
      if (error) {
        logger.error('Error fetching users for procedure reminders', { error: error.message });
        return;
      }

      // Get procedure names
      const { data: procedures } = await supabaseAdmin
        .from('procedures')
        .select('id, name, deadline_info');

      const procedureMap = new Map((procedures || []).map(p => [p.id, p]));

      for (const user of users || []) {
        if (!user.user_procedures?.length) continue;
        
        const proceduresData = user.user_procedures.map(up => ({
          name: procedureMap.get(up.procedure_id)?.name || 'Démarche',
          status: up.status === 'in_progress' ? 'En cours' : up.status,
          nextStep: up.current_step,
          deadline: procedureMap.get(up.procedure_id)?.deadline_info,
        }));

        try {
          await emailService.sendProcedureReminder(user.email, {
            proceduresCount: proceduresData.length,
            procedures: proceduresData,
          });

          // Update last reminder date
          await supabaseAdmin
            .from('profiles')
            .update({ last_procedure_reminder: new Date().toISOString() })
            .eq('id', user.id);

          logger.info('Sent procedure reminder', { userId: user.id });
        } catch (emailError) {
          logger.error('Failed to send procedure reminder', { 
            userId: user.id, 
            error: emailError.message 
          });
        }
      }

      logger.info('Procedure reminders job completed');
    } catch (error) {
      logger.error('Procedure reminders job failed', { error: error.message });
    }
  }

  /**
   * Send deadline alerts for procedures with deadlines in the next 7 days
   */
  async sendDeadlineAlerts() {
    try {
      logger.info('Running deadline alerts job...');
      
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Get all in-progress user procedures
      const { data: userProcedures, error } = await supabaseAdmin
        .from('user_procedures')
        .select(`
          id,
          procedure_id,
          user_id,
          deadline,
          profiles (
            email,
            full_name
          )
        `)
        .eq('status', 'in_progress')
        .not('deadline', 'is', null)
        .lte('deadline', sevenDaysFromNow.toISOString())
        .gte('deadline', new Date().toISOString());

      if (error) {
        logger.error('Error fetching procedures for deadline alerts', { error: error.message });
        return;
      }

      // Get procedure names
      const { data: procedures } = await supabaseAdmin
        .from('procedures')
        .select('id, name');

      const procedureMap = new Map((procedures || []).map(p => [p.id, p]));

      for (const up of userProcedures || []) {
        if (!up.profiles?.email) continue;

        const deadlineDate = new Date(up.deadline);
        const daysLeft = Math.ceil((deadlineDate - Date.now()) / (24 * 60 * 60 * 1000));

        try {
          await emailService.sendProcedureDeadline(up.profiles.email, {
            procedureName: procedureMap.get(up.procedure_id)?.name || 'Démarche',
            deadline: deadlineDate.toLocaleDateString('fr-FR'),
            daysLeft,
            procedureId: up.id,
          });

          logger.info('Sent deadline alert', { userId: up.user_id, procedureId: up.id });
        } catch (emailError) {
          logger.error('Failed to send deadline alert', { 
            userId: up.user_id, 
            error: emailError.message 
          });
        }
      }

      logger.info('Deadline alerts job completed');
    } catch (error) {
      logger.error('Deadline alerts job failed', { error: error.message });
    }
  }

  /**
   * Send weekly digest to all active users
   */
  async sendWeeklyDigests() {
    try {
      logger.info('Running weekly digest job...');
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get all active users
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, weekly_digest_enabled')
        .eq('weekly_digest_enabled', true);

      if (error) {
        logger.error('Error fetching users for weekly digest', { error: error.message });
        return;
      }

      for (const user of users || []) {
        try {
          // Get user's procedure count
          const { count: proceduresCount } = await supabaseAdmin
            .from('user_procedures')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'in_progress');

          // Get chat messages count from last week
          const { count: chatCount } = await supabaseAdmin
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('created_at', oneWeekAgo.toISOString());

          // Get upcoming deadlines
          const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const { data: upcomingProcedures } = await supabaseAdmin
            .from('user_procedures')
            .select('id, deadline, procedure_id')
            .eq('user_id', user.id)
            .eq('status', 'in_progress')
            .not('deadline', 'is', null)
            .lte('deadline', sevenDaysFromNow.toISOString())
            .gte('deadline', new Date().toISOString());

          const { data: procedures } = await supabaseAdmin
            .from('procedures')
            .select('id, name');
          const procedureMap = new Map((procedures || []).map(p => [p.id, p]));

          const upcomingDeadlines = (upcomingProcedures || []).map(up => ({
            name: procedureMap.get(up.procedure_id)?.name || 'Démarche',
            date: new Date(up.deadline).toLocaleDateString('fr-FR'),
          }));

          await emailService.sendWeeklyDigest(user.email, {
            newAidesCount: 0, // TODO: Calculate based on user profile match
            proceduresProgress: proceduresCount || 0,
            chatMessages: chatCount || 0,
            upcomingDeadlines,
          });

          logger.info('Sent weekly digest', { userId: user.id });
        } catch (emailError) {
          logger.error('Failed to send weekly digest', { 
            userId: user.id, 
            error: emailError.message 
          });
        }
      }

      logger.info('Weekly digest job completed');
    } catch (error) {
      logger.error('Weekly digest job failed', { error: error.message });
    }
  }

  /**
   * Check for new aides that match user profiles
   */
  async checkNewAidesForUsers() {
    try {
      logger.info('Running new aides check job...');
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get recently added/updated aides
      const { data: newAides, error: aidesError } = await supabaseAdmin
        .from('gov_aides')
        .select('id, name, description, amount, criteria')
        .gte('updated_at', oneDayAgo.toISOString());

      if (aidesError || !newAides?.length) {
        logger.info('No new aides to check');
        return;
      }

      // Get all users with simulations
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          new_aides_notification_enabled,
          simulations (
            id,
            data
          )
        `)
        .eq('new_aides_notification_enabled', true);

      if (usersError) {
        logger.error('Error fetching users for new aides check', { error: usersError.message });
        return;
      }

      for (const user of users || []) {
        if (!user.simulations?.length) continue;

        // Simple matching: check if any new aide matches user's simulation criteria
        const matchingAides = newAides.filter(aide => {
          // This is a simplified match - in production, implement proper criteria matching
          return true; // For now, send all new aides to subscribed users
        });

        if (matchingAides.length > 0) {
          try {
            await emailService.sendNewAidesAvailable(user.email, {
              aides: matchingAides.map(a => ({
                name: a.name,
                description: a.description?.substring(0, 150) + '...',
                amount: a.amount,
              })),
            });

            logger.info('Sent new aides notification', { userId: user.id, aidesCount: matchingAides.length });
          } catch (emailError) {
            logger.error('Failed to send new aides notification', { 
              userId: user.id, 
              error: emailError.message 
            });
          }
        }
      }

      logger.info('New aides check job completed');
    } catch (error) {
      logger.error('New aides check job failed', { error: error.message });
    }
  }

  /**
   * Send platform update to all users (called manually by admin)
   */
  async sendPlatformUpdateToAll(updateData) {
    try {
      logger.info('Sending platform update to all users...', { title: updateData.title });

      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name');

      if (error) {
        throw error;
      }

      const results = await emailService.sendBulk(
        users || [],
        'platformUpdate',
        () => updateData
      );

      const successCount = results.filter(r => r.success).length;
      logger.info('Platform update sent', { 
        total: results.length, 
        success: successCount, 
        failed: results.length - successCount 
      });

      return results;
    } catch (error) {
      logger.error('Failed to send platform update', { error: error.message });
      throw error;
    }
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
