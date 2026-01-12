import { useCallback, useRef } from "react";

/**
 * Custom hook for hCaptcha integration
 * Manages hCaptcha token and verification
 * Uses explicit rendering to ensure API is fully loaded before rendering
 */
export const useHcaptcha = () => {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const isEnabled = !!siteKey;
  const scriptLoadedRef = useRef(false);
  const renderPromiseRef = useRef(null);

  const loadHcaptchaScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      // If script is already loaded, resolve immediately
      if (scriptLoadedRef.current && window.hcaptcha) {
        resolve();
        return;
      }

      // If script is loading, return existing promise
      if (renderPromiseRef.current) {
        renderPromiseRef.current.then(resolve).catch(reject);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load hCaptcha"));

      document.body.appendChild(script);
    });
  }, []);

  const renderCaptcha = useCallback(
    async (containerId = "hcaptcha-container") => {
      if (!isEnabled) return;

      try {
        await loadHcaptchaScript();

        // Wait for hCaptcha API to be available
        if (!window.hcaptcha) {
          throw new Error("hCaptcha API not available");
        }

        // Check if already rendered
        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`Container with ID ${containerId} not found`);
          return;
        }

        // Only render if not already rendered
        if (!container.dataset.hcaptchaRendered) {
          window.hcaptcha.render(containerId, {
            sitekey: siteKey,
            theme: "light",
          });
          container.dataset.hcaptchaRendered = "true";
        }
      } catch (error) {
        console.error("Error rendering hCaptcha:", error);
      }
    },
    [isEnabled, siteKey, loadHcaptchaScript]
  );

  const getToken = useCallback(
    async (containerId = "hcaptcha-container") => {
      if (!isEnabled) return null;

      try {
        // Ensure captcha is rendered
        await renderCaptcha(containerId);

        // Wait for hCaptcha API
        if (!window.hcaptcha) {
          throw new Error("hCaptcha API not available");
        }

        // Get response from the rendered captcha
        const { response } = window.hcaptcha.getResponse();

        if (!response) {
          console.warn(
            "hCaptcha response is empty. User may not have completed the challenge."
          );
          return null;
        }

        return response;
      } catch (error) {
        console.error("Error getting hCaptcha token:", error);
      }

      return null;
    },
    [isEnabled, renderCaptcha]
  );

  const resetCaptcha = useCallback((containerId = "hcaptcha-container") => {
    if (window.hcaptcha) {
      window.hcaptcha.reset();
    }
  }, []);

  const removeCaptcha = useCallback((containerId = "hcaptcha-container") => {
    if (window.hcaptcha) {
      window.hcaptcha.remove();
      const container = document.getElementById(containerId);
      if (container) {
        delete container.dataset.hcaptchaRendered;
      }
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
