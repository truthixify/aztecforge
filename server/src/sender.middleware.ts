import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Ensures x-sender header always has a value.
 * Falls back to 'anonymous' if not provided.
 */
@Injectable()
export class SenderMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (!req.headers['x-sender']) {
      req.headers['x-sender'] = 'anonymous';
    }
    next();
  }
}
