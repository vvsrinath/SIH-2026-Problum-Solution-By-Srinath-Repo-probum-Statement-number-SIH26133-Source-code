import { env } from './env';

/**
 * OpenAPI 3.0 specification. Module routers register their paths by mutating
 * `openapiSpec.paths`. No secrets are ever included.
 */
export const openapiSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'Swasthya Sathi Healthcare API',
    version: '1.0.0',
    description:
      'Production-structured backend for the SIH26133 healthcare platform. ' +
      'Designed to support alignment with applicable DPDP requirements. ' +
      'AI-assisted symptom assessment is not a definitive medical diagnosis.',
  },
  servers: [{ url: `http://localhost:${env.BACKEND_PORT}/api/v1` }],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  tags: [],
};
