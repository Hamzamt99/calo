// src/modules/team/jobs/team-creation.job.ts
import { TeamService } from '../services';
import {SocketIO} from '../../../core/socket';

interface Payload {
  userId: number;
  teamName?: string;
}


export class TeamCreationJob {
  /**
   * Called by BullMQ worker
   */
  static async handle(payload: Payload): Promise<void> {
    const io = SocketIO.get()
    const { userId } = payload;

    console.info(`⏳  Drafting team for user ${userId}…`);

    try {
      await TeamService.createTeamAndAssignPlayers({ userId });
      console.info(`✅  Team created for user ${userId}`);
      io.to(`user-${userId}`).emit('team-ready', { message: 'done' });
    } catch (err) {
      console.error(`❌  Failed to create team for user ${userId}: ${(err as Error).message}`);
      /**
       * Throw so BullMQ marks the job as failed and (if configured)
       * retries according to back-off settings.
       */
      throw err;
    }
  }
}
