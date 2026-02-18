import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource, initializeDatabase } from '../infrastructure/database/data-source';
import { EmployeeCategory, CategoryType } from '../modules/ems/entities';

async function seedCategories() {
  try {
    await initializeDatabase();
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

    for (const categoryName of categories) {
      const existing = await categoryRepo.findOne({ where: { name: categoryName } });
      if (!existing) {
        const category = categoryRepo.create({
          name: categoryName,
          active: true,
        });
        await categoryRepo.save(category);
        console.log(`✓ Created category: ${categoryName}`);
      } else {
        console.log(`- Category already exists: ${categoryName}`);
      }
    }

    console.log('\n✅ Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();

