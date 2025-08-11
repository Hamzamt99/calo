import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { TeamCreationJob } from '../modules/team/jobs/TeamCreationJob';

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
   maxRetriesPerRequest: null,
});

export const teamQueue = new Queue('team-creation', { connection });

new Worker('team-creation', async job => {
  if (job.name === 'create-team') {
   await TeamCreationJob.handle({ userId: job.data.userId });
  }
}, { connection });