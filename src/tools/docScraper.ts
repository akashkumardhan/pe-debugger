/**
 * PushEngage Documentation Scraper
 * 
 * Recursive scraper for PushEngage Web SDK documentation.
 * Extracts headings, API descriptions, parameters, and code examples.
 * 
 * @see https://pushengage.com/api/web-sdk/
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';

// Type alias for Cheerio wrapped elements
type CheerioElement = Cheerio<Element>;
import type { 
  DocPage, 
  DocSection, 
  DocCodeExample, 
  DocParameter,
  DocCache 
} from './types';
import { createDocCache } from '../utils/storage';

// ============================================================
// CONSTANTS
// ============================================================

const BASE_URL = 'https://pushengage.com/api/web-sdk';
const ALLOWED_URL_PATTERN = /^https:\/\/pushengage\.com\/api\/web-sdk/;
const MAX_PAGES = 50;
const MAX_DEPTH = 3;
const FETCH_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Delay execution for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalize a URL (remove trailing slashes, fragments, etc.)
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove fragment
    parsed.hash = '';
    // Remove trailing slash
    let normalized = parsed.href;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Check if a URL is within the allowed documentation scope
 */
function isAllowedUrl(url: string): boolean {
  return ALLOWED_URL_PATTERN.test(url);
}

/**
 * Resolve a relative URL against a base URL
 */
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

/**
 * Detect language from code block class or content
 */
function detectCodeLanguage(element: CheerioElement, _$: CheerioAPI): string {
  // Check for class-based language hints
  const className = element.attr('class') || '';
  const langMatch = className.match(/(?:language-|lang-|highlight-)(\w+)/i);
  if (langMatch) {
    return langMatch[1].toLowerCase();
  }

  // Check parent pre element
  const parentPre = element.closest('pre');
  const preClass = parentPre.attr('class') || '';
  const preLangMatch = preClass.match(/(?:language-|lang-|highlight-)(\w+)/i);
  if (preLangMatch) {
    return preLangMatch[1].toLowerCase();
  }

  // Check data attributes
  const dataLang = element.attr('data-language') || element.attr('data-lang');
  if (dataLang) {
    return dataLang.toLowerCase();
  }

  // Infer from content
  const code = element.text().trim();
  if (code.includes('PushEngage.') || code.includes('function') || code.includes('const ') || code.includes('var ')) {
    return 'javascript';
  }
  if (code.includes('<script') || code.includes('</') || code.includes('<!DOCTYPE')) {
    return 'html';
  }
  if (code.startsWith('{') || code.startsWith('[')) {
    return 'json';
  }

  return 'javascript'; // Default for PushEngage docs
}

// ============================================================
// HTML PARSING FUNCTIONS
// ============================================================

/**
 * Extract code examples from a section
 */
function extractCodeExamples($: CheerioAPI, container: CheerioElement): DocCodeExample[] {
  const examples: DocCodeExample[] = [];

  // Find all code blocks (pre > code, pre, or standalone code)
  container.find('pre code, pre, code').each((_, elem) => {
    const $elem = $(elem);
    
    // Skip if this is a code inside a pre that we'll get from the pre
    if ($elem.is('code') && $elem.parent().is('pre')) {
      // Only process the code element, not the pre
      if ($elem.is('code')) {
        const code = $elem.text().trim();
        if (code.length > 10) { // Skip very short code snippets
          const language = detectCodeLanguage($elem, $);
          
          // Try to find description from preceding paragraph
          const prevP = $elem.closest('pre').prev('p');
          const description = prevP.length ? prevP.text().trim().slice(0, 200) : undefined;

          examples.push({
            language,
            code,
            description,
          });
        }
      }
      return;
    }

    // Handle pre without code child
    if ($elem.is('pre') && $elem.find('code').length === 0) {
      const code = $elem.text().trim();
      if (code.length > 10) {
        const language = detectCodeLanguage($elem, $);
        const prevP = $elem.prev('p');
        const description = prevP.length ? prevP.text().trim().slice(0, 200) : undefined;

        examples.push({
          language,
          code,
          description,
        });
      }
    }
  });

  return examples;
}

