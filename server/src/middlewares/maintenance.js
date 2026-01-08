import { appSettingsRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';

/**
 * Maintenance mode middleware
 * Checks if maintenance mode is enabled and blocks non-admin requests
 */
export const checkMaintenance = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes and auth routes
    if (req.path.startsWith('/api/v1/admin') || 
        req.path.startsWith('/api/v1/auth/login') ||
        req.path.startsWith('/api/v1/auth/refresh') ||
        req.path === '/api/v1/settings/public' ||
        req.path === '/health') {
      return next();
    }

    // Check if maintenance mode is enabled
    const maintenanceSetting = await appSettingsRepository.getByKey('general.maintenance_mode');
    
    if (maintenanceSetting?.value === true || maintenanceSetting?.value === 'true') {
      // If user is authenticated as admin, allow through
      if (req.user && req.admin) {
        return next();
      }
      
      // Return maintenance response
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'The site is currently under maintenance. Please try again later.',
        },
        maintenance: true,
      });
    }

    next();
  } catch (error) {
    // If we can't check maintenance status, allow request through
    console.error('Error checking maintenance mode:', error);
    next();
  }
};

/**
 * Get public settings (maintenance status, etc.)
 * This endpoint is always accessible
 */
export const getPublicSettings = async (req, res) => {
  try {
    const [maintenanceSetting, registrationSetting] = await Promise.all([
      appSettingsRepository.getByKey('general.maintenance_mode'),
      appSettingsRepository.getByKey('general.registration_enabled'),
    ]);
    
    res.json({
      success: true,
      data: {
        maintenanceMode: maintenanceSetting?.value === true || maintenanceSetting?.value === 'true',
        registrationEnabled: registrationSetting?.value !== false && registrationSetting?.value !== 'false',
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        maintenanceMode: false,
        registrationEnabled: true,
      },
    });
  }
};
