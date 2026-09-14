import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  title?: string;
  detail?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, detail, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-red-100 bg-red-50/50 px-6 py-10 text-center',
        className,
      )}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangleIcon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs font-semibold text-navy">{title ?? 'Something went wrong'}</p>
      {detail && <p className="mt-1 max-w-sm text-2xs leading-5 text-ink-500">{detail}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-1.5 text-2xs font-medium text-ink-600 transition-colors hover:border-brand/30 hover:text-brand">
          <RefreshCwIcon className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}
