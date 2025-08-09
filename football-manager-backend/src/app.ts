import { setupCluster } from './core/cluster';
import { startServer } from './server';

setupCluster(startServer);