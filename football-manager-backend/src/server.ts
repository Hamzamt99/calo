import express from 'express';
import dotenv from 'dotenv';
import { database } from './config/database';
import routes from './routes';
import bodyParser from 'body-parser';
import cors from 'cors';
dotenv.config();

export const startServer = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api', routes);

  const PORT = process.env.PORT || 5000;

  database.authenticate()
    .then(() => {
      console.log('DB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('DB connection error', err));
};