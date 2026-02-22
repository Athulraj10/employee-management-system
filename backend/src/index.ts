import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { initializeSystem } from './scripts/initialize-system';

async function bootstrap() {
  try {
    await initializeSystem();
    const app = await createServer();

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    app.listen(port, () => {
      console.log(`🚀 EMS/PMS API server running on port ${port}`);
      console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
    });
  } catch (err) {
    console.error('Failed to bootstrap server', err);
    process.exit(1);
  }
}

bootstrap();


