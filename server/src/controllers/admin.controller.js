import { adminService } from '../services/admin.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { affiliateService } from '../services/affiliate.service.js';
import { schedulerService } from '../services/scheduler.service.js';
import { emailService } from '../services/email.service.js';
import { emailTemplateRepository } from '../repositories/index.js';
import { formatResponse } from '../utils/helpers.js';

// ============================================
// Dashboard & Analytics
// ============================================

export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, metric } = req.query;
    const data = await analyticsService.getDetailedAnalytics({ startDate, endDate, metric });
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
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
    res.json(formatResponse({ activity: data }));
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
    const data = await adminService.getAdmins();
    res.json(formatResponse({ admins: data }));
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { userId, role, permissions } = req.body;
    const data = await adminService.createAdmin(userId, role, permissions);
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

// ============================================
// Affiliate Management
// ============================================

export const getAffiliates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const data = await affiliateService.getAllAffiliates(parseInt(page), parseInt(limit), status);
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
    const stats = await emailService.getEmailStats({ startDate, endDate });
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
