import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: EmptyStateProps) {
  const defaultIcon = (
    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
        {icon || defaultIcon}
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm mb-4">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
} 