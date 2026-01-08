/**
 * Visitor Tracking Utility
 * Tracks anonymous visitors using browser fingerprinting
 */

import { API_ENDPOINTS } from '../config/api';

// Storage key for visitor fingerprint
const VISITOR_STORAGE_KEY = 'aideplus_visitor_fp';
const SESSION_STORAGE_KEY = 'aideplus_session_start';

/**
 * Generate a simple device fingerprint
 * Uses available browser properties to create a unique-ish identifier
 */
function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36) + Date.now().toString(36);
}

/**
 * Get or create visitor fingerprint
 */
function getFingerprint() {
  let fingerprint = localStorage.getItem(VISITOR_STORAGE_KEY);
  
  if (!fingerprint) {
    fingerprint = generateFingerprint();
    localStorage.setItem(VISITOR_STORAGE_KEY, fingerprint);
  }
  
  return fingerprint;
}

/**
 * Detect device type from user agent
 */
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Detect browser name
 */
function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'IE';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

/**
 * Detect OS
 */
function getOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Get UTM parameters from URL
 */
function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || null,
    medium: params.get('utm_medium') || null,
    campaign: params.get('utm_campaign') || null,
  };
}

/**
 * Track anonymous visitor
 */
export async function trackVisitor() {
  // Don't track if user is authenticated (they're not anonymous)
  const token = localStorage.getItem('token');
  if (token) {
    return;
  }
  
  // Check if we've already tracked this session
  const sessionStart = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (sessionStart) {
    return; // Already tracked this session
  }
  
  try {
    const fingerprint = getFingerprint();
    const utm = getUTMParams();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${API_ENDPOINTS.ANALYTICS.TRACK_VISITOR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_fingerprint: fingerprint,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        source: utm.source,
        medium: utm.medium,
        campaign: utm.campaign,
        referrer: document.referrer || null,
        landing_page: window.location.pathname,
      }),
    });
    
    if (response.ok) {
      // Mark session as tracked
      sessionStorage.setItem(SESSION_STORAGE_KEY, Date.now().toString());
    }
  } catch (error) {
    // Silent fail - don't break the app for tracking
    console.debug('Visitor tracking failed:', error);
  }
}

/**
 * Track page view for anonymous visitor
 */
export async function trackPageView(pageUrl) {
  // Don't track if user is authenticated
  const token = localStorage.getItem('token');
  if (token) {
    return;
  }
  
  try {
    const fingerprint = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!fingerprint) {
      return;
    }
    
    await fetch(`${import.meta.env.VITE_API_URL || ''}${API_ENDPOINTS.ANALYTICS.TRACK_PAGEVIEW}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_fingerprint: fingerprint,
        page_url: pageUrl || window.location.pathname,
        time_on_page: 0, // Could track actual time
      }),
    });
  } catch (error) {
    console.debug('Page view tracking failed:', error);
  }
}

/**
 * Convert anonymous visitor to user after signup
 */
export async function convertVisitor(token) {
  try {
    const fingerprint = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!fingerprint) {
      return;
    }
    
    await fetch(`${import.meta.env.VITE_API_URL || ''}${API_ENDPOINTS.ANALYTICS.CONVERT_VISITOR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        device_fingerprint: fingerprint,
      }),
    });
    
    // Clear visitor fingerprint after conversion
    localStorage.removeItem(VISITOR_STORAGE_KEY);
  } catch (error) {
    console.debug('Visitor conversion failed:', error);
  }
}

/**
 * Initialize visitor tracking
 * Call this once when app loads
 */
export function initVisitorTracking() {
  // Track visitor on first load
  trackVisitor();
  
  // Track page views on navigation (for SPAs)
  // This is a simple approach - you could also use router events
  let lastPath = window.location.pathname;
  
  // Check for path changes periodically
  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      trackPageView(currentPath);
    }
  }, 1000);
}

export default {
  trackVisitor,
  trackPageView,
  convertVisitor,
  initVisitorTracking,
  getFingerprint,
};
