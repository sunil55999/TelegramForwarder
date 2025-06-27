import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, ArrowRightLeft, Send, CheckCircle, Users } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import StatsCard from '@/components/dashboard/stats-card';
import ForwardingPairCard from '@/components/dashboard/forwarding-pair-card';
import ActivityFeed from '@/components/dashboard/activity-feed';
import NewPairModal from '@/components/modals/new-pair-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/auth';

export default function Dashboard() {
  const [showNewPairModal, setShowNewPairModal] = useState(false);
  const { toast } = useToast();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch forwarding pairs
  const { data: pairs = [], isLoading: pairsLoading } = useQuery({
    queryKey: ['/api/forwarding-pairs'],
    queryFn: async () => {
      const response = await fetch('/api/forwarding-pairs', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pairs');
      return response.json();
    },
  });

  // Fetch activity logs
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      const response = await fetch('/api/activity-logs?limit=10', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
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
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      toast({
        title: 'Success',
        description: 'Forwarding pair deleted successfully',
      });
    },
  });

  if (statsLoading || pairsLoading || activitiesLoading) {
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
              <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
              <p className="text-text-secondary">Monitor your forwarding activity</p>
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
        <div className="flex-1 p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Active Pairs"
              value={stats?.activePairs || 0}
              icon={ArrowRightLeft}
              iconColor="bg-primary/20 text-primary"
              progress={{
                value: stats?.activePairs || 0,
                max: 3, // Free plan limit
                label: `${stats?.activePairs || 0}/3 used`,
              }}
            />
            <StatsCard
              title="Messages Today"
              value={stats?.messagesToday || 0}
              icon={Send}
              iconColor="bg-success/20 text-success"
              trend={{
                value: '+12% from yesterday',
                positive: true,
              }}
            />
            <StatsCard
              title="Success Rate"
              value={`${stats?.successRate || 0}%`}
              icon={CheckCircle}
              iconColor="bg-success/20 text-success"
              subtitle="All systems operational"
            />
            <StatsCard
              title="Connected Accounts"
              value={stats?.connectedAccounts || 0}
              icon={Users}
              iconColor="bg-warning/20 text-warning"
              subtitle="Telegram accounts"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forwarding Pairs */}
            <div className="lg:col-span-2 surface rounded-xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Active Forwarding Pairs</h3>
                  <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm">
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {pairs.length > 0 ? (
                  pairs.map((pair: any) => (
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ArrowRightLeft className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
                    <p className="text-text-secondary">No forwarding pairs created yet</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700">
                  <Button
                    onClick={() => setShowNewPairModal(true)}
                    variant="outline"
                    className="w-full border-dashed border-slate-600 text-text-secondary hover:text-text-primary hover:border-slate-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Forwarding Pair
                  </Button>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="surface rounded-xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
              </div>
              <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 text-left border-slate-700 hover:bg-slate-700"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Connect Account</p>
                  <p className="text-sm text-text-secondary">Add new Telegram account</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 text-left border-slate-700 hover:bg-slate-700"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">View Logs</p>
                  <p className="text-sm text-text-secondary">Check activity history</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 text-left border-slate-700 hover:bg-slate-700"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Settings</p>
                  <p className="text-sm text-text-secondary">Configure preferences</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 text-left border-slate-700 hover:bg-slate-700"
              >
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Upgrade Plan</p>
                  <p className="text-sm text-text-secondary">Get more features</p>
                </div>
              </Button>
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
