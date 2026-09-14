import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { Route, Routes } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PatientLayout } from '../layouts/PatientLayout';
import { DoctorLayout } from '../layouts/DoctorLayout';
import { SpecialistLayout } from '../layouts/SpecialistLayout';
import { WorkerLayout } from '../layouts/WorkerLayout';
import { PHCLayout } from '../layouts/PHCLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { LoadingState } from '../components/common/LoadingState';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const lazyPage = <T extends ComponentType = ComponentType>(
  loader: () => Promise<Record<string, ComponentType>>,
  name: string,
): LazyExoticComponent<T> =>
  lazy(() => loader().then((mod) => ({ default: mod[name] as ComponentType }))) as unknown as LazyExoticComponent<T>;

const Home = lazyPage(() => import('../pages/public/Home'), 'Home');
const About = lazyPage(() => import('../pages/public/About'), 'About');
const Services = lazyPage(() => import('../pages/public/Services'), 'Services');
const HowItWorks = lazyPage(() => import('../pages/public/HowItWorks'), 'HowItWorks');
const HealthInformation = lazyPage(() => import('../pages/public/HealthInformation'), 'HealthInformation');
const Contact = lazyPage(() => import('../pages/public/Contact'), 'Contact');
const NotFound = lazyPage(() => import('../pages/public/NotFound'), 'NotFound');
const Login = lazyPage(() => import('../pages/auth/Login'), 'Login');

const PatientDashboard = lazyPage(() => import('../pages/patient/PatientDashboard'), 'PatientDashboard');
const AskHealthWorker = lazyPage(() => import('../pages/patient/AskHealthWorker'), 'AskHealthWorker');
const FindHealthcare = lazyPage(() => import('../pages/patient/FindHealthcare'), 'FindHealthcare');
const PatientAppointments = lazyPage(() => import('../pages/patient/PatientAppointments'), 'PatientAppointments');
const HealthRecords = lazyPage(() => import('../pages/patient/HealthRecords'), 'HealthRecords');
const PatientReferrals = lazyPage(() => import('../pages/patient/PatientReferrals'), 'PatientReferrals');
const FollowUps = lazyPage(() => import('../pages/patient/FollowUps'), 'FollowUps');
const Medicines = lazyPage(() => import('../pages/patient/Medicines'), 'Medicines');
const ConsultOnline = lazyPage(() => import('../pages/patient/ConsultOnline'), 'ConsultOnline');
const SymptomChecker = lazyPage(() => import('../pages/patient/SymptomChecker'), 'SymptomChecker');
const HelpSupport = lazyPage(() => import('../pages/patient/HelpSupport'), 'HelpSupport');

const DoctorDashboard = lazyPage(() => import('../pages/doctor/DoctorDashboard'), 'DoctorDashboard');
const DoctorAppointments = lazyPage(() => import('../pages/doctor/DoctorAppointments'), 'DoctorAppointments');
const DoctorPatients = lazyPage(() => import('../pages/doctor/DoctorPatients'), 'DoctorPatients');
const PatientConsultation = lazyPage(() => import('../pages/doctor/PatientConsultation'), 'PatientConsultation');
const DoctorReferrals = lazyPage(() => import('../pages/doctor/DoctorReferrals'), 'DoctorReferrals');

const SpecialistDashboard = lazyPage(() => import('../pages/specialist/SpecialistDashboard'), 'SpecialistDashboard');
const SpecialistAppointments = lazyPage(() => import('../pages/specialist/SpecialistAppointments'), 'SpecialistAppointments');
const SpecialistPatients = lazyPage(() => import('../pages/specialist/SpecialistPatients'), 'SpecialistPatients');
const SpecialistReferrals = lazyPage(() => import('../pages/specialist/SpecialistReferrals'), 'SpecialistReferrals');

const MessagesPage = lazyPage(() => import('../pages/common/MessagesPage'), 'MessagesPage');
const ProfilePage = lazyPage(() => import('../pages/common/ProfilePage'), 'ProfilePage');
const PrescriptionsPage = lazyPage(() => import('../pages/common/PrescriptionsPage'), 'PrescriptionsPage');
const ReportsPage = lazyPage<ComponentType<{ emptyTitle?: string }>>(() => import('../pages/common/ReportsPage'), 'ReportsPage');
const NotificationsPage = lazyPage(() => import('../pages/common/NotificationsPage'), 'NotificationsPage');

