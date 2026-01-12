import { useEffect, useState } from "react";
import useHcaptcha from "../../../features/user/useHcaptcha.js";

/**
 * HCaptcha Component
 * Renders hCaptcha widget with explicit rendering
 */
export const HCaptcha = ({
  containerId = "hcaptcha-container",
  onLoad = null,
  className = "",
}) => {
  const { isEnabled, renderCaptcha } = useHcaptcha();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setIsReady(true);
      return;
    }

    const initCaptcha = async () => {
      try {
        await renderCaptcha(containerId);
        setIsReady(true);
        onLoad?.();
      } catch (error) {
        console.error("Failed to render hCaptcha:", error);
        setIsReady(true);
      }
    };

    // Small delay to ensure container is mounted
    const timer = setTimeout(() => {
      initCaptcha();
    }, 100);

    return () => clearTimeout(timer);
  }, [isEnabled, renderCaptcha, containerId, onLoad]);

  if (!isEnabled) return null;

  return (
    <div
      id={containerId}
      className={className}
      data-testid="hcaptcha-widget"
    ></div>
  );
};

export default HCaptcha;
