// src/modules/auth/controller.ts
import { Router, Request, Response } from 'express';
import { AuthService } from '../services';
import { sendResponse } from '../response';


export class AuthController {
  private authService: AuthService;
  private router: Router;

  constructor() {
    this.authService = new AuthService();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', this.auth);
  }

  private auth = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const data = await this.authService.registerOrLogin(dto);
      sendResponse(res, 200, 'OK', data);
    } catch (err) {
      sendResponse(res, 400, (err as Error).message);
    }
  };

  public getRouter(): Router {
    return this.router;
  }
}
