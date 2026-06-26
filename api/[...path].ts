import serverless from 'serverless-http';
import { createApp } from '../backend/src/app.ts';
import { initializeBackend } from '../backend/src/init.ts';

const app = createApp();
const handler = serverless(app);

let initialized = false;

const ensureInitialized = async () => {
  if (initialized) return;
  await initializeBackend();
  initialized = true;
};

export default async (req: any, res: any) => {
  await ensureInitialized();
  return handler(req, res);
};
