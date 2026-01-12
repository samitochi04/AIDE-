import { hcaptchaConfig, hcaptchaIsEnabled } from "../config/hcaptcha.js";
import logger from "../utils/logger.js";

/**
 * Verify hCaptcha token middleware
 * Expects hcaptchaToken in the request body or headers
 * Validates the token with hCaptcha service
 */
export const verifyHcaptcha = async (req, res, next) => {
  try {
    // Skip if hCaptcha is not configured
    if (!hcaptchaIsEnabled()) {
      return next();
    }

    // Get token from request body
    const token = req.body?.hcaptchaToken || req.headers["x-hcaptcha-token"];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "hCaptcha token is required",
        error: "MISSING_CAPTCHA_TOKEN",
      });
    }

    // Verify with hCaptcha service
    const verifyData = new URLSearchParams();
    verifyData.append("secret", hcaptchaConfig.secretKey);
    verifyData.append("response", token);

    const response = await fetch(hcaptchaConfig.verifyUrl, {
      method: "POST",
      body: verifyData,
    });

    const data = await response.json();

    if (!data.success) {
      logger.warn("hCaptcha verification failed", {
        errors: data["error-codes"],
      });
      return res.status(400).json({
        success: false,
        message: "hCaptcha verification failed",
        error: "CAPTCHA_VERIFICATION_FAILED",
      });
    }

    // Check score/difficulty if available
    if (data.score !== undefined && data.score < 0.5) {
      logger.warn("hCaptcha score too low", { score: data.score });
      return res.status(400).json({
        success: false,
        message: "hCaptcha verification failed - suspicious activity",
        error: "CAPTCHA_LOW_SCORE",
      });
    }

    // Attach verification data to request
    req.hcaptchaVerified = true;
    req.hcaptchaData = {
      success: data.success,
      score: data.score,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };

    next();
  } catch (error) {
    logger.error("hCaptcha verification error", error);
    return res.status(500).json({
      success: false,
      message: "hCaptcha verification error",
      error: "CAPTCHA_ERROR",
    });
  }
};

export default verifyHcaptcha;
