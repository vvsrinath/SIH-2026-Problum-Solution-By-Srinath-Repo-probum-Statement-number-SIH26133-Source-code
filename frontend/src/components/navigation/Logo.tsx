import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { assetUrl } from '../../lib/assets';

interface LogoProps {
  /** When provided, the mark links to this path. */
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Swasthya Sathi wordmark: healthcare mark with the brand tagline. */
export function Logo({ to = '/', size = 'sm', className }: LogoProps) {
  const mark = (
    <img
      src={assetUrl('/logo.png')}
      alt="Swasthya Sathi logo"
      className={cn(
        'shrink-0 rounded-full object-contain shadow-card',
        size === 'lg' ? 'h-16 w-16' : size === 'md' ? 'h-12 w-12' : 'h-9 w-9'
      )}
    />
  );

  const text = (
    <span className="min-w-0">
      <span
        className={cn(
          'block font-semibold leading-tight tracking-[-0.01em] text-navy',
          size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
        )}
      >
        Swasthya Sathi
      </span>
      <span
        className={cn(
          'block font-medium uppercase tracking-[0.14em]',
          size === 'sm' ? 'text-[9px] text-ink-400' : 'mt-0.5 text-[10px] text-ink-500'
        )}
      >
        {size === 'sm' ? 'Healthcare App' : 'Healthcare for Every Village'}
      </span>
      {size === 'lg' && (
        <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-ink-500">
          A Healthier India.
        </span>
      )}
    </span>
  );

  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      {mark}
      {text}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="flex items-center" aria-label="Swasthya Sathi home">
      {content}
    </Link>
  );
}