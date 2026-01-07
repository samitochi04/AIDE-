import { adminService } from '../services/admin.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { affiliateService } from '../services/affiliate.service.js';
import { schedulerService } from '../services/scheduler.service.js';
import { emailService } from '../services/email.service.js';
import { emailTemplateRepository, userRepository } from '../repositories/index.js';
import { formatResponse } from '../utils/helpers.js';

// ============================================
// Dashboard & Analytics
// ============================================

export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    // Include admin info for frontend permission checks
    res.json(formatResponse({
      ...data,
      admin: {
        id: req.admin.id,
        role: req.admin.role,
        permissions: req.admin.permissions || {},
      }
    }));
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, metric, days } = req.query;
    
    // Support both days parameter and startDate/endDate
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : new Date();
    
    if (days && !startDate) {
      start = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    }
    
    const data = await analyticsService.getDetailedAnalytics({ 
      startDate: start?.toISOString(), 
      endDate: end?.toISOString(), 
      metric 
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Activity Logs
// ============================================

export const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, adminId, action, resourceType, startDate, endDate } = req.query;
    const data = await adminService.getActivityLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      adminId,
      action,
      resourceType,
      startDate,
      endDate,
    });
    
    // Transform logs to match client expectations
    const transformedLogs = (data.logs || []).map(log => ({
      ...log,
      type: `${log.action}_${log.resource_type}`.toLowerCase(),
      message: generateLogMessage(log),
      description: generateLogMessage(log),
    }));
    
    res.json(formatResponse({ ...data, logs: transformedLogs }));
  } catch (error) {
    next(error);
  }
};

// Helper function to generate human-readable log messages
const generateLogMessage = (log) => {
  const adminName = log.admin?.user?.full_name || log.admin?.user?.email || 'Admin';
  const action = log.action || 'performed action';
  const resourceType = log.resource_type || 'resource';
  
  const actionVerbs = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    login: 'logged in',
    export: 'exported',
    email_send: 'sent email to',
  };
  
  const verb = actionVerbs[action] || action;
  
  return `${adminName} ${verb} ${resourceType}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}`;
};

