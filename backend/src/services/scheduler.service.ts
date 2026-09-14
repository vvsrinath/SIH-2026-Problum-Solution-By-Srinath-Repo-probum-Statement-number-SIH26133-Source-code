/**
 * Scheduled Jobs — Swasthya Sathi (SIH26133)
 *
 * Runs periodic maintenance tasks:
 *   - Data retention enforcement (daily)
 *   - Consent expiry check (daily)
 *   - Key expiry enforcement (daily)
 *
 * In production, use a proper job scheduler (node-cron, bull, etc.).
 * For demo/hackathon, these run on server startup with a 24-hour interval.
 */

import { enforceAllRetention } from './retention.service';
import { enforceConsentExpiry } from '../modules/consent/consent.service';
import { enforceKeyExpiry } from './keyManagement.service';
import logger from '../config/logger';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let intervalIds: NodeJS.Timeout[] = [];

/**
 * Start all scheduled jobs.
 */
export function startScheduledJobs(): void {
  logger.info('Starting scheduled jobs');

  // Data retention enforcement — every 24 hours
  const retentionJob = setInterval(async () => {
    try {
      const result = await enforceAllRetention();
      if (result.totalDeleted > 0) {
        logger.info({ totalDeleted: result.totalDeleted }, 'retention enforcement complete');
      }
    } catch (err) {
      logger.error({ err }, 'retention enforcement failed');
    }
  }, ONE_DAY_MS);

  // Consent expiry — every 24 hours
  const consentJob = setInterval(async () => {
    try {
      const expired = await enforceConsentExpiry();
      if (expired > 0) {
        logger.info({ expired }, 'consent expiry enforcement complete');
      }
    } catch (err) {
      logger.error({ err }, 'consent expiry enforcement failed');
    }
  }, ONE_DAY_MS);

  // Key expiry — every 24 hours
  const keyJob = setInterval(async () => {
    try {
      const expired = await enforceKeyExpiry();
      if (expired > 0) {
        logger.info({ expired }, 'key expiry enforcement complete');
      }
    } catch (err) {
      logger.error({ err }, 'key expiry enforcement failed');
    }
  }, ONE_DAY_MS);

  intervalIds = [retentionJob, consentJob, keyJob];
  logger.info('Scheduled jobs started (retention, consent expiry, key expiry)');
}

/**
 * Stop all scheduled jobs.
 */
export function stopScheduledJobs(): void {
  for (const id of intervalIds) clearInterval(id);
  intervalIds = [];
  logger.info('Scheduled jobs stopped');
}
