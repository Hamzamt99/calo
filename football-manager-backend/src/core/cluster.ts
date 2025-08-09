import cluster from 'cluster';
import { availableParallelism } from 'os';

export const setupCluster = (startServer: () => void) => {
  if (cluster.isPrimary) {
    const cores = availableParallelism()
    console.log(`Primary ${process.pid} running, forking ${cores} workers.`);
    for (let i = 0; i < 1; i++) cluster.fork();
    cluster.on('exit', worker => {
      console.log(`Worker ${worker.process.pid} died, forking a new one.`);
      cluster.fork();
    });
  } else {
    startServer();
  }
};