import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  ArrowRight, 
  Hash, 
  Users, 
  Lock, 
  Radio,
  CheckCircle,
  Circle,
  Zap
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  memberCount?: number;
  status: 'joined' | 'left' | 'restricted';
  lastActivity?: string;
}

interface AttractiveChannelSelectorProps {
  channels: Channel[];
  selectedSources: string[];
  selectedDestinations: string[];
  onSourceSelect: (channelIds: string[]) => void;
  onDestinationSelect: (channelIds: string[]) => void;
  onCreatePair: () => void;
}

function ChannelIcon({ type, status }: { type: string; status: string }) {
  const baseClass = "w-5 h-5";
  
  if (status === 'restricted') {
    return <Lock className={`${baseClass} text-red-400`} />;
  }
  
  switch (type) {
    case 'public':
      return <Hash className={`${baseClass} text-blue-400`} />;
    case 'private':
      return <Lock className={`${baseClass} text-purple-400`} />;
    case 'group':
      return <Users className={`${baseClass} text-green-400`} />;
    default:
      return <Radio className={`${baseClass} text-gray-400`} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'joined':
      return (
        <Badge className="bg-green-500/20 border-green-500/30 text-green-300 text-xs">
          Joined
        </Badge>
      );
    case 'left':
      return (
        <Badge className="bg-gray-500/20 border-gray-500/30 text-gray-300 text-xs">
          Left
        </Badge>
      );
    case 'restricted':
      return (
        <Badge className="bg-red-500/20 border-red-500/30 text-red-300 text-xs">
          Restricted
        </Badge>
      );
    default:
      return null;
  }
}

function ChannelCard({ 
  channel, 
  isSelected, 
  onSelect, 
  variant = 'source' 
}: { 
  channel: Channel; 
  isSelected: boolean; 
  onSelect: (selected: boolean) => void;
  variant?: 'source' | 'destination';
}) {
  const gradientClass = variant === 'source' 
    ? 'from-emerald-500/10 to-green-600/20' 
    : 'from-blue-500/10 to-purple-600/20';
  
  const borderClass = variant === 'source'
    ? 'border-emerald-500/30'
    : 'border-blue-500/30';
    
  const selectedBorderClass = variant === 'source'
    ? 'border-emerald-400/60'
    : 'border-blue-400/60';

  return (
    <Card 
      className={`
        relative overflow-hidden bg-gradient-to-br ${gradientClass} 
        border ${isSelected ? selectedBorderClass : borderClass}
        hover:border-opacity-60 transition-all duration-300 cursor-pointer group
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-400/30' : ''}
      `}
      onClick={() => onSelect(!isSelected)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isSelected ? (
                <CheckCircle className="w-5 h-5 text-blue-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400" />
              )}
              <ChannelIcon type={channel.type} status={channel.status} />
            </div>
            <StatusBadge status={channel.status} />
          </div>
        </div>
        
        <div className="mb-2">
          <h4 className="font-semibold text-white truncate">{channel.name}</h4>
          {channel.memberCount && (
            <p className="text-sm text-slate-400">{channel.memberCount.toLocaleString()} members</p>
          )}
        </div>
        
        {channel.lastActivity && (
          <p className="text-xs text-slate-500">Last activity: {channel.lastActivity}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AttractiveChannelSelector({
  channels,
  selectedSources,
  selectedDestinations,
  onSourceSelect,
  onDestinationSelect,
  onCreatePair
}: AttractiveChannelSelectorProps) {
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");

  const filteredSourceChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(sourceSearch.toLowerCase()) &&
    channel.status === 'joined'
  );

  const filteredDestChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(destSearch.toLowerCase()) &&
    channel.status === 'joined'
  );

  const handleSourceSelect = (channelId: string, selected: boolean) => {
    if (selected) {
      onSourceSelect([...selectedSources, channelId]);
    } else {
      onSourceSelect(selectedSources.filter(id => id !== channelId));
    }
  };

  const handleDestSelect = (channelId: string, selected: boolean) => {
    if (selected) {
      onDestinationSelect([...selectedDestinations, channelId]);
    } else {
      onDestinationSelect(selectedDestinations.filter(id => id !== channelId));
    }
  };

  const canCreatePair = selectedSources.length > 0 && selectedDestinations.length > 0;

  return (
    <div className="space-y-8">
      {/* Three Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Source Channels */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Source Channels</h3>
              <p className="text-sm text-slate-400">Select channels to forward from</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search source channels..."
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredSourceChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isSelected={selectedSources.includes(channel.id)}
                onSelect={(selected) => handleSourceSelect(channel.id, selected)}
                variant="source"
              />
            ))}
          </div>
          
          {selectedSources.length > 0 && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-sm text-emerald-300">
                {selectedSources.length} source channel{selectedSources.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Center Flow Indicator */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-blue-500/20 rounded-full animate-ping" />
          </div>
          
          <div className="text-center">
            <h4 className="text-white font-medium">Auto-Forward Flow</h4>
            <p className="text-sm text-slate-400">Messages will be forwarded automatically</p>
          </div>
          
          {canCreatePair && (
            <Button
              onClick={onCreatePair}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Forwarding Pair
            </Button>
          )}
        </div>

        {/* Destination Channels */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Destination Channels</h3>
              <p className="text-sm text-slate-400">Select channels to forward to</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search destination channels..."
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredDestChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isSelected={selectedDestinations.includes(channel.id)}
                onSelect={(selected) => handleDestSelect(channel.id, selected)}
                variant="destination"
              />
            ))}
          </div>
          
          {selectedDestinations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                {selectedDestinations.length} destination channel{selectedDestinations.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(selectedSources.length > 0 || selectedDestinations.length > 0) && (
        <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50">
          <CardContent className="p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Selection Summary</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Source Channels:</p>
                <div className="space-y-1">
                  {selectedSources.map(sourceId => {
                    const channel = channels.find(c => c.id === sourceId);
                    return channel ? (
                      <Badge key={sourceId} className="bg-emerald-500/20 text-emerald-300 mr-2">
                        {channel.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Destination Channels:</p>
                <div className="space-y-1">
                  {selectedDestinations.map(destId => {
                    const channel = channels.find(c => c.id === destId);
                    return channel ? (
                      <Badge key={destId} className="bg-blue-500/20 text-blue-300 mr-2">
                        {channel.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}