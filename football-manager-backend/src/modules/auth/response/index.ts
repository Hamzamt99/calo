// i created this file as a response formatter for the auth module
import { Response } from 'express';

export function sendResponse(res: Response, statusCode: number, message: string, data: any = null) {
  res.status(statusCode).json({ statusCode, message, data });
}