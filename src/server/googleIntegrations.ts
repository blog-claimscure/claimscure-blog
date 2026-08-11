import { db } from './db';

export interface GoogleDocsImportResult {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export function parseGoogleDocContent(rawInput: string): GoogleDocsImportResult {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Invalid or empty Google Doc content provided.');
  }

  const lines = rawInput.split('\n').map((l) => l.trim()).filter(Boolean);
  let title = 'Imported Article Draft from Google Docs';
  let excerpt = '';
  let contentLines: string[] = [];

  if (lines.length > 0) {
    title = lines[0].replace(/^(#|\d+\.\s*|Title:\s*)/i, '').trim();
  }

  if (lines.length > 1) {
    excerpt = lines[1].replace(/^(Excerpt:\s*|Summary:\s*)/i, '').trim();
    if (excerpt.length > 250) {
      excerpt = excerpt.substring(0, 247) + '...';
    }
  }

  // Convert rest into clean structured HTML paragraphs and headings
  const bodyLines = lines.slice(lines.length > 1 && lines[1] === excerpt ? 2 : 1);

  bodyLines.forEach((line) => {
    if (line.startsWith('# ')) {
      contentLines.push(`<h1>${line.replace('# ', '')}</h1>`);
    } else if (line.startsWith('## ')) {
      contentLines.push(`<h2>${line.replace('## ', '')}</h2>`);
    } else if (line.startsWith('### ')) {
      contentLines.push(`<h3>${line.replace('### ', '')}</h3>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      contentLines.push(`<li>${line.substring(2)}</li>`);
    } else {
      contentLines.push(`<p>${line}</p>`);
    }
  });

  const formattedContent = contentLines.join('\n');

  return {
    title,
    excerpt: excerpt || 'Comprehensive medical billing executive summary imported from Google Docs draft.',
    content: formattedContent || `<p>${rawInput}</p>`,
    tags: ['Google Docs Import', 'Medical Billing', 'CMS Draft'],
  };
}

export function getGoogleServicesStatus() {
  const analyticsId = process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID || 'G-CLAIMSCURE2026';
  const searchConsoleSite = process.env.GOOGLE_SEARCH_CONSOLE_SITE || 'https://blog.claimscure.com';
  const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';

  return {
    analytics: {
      enabled: Boolean(analyticsId),
      measurementId: analyticsId,
    },
    searchConsole: {
      enabled: Boolean(searchConsoleSite),
      siteUrl: searchConsoleSite,
    },
    googleDrive: {
      enabled: Boolean(driveClientId),
      hasClientId: Boolean(driveClientId),
    },
  };
}
