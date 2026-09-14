import type { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

interface SchemaMap {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validate request parts against Zod schemas. Parsed (validated) values are
 * written back to the request so downstream handlers never trust raw input.
 */
export function validate(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      const details =
        err && typeof err === 'object' && 'issues' in err
          ? (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            }))
          : undefined;
      next(new ValidationError('Invalid request input', details));
    }
  };
}
