import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource, initializeDatabase } from '../infrastructure/database/data-source';
import { User, UserRole } from '../modules/auth/entities/User.entity';
import { EmployeeCategory, CategoryType } from '../modules/ems/entities';
import { AuthService } from '../modules/auth/services/AuthService';

async function initializeSystem() {
  try {
    console.log('🚀 Initializing system...');
    
    await initializeDatabase();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const authService = new AuthService();

    const adminUsername = process.env.ADMIN_USERNAME || 'Admingnx';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gnx.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await userRepo.findOne({
      where: [
        { username: adminUsername },
        { email: adminEmail },
      ],
    });

    if (!existingAdmin) {
      try {
        await authService.register({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          role: UserRole.ADMIN,
        });
        console.log(`✅ Admin user created: ${adminUsername}`);
      } catch (error: any) {
        console.log(`⚠️  Admin user creation: ${error.message}`);
      }
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminUsername}`);
    }

    const categoryRepo = AppDataSource.getRepository(EmployeeCategory);
    const categories = [
      CategoryType.FRONTEND,
      CategoryType.BACKEND,
      CategoryType.FULL_STACK,
      CategoryType.MOBILE,
      CategoryType.DEVOPS,
      CategoryType.QA,
      CategoryType.DATA_AI,
    ];

    let categoriesCreated = 0;
    for (const categoryName of categories) {
      const existing = await categoryRepo.findOne({ where: { name: categoryName } });
      if (!existing) {
        const category = categoryRepo.create({
          name: categoryName,
          active: true,
        });
        await categoryRepo.save(category);
        categoriesCreated++;
      }
    }

    if (categoriesCreated > 0) {
      console.log(`✅ Created ${categoriesCreated} categories`);
    } else {
      console.log('ℹ️  All categories already exist');
    }

    console.log('✅ System initialization complete!');
    return true;
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    throw error;
  }
}

if (require.main === module) {
  initializeSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { initializeSystem };

