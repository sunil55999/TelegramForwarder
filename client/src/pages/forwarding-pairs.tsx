import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Filter, Layers, Zap, Activity } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import AttractiveChannelSelector from '@/components/attractive-channel-selector';
import AttractiveForwardingCard from '@/components/attractive-forwarding-card';
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Enhanced Header with Gradient */}
        <header className="relative bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Forwarding Management
              </h2>
              <p className="text-slate-400 mt-1">Create and manage your message forwarding configurations with style</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40 text-green-300 px-4 py-2">
                {enhancedPairs.filter((p: any) => p.isActive).length} Active Pairs
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40 text-blue-300 px-4 py-2">
                {enhancedPairs.length} Total Configured
              </Badge>
            </div>
          </div>
        </header>

        {/* Enhanced Content */}
        <div className="flex-1 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-700/50 p-1 rounded-xl">
              <TabsTrigger 
                value="existing" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-blue-500/30 data-[state=active]:text-white transition-all duration-300 rounded-lg"
              >
                <Layers className="w-4 h-4" />
                <span className="font-medium">Existing Pairs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="create" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border-green-500/30 data-[state=active]:text-white transition-all duration-300 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create New</span>
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

              {/* Enhanced Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-600/10 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300/80 font-medium mb-1">Active Pairs</p>
                      <p className="text-3xl font-bold text-white">
                        {enhancedPairs.filter((p: any) => p.isActive).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-300/80 font-medium mb-1">Total Pairs</p>
                      <p className="text-3xl font-bold text-white">{enhancedPairs.length}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-yellow-600/10 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-300/80 font-medium mb-1">Messages Today</p>
                      <p className="text-3xl font-bold text-white">
                        {enhancedPairs.reduce((sum: number, p: any) => sum + Math.floor(p.messagesForwarded * 0.3), 0).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-purple-600/10 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-slate-900 font-bold text-lg">%</span>
                      </div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-300/80 font-medium mb-1">Success Rate</p>
                      <p className="text-3xl font-bold text-white">
                        {Math.round(enhancedPairs.reduce((sum: number, p: any) => sum + p.successRate, 0) / enhancedPairs.length || 0)}%
                      </p>
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
                    <AttractiveForwardingCard
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

            {/* Enhanced Create New Pair Tab */}
            <TabsContent value="create" className="mt-8">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-green-500/5" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />
                <CardHeader className="relative">
                  <CardTitle className="text-white flex items-center space-x-3 text-2xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Create New Forwarding Pair
                    </span>
                  </CardTitle>
                  <p className="text-slate-400 mt-2 text-lg">
                    Select source and destination channels to create a new automated forwarding configuration
                  </p>
                </CardHeader>
                <CardContent className="relative p-8">
                  <AttractiveChannelSelector
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
