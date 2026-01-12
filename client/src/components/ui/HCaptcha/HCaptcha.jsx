import { useEffect } from "react";
import useHcaptcha from "../../../features/user/useHcaptcha.js";

/**
 * HCaptcha Component
 * Renders hCaptcha widget
 */
export const HCaptcha = ({
  containerId = "hcaptcha-container",
  onLoad = null,
  className = "",
}) => {
  const { isEnabled, loadHcaptchaScript } = useHcaptcha();

  useEffect(() => {
    if (!isEnabled) return;

    const initCaptcha = async () => {
      try {
        await loadHcaptchaScript();

        if (window.hcaptcha && !window.hcaptchaRendered) {
          const container = document.getElementById(containerId);
          if (container) {
            window.hcaptcha.render(containerId, {
              sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
              theme: "light",
            });
            window.hcaptchaRendered = true;
            onLoad?.();
          }
        }
      } catch (error) {
        console.error("Failed to load hCaptcha:", error);
      }
    };

    initCaptcha();

    return () => {
      // Cleanup is handled separately if needed
    };
  }, [isEnabled, loadHcaptchaScript, containerId, onLoad]);

  if (!isEnabled) return null;

  return <div id={containerId} className={className}></div>;
};

export default HCaptcha;
