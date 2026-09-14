import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getWorkerOverview,
  getWorkerPatients,
  getWorkerTriage,
  getWorkerReferrals,
  getWorkerFollowUps,
  getPhcOverview,
  getPhcQueue,
  getPhcPatients,
  getPhcReferrals,
  getPhcMedicines,
  getPhcDiagnostics,
  getAdminOverview,
  getAdminAnalytics,
  getAdminFacilities,
  getAdminReferralCases,
  getAdminReports,
  getAdminSettings,
  listConversations,
  getThread,
  sendMessage,
  listPrescriptions,
  listReports,
  listConsultations,
} from './workspace.controller';

const router = Router();

router.use(requireAuth);

const worker = Router();
worker.use(requireRole('HEALTH_WORKER'));
worker.get('/overview', asyncHandler(getWorkerOverview));
worker.get('/patients', asyncHandler(getWorkerPatients));
worker.get('/triage', asyncHandler(getWorkerTriage));
worker.get('/referrals', asyncHandler(getWorkerReferrals));
worker.get('/followups', asyncHandler(getWorkerFollowUps));
router.use('/worker', worker);

const phc = Router();
phc.get('/overview', asyncHandler(getPhcOverview));
phc.get('/queue', asyncHandler(getPhcQueue));
phc.get('/patients', asyncHandler(getPhcPatients));
phc.get('/referrals', asyncHandler(getPhcReferrals));
phc.get('/medicines', asyncHandler(getPhcMedicines));
phc.get('/diagnostics', asyncHandler(getPhcDiagnostics));
router.use('/phc', phc);

const admin = Router();
admin.use(requireRole('ADMIN'));
admin.get('/overview', asyncHandler(getAdminOverview));
admin.get('/analytics', asyncHandler(getAdminAnalytics));
admin.get('/facilities', asyncHandler(getAdminFacilities));
admin.get('/referrals', asyncHandler(getAdminReferralCases));
admin.get('/reports', asyncHandler(getAdminReports));
admin.get('/settings', asyncHandler(getAdminSettings));
router.use('/admin', admin);

const messages = Router();
messages.get('/conversations', asyncHandler(listConversations));
messages.get('/conversations/:id', asyncHandler(getThread));
messages.post('/conversations/:id', asyncHandler(sendMessage));
router.use('/messages', messages);

router.get('/prescriptions', asyncHandler(listPrescriptions));
router.get('/reports', asyncHandler(listReports));
router.get('/consultations', asyncHandler(listConsultations));

export default router;