// ============================================
// User Management
// ============================================

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, tier, status } = req.query;
    const data = await adminService.getUsers(parseInt(page), parseInt(limit), {
      search,
      tier,
      status,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await adminService.getUserById(userId);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await adminService.updateUser(userId, req.body);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await adminService.deleteUser(userId);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await adminService.getUserActivity(userId);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Subscription Management
// ============================================

export const getSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, tier } = req.query;
    const data = await adminService.getSubscriptions(parseInt(page), parseInt(limit), {
      status,
      tier,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const grantSubscription = async (req, res, next) => {
  try {
    const { userId, tier, durationMonths } = req.body;
    const data = await adminService.grantSubscription(userId, tier, durationMonths);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const revokeSubscription = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await adminService.revokeSubscription(userId);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Content Management
// ============================================

export const getAides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, region, category, search } = req.query;
    const data = await adminService.getAides(parseInt(page), parseInt(limit), {
      region,
      category,
      search,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createAide = async (req, res, next) => {
  try {
    const data = await adminService.createAide(req.body);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateAide = async (req, res, next) => {
  try {
    const { aideId } = req.params;
    const data = await adminService.updateAide(aideId, req.body);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const deleteAide = async (req, res, next) => {
  try {
    const { aideId } = req.params;
    const result = await adminService.deleteAide(aideId);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Admin Management
// ============================================

export const getAdmins = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const data = await adminService.getAdmins({
      search,
      role,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { email, role, permissions } = req.body;
    const data = await adminService.createAdmin(email, role, permissions);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const removeAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const result = await adminService.removeAdmin(adminId);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { role, permissions } = req.body;
    const result = await adminService.updateAdmin(adminId, { role, permissions });
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Affiliate Management
// ============================================

export const getAffiliates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const data = await affiliateService.getAllAffiliates(parseInt(page), parseInt(limit), { status, search });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateAffiliate = async (req, res, next) => {
  try {
    const { affiliateId } = req.params;
    const result = await affiliateService.updateAffiliate(affiliateId, req.body);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getAffiliateStats = async (req, res, next) => {
  try {
    const { affiliateId } = req.params;
    const data = await affiliateService.getAffiliateStats(affiliateId);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

// ============================================
// System
// ============================================

export const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const data = await adminService.getLogs(parseInt(page), parseInt(limit));
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const clearCache = async (req, res, next) => {
  try {
    const result = await adminService.clearCache();
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Platform Updates / Notifications
// ============================================

export const sendPlatformUpdate = async (req, res, next) => {
  try {
    const { title, content, ctaText, ctaUrl } = req.body;
    const results = await schedulerService.sendPlatformUpdateToAll({
      title,
      content,
      ctaText,
      ctaUrl,
    });
    res.json(formatResponse({
      message: 'Platform update sent',
      results: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    }));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Email Management
// ============================================

export const getEmailStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get email stats from logs
    const rawStats = await emailService.getEmailStats({ startDate, endDate });
    
    // Get subscriber count (users with marketing emails enabled)
    const { count: subscriberCount } = await userRepository.db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('weekly_digest_enabled.is.null,weekly_digest_enabled.eq.true');
    
    // Transform stats to expected format
    const emailsSent = (rawStats?.sent || 0) + (rawStats?.delivered || 0);
    const opened = rawStats?.opened || 0;
    const openRate = emailsSent > 0 ? Math.round((opened / emailsSent) * 100) : 0;
    
    const stats = {
      emailsSent,
      subscribers: subscriberCount || 0,
      openRate,
      // Include raw stats for debugging
      raw: rawStats,
    };
    
    res.json(formatResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getRecentEmails = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const emails = await emailService.getRecentEmails(parseInt(limit));
    res.json(formatResponse({ emails }));
  } catch (error) {
    next(error);
  }
};

export const getEmailTemplates = async (req, res, next) => {
  try {
    const templates = await emailTemplateRepository.findAllActive();
    res.json(formatResponse({ templates }));
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate = async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    const { subject, body_html, body_text, is_active } = req.body;
    
    const template = await emailTemplateRepository.updateTemplate(templateKey, {
      subject,
      body_html,
      body_text,
      is_active,
    });
    
    res.json(formatResponse(template));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Content Management (Blog & Tutorials)
// ============================================

export const getContents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, language, search } = req.query;
    const data = await adminService.getContents(parseInt(page), parseInt(limit), {
      contentType: type || undefined,
      isPublished: status === 'published' ? true : status === 'draft' ? false : undefined,
      language: language || undefined,
      search: search || undefined,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const getContentById = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const data = await adminService.getContentById(contentId);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createContent = async (req, res, next) => {
  try {
    const data = await adminService.createContent(req.body, req.admin.id);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const data = await adminService.updateContent(contentId, req.body, req.admin.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const deleteContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const result = await adminService.deleteContent(contentId, req.admin.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Gov Aides Management
// ============================================

export const getGovAides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, region, profileType, search } = req.query;
    const data = await adminService.getGovAides(parseInt(page), parseInt(limit), {
      region,
      profileType,
      search,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createGovAide = async (req, res, next) => {
  try {
    const data = await adminService.createGovAide(req.body, req.admin.id);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateGovAide = async (req, res, next) => {
  try {
    const { aideId } = req.params;
    const data = await adminService.updateGovAide(aideId, req.body, req.admin.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const deleteGovAide = async (req, res, next) => {
  try {
    const { aideId } = req.params;
    const result = await adminService.deleteGovAide(aideId, req.admin.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Procedures Management
// ============================================

export const getProcedures = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, section, search } = req.query;
    const data = await adminService.getProcedures(parseInt(page), parseInt(limit), {
      category,
      section,
      search,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createProcedure = async (req, res, next) => {
  try {
    const data = await adminService.createProcedure(req.body, req.admin.id);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateProcedure = async (req, res, next) => {
  try {
    const { procedureId } = req.params;
    const data = await adminService.updateProcedure(procedureId, req.body, req.admin.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const deleteProcedure = async (req, res, next) => {
  try {
    const { procedureId } = req.params;
    const result = await adminService.deleteProcedure(procedureId, req.admin.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Renting Management
// ============================================

export const getRentingPlatforms = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const data = await adminService.getRentingPlatforms(parseInt(page), parseInt(limit), {
      category,
      search,
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const createRentingPlatform = async (req, res, next) => {
  try {
    const data = await adminService.createRentingPlatform(req.body, req.admin.id);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const updateRentingPlatform = async (req, res, next) => {
  try {
    const { platformId } = req.params;
    const data = await adminService.updateRentingPlatform(platformId, req.body, req.admin.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const deleteRentingPlatform = async (req, res, next) => {
  try {
    const { platformId } = req.params;
    const result = await adminService.deleteRentingPlatform(platformId, req.admin.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Bulk Email
// ============================================

export const getBulkEmailRecipients = async (req, res, next) => {
  try {
    const filters = req.query;
    const users = await adminService.getUsersForBulkEmail(filters);
    res.json(formatResponse({ users, count: users.length }));
  } catch (error) {
    next(error);
  }
};

export const createBulkEmail = async (req, res, next) => {
  try {
    const data = await adminService.createBulkEmail(req.body, req.admin.id);
    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const getBulkEmails = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const data = await adminService.getBulkEmails(parseInt(page), parseInt(limit), { status });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

// ============================================
// App Settings
// ============================================

export const getSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getSettings();
    res.json(formatResponse({ settings }));
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const setting = await adminService.updateSetting(key, value, req.admin.id);
    res.json(formatResponse(setting));
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateSettings = async (req, res, next) => {
  try {
    const settings = req.body;
    const result = await adminService.bulkUpdateSettings(settings, req.admin.id);
    res.json(formatResponse({ success: true, updated: result.length }));
  } catch (error) {
    next(error);
  }
};

// ============================================
// Anonymous Visitors
// ============================================

export const getVisitorStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getAnonymousVisitorStats();
    res.json(formatResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getRecentVisitors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await analyticsService.getRecentVisitors({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};
