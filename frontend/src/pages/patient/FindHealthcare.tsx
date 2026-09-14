import { useMemo, useReducer, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheckIcon,
  Building2Icon,
  MapPinIcon,
  StethoscopeIcon,
} from 'lucide-react';
import { SearchBar } from '../../components/common/SearchBar';
import { Dropdown } from '../../components/common/Dropdown';
import { LocationBadge } from '../../components/common/LocationBadge';
import { HealthcareMap, type MapMarker } from '../../components/maps/HealthcareMap';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { cn } from '../../utils/cn';
import { fetchDoctors, fetchNearbyHospitals } from '../../api/services';
import { useAsync } from '../../hooks/useAsync';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { DoctorPublic, NearbyHospital, NearbyHospitalsResult } from '../../types';

const SPECIALIZATIONS = [
  'General Physician',
  'Family Medicine',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Orthopedist',
  'Neurologist',
  'ENT',
  'Ophthalmologist',
  'Psychiatrist',
];

const PATNA: [number, number] = [25.5941, 85.1376];

type Tab = 'doctors' | 'nearby';

function DoctorCard({ doctor }: { doctor: DoctorPublic }) {
  const fee =
    doctor.consultationFee != null
      ? `₹${doctor.consultationFee.toLocaleString('en-IN')}`
      : 'Fee on request';
  const exp = doctor.experienceYears != null ? `${doctor.experienceYears} yrs` : '—';

  return (
    <div className="rounded-card border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-brand-tint text-brand">
            <StethoscopeIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-xs font-semibold text-navy">
              {doctor.displayName}
              {doctor.verified && (
                <BadgeCheckIcon
                  className="h-3.5 w-3.5 shrink-0 text-brand"
                  aria-label="Verified"
                />
              )}
            </p>
            <p className="truncate text-2xs text-ink-500">
              {doctor.specialization ?? 'General'}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-[4px] bg-line-soft px-1.5 py-0.5 text-2xs font-medium text-navy">
          {fee}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-500">
        {doctor.facilityName && (
          <span className="inline-flex items-center gap-1">
            <Building2Icon className="h-3 w-3 text-ink-400" />
            {doctor.facilityName}
          </span>
        )}
        <span>{exp}</span>
      </div>

      {doctor.languages.length > 0 && (
        <p className="mt-1.5 text-2xs text-ink-400">{doctor.languages.join(' · ')}</p>
      )}

      <Link
        to="/patient/appointments"
        state={{ doctorId: doctor.doctorId, doctorName: doctor.displayName }}
        className="mt-3 inline-flex h-8 items-center justify-center rounded-chip bg-brand px-3 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Appointment
      </Link>
    </div>
  );
}

function NearbyCard({
  hospital,
  index,
  active,
  onSelect,
}: {
  hospital: NearbyHospital;
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
}) {
  const distance =
    hospital.distanceMeters != null
      ? `${(hospital.distanceMeters / 1000).toFixed(1)} km`
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={active}
      className={cn(
        'flex w-full items-start gap-3 rounded-card border bg-white p-3 text-left transition-colors duration-150 ease-out hover:border-brand/30 hover:bg-brand-tint2',
        active ? 'border-brand/40 bg-brand-tint2' : 'border-line',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-info-tint text-info">
        <MapPinIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-navy">
          {hospital.name}
        </span>
        <span className="mt-0.5 block truncate text-2xs text-ink-500">
          {hospital.address}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-ink-400">
          <span className="capitalize">{hospital.type}</span>
          {distance && <span>· {distance}</span>}
          <span>· {hospital.source}</span>
        </span>
      </span>
    </button>
  );
}

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'doctors', label: 'Find a doctor', icon: <StethoscopeIcon className="h-3.5 w-3.5" /> },
    { key: 'nearby', label: 'Find nearby care', icon: <MapPinIcon className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-pressed={tab === t.key}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out',
            tab === t.key
              ? 'border-brand/40 bg-brand-tint text-brand'
              : 'border-line text-ink-500 hover:text-navy',
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function DoctorsTab({
  loading,
  error,
  doctors,
  total,
  onRetry,
}: {
  loading: boolean;
  error: Error | null;
  doctors: DoctorPublic[];
  total: number;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-2xs font-medium text-ink-500">
          {total} {total === 1 ? 'doctor' : 'doctors'}
        </p>
      </div>

      {loading ? (
        <LoadingState rows={4} label="Loading doctors" />
      ) : error ? (
        <ErrorState
          title="Couldn't load doctors"
          detail="We couldn't reach the doctor directory. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="Try a different search term or specialization, or clear your filters."
        />
      ) : (
        <div className="ss-scroll grid max-h-[620px] gap-2 overflow-y-auto pr-1 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.doctorId} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}

function NearbyTab({
  geoStatus,
  loading,
  error,
  result,
  markers,
  center,
  selectedIdx,
  hospitals,
  onRetry,
  onSelectHospital,
}: {
  geoStatus: string;
  loading: boolean;
  error: Error | null;
  result: NearbyHospitalsResult | null;
  markers: MapMarker[];
  center: [number, number];
  selectedIdx: number;
  hospitals: NearbyHospital[];
  onRetry: () => void;
  onSelectHospital: (id: number) => void;
}) {
  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <EmptyState
        icon={<MapPinIcon className="h-4 w-4" />}
        title="Location access required"
        description="Enable live location above to search for hospitals and clinics near you."
      />
    );
  }

  if (geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'error') {
    return (
      <EmptyState
        icon={<MapPinIcon className="h-4 w-4" />}
        title="Location access required"
        description="We couldn't determine your location. Allow location access in your browser to find nearby care."
      />
    );
  }

  if (loading) {
    return <LoadingState rows={4} label="Searching nearby care" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't search nearby care"
        detail="The nearby care service is unavailable right now. Try again in a moment."
        onRetry={onRetry}
      />
    );
  }

  if (!result || result.available === false || result.hospitals.length === 0) {
    return (
      <EmptyState
        icon={<MapPinIcon className="h-4 w-4" />}
        title="Unavailable in this environment"
        description="Nearby care uses the Mappls & Bhuvan India map integration, which isn't active here. No hospital data is available in this environment."
      />
    );
  }

  const activeMarker = markers[selectedIdx];

  return (
    <div className="grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-2xs font-medium text-ink-500">
            {result.hospitals.length}{' '}
            {result.hospitals.length === 1 ? 'place' : 'places'} of care
          </p>
        </div>
        <div className="ss-scroll max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {hospitals.map((hospital, i) => (
            <NearbyCard
              key={`${hospital.name}-${hospital.address}-${i}`}
              hospital={hospital}
              index={i}
              active={selectedIdx === i}
              onSelect={onSelectHospital}
            />
          ))}
        </div>
        <p className="px-1 text-2xs leading-4 text-ink-400">
          Nearby care is provided by the Mappls &amp; Bhuvan India map integration. Results
          reflect live provider availability; the integration may be inactive in some
          environments.
        </p>
      </div>

      <div className="space-y-2">
        <HealthcareMap
          className="h-[520px]"
          center={activeMarker?.position ?? center}
          zoom={activeMarker ? 14 : 12}
          activeId={activeMarker?.id}
          markers={markers}
          ariaLabel="Nearby care facilities map"
        />
        <p className="px-1 text-2xs text-ink-400">
          Map data © OpenStreetMap contributors. Hospital locations courtesy of Mappls / Bhuvan.
        </p>
      </div>
    </div>
  );
}

