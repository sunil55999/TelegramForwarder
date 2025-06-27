import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  Edit3, 
  Settings, 
  Clock, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ForwardingPair {
  id: number;
  userId: number;
  sourceChannelId: string;
  sourceChannelTitle: string;
  destinationChannelId: string;
  destinationChannelTitle: string;
  isActive: boolean;
  delayMin: number;
  delayMax: number;
  copyMode: boolean;
  silentMode: boolean;
  lastForwardedAt?: string;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  status: 'active' | 'paused' | 'stopped' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface PerPairTaskControlsProps {
  pair: ForwardingPair;
  onUpdate?: () => void;
}

export default function PerPairTaskControls({ pair, onUpdate }: PerPairTaskControlsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    delayMin: pair.delayMin,
    delayMax: pair.delayMax,
    copyMode: pair.copyMode,
    silentMode: pair.silentMode,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Status mutations
  const pauseMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/forwarding-pairs/${pair.id}/pause`),
    onSuccess: () => {
      toast({ title: "Pair paused successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to pause pair", variant: "destructive" });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/forwarding-pairs/${pair.id}/resume`),
    onSuccess: () => {
      toast({ title: "Pair resumed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to resume pair", variant: "destructive" });
    }
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/forwarding-pairs/${pair.id}/stop`),
    onSuccess: () => {
      toast({ title: "Pair stopped successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to stop pair", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/forwarding-pairs/${pair.id}`, data),
    onSuccess: () => {
      toast({ title: "Pair settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      setIsEditing(false);
      onUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to update pair settings", variant: "destructive" });
    }
  });

  const handleSaveSettings = () => {
    updateMutation.mutate(editData);
  };

  const getStatusBadge = () => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle },
      paused: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: Pause },
      stopped: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: Square },
      error: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle },
    };

    const config = statusConfig[pair.status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{pair.status}</span>
      </Badge>
    );
  };

  const getSuccessRate = () => {
    if (pair.totalMessages === 0) return 0;
    return Math.round((pair.successfulMessages / pair.totalMessages) * 100);
  };

  const formatDelay = () => {
    if (pair.delayMin === 0 && pair.delayMax === 0) return 'Instant';
    if (pair.delayMin === pair.delayMax) return `${pair.delayMin}s`;
    return `${pair.delayMin}-${pair.delayMax}s`;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">{pair.sourceChannelTitle}</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <span className="text-purple-400">{pair.destinationChannelTitle}</span>
            </div>
          </CardTitle>
          {getStatusBadge()}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span>{pair.totalMessages} total</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>{getSuccessRate()}% success</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDelay()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        {pair.status === 'error' && pair.errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="text-xs text-red-300">{pair.errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center space-x-2">
          {pair.status === 'paused' || pair.status === 'stopped' ? (
            <Button 
              size="sm" 
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>

          {/* Settings Dialog */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Pair Settings</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modify forwarding behavior for this pair
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Delay Settings */}
                <div className="space-y-3">
                  <Label className="text-white">Forwarding Delay</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Min (seconds)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editData.delayMin}
                        onChange={(e) => setEditData(prev => ({ ...prev, delayMin: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Max (seconds)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editData.delayMax}
                        onChange={(e) => setEditData(prev => ({ ...prev, delayMax: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Mode Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Copy Mode</Label>
                      <p className="text-xs text-gray-400">Forward messages exactly as they are</p>
                    </div>
                    <Switch
                      checked={editData.copyMode}
                      onCheckedChange={(checked) => setEditData(prev => ({ ...prev, copyMode: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Silent Mode</Label>
                      <p className="text-xs text-gray-400">Forward without notifications</p>
                    </div>
                    <Switch
                      checked={editData.silentMode}
                      onCheckedChange={(checked) => setEditData(prev => ({ ...prev, silentMode: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-400">{pair.successfulMessages}</p>
            <p className="text-xs text-gray-500">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-400">{pair.failedMessages}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-400">{pair.totalMessages}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>

        {/* Last Activity */}
        {pair.lastForwardedAt && (
          <div className="text-xs text-gray-500 text-center">
            Last forwarded: {new Date(pair.lastForwardedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}