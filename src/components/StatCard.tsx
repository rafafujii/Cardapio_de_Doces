import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  color: 'wine' | 'gold' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  return (
    <div className={cn(
      "p-6 rounded-[24px] border border-neutral-100 shadow-sm transition-all",
      color === 'wine' && "bg-brand-wine text-white",
      color === 'gold' && "bg-brand-gold text-brand-wine",
      color === 'neutral' && "bg-white text-neutral-800"
    )}>
      <p className={cn(
        "text-[10px] uppercase font-black tracking-widest mb-1",
        color === 'wine' ? "text-brand-gold/60" : "text-neutral-400"
      )}>{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
};
