import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Download, Search, Check } from 'lucide-react';
import type { PEAppConfig } from '../../types/pushEngage';
import { exportPEConfigAsJSON } from '../../utils/storage';

interface PEConfigViewerProps {
  peData: PEAppConfig;
}

interface SectionConfig {
  key: keyof PEAppConfig | 'all';
  label: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'browseAbandonments', label: 'Browse Abandonments' },
  { key: 'cartAbandonments', label: 'Cart Abandonments' },
  { key: 'customTriggerCampaigns', label: 'Custom Triggers' },
  { key: 'site', label: 'Site Information' },
  { key: 'siteSettings', label: 'Site Settings' },
  { key: 'segments', label: 'Segments' },
  { key: 'subscriberAttributes', label: 'Subscriber Attributes' }
];

export default function PEConfigViewer({ peData }: PEConfigViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Toggle section
  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Expand/collapse all
  const toggleAll = () => {
    if (expandedSections.size === SECTIONS.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(SECTIONS.map(s => s.key)));
    }
  };

  // Copy all JSON
  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(peData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON
  const handleExport = () => {
    exportPEConfigAsJSON(peData);
  };

  // Filter JSON based on search
  const filterJSON = (obj: unknown, term: string): boolean => {
    if (!term) return true;
    const str = JSON.stringify(obj).toLowerCase();
    return str.includes(term.toLowerCase());
  };

  // Render JSON with highlighting
  const renderJSON = (obj: unknown, indent: number = 0): JSX.Element => {
    const jsonStr = JSON.stringify(obj, null, 2);
    const lines = jsonStr.split('\n');

    return (
      <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto">
        {lines.map((line, i) => {
          const isMatch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
          return (
            <div
              key={i}
              className={`${isMatch ? 'bg-yellow-100' : ''}`}
            >
              <span className="text-gray-400 select-none mr-3">
                {String(i + 1).padStart(3, ' ')}
              </span>
              <span className="text-gray-800">{colorizeJSON(line)}</span>
            </div>
          );
        })}
      </pre>
    );
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="p-2 border-b bg-gray-50 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search config..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {expandedSections.size === SECTIONS.length ? 'Collapse All' : 'Expand All'}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={copyJSON}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              <Download size={12} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y max-h-[300px] overflow-y-auto">
        {SECTIONS.map(section => {
          const data = peData[section.key as keyof PEAppConfig];
          const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
          const isExpanded = expandedSections.has(section.key);
          const matchesSearch = filterJSON(data, searchTerm);

          if (searchTerm && !matchesSearch) return null;

          return (
            <details
              key={section.key}
              open={isExpanded}
              className="group"
            >
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  toggleSection(section.key);
                }}
                className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}
                  <span className="text-xs font-medium text-gray-700">{section.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isEmpty ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                }`}>
                  {Array.isArray(data) ? data.length : isEmpty ? 'Empty' : 'Set'}
                </span>
              </summary>
              {isExpanded && (
                <div className="p-2 bg-gray-50 border-t">
                  {renderJSON(data)}
                </div>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}

// Helper: Colorize JSON string
function colorizeJSON(line: string): JSX.Element {
  // Simple colorization
  const parts: JSX.Element[] = [];
  let remaining = line;
  let key = 0;

  // Match keys
  const keyMatch = remaining.match(/^(\s*)("[\w_]+"):/);
  if (keyMatch) {
    parts.push(<span key={key++}>{keyMatch[1]}</span>);
    parts.push(<span key={key++} className="text-purple-600">{keyMatch[2]}</span>);
    parts.push(<span key={key++}>:</span>);
    remaining = remaining.slice(keyMatch[0].length);
  }

  // Match string values
  const stringMatch = remaining.match(/^(\s*)"([^"]*)"(,?)$/);
  if (stringMatch) {
    parts.push(<span key={key++}>{stringMatch[1]}</span>);
    parts.push(<span key={key++} className="text-green-600">"{stringMatch[2]}"</span>);
    parts.push(<span key={key++}>{stringMatch[3]}</span>);
    return <>{parts}</>;
  }

  // Match number/boolean values
  const valueMatch = remaining.match(/^(\s*)(true|false|\d+\.?\d*)(,?)$/);
  if (valueMatch) {
    parts.push(<span key={key++}>{valueMatch[1]}</span>);
    parts.push(<span key={key++} className="text-blue-600">{valueMatch[2]}</span>);
    parts.push(<span key={key++}>{valueMatch[3]}</span>);
    return <>{parts}</>;
  }

  // Match null
  const nullMatch = remaining.match(/^(\s*)(null)(,?)$/);
  if (nullMatch) {
    parts.push(<span key={key++}>{nullMatch[1]}</span>);
    parts.push(<span key={key++} className="text-gray-500">{nullMatch[2]}</span>);
    parts.push(<span key={key++}>{nullMatch[3]}</span>);
    return <>{parts}</>;
  }

  // Default
  parts.push(<span key={key++}>{remaining}</span>);
  return <>{parts}</>;
}

