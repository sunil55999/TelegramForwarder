import { useState, useMemo } from 'react';
import { Search, Hash, Users, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  memberCount?: number;
  status: 'joined' | 'left' | 'restricted';
  lastActivity?: string;
}

interface ChannelSelectorProps {
  channels: Channel[];
  selectedSources: string[];
  selectedDestinations: string[];
  onSourceSelect: (channelIds: string[]) => void;
  onDestinationSelect: (channelIds: string[]) => void;
  onCreatePair: () => void;
}

function ChannelIcon({ type, status }: { type: string; status: string }) {
  const getIcon = () => {
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
  };

  const getColor = () => {
    switch (status) {
      case 'joined':
        return 'text-green-400';
      case 'restricted':
        return 'text-yellow-400';
      case 'left':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return <div className={getColor()}>{getIcon()}</div>;
}

function ChannelItem({ 
  channel, 
  isSelected, 
  onToggle,
  disabled = false 
}: { 
  channel: Channel; 
  isSelected: boolean; 
  onToggle: (channelId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div 
      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onToggle(channel.id)}
    >
      <Checkbox 
        checked={isSelected}
        onChange={() => !disabled && onToggle(channel.id)}
        disabled={disabled}
      />
      
      <ChannelIcon type={channel.type} status={channel.status} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium truncate">{channel.name}</span>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              channel.status === 'joined' 
                ? 'border-green-500 text-green-400' 
                : channel.status === 'restricted'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-red-500 text-red-400'
            }`}
          >
            {channel.status}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
          {channel.memberCount && (
            <span>{channel.memberCount.toLocaleString()} members</span>
          )}
          {channel.lastActivity && (
            <span>{channel.lastActivity}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChannelSelector({
  channels,
  selectedSources,
  selectedDestinations,
  onSourceSelect,
  onDestinationSelect,
  onCreatePair
}: ChannelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredChannels = useMemo(() => {
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [channels, searchTerm]);

  const availableChannels = filteredChannels.filter(c => c.status === 'joined');

  const handleSourceToggle = (channelId: string) => {
    const newSelection = selectedSources.includes(channelId)
      ? selectedSources.filter(id => id !== channelId)
      : [...selectedSources, channelId];
    onSourceSelect(newSelection);
  };

  const handleDestinationToggle = (channelId: string) => {
    const newSelection = selectedDestinations.includes(channelId)
      ? selectedDestinations.filter(id => id !== channelId)
      : [...selectedDestinations, channelId];
    onDestinationSelect(newSelection);
  };

  const getSelectedChannelNames = (selectedIds: string[]) => {
    return selectedIds
      .map(id => channels.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const canCreatePair = selectedSources.length > 0 && selectedDestinations.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Source Channels */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Hash className="w-5 h-5" />
            <span>Source Channels</span>
          </CardTitle>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {availableChannels.map(channel => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isSelected={selectedSources.includes(channel.id)}
              onToggle={handleSourceToggle}
              disabled={selectedDestinations.includes(channel.id)}
            />
          ))}
          
          {availableChannels.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Hash className="w-8 h-8 mx-auto mb-2" />
              <p>No available channels found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Center Panel - Visual Connector */}
      <div className="flex flex-col justify-center items-center space-y-6">
        {/* Selected Sources */}
        <div className="w-full">
          <h3 className="text-white font-medium mb-2">Selected Sources</h3>
          <Card className="bg-slate-800/50 border-slate-700 min-h-20">
            <CardContent className="p-4">
              {selectedSources.length > 0 ? (
                <div className="text-sm text-gray-300">
                  {getSelectedChannelNames(selectedSources)}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Select source channels</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-8 h-8 text-blue-400" />
        </div>

        {/* Selected Destinations */}
        <div className="w-full">
          <h3 className="text-white font-medium mb-2">Selected Destinations</h3>
          <Card className="bg-slate-800/50 border-slate-700 min-h-20">
            <CardContent className="p-4">
              {selectedDestinations.length > 0 ? (
                <div className="text-sm text-gray-300">
                  {getSelectedChannelNames(selectedDestinations)}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Select destination channels</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Pair Button */}
        <Button 
          onClick={onCreatePair}
          disabled={!canCreatePair}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          Create Forwarding Pair
        </Button>
      </div>

      {/* Right Panel - Destination Channels */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Destination Channels</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {availableChannels.map(channel => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isSelected={selectedDestinations.includes(channel.id)}
              onToggle={handleDestinationToggle}
              disabled={selectedSources.includes(channel.id)}
            />
          ))}
          
          {availableChannels.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p>No available channels found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}