/**
 * Extract parameters from tables or lists
 */
function extractParameters($: CheerioAPI, container: CheerioElement): DocParameter[] {
  const params: DocParameter[] = [];

  // Look for parameter tables
  container.find('table').each((_, table) => {
    const $table = $(table);
    const headers = $table.find('th').map((_, th) => $(th).text().toLowerCase().trim()).get();
    
    // Check if this looks like a parameter table
    const hasNameCol = headers.some(h => h.includes('name') || h.includes('param'));
    const hasTypeCol = headers.some(h => h.includes('type'));
    // Description column checked via headers.findIndex in the loop below

    if (hasNameCol || hasTypeCol) {
      $table.find('tbody tr, tr').each((_, row) => {
        const $row = $(row);
        if ($row.find('th').length > 0) return; // Skip header rows

        const cells = $row.find('td').map((_, td) => $(td).text().trim()).get();
        if (cells.length >= 2) {
          const nameIdx = Math.max(0, headers.findIndex(h => h.includes('name') || h.includes('param')));
          const typeIdx = headers.findIndex(h => h.includes('type'));
          const descIdx = headers.findIndex(h => h.includes('desc'));
          const reqIdx = headers.findIndex(h => h.includes('required') || h.includes('optional'));
          const defaultIdx = headers.findIndex(h => h.includes('default'));

          const param: DocParameter = {
            name: cells[nameIdx] || cells[0] || '',
            type: typeIdx >= 0 ? cells[typeIdx] : 'any',
            required: reqIdx >= 0 ? !cells[reqIdx].toLowerCase().includes('optional') : false,
            description: descIdx >= 0 ? cells[descIdx] : cells[cells.length - 1] || '',
          };

          if (defaultIdx >= 0 && cells[defaultIdx]) {
            param.defaultValue = cells[defaultIdx];
          }

          if (param.name) {
            params.push(param);
          }
        }
      });
    }
  });

  // Also look for definition lists (dl > dt/dd)
  container.find('dl').each((_, dl) => {
    const $dl = $(dl);
    $dl.find('dt').each((_, dt) => {
      const $dt = $(dt);
      const $dd = $dt.next('dd');
      
      const nameText = $dt.text().trim();
      const descText = $dd.text().trim();
      
      // Parse name (might include type like "name: string")
      const nameMatch = nameText.match(/^(\w+)(?:\s*:\s*(\w+))?/);
      if (nameMatch) {
        params.push({
          name: nameMatch[1],
          type: nameMatch[2] || 'any',
          required: !nameText.toLowerCase().includes('optional'),
          description: descText,
        });
      }
    });
  });

  return params;
}

/*
 * NOTE: extractApiMethods function removed - was not used in current implementation.
 * Can be re-added if needed for more granular API method extraction.
 */

/**
 * Parse HTML content into structured sections
 */
function parseContentIntoSections($: CheerioAPI, content: CheerioElement): DocSection[] {
  const sections: DocSection[] = [];
  const headings = content.find('h1, h2, h3, h4, h5, h6');

  if (headings.length === 0) {
    // No headings, treat entire content as one section
    const text = content.text().trim();
    if (text.length > 0) {
      sections.push({
        heading: 'Content',
        level: 1,
        content: text.slice(0, 5000),
        codeExamples: extractCodeExamples($, content),
        parameters: extractParameters($, content),
      });
    }
    return sections;
  }

  headings.each((_idx, heading) => {
    const $heading = $(heading);
    const headingText = $heading.text().trim();
    const level = parseInt(heading.tagName.charAt(1), 10);

    // Collect content until next heading of same or higher level
    let sectionContent = '';
    const sectionCodeExamples: DocCodeExample[] = [];
    const sectionParams: DocParameter[] = [];

    let $next = $heading.next();
    while ($next.length) {
      const tagName = $next.get(0)?.tagName?.toLowerCase() || '';
      
      // Stop if we hit a heading of same or higher level
      if (tagName.match(/^h[1-6]$/)) {
        const nextLevel = parseInt(tagName.charAt(1), 10);
        if (nextLevel <= level) {
          break;
        }
      }

      // Extract content
      if (tagName === 'p' || tagName === 'div' || tagName === 'span') {
        sectionContent += $next.text().trim() + '\n';
      }

      // Extract code examples
      if (tagName === 'pre' || $next.find('pre, code').length > 0) {
        sectionCodeExamples.push(...extractCodeExamples($, $next));
      }

      // Extract parameters
      if (tagName === 'table' || tagName === 'dl') {
        sectionParams.push(...extractParameters($, $next));
      }

      // Extract lists as content
      if (tagName === 'ul' || tagName === 'ol') {
        $next.find('li').each((_, li) => {
          sectionContent += '• ' + $(li).text().trim() + '\n';
        });
      }

      $next = $next.next();
    }

    sections.push({
      heading: headingText,
      level,
      content: sectionContent.trim().slice(0, 5000),
      codeExamples: sectionCodeExamples.length > 0 ? sectionCodeExamples : undefined,
      parameters: sectionParams.length > 0 ? sectionParams : undefined,
      // apiMethods extraction removed for simplicity
    });
  });

  return sections;
}

