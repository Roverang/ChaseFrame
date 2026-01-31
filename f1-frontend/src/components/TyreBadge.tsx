import { TyreCompound } from '@/types/race';

interface TyreBadgeProps {
  compound: TyreCompound;
  size?: 'sm' | 'md' | 'lg';
}

const compoundStyles: Record<TyreCompound, string> = {
  soft: 'tyre-soft',
  medium: 'tyre-medium',
  hard: 'tyre-hard',
  inter: 'tyre-inter',
  wet: 'tyre-wet',
};

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TyreBadge({ compound, size = 'md' }: TyreBadgeProps) {
  return (
    <div 
      className={`${compoundStyles[compound]} ${sizeClasses[size]} flex-shrink-0`}
      title={compound.charAt(0).toUpperCase() + compound.slice(1)}
    />
  );
}
