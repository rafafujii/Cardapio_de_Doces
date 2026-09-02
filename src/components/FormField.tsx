import React from 'react';

interface FormFieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, icon, children, className = '' }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
};
