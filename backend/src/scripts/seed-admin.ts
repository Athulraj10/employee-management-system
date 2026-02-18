import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource, initializeDatabase } from '../infrastructure/database/data-source';
import { User, UserRole } from '../modules/auth/entities/User.entity';
import { AuthService } from '../modules/auth/services/AuthService';

async function seedAdmin() {
  try {
    await initializeDatabase();
    const authService = new AuthService();

    const adminData = {
      username: process.env.ADMIN_USERNAME || 'Admingnx',
      email: process.env.ADMIN_EMAIL || 'admin@gnx.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: UserRole.ADMIN,
    };

    try {
      const user = await authService.register(adminData);
      console.log(`✅ Admin user created successfully!`);
      console.log(`   Username: ${adminData.username}`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();

