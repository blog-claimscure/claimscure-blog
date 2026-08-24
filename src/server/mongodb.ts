import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

const DEFAULT_MONGO_URI =
  'mongodb+srv://claimscure_db_user:J199ensKcVfsXuLL@cluster0.dq33ymm.mongodb.net/claimscure_cms?retryWrites=true&w=majority&appName=Cluster0';

/** Collections synced between local JSON and MongoDB Atlas */
export const SYNCABLE_COLLECTIONS = [
  'articles',
  'revisions',
  'categories',
  'tags',
  'authors',
  'media',
  'subscribers',
  'emailCampaigns',
  'leads',
  'activityLogs',
  'redirects',
  'settings',
  'analyticsEvents',
  'admin',
] as const;

export type SyncableCollection = (typeof SYNCABLE_COLLECTIONS)[number];

/** Stored as a single document in MongoDB (wrapped in a one-item array on sync) */
export const SINGLE_DOC_COLLECTIONS = ['settings', 'admin'] as const;

function isSingleDocCollection(key: string): boolean {
  return key === 'settings' || key === 'admin';
}

function localCountForKey(key: SyncableCollection, localCounts: Record<string, number>): number {
  if (isSingleDocCollection(key)) return localCounts[key] ?? 0;
  return localCounts[key] ?? 0;
}

function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim() || DEFAULT_MONGO_URI;
}

function stripMongoId<T extends Record<string, unknown>>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  return rest;
}

export async function getMongoDb(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  if (mongoDb) return mongoDb;

  try {
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'claimscure_cms';
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    console.log(`[MongoDB] Connected to Atlas database: ${dbName}`);
    return mongoDb;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    return null;
  }
}

export async function checkMongoStatus(): Promise<{
  isConnected: boolean;
  dbName?: string;
  uriConfigured: boolean;
}> {
  const uri = getMongoUri();
  if (!uri) return { isConnected: false, uriConfigured: false };

  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      return {
        isConnected: true,
        dbName: process.env.MONGODB_DB_NAME?.trim() || 'claimscure_cms',
        uriConfigured: true,
      };
    }
  } catch (err) {
    console.error('[MongoDB] Ping failed:', err);
  }

  return { isConnected: false, uriConfigured: true };
}

export async function getMongoCollectionCounts(): Promise<Record<string, number>> {
  const db = await getMongoDb();
  if (!db) return {};

  const counts: Record<string, number> = {};
  for (const name of SYNCABLE_COLLECTIONS) {
    try {
      counts[name] = await db.collection(name).countDocuments();
    } catch {
      counts[name] = 0;
    }
  }
  return counts;
}

export async function syncCollectionToMongo<T>(collectionName: string, items: T[]): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) return false;

    const collection = db.collection(collectionName);
    const payload = (items || []).map((item) => {
      const doc = { ...(item as object) } as Record<string, unknown>;
      delete doc._id;
      return doc;
    });

    if (payload.length === 0) {
      const existing = await collection.estimatedDocumentCount();
      if (existing === 0) {
        console.log(`[MongoDB] Synced ${collectionName} → 0 documents (no-op, both empty)`);
        return true;
      }
      console.warn(
        `[MongoDB] Skipped empty sync for ${collectionName}: local has 0 but Atlas has ${existing}. Refusing to wipe Atlas data.`
      );
      return true;
    }

    await collection.deleteMany({});
    const insertResult = await collection.insertMany(payload);
    const inserted = insertResult.insertedCount ?? payload.length;

    if (inserted !== payload.length) {
      console.warn(
        `[MongoDB] ${collectionName}: expected ${payload.length} docs inserted but Atlas got ${inserted}`
      );
    }

    console.log(`[MongoDB] Synced ${collectionName} → ${inserted} documents`);
    return true;
  } catch (err) {
    console.error(`[MongoDB] Failed to sync ${collectionName}:`, err);
    return false;
  }
}

