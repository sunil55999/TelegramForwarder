import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowRight, 
  Settings, 
  Trash2, 
  Play, 
  Pause,
  Activity,
  Clock,
  MessageCircle,
  TrendingUp,
  Hash,
  Users,
  Lock
} from "lucide-react";

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

interface AttractiveForwardingCardProps {
  pair: ForwardingPair;
  onToggle: (id: number, isActive: boolean) => void;
  onEdit: (pair: ForwardingPair) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}

function ChannelTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'public':
      return <Hash className="w-4 h-4 text-blue-400" />;
    case 'private':
      return <Lock className="w-4 h-4 text-purple-400" />;
    case 'group':
      return <Users className="w-4 h-4 text-green-400" />;
    default:
      return <MessageCircle className="w-4 h-4 text-gray-400" />;
  }
}

function StatusIndicator({ isActive, successRate }: { isActive: boolean; successRate: number }) {
  if (!isActive) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-xs text-gray-400">Paused</span>
      </div>
    );
  }

  if (successRate >= 95) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-green-400">Active</span>
      </div>
    );
  } else if (successRate >= 80) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        <span className="text-xs text-yellow-400">Issues</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        <span className="text-xs text-red-400">Error</span>
      </div>
    );
  }
}

export default function AttractiveForwardingCard({
  pair,
  onToggle,
  onEdit,
  onDelete,
  onPause,
  onResume
}: AttractiveForwardingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDelay = (delay: number) => {
    if (delay === 0) return 'Instant';
    if (delay < 60) return `${delay}s`;
    if (delay < 3600) return `${Math.floor(delay / 60)}m`;
    return `${Math.floor(delay / 3600)}h`;
  };

  return (
    <Card 
      className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border border-slate-700/50 hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      
      <CardContent className="relative p-6">
        {/* Main Channel Flow */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            {/* Source Channel */}
            <div className="relative group/source">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/40 rounded-2xl p-4 min-w-[160px] transform group-hover/source:scale-105 transition-transform duration-300">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-300 font-medium uppercase tracking-wide">Source Channel</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ChannelTypeIcon type={pair.sourceType} />
                  <span className="text-white font-semibold truncate">
                    {pair.sourceChannel}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Animated Arrow Flow */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  <ArrowRight className="w-8 h-8 text-blue-400 transform group-hover:translate-x-1 transition-transform duration-300" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-150" />
                </div>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                <span className="text-xs text-green-300 font-medium">Auto-forwarding active</span>
              </div>
            </div>
            
            {/* Destination Channel */}
            <div className="relative group/dest">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/30 border border-blue-500/40 rounded-2xl p-4 min-w-[160px] transform group-hover/dest:scale-105 transition-transform duration-300">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-xs text-blue-300 font-medium uppercase tracking-wide">Destination</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ChannelTypeIcon type={pair.destinationType} />
                  <span className="text-white font-semibold truncate">
                    {pair.destinationChannel}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex flex-col items-end space-y-2">
            <StatusIndicator isActive={pair.isActive} successRate={pair.successRate} />
            <Badge 
              variant={pair.isActive ? "default" : "secondary"}
              className={`${
                pair.isActive 
                  ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 text-green-300" 
                  : "bg-slate-700/50 border-slate-600 text-slate-400"
              }`}
            >
              {pair.successRate}% Success
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Messages</span>
            </div>
            <span className="text-white font-semibold">{pair.messagesForwarded.toLocaleString()}</span>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Delay</span>
            </div>
            <span className="text-white font-semibold">{formatDelay(pair.delay)}</span>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Rate</span>
            </div>
            <span className="text-white font-semibold">{pair.successRate}%</span>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Status</span>
            </div>
            <span className="text-white font-semibold">{pair.isActive ? 'Active' : 'Paused'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={pair.isActive}
                onCheckedChange={(checked) => onToggle(pair.id, checked)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-blue-500"
              />
              <span className="text-sm text-slate-300">
                {pair.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            
            {pair.copyMode && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                Copy Mode
              </Badge>
            )}
            
            {pair.silentMode && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Silent
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {pair.isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(pair.id)}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResume(pair.id)}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(pair)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(pair.id)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}