import { Router } from 'express';
import { AuthController } from '../modules/auth/controller';
import { AuthMiddleware } from '../middlewares/auth';
import { TeamController } from '../modules/team/controller';
import { MarketController } from '../modules/market/controller';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();
const teamController = new TeamController();
const marketController = new MarketController();
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

router.use('/auth', authController.getRouter());

router.use('/team', authMiddleware.loggedIn, teamController.getRouter());

router.use('/market', authMiddleware.loggedIn, marketController.getRouter());

export default router;