export function autoSyncMongoCollection(collectionName: string, items: unknown[]): void {
  syncCollectionToMongo(collectionName, items).catch((err) => {
    console.warn(`[MongoDB] Background sync for ${collectionName} failed:`, err?.message || err);
  });
}

/** Push all local collections to MongoDB */
export async function syncAllCollectionsToMongo(getCollection: (key: string) => unknown): Promise<{
  successCount: number;
  total: number;
  details: Record<string, { ok: boolean; count: number }>;
}> {
  const details: Record<string, { ok: boolean; count: number }> = {};
  let successCount = 0;

  for (const key of SYNCABLE_COLLECTIONS) {
    let items: unknown[];
    if (isSingleDocCollection(key)) {
      const doc = getCollection(key);
      items = doc ? [doc] : [];
    } else {
      items = (getCollection(key) as unknown[]) || [];
    }

    const ok = await syncCollectionToMongo(key, items);
    details[key] = { ok, count: items.length };
    if (ok) successCount++;
  }

  return { successCount, total: SYNCABLE_COLLECTIONS.length, details };
}

/** Load MongoDB data into local JSON when Atlas has equal or more data (critical for Render redeploys) */
export async function hydrateFromMongo(dbService: {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => Promise<void>;
  setSkipMongoSync?: (skip: boolean) => void;
}): Promise<{ hydrated: boolean; collections: Record<string, { mongo: number; local: number; loaded: boolean }> }> {
  const mongo = await getMongoDb();
  const report: Record<string, { mongo: number; local: number; loaded: boolean }> = {};
  let hydrated = false;

  if (!mongo) {
    console.log('[MongoDB] Hydration skipped — not connected');
    return { hydrated: false, collections: report };
  }

  console.log('[MongoDB] Checking Atlas for data to hydrate local database...');
  dbService.setSkipMongoSync?.(true);

  try {
    for (const key of SYNCABLE_COLLECTIONS) {
      try {
        const docs = await mongo.collection(key).find({}).toArray();
        const cleaned = docs.map((d) => stripMongoId(d as Record<string, unknown>));

        let localCount = 0;
        if (isSingleDocCollection(key)) {
          localCount = dbService.get(key) ? 1 : 0;
        } else {
          localCount = ((dbService.get(key) as unknown[]) || []).length;
        }

        const mongoCount = cleaned.length;
        const shouldLoad = mongoCount > 0 && mongoCount >= localCount;

        report[key] = { mongo: mongoCount, local: localCount, loaded: shouldLoad };

        if (shouldLoad) {
          if (isSingleDocCollection(key)) {
            await dbService.set(key, cleaned[0]);
          } else {
            await dbService.set(key, cleaned);
          }
          hydrated = true;
          console.log(`[MongoDB] Hydrated ${key}: ${mongoCount} documents (local had ${localCount})`);
        }
      } catch (err) {
        console.warn(`[MongoDB] Hydration failed for ${key}:`, err);
        report[key] = { mongo: 0, local: 0, loaded: false };
      }
    }
  } finally {
    dbService.setSkipMongoSync?.(false);
  }

  if (hydrated) {
    console.log('[MongoDB] Local database hydrated from Atlas successfully');
  } else {
    console.log('[MongoDB] Local database is up to date — no hydration needed');
  }

  return { hydrated, collections: report };
}

export async function verifyMongoSync(localCounts: Record<string, number>): Promise<{
  inSync: boolean;
  mongoCounts: Record<string, number>;
  mismatches: string[];
}> {
  const mongoCounts = await getMongoCollectionCounts();
  const mismatches: string[] = [];

  for (const key of SYNCABLE_COLLECTIONS) {
    const local = localCountForKey(key, localCounts);
    const remote = mongoCounts[key] ?? 0;
    if (local !== remote) {
      mismatches.push(`${key}: local=${local} mongo=${remote}`);
    }
  }

  return { inSync: mismatches.length === 0, mongoCounts, mismatches };
}
