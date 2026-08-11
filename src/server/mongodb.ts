import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

const DEFAULT_MONGO_URI = 'mongodb+srv://claimscure_db_user:J199ensKcVfsXuLL@cluster0.dq33ymm.mongodb.net/claimscure_cms?retryWrites=true&w=majority&appName=Cluster0';

export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGO_URI;
  if (!uri) {
    return null;
  }

  if (mongoDb) {
    return mongoDb;
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME || 'claimscure_cms';
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    console.log(`Connected successfully to MongoDB Atlas database: ${dbName}`);
    return mongoDb;
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err);
    return null;
  }
}

export async function checkMongoStatus(): Promise<{
  isConnected: boolean;
  dbName?: string;
  uriConfigured: boolean;
}> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGO_URI;
  const uriConfigured = Boolean(uri);
  if (!uriConfigured) {
    return { isConnected: false, uriConfigured: false };
  }

  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      return {
        isConnected: true,
        dbName: process.env.MONGODB_DB_NAME || 'claimscure_cms',
        uriConfigured: true,
      };
    }
  } catch (err) {
    console.error('MongoDB Atlas ping failed:', err);
  }

  return { isConnected: false, uriConfigured: true };
}

export async function syncCollectionToMongo<T>(collectionName: string, items: T[]): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) return false;

    const collection = db.collection(collectionName);
    // Refresh collection cleanly
    await collection.deleteMany({});
    if (items && items.length > 0) {
      await collection.insertMany(items as any[]);
    }
    return true;
  } catch (err) {
    console.error(`Failed to sync collection ${collectionName} to MongoDB Atlas:`, err);
    return false;
  }
}

export function autoSyncMongoCollection(collectionName: string, items: any[]): void {
  syncCollectionToMongo(collectionName, items).catch((err) => {
    console.warn(`Background Mongo sync for ${collectionName} failed:`, err?.message || err);
  });
}
