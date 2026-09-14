import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import {
  fetchAppointments,
  fetchDoctors,
  fetchReferrals,
  fetchNotifications,
  assessTriage,
  getSelf,
  fetchNearbyHospitals,
} from './services';

// The backend is not running in the test env, so every request hits the
// network-error path and should transparently fall back to mock data.
describe('service-level offline fallbacks (no backend running)', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('fetchDoctors returns the mock directory', async () => {
    const page = await fetchDoctors({ limit: 50 });
    expect(page.doctors.length).toBeGreaterThan(0);
    expect(page.doctors[0].doctorId).toBeTruthy();
    expect(page.pagination.total).toBe(page.doctors.length);
  });

  it('fetchAppointments returns mock appointments', async () => {
    const page = await fetchAppointments({ limit: 50 });
    expect(page.appointments.length).toBeGreaterThan(0);
    expect(page.appointments[0].appointmentId).toMatch(/^mock-appt/);
  });

  it('fetchReferrals returns mock referrals', async () => {
    const refs = await fetchReferrals();
    expect(refs.length).toBeGreaterThan(0);
  });

  it('fetchNotifications returns mock notifications with unread counts', async () => {
    const page = await fetchNotifications();
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.unread).toBeGreaterThan(0);
  });

  it('getSelf returns the mock patient profile', async () => {
    const self = await getSelf();
    expect(self.profile?.displayName).toBe('Ramesh Kumar');
  });

  it('fetchNearbyHospitals returns mock nearby care', async () => {
    const result = await fetchNearbyHospitals({ lat: 25.59, lng: 85.13 });
    expect(result.available).toBe(true);
    expect(result.hospitals.length).toBeGreaterThan(0);
  });

  it('assessTriage still diagnoses symptoms offline', async () => {
    const result = await assessTriage({ symptoms: 'chest pain and difficulty breathing' });
    expect(result.riskLevel).toBe('URGENT');
    expect(result.source).toBe('MANUAL_FALLBACK');
  });
});