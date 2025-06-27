import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import ForwardingPairCard from '@/components/dashboard/forwarding-pair-card';
import NewPairModal from '@/components/modals/new-pair-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/auth';

export default function ForwardingPairs() {
  const [showNewPairModal, setShowNewPairModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Forwarding Pairs</h2>
              <p className="text-text-secondary">Manage your message forwarding configurations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowNewPairModal(true)}
                className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Forwarding Pair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
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

          {/* Forwarding Pairs List */}
          <div className="surface rounded-xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  All Forwarding Pairs ({filteredPairs.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              {filteredPairs.length > 0 ? (
                <div className="space-y-4">
                  {filteredPairs.map((pair: any) => (
                    <ForwardingPairCard
                      key={pair.id}
                      pair={pair}
                      onToggle={(id, isActive) => togglePairMutation.mutate({ id, isActive })}
                      onEdit={(pair) => {
                        // TODO: Implement edit functionality
                        console.log('Edit pair:', pair);
                      }}
                      onDelete={(id) => deletePairMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-text-secondary" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {searchQuery ? 'No matching forwarding pairs' : 'No forwarding pairs yet'}
                  </h3>
                  <p className="text-text-secondary mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Create your first forwarding pair to start auto-forwarding messages'
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowNewPairModal(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Forwarding Pair
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
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
