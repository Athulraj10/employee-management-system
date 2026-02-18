import { Router } from 'express';
import { AuthController } from './controllers/AuthController';

export function registerAuthRoutes() {
  const router = Router();
  const authController = new AuthController();

  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.get('/verify', (req, res) => authController.verify(req, res));

  return router;
}

