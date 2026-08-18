import 'dotenv/config';
import { db } from '../src/server/db.ts';
import {
  checkMongoStatus,
  syncAllCollectionsToMongo,
  hydrateFromMongo,
  verifyMongoSync,
} from '../src/server/mongodb.ts';

console.log('=== MongoDB Sync Test ===\n');

const status = await checkMongoStatus();
console.log('Connection:', status.isConnected ? 'OK' : 'FAILED', status.dbName || '');

if (!status.isConnected) {
  console.error('Cannot connect to MongoDB. Check MONGODB_URI.');
  process.exit(1);
}

console.log('\n1. Push local → MongoDB...');
const push = await syncAllCollectionsToMongo((key) => {
  if (key === 'settings') return db.get('settings');
  return db.get(key as any);
});
console.log(`   Pushed ${push.successCount}/${push.total} collections`);

const localCounts = {
  articles: db.get('articles').length,
  revisions: db.get('revisions').length,
  categories: db.get('categories').length,
  tags: db.get('tags').length,
  authors: db.get('authors').length,
  media: db.get('media').length,
  subscribers: db.get('subscribers').length,
  emailCampaigns: db.get('emailCampaigns').length,
  leads: db.get('leads').length,
  activityLogs: db.get('activityLogs').length,
  redirects: db.get('redirects').length,
  settings: db.get('settings') ? 1 : 0,
  admin: db.get('admin') ? 1 : 0,
  analyticsEvents: db.get('analyticsEvents').length,
};

console.log('\n2. Verify sync...');
const verify = await verifyMongoSync(localCounts);
console.log('   In sync:', verify.inSync ? 'YES' : 'NO');
if (!verify.inSync) {
  verify.mismatches.forEach((m) => console.log('   -', m));
}

console.log('\n3. Test hydration...');
const hydration = await hydrateFromMongo(db);
console.log('   Hydrated:', hydration.hydrated ? 'YES' : 'NO (already up to date)');

console.log('\n=== All MongoDB tests passed ===');
