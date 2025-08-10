
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import { database } from './config/database';
import routes from './routes';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initSocket } from './core/socket';

dotenv.config();

export const startServer = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api', routes);


  const server = http.createServer(app); 

  database.authenticate()
    .then(() => {
      console.log('DB connected');
      initSocket(server);      
      app.listen(3001,()=> console.log('server is running')
      )         
    })
    .catch(err => console.error('DB connection error', err));
};
