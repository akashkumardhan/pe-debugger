/**
 * MDX Parser for PushEngage Web SDK Documentation
 * 
 * Parses the MDX documentation file at runtime using regex to extract:
 * - Sections (## headings)
 * - Subsections (### headings)
 * - Code blocks (```js ... ```)
 * - Parameters
 * - Syntax definitions
 * 
 * Integrates with table data from pushengageDocsTableData.ts
 */

// Import MDX as raw string (Vite feature)
import mdxContent from './pushengageDocsData.mdx?raw';

// Import table data
import {
  sdkInitializationProperties,
  subscriberProperties,
  permissionPromptProperties,
  identifyProperties,
} from './pushengageDocsTableData';

// ============================================================
// TYPES
// ============================================================

export interface ParsedCodeBlock {
  language: string;
  code: string;
  title?: string;
}

export interface ParsedParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ParsedSection {
  id: string;
  title: string;
  level: number;
  description: string;
  syntax?: string;
  parameters?: ParsedParameter[];
  codeExamples: ParsedCodeBlock[];
  responseExample?: ParsedCodeBlock;
  notes?: string[];
  tableData?: ParsedParameter[];
}

export interface ParsedDocumentation {
  title: string;
  introduction: string;
  sections: ParsedSection[];
}

// ============================================================
// TABLE DATA MAPPING
// ============================================================

// Map table references to actual data
const tableDataMap: Record<string, any[]> = {
  'sdkData.sdkInitializationProperties': sdkInitializationProperties,
  'sdkData.subscriberProperties': subscriberProperties,
  'sdkData.permissionPromptProperties': permissionPromptProperties,
  'sdkData.identifyProperties': identifyProperties,
};

/**
 * Convert table data array to ParsedParameter format
 */
function tableToParameters(tableData: any[]): ParsedParameter[] {
  return tableData.map(row => ({
    name: row['Property Name'] || row['Key'] || '',
    type: row['Type'] || 'unknown',
    required: row['Required'] === 'Yes',
    description: stripHtml(row['Description'] || ''),
  }));
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#91;/g, '[')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// REGEX PATTERNS
// ============================================================

// Match <Table data={...} /> references
const TABLE_REGEX = /<Table\s+data=\{([^}]+)\}\s*\/>/g;

// ============================================================
// PARSER FUNCTIONS
// ============================================================

/**
 * Extract code blocks from text
 */
function extractCodeBlocks(text: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = [];
  let match;
  
  const regex = /```(\w+)(?:\s+title="([^"]*)")?\n([\s\S]*?)```/g;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1],
      title: match[2],
      code: match[3].trim(),
    });
  }
  
  return blocks;
}

/**
 * Extract parameters from #### Parameters section
 */
