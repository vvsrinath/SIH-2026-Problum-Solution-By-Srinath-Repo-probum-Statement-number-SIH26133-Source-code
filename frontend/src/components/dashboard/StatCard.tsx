import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { type LucideIcon } from "lucide-react";

function TrendBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-1.5 flex items-end gap-0.5 sm:mt-2.5" aria-label="Trend sparkline">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-brand/30 sm:w-1.5"
          style={{ height: `${Math.max(4, (v / max) * 28)}px` }}
        />
      ))}
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  caption?: string;
  linkLabel?: string;
  linkTo?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  trend?: number[];
  tone?: 'brand' | 'info';
  className?: string;
}
export function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  linkLabel,
  linkTo,
  badge,
  children,
  trend,
  tone = 'brand',
  className
}: StatCardProps) {
  return <div className={cn('flex h-full min-w-0 flex-col rounded-lg border border-line bg-white p-2.5 shadow-card sm:rounded-card sm:p-3.5', className)}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-[3px] sm:h-6 sm:w-6 sm:rounded-[5px]', tone === 'info' ? 'bg-info-tint text-info' : 'bg-brand-tint text-brand')}>
            <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
          <span className="text-2xs font-medium text-ink-500 sm:text-xs">{label}</span>
        </span>
        {badge}
      </div>

      {value && <p className="mt-2 text-lg font-semibold leading-none tracking-[-0.02em] text-navy sm:mt-3 sm:text-2xl">
          {value}
        </p>}
      {children && <div className="mt-1.5 sm:mt-2.5">{children}</div>}
      {trend && trend.length > 0 && <TrendBars values={trend} />}

      <div className="mt-auto flex items-end justify-between gap-1.5 pt-2 sm:pt-3">
        {caption ? <p className="text-2xs text-ink-400">{caption}</p> : <span />}
        {linkLabel && linkTo && <Link to={linkTo} className="shrink-0 rounded-[3px] border border-line px-1.5 py-0.5 text-2xs font-medium text-ink-500 transition-colors duration-150 ease-out hover:border-brand/30 hover:text-brand sm:px-2">
            {linkLabel}
          </Link>}
      </div>
    </div>;
}