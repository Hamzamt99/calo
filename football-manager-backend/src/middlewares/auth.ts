import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validateToken } from '../helpers';
import { SignedRequest, AuthenticatedRequest } from '../types';

export class AuthMiddleware {
  public loggedIn: RequestHandler = (req, res, next) => {
    const token = req.header('authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not Authorized' });
    }

    const result = validateToken(token);

    if (!result.is_valid || !result.id) {
      return res.status(401).json({ error: 'Not Authorized' });
    }

    const typedReq = req as AuthenticatedRequest;
    typedReq.is_logged_in = true;
    typedReq.member_id = result.id;
    typedReq.access_token = token;

    next();
  };

  public validToken: RequestHandler = (req, res, next) => {
    const token = req.header('authorization')?.replace('Bearer ', '');

    const result = validateToken(token || '');

    if (!token || !result.is_valid || !result.id) {
      return res.status(401).json({ error: 'Not Authorized' });
    }

    const typedReq = req as SignedRequest;
    typedReq.is_logged_in = true;
    typedReq.member_id = result.id;
    typedReq.access_token = token;

    next();
  };
}
