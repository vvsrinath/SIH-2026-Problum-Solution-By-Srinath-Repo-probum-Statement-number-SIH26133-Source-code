import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';
import { navLabel } from '../../data/navigation';
import type { NavItem } from '../../data/navigation';

/** Horizontal nav strip shown below the top bar on narrow screens. */
export function MobileWorkspaceNav({
  items,
  workspaceLabel

}: {items: NavItem[];workspaceLabel: string;}) {
  const { t } = useLanguage();
  return (
    <nav
      aria-label={`${workspaceLabel} navigation`}
      className="ss-scroll flex gap-1.5 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:hidden">
      
      {items.map((item) => {
        const Icon = item.icon;
        const labelKey = navLabel(item.label);
        return (
          <NavLink
            key={item.to + labelKey}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
            cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-chip border px-2.5 py-1.5 text-2xs font-medium transition-colors duration-150 ease-out',
              isActive ?
              'border-brand/30 bg-brand-tint text-brand' :
              'border-line text-ink-500'
            )
            }>
            
            <Icon className="h-3.5 w-3.5" />
            {t(`nav.${labelKey}`)}
          </NavLink>);

      })}
    </nav>);

}