const WorkerDashboard = lazyPage(() => import('../pages/worker/WorkerDashboard'), 'WorkerDashboard');
const WorkerPatients = lazyPage(() => import('../pages/worker/WorkerPatients'), 'WorkerPatients');
const WorkerTriage = lazyPage(() => import('../pages/worker/WorkerTriage'), 'WorkerTriage');
const WorkerReferrals = lazyPage(() => import('../pages/worker/WorkerReferrals'), 'WorkerReferrals');
const WorkerFollowups = lazyPage(() => import('../pages/worker/WorkerFollowups'), 'WorkerFollowups');

const PhcDashboard = lazyPage(() => import('../pages/phc/PhcDashboard'), 'PhcDashboard');
const PhcQueue = lazyPage(() => import('../pages/phc/PhcQueue'), 'PhcQueue');
const PhcPatients = lazyPage(() => import('../pages/phc/PhcPatients'), 'PhcPatients');
const PhcReferrals = lazyPage(() => import('../pages/phc/PhcReferrals'), 'PhcReferrals');
const PhcMedicines = lazyPage(() => import('../pages/phc/PhcMedicines'), 'PhcMedicines');
const PhcDiagnostics = lazyPage(() => import('../pages/phc/PhcDiagnostics'), 'PhcDiagnostics');

const AdminDashboard = lazyPage(() => import('../pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminAnalytics = lazyPage(() => import('../pages/admin/AdminAnalytics'), 'AdminAnalytics');
const AdminFacilities = lazyPage(() => import('../pages/admin/AdminFacilities'), 'AdminFacilities');
const AdminReferrals = lazyPage(() => import('../pages/admin/AdminReferrals'), 'AdminReferrals');
const AdminReports = lazyPage(() => import('../pages/admin/AdminReports'), 'AdminReports');
const AdminSettings = lazyPage(() => import('../pages/admin/AdminSettings'), 'AdminSettings');

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="px-4 py-6">
            <LoadingState rows={4} label="Loading page" />
          </div>
        }
      >
        <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/health-information" element={<HealthInformation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
        </Route>

        {/* Patient workspace */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="assistant" element={<AskHealthWorker />} />
          <Route path="symptom-checker" element={<SymptomChecker />} />
          <Route path="find-healthcare" element={<FindHealthcare />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records" element={<HealthRecords />} />
          <Route path="referrals" element={<PatientReferrals />} />
          <Route path="follow-up" element={<FollowUps />} />
          <Route path="medicines" element={<Medicines />} />
          <Route path="consult-online" element={<ConsultOnline />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* Doctor workspace */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<PatientConsultation />} />
          <Route path="referrals" element={<DoctorReferrals />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Specialist workspace */}
        <Route path="/specialist" element={<SpecialistLayout />}>
          <Route index element={<SpecialistDashboard />} />
          <Route path="appointments" element={<SpecialistAppointments />} />
          <Route path="patients" element={<SpecialistPatients />} />
          <Route path="referrals" element={<SpecialistReferrals />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="records" element={<ReportsPage emptyTitle="No shared records open" />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Health worker workspace */}
        <Route path="/worker" element={<WorkerLayout />}>
          <Route index element={<WorkerDashboard />} />
          <Route path="patients" element={<WorkerPatients />} />
          <Route path="triage" element={<WorkerTriage />} />
          <Route path="referrals" element={<WorkerReferrals />} />
          <Route path="followups" element={<WorkerFollowups />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* PHC workspace */}
        <Route path="/phc" element={<PHCLayout />}>
          <Route index element={<PhcDashboard />} />
          <Route path="queue" element={<PhcQueue />} />
          <Route path="patients" element={<PhcPatients />} />
          <Route path="referrals" element={<PhcReferrals />} />
          <Route path="medicines" element={<PhcMedicines />} />
          <Route path="diagnostics" element={<PhcDiagnostics />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin workspace */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="facilities" element={<AdminFacilities />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}