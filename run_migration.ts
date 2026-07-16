import { UserIdentityService } from './src/services/userIdentityService';

async function run() {
  console.log('Starting migration...');
  const result = await UserIdentityService.migrateLegacyUsers();
  console.log('Migration completed:', result);
}

run();
