import { useCallback } from "react";

/**
 * Custom hook for hCaptcha integration
 * Manages hCaptcha token and verification
 */
export const useHcaptcha = () => {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const isEnabled = !!siteKey;

  const loadHcaptchaScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.hcaptcha) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js";
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load hCaptcha"));

      document.body.appendChild(script);
    });
  }, []);

  const getToken = useCallback(
    async (containerId = "hcaptcha-container") => {
      if (!isEnabled) return null;

      try {
        await loadHcaptchaScript();

        // Render captcha if not already rendered
        if (window.hcaptcha && !window.hcaptchaRendered) {
          const container = document.getElementById(containerId);
          if (container) {
            window.hcaptcha.render(containerId, {
              sitekey: siteKey,
              theme: "light",
            });
            window.hcaptchaRendered = true;
          }
        }

        // Get token
        if (window.hcaptcha) {
          const { response } = window.hcaptcha.getResponse();
          return response;
        }
      } catch (error) {
        console.error("Error getting hCaptcha token:", error);
      }

      return null;
    },
    [isEnabled, siteKey, loadHcaptchaScript]
  );

  const resetCaptcha = useCallback((containerId = "hcaptcha-container") => {
    if (window.hcaptcha) {
      window.hcaptcha.reset();
    }
  }, []);

  const removeCaptcha = useCallback((containerId = "hcaptcha-container") => {
    if (window.hcaptcha) {
      window.hcaptcha.remove();
      window.hcaptchaRendered = false;
    }
  }, []);

  return {
    isEnabled,
    siteKey,
    loadHcaptchaScript,
    getToken,
    resetCaptcha,
    removeCaptcha,
  };
};

export default useHcaptcha;
