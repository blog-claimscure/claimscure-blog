import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Article, Lead, SiteSettings } from '../types';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Email] SMTP credentials not configured. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function getSender(settings?: SiteSettings) {
  // SMTP_FROM_EMAIL is the Brevo-validated sender — env always takes priority over DB settings
  const email =
    process.env.SMTP_FROM_EMAIL ||
    settings?.senderEmail ||
    process.env.SMTP_USER ||
    'ar.claimscure@gmail.com';

  return {
    name: process.env.SMTP_FROM_NAME || settings?.senderName || 'ClaimsCure Insights',
    email,
  };
}

function getBlogUrl(settings?: SiteSettings) {
  return settings?.blogUrl || process.env.APP_URL || 'http://localhost:3000';
}

function emailWrapper(title: string, bodyHtml: string, settings?: SiteSettings) {
  const blogUrl = getBlogUrl(settings);
  const siteName = settings?.siteName || 'ClaimsCure Insights';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0B5FA5;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${siteName}</h1>
          <p style="margin:6px 0 0;color:#E3F2FD;font-size:12px;">U.S. Healthcare RCM & Medical Billing Insights</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:22px;line-height:1.3;">${title}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6;">
            You are receiving this because you subscribed to ${siteName}.
          </p>
          <p style="margin:0;color:#64748b;font-size:12px;">
            <a href="${blogUrl}" style="color:#0B5FA5;">Visit the blog</a>
            &nbsp;·&nbsp;
            <a href="${blogUrl}/api/subscribers/unsubscribe?email={{EMAIL}}" style="color:#64748b;">Unsubscribe</a>
          </p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} ClaimsCure LLC. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function transactionalEmailWrapper(title: string, bodyHtml: string, settings?: SiteSettings) {
  const blogUrl = getBlogUrl(settings);
  const siteName = settings?.siteName || 'ClaimsCure';
  const contactEmail = settings?.contactEmail || 'info@claimscure.com';
  const contactPhone = settings?.contactPhone || '+1 (301) 739-8880';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0B5FA5;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${siteName}</h1>
          <p style="margin:6px 0 0;color:#E3F2FD;font-size:12px;">ClaimsCure Revenue Cycle Services</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:22px;line-height:1.3;">${title}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6;">
            Questions? Contact us at <a href="mailto:${contactEmail}" style="color:#0B5FA5;">${contactEmail}</a> or ${contactPhone}.
          </p>
          <p style="margin:0;color:#64748b;font-size:12px;">
            <a href="${blogUrl}" style="color:#0B5FA5;">Visit ClaimsCure Blog</a>
          </p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} ClaimsCure LLC. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  settings?: SiteSettings
): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: 'SMTP not configured' };
  }

  const sender = getSender(settings);
  const finalHtml = html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(to));
  const plainText = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  try {
    await transport.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      replyTo: `"${sender.name}" <${sender.email}>`,
      to,
      subject,
      html: finalHtml,
      text: plainText,
    });
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendWelcomeEmail(to: string, settings?: SiteSettings) {
  const blogUrl = getBlogUrl(settings);
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Thank you for subscribing to <strong>ClaimsCure Insights</strong>! You will now receive expert healthcare RCM articles, compliance updates, and billing best practices directly in your inbox.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Our editorial team publishes actionable guides on medical billing, denial management, credentialing, and payer compliance — written for U.S. healthcare practices.
    </p>
    <a href="${blogUrl}" style="display:inline-block;background:#0B5FA5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      Browse Latest Articles
    </a>`;

  return sendEmail(
    to,
    'Welcome to ClaimsCure Insights — You\'re Subscribed!',
    emailWrapper('Welcome aboard!', body, settings),
    settings
  );
}

export async function sendReactivationEmail(to: string, settings?: SiteSettings) {
  const blogUrl = getBlogUrl(settings);
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Welcome back! Your subscription to <strong>ClaimsCure Insights</strong> has been re-activated. You will continue receiving our latest healthcare billing publications.
    </p>
    <a href="${blogUrl}" style="display:inline-block;background:#0B5FA5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      Read Latest Articles
    </a>`;

  return sendEmail(
    to,
    'Welcome Back — Your ClaimsCure Subscription is Active',
    emailWrapper('Subscription re-activated', body, settings),
    settings
  );
}

export async function sendArticleNewsletter(
  recipients: string[],
  article: Article,
  type: 'new' | 'update',
  settings?: SiteSettings
) {
  const blogUrl = getBlogUrl(settings);
  const articleUrl = `${blogUrl}/article/${article.slug}`;
  const isUpdate = type === 'update';

  const subject = isUpdate
    ? `Updated: ${article.title} | ClaimsCure Insights`
    : `New Article: ${article.title} | ClaimsCure Insights`;

  const body = `
    <p style="color:#64748b;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">
      ${isUpdate ? '📝 Article Updated' : '📰 New Publication'}
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      ${article.excerpt || 'Read our latest expert analysis on healthcare revenue cycle management.'}
    </p>
    ${article.featuredImage ? `<img src="${article.featuredImage}" alt="${article.imageAlt || article.title}" style="width:100%;max-width:536px;border-radius:8px;margin:0 0 20px;" />` : ''}
    <a href="${articleUrl}" style="display:inline-block;background:#0B5FA5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;">
      ${isUpdate ? 'Read Updated Article' : 'Read Full Article'}
    </a>`;

  const html = emailWrapper(article.title, body, settings);
  const results = await Promise.allSettled(
    recipients.map((email) => sendEmail(email, subject, html, settings))
  );

  const delivered = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const bounced = recipients.length - delivered;

  return { delivered, bounced, total: recipients.length };
}

export async function sendCustomNewsletter(
  recipients: string[],
  subject: string,
  content: string,
  settings?: SiteSettings
) {
  const body = `
    <div style="color:#334155;font-size:15px;line-height:1.7;">
      ${content.replace(/\n/g, '<br/>')}
    </div>`;

  const html = emailWrapper(subject, body, settings);
  const results = await Promise.allSettled(
    recipients.map((email) => sendEmail(email, subject, html, settings))
  );

  const delivered = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const bounced = recipients.length - delivered;

  return { delivered, bounced, total: recipients.length };
}

export async function sendAuditRequestConfirmationEmail(lead: Lead, settings?: SiteSettings) {
  const body = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${lead.name}</strong>,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Thank you for requesting a <strong>Free Claims &amp; Denial Audit</strong> for <strong>${lead.clinicName}</strong>.
      We have received your submission and a senior ClaimsCure billing specialist will review your practice details.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Your Submission Summary</p>
      <p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Clinic:</strong> ${lead.clinicName}</p>
      <p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Email:</strong> ${lead.workEmail}</p>
      ${lead.phone ? `<p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Phone:</strong> ${lead.phone}</p>` : ''}
      <p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Estimated Outstanding Denials:</strong> ${lead.estimatedOutstandingDenials}</p>
      ${lead.billingIssues ? `<p style="margin:0;color:#334155;font-size:14px;"><strong>Billing Concerns:</strong> ${lead.billingIssues.replace(/\n/g, '<br/>')}</p>` : ''}
    </div>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong>What happens next?</strong> Our team will analyze your denial metrics and reach out within <strong>24 business hours</strong> with next steps. This audit is confidential and non-binding.
    </p>
    <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
      If you did not submit this request, please ignore this email or contact us immediately.
    </p>`;

  return sendEmail(
    lead.workEmail,
    `Your Free Claims Audit Request — ${lead.clinicName} | ClaimsCure`,
    transactionalEmailWrapper('Audit Request Received', body, settings),
    settings
  );
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}
