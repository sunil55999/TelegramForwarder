import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Filter, Layers, Zap, Activity } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import ChannelSelector from '@/components/channel-selector';
import EnhancedForwardingCard from '@/components/enhanced-forwarding-card';
import NewPairModal from '@/components/modals/new-pair-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/auth';

// Mock channel data for development
const mockChannels = [
  {
    id: '1',
    name: 'TechNews Daily',
    type: 'public' as const,
    memberCount: 15420,
    status: 'joined' as const,
    lastActivity: '2 min ago'
  },
  {
    id: '2',
    name: 'Crypto Signals',
    type: 'private' as const,
    memberCount: 8934,
    status: 'joined' as const,
    lastActivity: '5 min ago'
  },
  {
    id: '3',
    name: 'Marketing Team',
    type: 'group' as const,
    memberCount: 24,
    status: 'joined' as const,
    lastActivity: '1 hour ago'
  },
  {
    id: '4',
    name: 'Breaking News',
    type: 'public' as const,
    memberCount: 45230,
    status: 'joined' as const,
    lastActivity: '30 sec ago'
  },
  {
    id: '5',
    name: 'Private Updates',
    type: 'private' as const,
    memberCount: 156,
    status: 'restricted' as const,
    lastActivity: '1 day ago'
  },
  {
    id: '6',
    name: 'Development Team',
    type: 'group' as const,
    memberCount: 12,
    status: 'left' as const,
    lastActivity: '3 days ago'
  }
];

export default function ForwardingPairs() {
  const [showNewPairModal, setShowNewPairModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('existing');
  const { toast } = useToast();

  // Fetch forwarding pairs
  const { data: pairs = [], isLoading } = useQuery({
    queryKey: ['/api/forwarding-pairs'],
    queryFn: async () => {
      const response = await fetch('/api/forwarding-pairs', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pairs');
      return response.json();
    },
  });

  // Create new forwarding pair
  const createPairMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/forwarding-pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      toast({
        title: 'Success',
        description: 'Forwarding pair created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle pair status
  const togglePairMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/forwarding-pairs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update pair');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
    },
  });

  // Delete pair
  const deletePairMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/forwarding-pairs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to delete pair');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      toast({
        title: 'Success',
        description: 'Forwarding pair deleted successfully',
      });
    },
  });

  // Filter pairs based on search query
  const filteredPairs = pairs.filter((pair: any) =>
    pair.sourceChannel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.destinationChannel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // Enhanced pair data transformation for display
  const enhancedPairs = pairs.map((pair: any) => ({
    ...pair,
    messageType: 'all' as const,
    messagesForwarded: Math.floor(Math.random() * 1000) + 100,
    successRate: Math.floor(Math.random() * 20) + 80,
    sourceType: mockChannels.find(c => c.name === pair.sourceChannel)?.type || 'public',
    destinationType: mockChannels.find(c => c.name === pair.destinationChannel)?.type || 'public'
  }));

  const handleCreatePair = () => {
    if (selectedSources.length > 0 && selectedDestinations.length > 0) {
      const sourceChannel = mockChannels.find(c => c.id === selectedSources[0])?.name || 'Unknown';
      const destinationChannel = mockChannels.find(c => c.id === selectedDestinations[0])?.name || 'Unknown';
      
      createPairMutation.mutate({
        sourceChannel,
        destinationChannel,
        delay: 0,
        copyMode: false,
        silentMode: false
      });
      
      setSelectedSources([]);
      setSelectedDestinations([]);
    }
  };

  const handlePairToggle = (id: number, isActive: boolean) => {
    togglePairMutation.mutate({ id, isActive });
  };

  const handlePairEdit = (pair: any) => {
    setShowNewPairModal(true);
  };

  const handlePairDelete = (id: number) => {
    deletePairMutation.mutate(id);
  };

  const handlePairPause = (id: number) => {
    togglePairMutation.mutate({ id, isActive: false });
  };

  const handlePairResume = (id: number) => {
    togglePairMutation.mutate({ id, isActive: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Forwarding Management</h2>
              <p className="text-text-secondary">Create and manage your message forwarding configurations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                {enhancedPairs.filter((p: any) => p.isActive).length} Active
              </Badge>
              <Badge variant="outline" className="border-slate-500 text-slate-400">
                {enhancedPairs.length} Total
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="existing" className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Existing Pairs</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </TabsTrigger>
            </TabsList>

            {/* Existing Pairs Tab */}
            <TabsContent value="existing" className="mt-6">
              {/* Search and Filters */}
              <div className="mb-6 flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <Input
                    placeholder="Search forwarding pairs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-text-primary placeholder-text-secondary"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-slate-600 text-text-secondary hover:text-text-primary"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Active Pairs</p>
                        <p className="text-2xl font-bold text-white">
                          {enhancedPairs.filter((p: any) => p.isActive).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Layers className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Total Pairs</p>
                        <p className="text-2xl font-bold text-white">{enhancedPairs.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Messages Today</p>
                        <p className="text-2xl font-bold text-white">
                          {enhancedPairs.reduce((sum: number, p: any) => sum + Math.floor(p.messagesForwarded * 0.3), 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-slate-900 font-bold text-sm">%</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Success Rate</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(enhancedPairs.reduce((sum: number, p: any) => sum + p.successRate, 0) / enhancedPairs.length || 0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Forwarding Pairs List */}
              {filteredPairs.length > 0 ? (
                <div className="space-y-4">
                  {enhancedPairs.filter((pair: any) =>
                    pair.sourceChannel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pair.destinationChannel.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((pair: any) => (
                    <EnhancedForwardingCard
                      key={pair.id}
                      pair={pair}
                      onToggle={handlePairToggle}
                      onEdit={handlePairEdit}
                      onDelete={handlePairDelete}
                      onPause={handlePairPause}
                      onResume={handlePairResume}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-12 text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">No forwarding pairs found</h3>
                    <p className="text-gray-400 mb-6">Create your first forwarding pair to get started</p>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Forwarding Pair
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Create New Pair Tab */}
            <TabsContent value="create" className="mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create New Forwarding Pair</span>
                  </CardTitle>
                  <p className="text-gray-400">
                    Select source and destination channels to create a new forwarding pair
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <ChannelSelector
                    channels={mockChannels}
                    selectedSources={selectedSources}
                    selectedDestinations={selectedDestinations}
                    onSourceSelect={setSelectedSources}
                    onDestinationSelect={setSelectedDestinations}
                    onCreatePair={handleCreatePair}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <NewPairModal
        open={showNewPairModal}
        onOpenChange={setShowNewPairModal}
        onSubmit={(data) => createPairMutation.mutateAsync(data)}
      />
    </div>
  );
}
