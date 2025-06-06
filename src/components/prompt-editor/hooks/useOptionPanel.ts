import { useState, useCallback } from 'react';

interface CurrentBracket {
  position: { start: number; end: number };
  options: string[];
  type: string;
  originalContent?: string;
  optionId?: string;
}

export const useOptionPanel = () => {
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  const [currentBracket, setCurrentBracket] = useState<CurrentBracket | null>(null);

  const showOptions = useCallback((bracket: CurrentBracket) => {
    setCurrentBracket(bracket);
    setIsShowingOptions(true);
  }, []);

  const hideOptions = useCallback(() => {
    setIsShowingOptions(false);
    setCurrentBracket(null);
  }, []);

  const updateCurrentBracket = useCallback((updates: Partial<CurrentBracket>) => {
    setCurrentBracket(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return {
    isShowingOptions,
    currentBracket,
    showOptions,
    hideOptions,
    updateCurrentBracket
  };
}; 