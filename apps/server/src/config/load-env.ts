import { config } from 'dotenv';

export function loadEnvironment(): void {
  config({ path: ['.env.local', '.env'], quiet: true });
}

loadEnvironment();
