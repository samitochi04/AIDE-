// ===========================================
// hCaptcha Configuration
// ===========================================

export const hcaptchaConfig = {
  siteKey: process.env.HCAPTCHA_SITE_KEY,
  secretKey: process.env.HCAPTCHA_SECRET_KEY,
  verifyUrl: "https://hcaptcha.com/siteverify",
};

export const hcaptchaIsEnabled = () => {
  return !!(hcaptchaConfig.siteKey && hcaptchaConfig.secretKey);
};
