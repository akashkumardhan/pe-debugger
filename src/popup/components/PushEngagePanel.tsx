import { RefreshCw, MessageSquare, AlertCircle, CheckCircle, TrendingUp, Bell, MapPin, Activity } from 'lucide-react';
import type { PEAppConfig } from '../../types/pushEngage';
import { pushEngageService } from '../../services/pushEngage';
import PEQuerySuggestions from './PEQuerySuggestions';
import PEConfigViewer from './PEConfigViewer';

interface PushEngagePanelProps {
  peData: PEAppConfig | null;
  peAvailable: boolean;
  onRefresh: () => void;
  onQuerySelect: (query: string) => void;
}

export default function PushEngagePanel({
  peData,
  peAvailable,
  onRefresh,
  onQuerySelect
}: PushEngagePanelProps) {
  // Not detected state
  if (!peAvailable) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bell size={28} className="text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          PushEngage Not Detected
        </h3>
        <p className="text-xs text-gray-500 mb-4 max-w-xs">
          The PushEngage SDK was not found on the current page.
          Make sure you're on a website with PushEngage installed.
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh Detection
        </button>
      </div>
    );
  }

  // No config data yet
  if (!peData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Bell size={28} className="text-secondary" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          PushEngage Detected
        </h3>
        <p className="text-xs text-gray-500 mb-4 max-w-xs">
          SDK detected but configuration data is loading...
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
          <RefreshCw size={16} />
          Fetch Config
        </button>
      </div>
    );
  }

  // Parse data
  const summary = pushEngageService.parseCampaignSummary(peData);
  const settings = pushEngageService.extractKeySettings(peData);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Bell size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{settings.siteName}</h2>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">{settings.siteUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => onQuerySelect('')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <MessageSquare size={14} />
              Ask AI
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Campaign Summary Cards */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Campaigns</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<TrendingUp size={16} />}
              label="Total Campaigns"
              value={summary.totalCampaigns}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle size={16} />}
              label="Active"
              value={summary.activeCampaigns}
              color="green"
            />
            <StatCard
              icon={<AlertCircle size={16} />}
              label="Browse Abandon"
              value={summary.browseAbandonments}
              color="purple"
            />
            <StatCard
              icon={<Activity size={16} />}
              label="Cart Abandon"
              value={summary.cartAbandonments}
              color="orange"
            />
          </div>
        </div>

        {/* Site Info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Site Info</h3>
          <div className="bg-white rounded-lg border p-3 space-y-2">
            <InfoRow label="Site ID" value={settings.siteId.toString()} />
            <InfoRow label="Segments" value={`${settings.segmentsCount} configured`} />
            <InfoRow label="Attributes" value={`${settings.attributesCount} defined`} />
          </div>
        </div>

        {/* Settings Summary */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Settings</h3>
          <div className="bg-white rounded-lg border p-3 space-y-2">
            <InfoRow
              label="Chicklet Position"
              value={settings.chickletPosition || 'Not set'}
              icon={<Bell size={12} className="text-gray-400" />}
            />
            <InfoRow
              label="Geo Location"
              value={settings.geoLocation ? 'Enabled' : 'Disabled'}
              icon={<MapPin size={12} className="text-gray-400" />}
              highlight={settings.geoLocation}
            />
            <InfoRow
              label="Analytics"
              value={settings.analytics ? 'Enabled' : 'Disabled'}
              icon={<Activity size={12} className="text-gray-400" />}
              highlight={settings.analytics}
            />
          </div>
        </div>

        {/* Query Suggestions */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Questions</h3>
          <PEQuerySuggestions onQuerySelect={onQuerySelect} />
        </div>

        {/* Config Viewer */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Raw Config</h3>
          <PEConfigViewer peData={peData} />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
}

// Info Row Component
function InfoRow({
  label,
  value,
  icon,
  highlight
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-xs font-medium ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

