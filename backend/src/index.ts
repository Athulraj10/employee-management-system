import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { initializeSystem } from './scripts/initialize-system';

async function bootstrap() {
  try {
    // Initialize system (admin user, categories, etc.)
    await initializeSystem();

    const app = await createServer();

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 EMS/PMS API server running on port ${port}`);
      // eslint-disable-next-line no-console
      console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap server', err);
    process.exit(1);
  }
}

bootstrap();


