import { MinusCircleFilled } from '@ant-design/icons';
import React from 'react';

interface PAMEnvVarInputProps {
  keyValue: string;
  valueValue: string;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
}

export const PAMEnvVarInput: React.FC<PAMEnvVarInputProps> = ({
  keyValue,
  valueValue,
  onKeyChange,
  onValueChange,
  onRemove
}) => {
  return (
    <div data-testid="PAMEnvVarInput" className="flex gap-2 items-center mb-2">
      <input
        type="text"
        placeholder="KEY"
        value={keyValue}
        onChange={(e) => onKeyChange(e.target.value)}
        className="flex-1 border border-primary-border rounded-lg px-3 py-1.5 text-sm bg-secondary text-primary-text focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <input
        type="text"
        placeholder="value"
        value={valueValue}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex-1 border border-primary-border rounded-lg px-3 py-1.5 text-sm bg-secondary text-primary-text focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 transition"
      >
        <MinusCircleFilled />
      </button>
    </div>
  );
};
