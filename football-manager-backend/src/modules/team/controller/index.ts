import { Router, Request, Response } from 'express';
import { TeamService } from '../services';
import { sendResponse } from '../response'; 
import { formatTeamResponse } from '../response';
import { AuthenticatedRequest } from '../../../types';

export class TeamController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getTeam);
  }

  private getTeam = async (req: Request, res: Response) => {
    try {
      const request = req as AuthenticatedRequest;
      const userId = request.member_id as AuthenticatedRequest['member_id'];
      const { team, players } = await TeamService.getTeamWithPlayers(userId?? 0);
      const formatted = formatTeamResponse(team, players);
      sendResponse(res, 200, 'Team fetched successfully', formatted);
    } catch (err) {
      sendResponse(res, 500, (err as Error).message);
    }
  };

  public getRouter(): Router {
    return this.router;
  }
}
