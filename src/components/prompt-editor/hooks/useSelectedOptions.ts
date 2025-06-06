import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SelectedOption } from '../types';

export const useSelectedOptions = (onSelectedOptionsChange?: (options: SelectedOption[]) => void) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);

  const addSelectedOption = useCallback((
    option: string,
    type: string,
    originalBracket: string,
    position: { start: number; end: number }
  ) => {
    const newOption: SelectedOption = {
      id: uuidv4(),
      type,
      originalBracket,
      selectedValue: option,
      position
    };

    setSelectedOptions(prev => {
      const updated = [...prev, newOption];
      onSelectedOptionsChange?.(updated);
      return updated;
    });

    return newOption;
  }, [onSelectedOptionsChange]);

  const updateSelectedOption = useCallback((
    optionId: string,
    newValue: string,
    newPosition: { start: number; end: number }
  ) => {
    setSelectedOptions(prev => {
      const updated = prev.map(item => 
        item.id === optionId 
          ? {
              ...item,
              selectedValue: newValue,
              position: newPosition
            } 
          : item
      );
      onSelectedOptionsChange?.(updated);
      return updated;
    });
  }, [onSelectedOptionsChange]);

  const removeSelectedOption = useCallback((optionId: string) => {
    setSelectedOptions(prev => {
      const updated = prev.filter(item => item.id !== optionId);
      onSelectedOptionsChange?.(updated);
      return updated;
    });
  }, [onSelectedOptionsChange]);

  const clearSelectedOptions = useCallback(() => {
    setSelectedOptions([]);
    onSelectedOptionsChange?.([]);
  }, [onSelectedOptionsChange]);

  const replaceAllSelectedOptions = useCallback((options: SelectedOption[]) => {
    setSelectedOptions(options);
    onSelectedOptionsChange?.(options);
  }, [onSelectedOptionsChange]);

  return {
    selectedOptions,
    addSelectedOption,
    updateSelectedOption,
    removeSelectedOption,
    clearSelectedOptions,
    replaceAllSelectedOptions
  };
}; 