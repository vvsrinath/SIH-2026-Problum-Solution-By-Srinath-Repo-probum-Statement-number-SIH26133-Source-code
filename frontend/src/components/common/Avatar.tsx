import { cn } from '../../utils/cn';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-7 w-7 text-2xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

const GRADIENTS = [
  'bg-gradient-to-br from-brand to-emerald-600',
  'bg-gradient-to-br from-sky-500 to-brand',
  'bg-gradient-to-br from-amber-500 to-rose-600',
  'bg-gradient-to-br from-violet-500 to-brand',
  'bg-gradient-to-br from-emerald-500 to-sky-600',
  'bg-gradient-to-br from-rose-500 to-violet-600',
  'bg-gradient-to-br from-teal-500 to-emerald-700',
  'bg-gradient-to-br from-indigo-500 to-sky-600',
];

function initials(name: string) {
  return name.
  replace(/^Dr\.?\s+/i, '').
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((part) => part[0]?.toUpperCase()).
  join('');
}

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const gradient = GRADIENTS[hashName(name) % GRADIENTS.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full border border-line object-cover',
          sizes[size],
          className
        )} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-inner',
        gradient,
        sizes[size],
        className
      )}>
      {initials(name)}
    </span>
  );
}