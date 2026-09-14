import { useState } from 'react';
import { GlobeIcon, SaveIcon, SettingsIcon, ShieldCheckIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getSelf, patchSelf } from '../../api/services';
import { cn } from '../../utils/cn';

export function ProfilePage() {
  const { user, roleName, signOut } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const { data: self, loading, error, reload } = useAsync(() => getSelf(), []);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const profile = self?.profile;
  const internalUserId = profile?.internalUserId ?? user?.internalUserId ?? '—';
  const displayName = profile?.displayName ?? user?.displayName ?? roleName ?? 'User';
  const district = profile?.addressDistrict ?? '—';
  const region = profile?.addressRegion ?? '—';
  const languagesList = profile?.languages ?? [];

  async function handleSaveLanguage(code: string) {
    setLanguage(code as Parameters<typeof setLanguage>[0]);
    setMessage(null);
    setSaving(true);
    try {
      if (self) {
        const existing = profile?.languages ?? [];
        const updated = [...new Set([...existing, code])];
        await patchSelf({
          profile: { ...profile, languages: updated },
        });
      }
      setMessage('Preferences saved.');
    } finally {
      setSaving(false);
    }
  }

  const consentItems = [
    { purpose: 'Care continuity', detail: 'Share your clinical summaries with doctors in your care network.', granted: true },
    { purpose: 'Referral coordination', detail: 'Share relevant records with referral recipients.', granted: true },
    { purpose: 'Health campaigns', detail: 'Receive locational health awareness and screening alerts.', granted: false },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Profile Settings</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Personal details, language preference and consent settings.
        </p>
      </div>

      {loading ? (
        <LoadingState rows={3} label="Loading profile" />
      ) : error ? (
        <ErrorState title="Couldn't load profile" detail={error.message} onRetry={reload} />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Profile details" subtitle="Information from your health identity.">
            <div className="space-y-2">
              <Field label="Display name" value={displayName} />
              <Field label="Health ID" value={internalUserId} />
              <Field label="Role" value={roleName} />
              <Field label="District" value={district} />
              <Field label="Region" value={region} />
              <Field label="Languages" value={languagesList.join(', ') || '—'} />
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Language preference" subtitle="Choose the language used across the app.">
              <div className="grid gap-1.5">
                {languages.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveLanguage(option.code)}
                    className={cn(
                      'flex items-center justify-between rounded-card border px-3 py-2 text-left transition-colors disabled:opacity-60',
                      language === option.code
                        ? 'border-brand/40 bg-brand-tint text-brand'
                        : 'border-line bg-white text-navy hover:border-brand/25'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <GlobeIcon className="h-4 w-4" />
                      <span>
                        <span className="block text-xs font-medium">{option.label}</span>
                        <span className="block text-2xs text-ink-500">{option.nativeLabel}</span>
                      </span>
                    </span>
                    {language === option.code && (
                      <span className="text-2xs font-semibold">Active</span>
                    )}
                  </button>
                ))}
              </div>
              {message && <p className="mt-2 text-2xs text-brand">{message}</p>}
            </Panel>
          </div>

          <Panel title="Privacy & consent" subtitle="Control how your health data is shared." className="xl:col-span-2">
            <div className="space-y-2">
              {consentItems.map((item) => (
                <div key={item.purpose} className="flex items-start justify-between gap-3 rounded-card border border-line px-3 py-2.5">
                  <span className="flex items-start gap-2.5">
                    <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md', item.granted ? 'bg-brand-tint text-brand' : 'bg-line-soft text-ink-400')}>
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium text-navy">{item.purpose}</span>
                      <span className="mt-0.5 block text-2xs leading-5 text-ink-500">{item.detail}</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-[4px] px-2 py-0.5 text-2xs font-medium text-ink-500">
                    {item.granted ? 'Granted' : 'Not granted'}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-white px-4 py-3 shadow-card">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-line-soft text-ink-500">
          <SettingsIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-navy">Session</p>
          <p className="text-2xs text-ink-500">Signed in as {roleName}. Sign out ends this demo session.</p>
        </div>
        <Button variant="secondary" onClick={signOut}>
          <SaveIcon className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-3 py-2">
      <span className="text-2xs font-medium text-ink-500">{label}</span>
      <span className="truncate text-xs font-medium text-navy">{value}</span>
    </div>
  );
}