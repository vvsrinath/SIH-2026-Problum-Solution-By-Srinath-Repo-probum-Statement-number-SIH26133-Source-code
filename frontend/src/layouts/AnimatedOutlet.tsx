import { useLocation, Outlet } from 'react-router-dom';

/** Keyed outlet that remounts + fades content on route change. */
export function AnimatedOutlet() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="ss-route-enter">
      <Outlet />
    </div>
  );
}