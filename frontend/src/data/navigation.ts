import {
  BellIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  FolderOpenIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  MessageSquareIcon,
  PillIcon,
  RepeatIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UsersIcon,
  VideoIcon } from
'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboardIcon;
  /** Rendered below a hairline divider, at the bottom of the sidebar. */
  footer?: boolean;
  end?: boolean;
}

const NAV_KEYS: Record<string, string> = {
  Home: 'home',
  'About Us': 'aboutUs',
  Services: 'services',
  'How It Works': 'howItWorks',
  'For Patients': 'forPatients',
  'For Health Workers': 'forHealthWorkers',
  'Health Tips': 'healthTips',
  'Contact Us': 'contactUs',
  Dashboard: 'dashboard',
  'Ask a Health Worker': 'askHealthWorker',
  'Symptom Checker': 'symptomChecker',
  'Find Services': 'findServices',
  Appointments: 'appointments',
  'Consult Online': 'consultOnline',
  Referrals: 'referrals',
  'Health Records': 'healthRecords',
  'Follow-ups': 'followUps',
  Messages: 'messages',
  Notifications: 'notifications',
  'Profile Settings': 'profileSettings',
  'Help & Support': 'helpSupport',
  Logout: 'logout',
  Patients: 'patients',
  Prescriptions: 'prescriptions',
  Triage: 'triage',
  Queue: 'queue',
  Records: 'records',
  Medicines: 'medicines',
  Diagnostics: 'diagnostics',
  Analytics: 'analytics',
  Facilities: 'facilities',
  Reports: 'reports',
  Settings: 'settings',
  Profile: 'profile'
};

/** Resolves an English nav label to its i18n key under the `nav.` namespace. */
export function navLabel(label: string): string {
  return NAV_KEYS[label] ?? label;
}

export const publicNav = [
{ label: 'Home', to: '/' },
{ label: 'How It Works', to: '/how-it-works' },
{ label: 'Services', to: '/services' },
{ label: 'For Patients', to: '/patient' },
{ label: 'For Health Workers', to: '/worker' },
{ label: 'About', to: '/about' },
{ label: 'Contact', to: '/contact' }];


export const patientNav: NavItem[] = [
{ label: 'Dashboard', to: '/patient', icon: LayoutDashboardIcon, end: true },
{ label: 'Ask a Health Worker', to: '/patient/assistant', icon: StethoscopeIcon },
  { label: 'Symptom Checker', to: '/patient/symptom-checker', icon: ClipboardCheckIcon },
  { label: 'Find Services', to: '/patient/find-healthcare', icon: MapPinIcon },
{ label: 'Appointments', to: '/patient/appointments', icon: CalendarDaysIcon },
{ label: 'Consult Online', to: '/patient/consult-online', icon: VideoIcon },
{ label: 'Referrals', to: '/patient/referrals', icon: RepeatIcon },
{ label: 'Health Records', to: '/patient/records', icon: FolderOpenIcon },
{ label: 'Follow-ups', to: '/patient/follow-up', icon: HeartPulseIcon },
{ label: 'Messages', to: '/patient/messages', icon: MessageSquareIcon },
{ label: 'Notifications', to: '/patient/notifications', icon: BellIcon },
{ label: 'Profile Settings', to: '/patient/profile', icon: SettingsIcon },
{ label: 'Help & Support', to: '/patient/help', icon: HelpCircleIcon },
{ label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];


export const doctorNav: NavItem[] = [
{ label: 'Dashboard', to: '/doctor', icon: LayoutDashboardIcon, end: true },
{ label: 'Appointments', to: '/doctor/appointments', icon: CalendarDaysIcon },
{ label: 'Patients', to: '/doctor/patients', icon: UsersIcon },
{ label: 'Referrals', to: '/doctor/referrals', icon: RepeatIcon },
{ label: 'Prescriptions', to: '/doctor/prescriptions', icon: PillIcon },
{ label: 'Reports', to: '/doctor/reports', icon: FileTextIcon },
{ label: 'Messages', to: '/doctor/messages', icon: MessageSquareIcon },
{ label: 'Notifications', to: '/doctor/notifications', icon: BellIcon },
{ label: 'Profile Settings', to: '/doctor/profile', icon: SettingsIcon },
{ label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];


export const specialistNav: NavItem[] = [
{ label: 'Dashboard', to: '/specialist', icon: LayoutDashboardIcon, end: true },
{ label: 'Appointments', to: '/specialist/appointments', icon: CalendarDaysIcon },
{ label: 'Patients', to: '/specialist/patients', icon: UsersIcon },
{ label: 'Referrals', to: '/specialist/referrals', icon: RepeatIcon },
{ label: 'Prescriptions', to: '/specialist/prescriptions', icon: PillIcon },
{ label: 'Records', to: '/specialist/records', icon: ClipboardListIcon },
{ label: 'Messages', to: '/specialist/messages', icon: MessageSquareIcon },
{ label: 'Notifications', to: '/specialist/notifications', icon: BellIcon },
{ label: 'Profile Settings', to: '/specialist/profile', icon: SettingsIcon },
{ label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];

export const workerNav: NavItem[] = [
  { label: 'Home', to: '/worker', icon: LayoutDashboardIcon, end: true },
  { label: 'Patients', to: '/worker/patients', icon: UsersIcon },
  { label: 'Triage', to: '/worker/triage', icon: StethoscopeIcon },
  { label: 'Referrals', to: '/worker/referrals', icon: RepeatIcon },
  { label: 'Follow-ups', to: '/worker/followups', icon: HeartPulseIcon },
  { label: 'Messages', to: '/worker/messages', icon: MessageSquareIcon },
  { label: 'Notifications', to: '/worker/notifications', icon: BellIcon },
  { label: 'Profile', to: '/worker/profile', icon: SettingsIcon },
  { label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];

export const phcNav: NavItem[] = [
  { label: 'Dashboard', to: '/phc', icon: LayoutDashboardIcon, end: true },
  { label: 'Queue', to: '/phc/queue', icon: UsersIcon },
  { label: 'Patients', to: '/phc/patients', icon: FolderOpenIcon },
  { label: 'Referrals', to: '/phc/referrals', icon: RepeatIcon },
  { label: 'Medicines', to: '/phc/medicines', icon: PillIcon },
  { label: 'Diagnostics', to: '/phc/diagnostics', icon: FileTextIcon },
  { label: 'Messages', to: '/phc/messages', icon: MessageSquareIcon },
  { label: 'Notifications', to: '/phc/notifications', icon: BellIcon },
  { label: 'Profile', to: '/phc/profile', icon: SettingsIcon },
  { label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboardIcon, end: true },
  { label: 'Analytics', to: '/admin/analytics', icon: ShieldCheckIcon },
  { label: 'Facilities', to: '/admin/facilities', icon: MapPinIcon },
  { label: 'Referrals', to: '/admin/referrals', icon: RepeatIcon },
  { label: 'Reports', to: '/admin/reports', icon: FileTextIcon },
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
  { label: 'Messages', to: '/admin/messages', icon: MessageSquareIcon },
  { label: 'Notifications', to: '/admin/notifications', icon: BellIcon },
  { label: 'Profile', to: '/admin/profile', icon: SettingsIcon },
  { label: 'Logout', to: '/login', icon: LogOutIcon, footer: true }];