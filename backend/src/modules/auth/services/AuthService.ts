import { AppDataSource } from '../../../infrastructure/database/data-source';
import { User, UserRole } from '../entities/User.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async register(data: {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
    employeeId?: string;
  }): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });

    if (existing) {
      throw new Error('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role || UserRole.ADMIN,
      employeeId: data.employeeId || null,
      active: true,
    });

    return this.userRepo.save(user);
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepo.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user || !user.active) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    const token = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}

