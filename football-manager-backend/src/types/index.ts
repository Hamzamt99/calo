// ../types/index.ts
import { Request } from "express";

/** Common auth props we attach to requests */
export interface AuthProps {
  /** Set by middlewares to indicate login state */
  is_logged_in: boolean;
  /** User id extracted from the token (if available) */
  member_id?: number;
  /** Raw bearer token (if provided) */
  access_token?: string;
}

/** Used by routes that require a valid/active session */
export type AuthenticatedRequest = Request & AuthProps;

/** Used by routes that only need a valid token (may be logged out) */
export type SignedRequest = Request & AuthProps;
