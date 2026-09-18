import { useEffect, useState } from 'react';

export interface AntiCheatOptions {
  onViolation?: (count: number) => void;
  maxAllowedViolations?: number;
  isActive?: boolean;
}

export const useAntiCheat = ({
  onViolation,
  maxAllowedViolations = 3,
  isActive = true,
}: AntiCheatOptions = {}) => {
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => {
          const next = prev + 1;
          if (onViolation) onViolation(next);
          return next;
        });
        setShowWarningModal(true);
      }
    };

    const handleBlur = () => {
      // Additional check for window blur
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive, onViolation]);

  const dismissWarning = () => {
    setShowWarningModal(false);
  };

  return {
    violationCount,
    showWarningModal,
    dismissWarning,
    isLimitExceeded: violationCount >= maxAllowedViolations,
  };
};
