import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { json } from 'body-parser';

import { registerEmsRoutes } from './modules/ems/ems.routes';
import { registerPmsRoutes } from './modules/pms/pms.routes';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerAttendanceRoutes } from './modules/attendance/attendance.routes';
import { registerTicketRoutes } from './modules/tickets/tickets.routes';
import { errorHandler } from './common/middleware/error-handler';
import { buildSwaggerSpec } from './swagger';
import { initializeDatabase } from './infrastructure/database/data-source';

export async function createServer() {
  await initializeDatabase();

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const swaggerSpec = buildSwaggerSpec();
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/auth', registerAuthRoutes());
  app.use('/api/ems', registerEmsRoutes());
  app.use('/api/pms', registerPmsRoutes());
  app.use('/api/attendance', registerAttendanceRoutes());
  app.use('/api/tickets', registerTicketRoutes());

  app.use(errorHandler);

  return app;
}