/**
 * Extract all internal links from a page
 */
function extractLinks($: CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  
  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const absoluteUrl = resolveUrl(baseUrl, href);
      const normalized = normalizeUrl(absoluteUrl);
      
      if (isAllowedUrl(normalized) && !links.includes(normalized)) {
        links.push(normalized);
      }
    }
  });

  return links;
}

// ============================================================
// MAIN SCRAPER FUNCTIONS
// ============================================================

/**
 * Fetch and parse a single documentation page
 */
async function scrapeSinglePage(url: string): Promise<DocPage | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; PushEngageDebugger/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract page title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content');

    // Find main content area (try common selectors)
    let mainContent = $('main, article, .content, .documentation, #content, .doc-content').first();
    if (mainContent.length === 0) {
      mainContent = $('body');
    }

    // Remove navigation, footer, sidebar elements
    mainContent.find('nav, footer, aside, .sidebar, .navigation, .footer, .header').remove();

    // Parse into sections
    const sections = parseContentIntoSections($, mainContent);

    return {
      title,
      url: normalizeUrl(url),
      description: description?.trim().slice(0, 300),
      sections,
      lastScraped: Date.now(),
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

/**
 * Progress callback type
 */
export type ScrapeProgressCallback = (progress: {
  currentPage: number;
  totalPages: number;
  currentUrl: string;
  status: 'scraping' | 'complete' | 'error';
}) => void;

/**
 * Recursively scrape all documentation pages
 */
export async function scrapeDocumentation(
  startUrl: string = BASE_URL,
  options: {
    maxPages?: number;
    maxDepth?: number;
    onProgress?: ScrapeProgressCallback;
  } = {}
): Promise<DocCache> {
  const { 
    maxPages = MAX_PAGES, 
    maxDepth = MAX_DEPTH,
    onProgress 
  } = options;

  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [
    { url: normalizeUrl(startUrl), depth: 0 }
  ];
  const pages: DocPage[] = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const current = toVisit.shift();
    if (!current) break;

    const { url, depth } = current;
    const normalizedUrl = normalizeUrl(url);

    // Skip if already visited
    if (visited.has(normalizedUrl)) {
      continue;
    }
    visited.add(normalizedUrl);

    // Report progress
    if (onProgress) {
      onProgress({
        currentPage: pages.length + 1,
        totalPages: Math.min(visited.size + toVisit.length, maxPages),
        currentUrl: url,
        status: 'scraping',
      });
    }

    // Scrape the page
    const page = await scrapeSinglePage(url);
    
    if (page) {
      pages.push(page);

      // Extract links if we haven't reached max depth
      if (depth < maxDepth) {
        const html = await fetch(url).then(r => r.text()).catch(() => '');
        const $ = cheerio.load(html);
        const links = extractLinks($, url);

        for (const link of links) {
          const normalized = normalizeUrl(link);
          if (!visited.has(normalized) && !toVisit.some(t => normalizeUrl(t.url) === normalized)) {
            toVisit.push({ url: normalized, depth: depth + 1 });
          }
        }
      }
    }

    // Rate limiting
    if (toVisit.length > 0) {
      await delay(FETCH_DELAY_MS);
    }
  }

  // Report completion
  if (onProgress) {
    onProgress({
      currentPage: pages.length,
      totalPages: pages.length,
      currentUrl: '',
      status: 'complete',
    });
  }

  return createDocCache(startUrl, pages);
}

