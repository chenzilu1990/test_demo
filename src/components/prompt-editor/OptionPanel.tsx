import { BracketOption } from './types';

interface OptionPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;
  options: string[];
  type: string;
}

export default function OptionPanel({
  isVisible,
  onClose,
  onOptionSelect,
  options,
  type
}: OptionPanelProps) {
  if (!isVisible) return null;
  
  return (
    <div className="option-panel absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
      <div className="p-2 border-b dark:border-gray-700">
        <span className="font-medium">请选择{type}</span>
        <button 
          className="float-right text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="p-2 max-h-60 overflow-y-auto">
        {options.map((option, idx) => (
          <div 
            key={idx}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
            onClick={() => onOptionSelect(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}
