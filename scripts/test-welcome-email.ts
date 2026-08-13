import 'dotenv/config';
import { sendWelcomeEmail, verifyEmailConnection, getEmailConfigSummary } from '../src/server/email.ts';

console.log('Config:', getEmailConfigSummary());
const verify = await verifyEmailConnection();
console.log('Verify:', verify);

const testEmail = process.env.SMTP_FROM_EMAIL || 'ar.claimscure@gmail.com';
const result = await sendWelcomeEmail(testEmail);
console.log('Welcome email result:', result);
