import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Users, CheckCircle, XCircle, Clock, ArrowRight, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  type: 'channel' | 'group' | 'supergroup';
  participantCount?: number;
  isChannel: boolean;
  isMegagroup: boolean;
  status: 'joined' | 'restricted' | 'left' | 'banned';
  lastUpdated: string;
}

interface ChannelSelectorProps {
  onChannelsPaired?: (sourceId: string, destinationId: string) => void;
  selectedSource?: string;
  selectedDestination?: string;
}

export default function JoinedChannelSelector({ 
  onChannelsPaired, 
  selectedSource, 
  selectedDestination 
}: ChannelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSourceChannel, setSelectedSourceChannel] = useState<string>(selectedSource || '');
  const [selectedDestinationChannel, setSelectedDestinationChannel] = useState<string>(selectedDestination || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'joined' | 'restricted' | 'left'>('all');

  const { data: channelsData, isLoading, refetch } = useQuery<{ channels: TelegramChannel[] }>({
    queryKey: ['/api/telegram/channels'],
    queryFn: () => apiRequest('GET', '/api/telegram/channels'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const channels = channelsData?.channels || [];

  // Filter channels based on search term and status
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (channel.username && channel.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || channel.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Separate channels by status for better organization
  const joinedChannels = filteredChannels.filter(c => c.status === 'joined');
  const restrictedChannels = filteredChannels.filter(c => c.status === 'restricted');
  const leftChannels = filteredChannels.filter(c => c.status === 'left');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'joined': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'restricted': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'left': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'joined': 'bg-green-500/20 text-green-400 border-green-500/50',
      'restricted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'left': 'bg-red-500/20 text-red-400 border-red-500/50',
      'banned': 'bg-red-600/20 text-red-300 border-red-600/50'
    };
    
    return (
      <Badge variant="outline" className={`${variants[status as keyof typeof variants]} text-xs`}>
        {status}
      </Badge>
    );
  };

  const handleChannelSelect = (channelId: string, type: 'source' | 'destination') => {
    if (type === 'source') {
      setSelectedSourceChannel(channelId);
    } else {
      setSelectedDestinationChannel(channelId);
    }
  };

  const handleCreatePair = () => {
    if (selectedSourceChannel && selectedDestinationChannel && onChannelsPaired) {
      onChannelsPaired(selectedSourceChannel, selectedDestinationChannel);
      setSelectedSourceChannel('');
      setSelectedDestinationChannel('');
    }
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const ChannelCard = ({ channel, isSelectable = false }: { channel: TelegramChannel, isSelectable?: boolean }) => {
    const isSourceSelected = selectedSourceChannel === channel.id;
    const isDestinationSelected = selectedDestinationChannel === channel.id;
    const isMultiSelected = selectedChannels.includes(channel.id);

    return (
      <div className={`
        p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSourceSelected ? 'border-blue-500 bg-blue-500/10' : ''}
        ${isDestinationSelected ? 'border-purple-500 bg-purple-500/10' : ''}
        ${isMultiSelected ? 'border-green-500 bg-green-500/10' : ''}
        ${!isSourceSelected && !isDestinationSelected && !isMultiSelected ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {isSelectable && (
              <Checkbox
                checked={isMultiSelected}
                onCheckedChange={() => toggleChannelSelection(channel.id)}
                className="border-gray-600"
              />
            )}
            
            <div className="flex items-center space-x-2">
              {getStatusIcon(channel.status)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{channel.title}</h4>
                {channel.username && (
                  <p className="text-sm text-gray-400">@{channel.username}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {channel.participantCount && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                <span>{channel.participantCount.toLocaleString()}</span>
              </div>
            )}
            {getStatusBadge(channel.status)}
          </div>
        </div>

        {/* Action buttons for pairing */}
        {!isSelectable && channel.status === 'joined' && (
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              variant={isSourceSelected ? "default" : "outline"}
              onClick={() => handleChannelSelect(channel.id, 'source')}
              className="text-xs"
            >
              Source
            </Button>
            <Button
              size="sm"
              variant={isDestinationSelected ? "default" : "outline"}
              onClick={() => handleChannelSelect(channel.id, 'destination')}
              className="text-xs"
            >
              Destination
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Channel Selector</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Refresh
            </Button>
          </div>

          {/* Status Filters */}
          <div className="flex space-x-2">
            {['all', 'joined', 'restricted', 'left'].map(status => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status as any)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Pairing Section */}
      {selectedSourceChannel && selectedDestinationChannel && (
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-xs text-blue-400">Source</p>
                  <p className="font-medium text-white">
                    {channels.find(c => c.id === selectedSourceChannel)?.title}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div className="text-center">
                  <p className="text-xs text-purple-400">Destination</p>
                  <p className="font-medium text-white">
                    {channels.find(c => c.id === selectedDestinationChannel)?.title}
                  </p>
                </div>
              </div>
              <Button onClick={handleCreatePair} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Pair
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Lists */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading channels...</div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No channels found. Try adjusting your search or status filter.
          </div>
        ) : (
          <>
            {/* Joined Channels */}
            {joinedChannels.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Joined Channels ({joinedChannels.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {joinedChannels.map(channel => (
                        <ChannelCard key={channel.id} channel={channel} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Restricted Channels */}
            {restrictedChannels.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Restricted Channels ({restrictedChannels.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {restrictedChannels.map(channel => (
                        <ChannelCard key={channel.id} channel={channel} isSelectable />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Left Channels */}
            {leftChannels.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center space-x-2">
                    <XCircle className="h-5 w-5" />
                    <span>Left Channels ({leftChannels.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {leftChannels.map(channel => (
                        <ChannelCard key={channel.id} channel={channel} isSelectable />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedChannels.length > 0 && (
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-400">
                {selectedChannels.length} channels selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Bulk Rejoin
                </Button>
                <Button variant="outline" size="sm">
                  Remove Selected
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedChannels([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}