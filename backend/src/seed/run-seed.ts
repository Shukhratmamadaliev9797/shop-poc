import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { seedPosUsers } from 'src/database/seeds/seed-pos-users';

const envPath = resolve(__dirname, '../../.env');
loadEnv({ path: envPath, override: true });

type RequiredDbEnv = {
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
};

function getRequiredDbEnv(): RequiredDbEnv {
  const requiredKeys = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ] as const;

  const missing = requiredKeys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Seed configuration error. Missing required env vars: ${missing.join(', ')}`,
    );
  }

  return {
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: process.env.DB_PORT!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
  };
}

let dataSource: DataSource | null = null;

async function run() {
  const shouldReseed = process.argv.includes('--reseed');
  const dbEnv = getRequiredDbEnv();

  if (process.env.APP_ENV !== 'production') {
    console.log('[seed] Database connection config', {
      DB_HOST: dbEnv.DB_HOST,
      DB_PORT: dbEnv.DB_PORT,
      DB_USER: dbEnv.DB_USER,
      DB_NAME: dbEnv.DB_NAME,
    });
  }

  dataSource = new DataSource({
    type: 'postgres',
    host: dbEnv.DB_HOST,
    port: Number(dbEnv.DB_PORT),
    username: dbEnv.DB_USER,
    password: dbEnv.DB_PASSWORD,
    database: dbEnv.DB_NAME,
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  if (shouldReseed) {
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  }

  const count = await seedPosUsers(dataSource);
  await dataSource.destroy();

  const mode = shouldReseed ? 'reseeded' : 'seeded';
  console.log(`Successfully ${mode} ${count} POS users`);
}

void run().catch(async (error: unknown) => {
  console.error('Failed to run seed', error);
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
