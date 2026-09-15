import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { assetUrl } from '../../lib/assets';

/**
 * Standard Government of India identification block: Emblem of India next to
 * the ministry name. Bundled locally so it renders offline.
 */
interface GovernmentIdentityProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export function GovernmentIdentity({ variant = 'compact', className }: GovernmentIdentityProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        variant === 'hero' ? 'flex-col text-center sm:flex-row sm:text-left' : 'flex-row',
        className,
      )}
    >
      <img
        src={assetUrl('/images/gov/emblem-of-india.svg')}
        alt="Emblem of India"
        className={cn(
          'h-9 w-auto shrink-0 object-contain',
          variant === 'hero' ? 'h-14 sm:h-16' : 'h-8',
        )}
      />
      <div className={variant === 'hero' ? 'text-center sm:text-left' : ''}>
        <p
          className={cn(
            'font-semibold leading-tight text-navy',
            variant === 'hero' ? 'text-sm sm:text-[15px]' : 'text-2xs',
          )}
        >
          Government of India
        </p>
        <p
          className={cn(
            'mt-0.5 leading-tight text-ink-500',
            variant === 'hero' ? 'text-[11px]' : 'text-2xs',
          )}
        >
          Ministry of Health &amp; Family Welfare
        </p>
      </div>
    </div>
  );
}

/** Small national flag badge for footers / trust areas. */
export function IndianFlag({ className, label }: { className?: string; label?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <img
        src={assetUrl('/images/gov/flag-of-india.svg')}
        alt="Flag of India"
        className="h-3.5 w-auto rounded-[2px] object-cover shadow-sm ring-1 ring-line-soft"
      />
      {label}
    </span>
  );
}

/** Ayushman Bharat Digital Mission logo treatment for integration cards. */
export function AyushmanBharatBadge({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <img
      src={assetUrl('/images/gov/ayushman-bharat.svg')}
      alt="Ayushman Bharat Digital Mission"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
    />
  );
}