/**
 * Search documentation for a specific query
 */
export function searchDocumentation(cache: DocCache, query: string): {
  relevantSections: Array<{
    pageTitle: string;
    pageUrl: string;
    section: DocSection;
    relevanceScore: number;
  }>;
} {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);
  const results: Array<{
    pageTitle: string;
    pageUrl: string;
    section: DocSection;
    relevanceScore: number;
  }> = [];

  for (const page of cache.pages) {
    for (const section of page.sections) {
      let score = 0;

      // Check heading match (highest weight)
      const headingLower = section.heading.toLowerCase();
      for (const term of queryTerms) {
        if (headingLower.includes(term)) {
          score += 10;
        }
      }

      // Check content match
      const contentLower = section.content.toLowerCase();
      for (const term of queryTerms) {
        const matches = contentLower.split(term).length - 1;
        score += matches * 2;
      }

      // Check code examples
      if (section.codeExamples) {
        for (const example of section.codeExamples) {
          if (example.code.toLowerCase().includes(queryLower)) {
            score += 5;
          }
        }
      }

      // Check API method names
      if (section.apiMethods) {
        for (const method of section.apiMethods) {
          if (method.name.toLowerCase().includes(queryLower)) {
            score += 15;
          }
        }
      }

      if (score > 0) {
        results.push({
          pageTitle: page.title,
          pageUrl: page.url,
          section,
          relevanceScore: score,
        });
      }
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return { relevantSections: results.slice(0, 20) }; // Top 20 results
}

/**
 * Format documentation for AI context
 */
export function formatDocsForAI(cache: DocCache, query?: string): string {
  let output = `# PushEngage Web SDK Documentation\n\n`;
  output += `Source: ${cache.baseUrl}\n`;
  output += `Last Updated: ${new Date(cache.lastUpdated).toISOString()}\n`;
  output += `Total Pages: ${cache.totalPages}\n\n`;

  if (query) {
    // If a query is provided, return only relevant sections
    const searchResults = searchDocumentation(cache, query);
    
    if (searchResults.relevantSections.length === 0) {
      output += `No relevant documentation found for query: "${query}"\n`;
      return output;
    }

    output += `## Relevant Documentation for: "${query}"\n\n`;
    
    for (const result of searchResults.relevantSections) {
      output += `### ${result.section.heading}\n`;
      output += `*From: ${result.pageTitle}*\n\n`;
      output += result.section.content + '\n\n';

      if (result.section.codeExamples && result.section.codeExamples.length > 0) {
        output += '**Code Examples:**\n';
        for (const example of result.section.codeExamples) {
          output += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n`;
          if (example.description) {
            output += `*${example.description}*\n`;
          }
          output += '\n';
        }
      }

      if (result.section.parameters && result.section.parameters.length > 0) {
        output += '**Parameters:**\n';
        for (const param of result.section.parameters) {
          output += `- \`${param.name}\` (${param.type}${param.required ? ', required' : ''}): ${param.description}\n`;
        }
        output += '\n';
      }

      output += '---\n\n';
    }
  } else {
    // Return full documentation summary
    for (const page of cache.pages) {
      output += `## ${page.title}\n`;
      output += `URL: ${page.url}\n\n`;

      for (const section of page.sections) {
        output += `### ${section.heading}\n`;
        output += section.content.slice(0, 1000) + '\n\n';

        if (section.codeExamples && section.codeExamples.length > 0) {
          output += '**Code Examples:**\n';
          for (const example of section.codeExamples.slice(0, 2)) {
            output += `\`\`\`${example.language}\n${example.code.slice(0, 500)}\n\`\`\`\n\n`;
          }
        }
      }

      output += '---\n\n';
    }
  }

  return output;
}

// Export constants for external use
export { BASE_URL, MAX_PAGES, MAX_DEPTH };