export function FindHealthcare() {
  const [tab, setTab] = useState<Tab>('doctors');
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [selectedNearby, setSelectedNearby] = useState<number | null>(null);
  const [nearbyTicker, bumpNearby] = useReducer((x: number) => x + 1, 0);

  const geo = useGeolocation();
  const locationReady = geo.status === 'granted' && geo.coords != null;

  const doctorsQ = useAsync(
    () =>
      fetchDoctors({
        specialization: specialization === 'All' ? undefined : specialization,
        limit: 50,
      }),
    [specialization],
  );

  const nearbyQ = useAsync(
    () =>
      locationReady && geo.coords
        ? fetchNearbyHospitals({
            lat: geo.coords.latitude,
            lng: geo.coords.longitude,
            radiusKm: 10,
          })
        : Promise.resolve(null),
    [locationReady, geo.coords?.latitude, geo.coords?.longitude, nearbyTicker],
  );

  const filteredDoctors = useMemo(() => {
    const doctors = doctorsQ.data?.doctors ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        d.displayName.toLowerCase().includes(term) ||
        d.specialization?.toLowerCase().includes(term) ||
        d.facilityName?.toLowerCase().includes(term),
    );
  }, [doctorsQ.data, query]);

  const hospitals: NearbyHospital[] = nearbyQ.data?.hospitals ?? [];

  const markers: MapMarker[] = useMemo(
    () =>
      hospitals
        .filter((h) => h.point)
        .map((h, i) => ({
          id: String(i),
          name: h.name,
          position: [h.point!.lat, h.point!.lng] as [number, number],
          meta: `${h.type}${
            h.distanceMeters != null ? ` · ${(h.distanceMeters / 1000).toFixed(1)} km` : ''
          }`,
          tone: 'info' as const,
        })),
    [hospitals],
  );

  const center: [number, number] =
    geo.coords != null ? [geo.coords.latitude, geo.coords.longitude] : PATNA;

  const selectedIdx = markers.findIndex((m) => m.id === String(selectedNearby));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-white px-3 py-2.5">
        <TabSwitcher tab={tab} onChange={setTab} />
      </div>

      {tab === 'doctors' && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-white px-3 py-2.5">
          <SearchBar
            className="min-w-0 flex-1"
            value={query}
            onChange={setQuery}
            placeholder="Search doctor, specialization, facility..."
            ariaLabel="Search doctors"
          />
          <Dropdown
            className="w-[200px]"
            ariaLabel="Specialization"
            icon={<StethoscopeIcon className="h-3.5 w-3.5 text-ink-400" />}
            value={specialization}
            onChange={setSpecialization}
            options={[
              { value: 'All', label: 'All specializations' },
              ...SPECIALIZATIONS.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      )}

      <div className="rounded-card border border-line bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LocationBadge />
          {tab === 'nearby' && locationReady && (
            <button
              type="button"
              onClick={bumpNearby}
              className="shrink-0 rounded-chip border border-line px-2.5 py-1 text-2xs font-medium text-ink-500 hover:border-brand/30 hover:text-brand"
            >
              {nearbyQ.loading ? 'Searching…' : 'Search near me'}
            </button>
          )}
        </div>
      </div>

      {tab === 'doctors' ? (
        <DoctorsTab
          loading={doctorsQ.loading}
          error={doctorsQ.error}
          doctors={filteredDoctors}
          total={filteredDoctors.length}
          onRetry={doctorsQ.reload}
        />
      ) : (
        <NearbyTab
          geoStatus={geo.status}
          loading={nearbyQ.loading}
          error={nearbyQ.error}
          result={nearbyQ.data}
          markers={markers}
          center={center}
          selectedIdx={selectedIdx}
          hospitals={hospitals}
          onRetry={nearbyQ.reload}
          onSelectHospital={setSelectedNearby}
        />
      )}
    </div>
  );
}
