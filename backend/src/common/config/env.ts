export type AppEnv = 'dev' | 'prod' | 'test';

export interface AppConfig {
  env: AppEnv;
  APP_ENV: AppEnv;
  port: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  perfEncryptionKey?: string;
}

export function loadConfig(): AppConfig {
  const env = (process.env.APP_ENV as AppEnv) || 'dev';

  return {
    env,
    APP_ENV: env,
    port: process.env.PORT ? Number(process.env.PORT) : 4000,
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      name: process.env.DB_NAME || 'ems_pms',
    },
    perfEncryptionKey: process.env.PERF_ENC_KEY,
  };
}

export function getEnv(): AppConfig {
  return loadConfig();
}