function extractParameters(text: string): ParsedParameter[] {
  const params: ParsedParameter[] = [];
  
  // Match patterns like `paramName`: type description
  const paramRegex = /`([^`]+)`:\s*([^\n]+)/g;
  let match;
  
  while ((match = paramRegex.exec(text)) !== null) {
    const name = match[1];
    const rest = match[2].trim();
    
    // Try to parse type from the rest
    // Format is usually: type (optional) "description" or just type
    let type = rest;
    let required = true;
    
    if (rest.includes('(optional)')) {
      required = false;
      type = rest.replace('(optional)', '').trim();
    }
    
    params.push({
      name,
      type,
      required,
      description: '',
    });
  }
  
  return params;
}

/**
 * Extract table data reference and return actual data
 */
function extractTableData(text: string): ParsedParameter[] | undefined {
  const match = TABLE_REGEX.exec(text);
  if (match) {
    const tableRef = match[1].trim();
    const data = tableDataMap[tableRef];
    if (data) {
      return tableToParameters(data);
    }
  }
  return undefined;
}

/**
 * Clean MDX-specific syntax from text
 */
function cleanMdxSyntax(text: string): string {
  return text
    // Remove import statements
    .replace(/^import\s+.*$/gm, '')
    // Remove JSX components but keep content inside Tabs/TabItems
    .replace(/<Tabs[\s\S]*?values=\{[\s\S]*?\}[\s\S]*?>/g, '')
    .replace(/<\/Tabs>/g, '')
    .replace(/<TabItem[^>]*>/g, '')
    .replace(/<\/TabItem>/g, '')
    // Remove Table components (we handle them separately)
    .replace(/<Table[^>]*\/>/g, '')
    // Remove admonition markers but keep content
    .replace(/:::(info|caution|note)\n/g, '**Note:** ')
    .replace(/:::/g, '')
    // Remove HTML anchor tags but keep text
    .replace(/<a[^>]*>([^<]*)<\/a>/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parse the MDX content into structured sections
 */
export function parseMdxDocumentation(): ParsedDocumentation {
  const cleaned = cleanMdxSyntax(mdxContent);
  
  // Extract title (# heading)
  const titleMatch = cleaned.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'PushEngage Web SDK';
  
  // Extract introduction (text before first ## heading)
  const introMatch = cleaned.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##\s+)/);
  const introduction = introMatch ? introMatch[1].trim() : '';
  
  // Split by ## headings to get sections
  const sections: ParsedSection[] = [];
  const sectionSplits = cleaned.split(/(?=^##\s+)/m);
  
  for (const sectionText of sectionSplits) {
    if (!sectionText.trim() || !sectionText.startsWith('##')) continue;
    
    // Get section heading
    const headingMatch = sectionText.match(/^(#{2,4})\s+(.+)$/m);
    if (!headingMatch) continue;
    
    const level = headingMatch[1].length;
    const sectionTitle = headingMatch[2].trim();
    const sectionId = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Get content after heading
    const contentStart = sectionText.indexOf('\n') + 1;
    const sectionContent = sectionText.slice(contentStart);
    
    // Extract description (text before first #### or code block)
    const descMatch = sectionContent.match(/^([\s\S]*?)(?=####|\n```|$)/);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract syntax
    const syntaxMatch = sectionContent.match(/####\s+Syntax\n\n```[\w]+[^\n]*\n([\s\S]*?)```/);
    const syntax = syntaxMatch ? syntaxMatch[1].trim() : undefined;
    
    // Extract parameters
    const paramsSection = sectionContent.match(/####\s+Parameters\n\n([\s\S]*?)(?=####|$)/);
    const parameters = paramsSection ? extractParameters(paramsSection[1]) : undefined;
    
    // Extract code examples (Usage section)
    const usageMatch = sectionContent.match(/####\s+Usage\n\n([\s\S]*?)(?=####|```json|$)/);
    const codeExamples = usageMatch ? extractCodeBlocks(usageMatch[1]) : extractCodeBlocks(sectionContent);
    
    // Extract response example
    const responseMatch = sectionContent.match(/```json\s+title="Example of (?:Success )?Response"[\s\S]*?```/);
    let responseExample: ParsedCodeBlock | undefined;
    if (responseMatch) {
      const blocks = extractCodeBlocks(responseMatch[0]);
      responseExample = blocks[0];
    }
    
    // Extract notes from admonitions
    const notes: string[] = [];
    let admonMatch;
    const admonRegex = /:::(info|caution|note)\n([\s\S]*?):::/g;
    while ((admonMatch = admonRegex.exec(sectionContent)) !== null) {
      notes.push(admonMatch[2].trim());
    }
    
    // Check for table data
    TABLE_REGEX.lastIndex = 0;
    const tableData = extractTableData(sectionContent);
    
    sections.push({
      id: sectionId,
      title: sectionTitle,
      level,
      description: cleanMdxSyntax(description),
      syntax,
      parameters: parameters && parameters.length > 0 ? parameters : undefined,
      codeExamples,
      responseExample,
      notes: notes.length > 0 ? notes : undefined,
      tableData,
    });
  }
  
  return {
    title,
    introduction: cleanMdxSyntax(introduction),
    sections,
  };
}

// ============================================================
// SEARCH FUNCTIONS
// ============================================================

/**
 * Search parsed documentation for relevant sections
 */
export function searchDocumentation(query: string): ParsedSection[] {
  const docs = parseMdxDocumentation();
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
  
  const results: { section: ParsedSection; score: number }[] = [];
  
  for (const section of docs.sections) {
    let score = 0;
    
    // Check title
    if (section.title.toLowerCase().includes(queryLower)) {
      score += 15;
    }
    
    // Check keywords in title
    for (const keyword of keywords) {
      if (section.title.toLowerCase().includes(keyword)) {
        score += 8;
      }
      if (section.description.toLowerCase().includes(keyword)) {
        score += 4;
      }
      if (section.syntax?.toLowerCase().includes(keyword)) {
        score += 6;
      }
      
      // Check code examples
      for (const example of section.codeExamples) {
        if (example.code.toLowerCase().includes(keyword)) {
          score += 3;
        }
      }
      
      // Check parameters
      if (section.parameters) {
        for (const param of section.parameters) {
          if (param.name.toLowerCase().includes(keyword)) {
            score += 5;
          }
        }
      }
    }
    
    if (score > 0) {
      results.push({ section, score });
    }
  }
  
  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(r => r.section);
}

/**
 * Get all sections from documentation
 */
export function getAllSections(): ParsedSection[] {
  const docs = parseMdxDocumentation();
  return docs.sections;
}

// ============================================================
// FORMAT FUNCTIONS
// ============================================================

/**
 * Format sections for AI consumption
 */
export function formatSectionsForAI(sections: ParsedSection[]): string {
  if (sections.length === 0) {
    return 'No relevant documentation found.';
  }
  
  return sections.map(section => {
    let doc = `## ${section.title}\n\n`;
    
    if (section.description) {
      doc += `${section.description}\n\n`;
    }
    
    if (section.syntax) {
      doc += `**Syntax:**\n\`\`\`javascript\n${section.syntax}\n\`\`\`\n\n`;
    }
    
    if (section.parameters && section.parameters.length > 0) {
      doc += `**Parameters:**\n`;
      for (const param of section.parameters) {
        const reqText = param.required ? 'required' : 'optional';
        doc += `- \`${param.name}\`: ${param.type} (${reqText})${param.description ? ' - ' + param.description : ''}\n`;
      }
      doc += '\n';
    }
    
    if (section.tableData && section.tableData.length > 0) {
      doc += `**Properties:**\n`;
      for (const prop of section.tableData) {
        const reqText = prop.required ? 'required' : 'optional';
        doc += `- \`${prop.name}\` (${prop.type}, ${reqText}): ${prop.description}\n`;
      }
      doc += '\n';
    }
    
    if (section.codeExamples.length > 0) {
      doc += `**Example:**\n`;
      for (const example of section.codeExamples) {
        if (example.title) {
          doc += `*${example.title}*\n`;
        }
        doc += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
      }
    }
    
    if (section.responseExample) {
      doc += `**Response Example:**\n\`\`\`${section.responseExample.language}\n${section.responseExample.code}\n\`\`\`\n\n`;
    }
    
    if (section.notes && section.notes.length > 0) {
      doc += `**Notes:**\n`;
      for (const note of section.notes) {
        doc += `> ${note}\n`;
      }
      doc += '\n';
    }
    
    return doc;
  }).join('\n---\n\n');
}

/**
 * Format all documentation as a complete reference
 */
export function formatAllDocsForAI(): string {
  const docs = parseMdxDocumentation();
  
  let result = `# ${docs.title}\n\n`;
  result += `${docs.introduction}\n\n`;
  result += '---\n\n';
  result += formatSectionsForAI(docs.sections);
  
  return result;
}

// ============================================================
// EXPORTS
// ============================================================

export {
  mdxContent as RAW_MDX_CONTENT,
  tableDataMap as TABLE_DATA_MAP,
};

