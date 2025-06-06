import React from 'react';

interface PromptActionsProps {
  onClear: () => void;
  disabled?: boolean;
}

export const PromptActions: React.FC<PromptActionsProps> = ({
  onClear,
  disabled = false
}) => {
  return (
    <div className="absolute bottom-3 right-3 flex space-x-2">
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        title="清空提示词"
      >
        清空
      </button>
    </div>
  );
}; 