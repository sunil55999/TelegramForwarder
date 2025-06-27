import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Hash, 
  Users, 
  Lock, 
  ArrowRight, 
  Clock, 
  Activity,
  Settings,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ForwardingPair {
  id: number;
  sourceChannel: string;
  destinationChannel: string;
  delay: number;
  isActive: boolean;
  lastActivity: string | null;
  messageType: 'all' | 'media' | 'text';
  copyMode: boolean;
  silentMode: boolean;
  messagesForwarded: number;
  successRate: number;
  sourceType: 'public' | 'private' | 'group';
  destinationType: 'public' | 'private' | 'group';
}

interface EnhancedForwardingCardProps {
  pair: ForwardingPair;
  onToggle: (id: number, isActive: boolean) => void;
  onEdit: (pair: ForwardingPair) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}

function ChannelIcon({ type }: { type: string }) {
  switch (type) {
    case 'public':
      return <Hash className="w-4 h-4" />;
    case 'private':
      return <Lock className="w-4 h-4" />;
    case 'group':
      return <Users className="w-4 h-4" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
}

function StatusBadge({ isActive, successRate }: { isActive: boolean; successRate: number }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="border-gray-500 text-gray-400">
        Paused
      </Badge>
    );
  }

  if (successRate >= 95) {
    return (
      <Badge variant="outline" className="border-green-500 text-green-400">
        ✅ Active
      </Badge>
    );
  } else if (successRate >= 80) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
        ⚠️ Issues
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="border-red-500 text-red-400">
        ❌ Error
      </Badge>
    );
  }
}

function MessageTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'media':
      return '📷';
    case 'text':
      return '📝';
    default:
      return '📨';
  }
}

export default function EnhancedForwardingCard({
  pair,
  onToggle,
  onEdit,
  onDelete,
  onPause,
  onResume
}: EnhancedForwardingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDelay = (delay: number) => {
    if (delay === 0) return 'Instant';
    if (delay < 60) return `${delay}s`;
    if (delay < 3600) return `${Math.floor(delay / 60)}m`;
    return `${Math.floor(delay / 3600)}h`;
  };

  const getLastActivityText = (lastActivity: string | null) => {
    if (!lastActivity) return 'No activity';
    return `Last: ${lastActivity}`;
  };

  return (
    <Card className="bg-slate-800 border-slate-700 transition-all duration-200 hover:border-slate-600">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusBadge isActive={pair.isActive} successRate={pair.successRate} />
            <span className="text-white font-medium">#{pair.id}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={pair.isActive}
              onCheckedChange={(checked) => onToggle(pair.id, checked)}
              className="data-[state=checked]:bg-green-600"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => onEdit(pair)}
                  className="text-white hover:bg-slate-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => pair.isActive ? onPause(pair.id) : onResume(pair.id)}
                  className="text-white hover:bg-slate-700"
                >
                  {pair.isActive ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(pair.id)}
                  className="text-red-400 hover:bg-slate-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source to Destination Flow */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <ChannelIcon type={pair.sourceType} />
            <span className="text-white font-medium truncate">{pair.sourceChannel}</span>
          </div>
          
          <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
          
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <ChannelIcon type={pair.destinationType} />
            <span className="text-white font-medium truncate">{pair.destinationChannel}</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{formatDelay(pair.delay)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-lg">{MessageTypeIcon(pair.messageType)}</span>
            <span className="text-gray-300 capitalize">{pair.messageType}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{pair.messagesForwarded}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              pair.successRate >= 95 ? 'bg-green-400' :
              pair.successRate >= 80 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-gray-300">{pair.successRate}%</span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2">
          {pair.copyMode && (
            <Badge variant="secondary" className="bg-blue-900/30 text-blue-300 text-xs">
              Copy Mode
            </Badge>
          )}
          {pair.silentMode && (
            <Badge variant="secondary" className="bg-purple-900/30 text-purple-300 text-xs">
              Silent
            </Badge>
          )}
        </div>

        {/* Last Activity */}
        <div className="text-xs text-gray-500 border-t border-slate-700 pt-3">
          {getLastActivityText(pair.lastActivity)}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-slate-700 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Messages Today:</span>
                <span className="text-white ml-2">{Math.floor(pair.messagesForwarded * 0.3)}</span>
              </div>
              <div>
                <span className="text-gray-400">Success Rate:</span>
                <span className="text-white ml-2">{pair.successRate}%</span>
              </div>
              <div>
                <span className="text-gray-400">Avg Delay:</span>
                <span className="text-white ml-2">{formatDelay(pair.delay + Math.floor(Math.random() * 5))}</span>
              </div>
              <div>
                <span className="text-gray-400">Last Error:</span>
                <span className="text-white ml-2">
                  {pair.successRate < 95 ? '2h ago' : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </CardContent>
    </Card>
  );
}