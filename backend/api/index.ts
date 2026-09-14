/**
 * Vercel serverless entry point for the entire Express application.
 *
 * `backend/vercel.json` rewrites every path to this function, so the same
 * Express app that runs locally (or under Docker) serves /health, /ready,
 * /api/v1/* and the / lobby. Deps are kept out of the bundle by Vercel's
 * Node runtime, which resolves them from node_modules at deploy time.
 */
import { createServerlessApp } from '../src/app';

const app = createServerlessApp();

export default app;