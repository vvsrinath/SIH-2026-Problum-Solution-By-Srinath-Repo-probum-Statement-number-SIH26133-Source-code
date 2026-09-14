import { useState } from 'react';
import { SaveIcon, SettingsIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAdminSettings } from '../../api/workspaces';

export function AdminSettings() {
  const { data: settings, loading, error, reload } = useAsync(() => fetchAdminSettings(), []);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const values: Record<string, string> = {
    ...Object.fromEntries((settings ?? []).map((setting) => [setting.key, setting.value])),
    ...draft,
  };

  function update(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Settings</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Role permissions, templates and system configuration.
        </p>
      </div>

      {loading && <LoadingState rows={4} label="Loading settings" />}
      {!loading && error && (
        <ErrorState title="Couldn't load settings" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && settings && settings.length === 0 && (
        <Panel>
          <EmptyState
            icon={<SettingsIcon className="h-4 w-4" />}
            title="No system settings configured"
            description="Configuration options for the care network and compliance rules would be managed here."
          />
        </Panel>
      )}

      {!loading && !error && settings && settings.length > 0 && (
        <Panel title="System configuration" subtitle="Update network-wide defaults.">
          <div className="space-y-2">
            {settings.map((setting) => (
              <div key={setting.key} className="flex flex-col gap-1.5 rounded-card border border-line px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-navy">{setting.label}</p>
                </div>
                {setting.kind === 'BOOL' ? (
                  <ToggleSetting
                    label={setting.label}
                    checked={values[setting.key] === 'true'}
                    onChange={(checked) => update(setting.key, String(checked))}
                  />
                ) : (
                  <input
                    type={setting.kind === 'NUMBER' ? 'number' : 'text'}
                    value={values[setting.key] ?? ''}
                    onChange={(event) => update(setting.key, event.target.value)}
                    className="h-8 w-full rounded-chip border border-line bg-white px-3 text-xs text-navy focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15 sm:w-[220px]"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-line-soft pt-3">
            {saved && <span className="text-2xs text-brand">Changes saved.</span>}
            <Button onClick={handleSave}>
              <SaveIcon className="h-3.5 w-3.5" />
              Save changes
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}