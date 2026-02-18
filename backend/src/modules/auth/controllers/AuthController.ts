import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response) {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);
      res.json({
        token: result.token,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
        },
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      const decoded = await this.authService.verifyToken(token);
      res.json({ valid: true, user: decoded });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}

