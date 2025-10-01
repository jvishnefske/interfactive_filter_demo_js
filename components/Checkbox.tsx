
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ id, label, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        {...props}
        className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
      />
      <label htmlFor={id} className="ml-3 block text-sm font-medium text-gray-300">
        {label}
      </label>
    </div>
  );
};
