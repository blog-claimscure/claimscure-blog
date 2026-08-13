import fs from 'fs';
import path from 'path';
import { db } from './db';
import { checkMongoStatus } from './mongodb';
import { getCloudinaryConfig } from './cloudinary';
import { isEmailConfigured, verifyEmailConnection, getEmailConfigSummary } from './email';

function status(ok: boolean) {
  return ok ? '✓ OK' : '✗ FAILED';
}

function mask(value?: string) {
  if (!value) return '(not set)';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function runStartupDiagnostics(host: string, port: number): Promise<void> {
  const line = '─'.repeat(52);
  console.log(`\n${line}`);
  console.log('  ClaimsCure CMS — Startup Diagnostics');
  console.log(line);

  // Environment
  console.log('\n[ENVIRONMENT]');
  console.log(`  NODE_ENV ........... ${process.env.NODE_ENV || 'development'}`);
  console.log(`  PORT ............... ${port}`);
  console.log(`  HOST ............... ${host}`);
  console.log(`  APP_URL ............ ${process.env.APP_URL || '(not set — set this on Render!)'}`);
  console.log(`  ADMIN_EMAIL ........ ${process.env.ADMIN_EMAIL ? mask(process.env.ADMIN_EMAIL) : '(not set)'}`);
  console.log(`  ADMIN_PASSWORD ..... ${process.env.ADMIN_PASSWORD ? 'configured' : '(not set)'}`);

  // Local database
  console.log('\n[LOCAL DATABASE]');
  const dataDir = path.join(process.cwd(), 'data');
  const dbFile = path.join(dataDir, 'database.json');
  const uploadsDir = path.join(dataDir, 'uploads');

  let dbWritable = false;
  try {
    fs.accessSync(dataDir, fs.constants.W_OK);
    dbWritable = true;
  } catch {
    dbWritable = false;
  }

  console.log(`  Data directory ..... ${fs.existsSync(dataDir) ? status(true) : status(false)} ${dataDir}`);
  console.log(`  database.json ...... ${fs.existsSync(dbFile) ? status(true) : 'seed on first run'} ${dbFile}`);
  console.log(`  Writable ........... ${status(dbWritable)}`);
  console.log(`  Uploads folder ..... ${fs.existsSync(uploadsDir) ? status(true) : status(false)}`);

  try {
    const articles = db.get('articles');
    const subscribers = db.get('subscribers');
    const leads = db.get('leads');
    const categories = db.get('categories');
    console.log(`  Articles ........... ${articles.length} (${articles.filter((a) => a.status === 'published').length} published)`);
    console.log(`  Categories ......... ${categories.length}`);
    console.log(`  Subscribers ........ ${subscribers.filter((s) => s.status === 'active').length} active`);
    console.log(`  Leads .............. ${leads.length}`);
  } catch (err: any) {
    console.log(`  Data load .......... ${status(false)} ${err.message}`);
  }

  // MongoDB
  console.log('\n[MONGODB ATLAS]');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log(`  URI configured ..... ${mongoUri ? status(true) : status(false)}`);
  try {
    const mongo = await Promise.race([
      checkMongoStatus(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000)),
    ]);
    if (mongo.isConnected) {
      console.log(`  Connection ......... ${status(true)} database: ${mongo.dbName}`);
    } else {
      console.log(`  Connection ......... ${status(false)} ${mongo.uriConfigured ? 'could not connect' : 'MONGODB_URI not set'}`);
    }
  } catch (err: any) {
    console.log(`  Connection ......... ${status(false)} ${err.message}`);
  }

  // Email / Brevo
  console.log('\n[EMAIL / BREVO]');
  const emailSummary = getEmailConfigSummary();
  const brevoKeyLen = process.env.BREVO_API_KEY?.trim().length || 0;
  console.log(`  Email configured ... ${emailSummary.configured ? status(true) : status(false)}`);
  console.log(`  BREVO_API_KEY ...... ${brevoKeyLen > 0 ? status(true) + ` (length ${brevoKeyLen})` : status(false) + ' ← ADD THIS ON RENDER!'}`);
  if (emailSummary.configured) {
    console.log(`  Transport .......... ${emailSummary.transport}${emailSummary.transport === 'brevo-api' ? ' (recommended for Render)' : ''}`);
    console.log(`  Brevo API key ...... ${emailSummary.brevoApiConfigured ? status(true) : status(false)}`);
    console.log(`  SMTP credentials ... ${emailSummary.smtpConfigured ? status(true) : status(false)}`);
    console.log(`  From name .......... ${emailSummary.fromName}`);
    console.log(`  From email ......... ${emailSummary.fromEmail}`);
    if (emailSummary.smtpConfigured) {
      console.log(`  SMTP host .......... ${emailSummary.host}:${emailSummary.port}`);
      console.log(`  SMTP user .......... ${mask(emailSummary.user)}`);
    }

    try {
      const verify = await Promise.race([
        verifyEmailConnection(),
        new Promise<{ ok: false; error: string }>((resolve) =>
          setTimeout(() => resolve({ ok: false, error: 'Verification timeout (12s)' }), 12000)
        ),
      ]);
      console.log(
        `  Connection test .... ${verify.ok ? status(true) : status(false)}${verify.error ? ` — ${verify.error}` : ''}${(verify as any).transport ? ` [${(verify as any).transport}]` : ''}`
      );
    } catch (err: any) {
      console.log(`  Connection test .... ${status(false)} ${err.message}`);
    }
  } else {
    console.log('  → Set BREVO_API_KEY (recommended) or SMTP_USER + SMTP_PASS in Render env vars');
  }

  // Cloudinary
  console.log('\n[CLOUDINARY CDN]');
  const cloudinary = getCloudinaryConfig();
  console.log(`  Configured ......... ${cloudinary.isConfigured ? status(true) : status(false)}`);
  if (cloudinary.isConfigured) {
    console.log(`  Cloud name ......... ${cloudinary.cloudName}`);
  }

  // Production static assets
  console.log('\n[FRONTEND]');
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`  Mode ............... ${isProd ? 'production' : 'development (Vite HMR)'}`);
  if (isProd) {
    console.log(`  dist/index.html .... ${fs.existsSync(indexHtml) ? status(true) : status(false)}`);
    console.log(`  dist/server.cjs .... ${fs.existsSync(path.join(distPath, 'server.cjs')) ? status(true) : status(false)}`);
  }

  console.log(`\n${line}`);
  console.log(`  Server listening on http://${host}:${port}`);
  console.log(`  Health check ....... http://${host}:${port}/api/health`);
  console.log(line + '\n');
}

export function getHealthStatus() {
  const dataDir = path.join(process.cwd(), 'data');
  const dbFile = path.join(dataDir, 'database.json');
  const emailSummary = getEmailConfigSummary();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || null,
    database: {
      file: dbFile,
      exists: fs.existsSync(dbFile),
      articles: db.get('articles').length,
      subscribers: db.get('subscribers').filter((s) => s.status === 'active').length,
      leads: db.get('leads').length,
    },
    email: {
      ...emailSummary,
      brevoApiKeySet: !!(process.env.BREVO_API_KEY?.trim()),
      brevoApiKeyLength: process.env.BREVO_API_KEY?.trim().length || 0,
    },
    cloudinary: getCloudinaryConfig(),
  };
}
