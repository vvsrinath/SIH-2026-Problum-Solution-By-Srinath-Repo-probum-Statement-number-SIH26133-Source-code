import { useEffect, useState } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { patientNav } from '../data/navigation';
import { useAuth } from '../context/AuthContext';
import { getSelf } from '../api/services';
import type { SelfView } from '../types';

export function PatientLayout() {
  const { user, roleName } = useAuth();
  const [self, setSelf] = useState<SelfView | null>(null);

  useEffect(() => {
    let active = true;
    getSelf()
      .then((v) => active && setSelf(v))
      .catch(() => active && setSelf(null));
    return () => {
      active = false;
    };
  }, []);

  const displayName =
    (self?.profile?.displayName as string | undefined) ||
    user?.displayName ||
    roleName ||
    'Patient';
  const meta = (self?.profile?.addressDistrict as string | undefined) || 'Patient';

  return (
    <WorkspaceLayout
      items={patientNav}
      workspaceLabel="Patient workspace"
      basePath="/patient"
      userName={displayName}
      userMeta={`Patient · ${meta}`} />
  );
}
