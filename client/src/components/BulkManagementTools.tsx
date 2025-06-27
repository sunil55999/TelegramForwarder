import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckSquare, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  Settings,
  AlertCircle,
  Clock,
  Copy
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ForwardingPair {
  id: number;
  sourceChannelTitle: string;
  destinationChannelTitle: string;
  isActive: boolean;
  status: 'active' | 'paused' | 'stopped' | 'error';
  delayMin: number;
  delayMax: number;
  copyMode: boolean;
  silentMode: boolean;
}

interface BulkManagementToolsProps {
  pairs: ForwardingPair[];
  selectedPairs: number[];
  onSelectionChange: (pairIds: number[]) => void;
  onUpdate?: () => void;
}

export default function BulkManagementTools({ 
  pairs, 
  selectedPairs, 
  onSelectionChange, 
  onUpdate 
}: BulkManagementToolsProps) {
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showBulkSettings, setShowBulkSettings] = useState(false);
  const [bulkAddData, setBulkAddData] = useState({
    sourceChannels: '',
    destinationChannels: '',
    delayMin: 0,
    delayMax: 0,
    copyMode: true,
    silentMode: false
  });

  const [bulkSettings, setBulkSettings] = useState({
    delayMin: 0,
    delayMax: 0,
    copyMode: true,
    silentMode: false,
    applyDelay: false,
    applyCopyMode: false,
    applySilentMode: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAllSelected = pairs.length > 0 && selectedPairs.length === pairs.length;
  const isPartiallySelected = selectedPairs.length > 0 && selectedPairs.length < pairs.length;

  // Bulk action mutations
  const bulkPauseMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/forwarding-pairs/bulk/pause', { pairIds: selectedPairs }),
    onSuccess: () => {
      toast({ title: `${selectedPairs.length} pairs paused successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onUpdate?.();
    }
  });

  const bulkResumeMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/forwarding-pairs/bulk/resume', { pairIds: selectedPairs }),
    onSuccess: () => {
      toast({ title: `${selectedPairs.length} pairs resumed successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onUpdate?.();
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/forwarding-pairs/bulk', { pairIds: selectedPairs }),
    onSuccess: () => {
      toast({ title: `${selectedPairs.length} pairs deleted successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      onSelectionChange([]);
      onUpdate?.();
    }
  });

  const bulkAddMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/forwarding-pairs/bulk/create', data),
    onSuccess: (result: any) => {
      toast({ title: `${result.created} pairs created successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      setShowBulkAdd(false);
      setBulkAddData({
        sourceChannels: '',
        destinationChannels: '',
        delayMin: 0,
        delayMax: 0,
        copyMode: true,
        silentMode: false
      });
      onUpdate?.();
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/forwarding-pairs/bulk/update', { 
      pairIds: selectedPairs, 
      ...data 
    }),
    onSuccess: () => {
      toast({ title: `${selectedPairs.length} pairs updated successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-pairs'] });
      setShowBulkSettings(false);
      onUpdate?.();
    }
  });

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(pairs.map(p => p.id));
    }
  };

  const handleBulkAdd = () => {
    const sourceChannels = bulkAddData.sourceChannels.split('\n').filter(s => s.trim());
    const destinationChannels = bulkAddData.destinationChannels.split('\n').filter(s => s.trim());

    if (sourceChannels.length === 0 || destinationChannels.length === 0) {
      toast({ 
        title: "Invalid input", 
        description: "Please provide at least one source and destination channel",
        variant: "destructive" 
      });
      return;
    }

    const pairsToCreate = [];
    for (const source of sourceChannels) {
      for (const destination of destinationChannels) {
        pairsToCreate.push({
          sourceChannel: source.trim(),
          destinationChannel: destination.trim(),
          delayMin: bulkAddData.delayMin,
          delayMax: bulkAddData.delayMax,
          copyMode: bulkAddData.copyMode,
          silentMode: bulkAddData.silentMode
        });
      }
    }

    bulkAddMutation.mutate({ pairs: pairsToCreate });
  };

  const handleBulkUpdate = () => {
    const updates: any = {};
    
    if (bulkSettings.applyDelay) {
      updates.delayMin = bulkSettings.delayMin;
      updates.delayMax = bulkSettings.delayMax;
    }
    
    if (bulkSettings.applyCopyMode) {
      updates.copyMode = bulkSettings.copyMode;
    }
    
    if (bulkSettings.applySilentMode) {
      updates.silentMode = bulkSettings.silentMode;
    }

    if (Object.keys(updates).length === 0) {
      toast({ 
        title: "No changes selected", 
        description: "Please select at least one setting to update",
        variant: "destructive" 
      });
      return;
    }

    bulkUpdateMutation.mutate(updates);
  };

  const exportPairs = () => {
    const selectedPairData = pairs.filter(p => selectedPairs.includes(p.id));
    const csvContent = [
      'Source Channel,Destination Channel,Status,Delay Min,Delay Max,Copy Mode,Silent Mode',
      ...selectedPairData.map(p => 
        `${p.sourceChannelTitle},${p.destinationChannelTitle},${p.status},${p.delayMin},${p.delayMax},${p.copyMode},${p.silentMode}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forwarding-pairs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Pairs exported successfully" });
  };

  const getStatusCounts = () => {
    const selected = pairs.filter(p => selectedPairs.includes(p.id));
    return {
      active: selected.filter(p => p.status === 'active').length,
      paused: selected.filter(p => p.status === 'paused').length,
      stopped: selected.filter(p => p.status === 'stopped').length,
      error: selected.filter(p => p.status === 'error').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isPartiallySelected}
                onCheckedChange={handleSelectAll}
                className="border-gray-600"
              />
              <div>
                <CardTitle className="text-sm">
                  {selectedPairs.length === 0 
                    ? `Select from ${pairs.length} pairs`
                    : `${selectedPairs.length} of ${pairs.length} pairs selected`
                  }
                </CardTitle>
                {selectedPairs.length > 0 && (
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                      {statusCounts.active} active
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      {statusCounts.paused} paused
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/50">
                      {statusCounts.error} error
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              {/* Bulk Add Dialog */}
              <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Bulk Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Bulk Add Forwarding Pairs</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create multiple forwarding pairs at once
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Source Channels (one per line)</Label>
                        <Textarea
                          placeholder="@channel1&#10;@channel2&#10;channel_id_3"
                          value={bulkAddData.sourceChannels}
                          onChange={(e) => setBulkAddData(prev => ({ ...prev, sourceChannels: e.target.value }))}
                          className="bg-gray-800 border-gray-600 text-white h-32"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Destination Channels (one per line)</Label>
                        <Textarea
                          placeholder="@dest1&#10;@dest2&#10;dest_id_3"
                          value={bulkAddData.destinationChannels}
                          onChange={(e) => setBulkAddData(prev => ({ ...prev, destinationChannels: e.target.value }))}
                          className="bg-gray-800 border-gray-600 text-white h-32"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Min Delay (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={bulkAddData.delayMin}
                          onChange={(e) => setBulkAddData(prev => ({ ...prev, delayMin: parseInt(e.target.value) || 0 }))}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Max Delay (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={bulkAddData.delayMax}
                          onChange={(e) => setBulkAddData(prev => ({ ...prev, delayMax: parseInt(e.target.value) || 0 }))}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowBulkAdd(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkAdd} disabled={bulkAddMutation.isPending}>
                      Create Pairs
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" onClick={exportPairs} disabled={selectedPairs.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Bulk Actions */}
        {selectedPairs.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => bulkResumeMutation.mutate()}
                  disabled={bulkResumeMutation.isPending || statusCounts.active === selectedPairs.length}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume All
                </Button>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => bulkPauseMutation.mutate()}
                  disabled={bulkPauseMutation.isPending || statusCounts.paused === selectedPairs.length}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause All
                </Button>

                <Dialog open={showBulkSettings} onOpenChange={setShowBulkSettings}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Bulk Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Bulk Update Settings</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Apply settings to {selectedPairs.length} selected pairs
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={bulkSettings.applyDelay}
                            onCheckedChange={(checked) => setBulkSettings(prev => ({ ...prev, applyDelay: !!checked }))}
                          />
                          <Label className="text-white">Update Delay Settings</Label>
                        </div>
                        {bulkSettings.applyDelay && (
                          <div className="grid grid-cols-2 gap-3 ml-6">
                            <div>
                              <Label className="text-xs text-gray-400">Min (seconds)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={bulkSettings.delayMin}
                                onChange={(e) => setBulkSettings(prev => ({ ...prev, delayMin: parseInt(e.target.value) || 0 }))}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">Max (seconds)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={bulkSettings.delayMax}
                                onChange={(e) => setBulkSettings(prev => ({ ...prev, delayMax: parseInt(e.target.value) || 0 }))}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator className="bg-gray-700" />

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={bulkSettings.applyCopyMode}
                            onCheckedChange={(checked) => setBulkSettings(prev => ({ ...prev, applyCopyMode: !!checked }))}
                          />
                          <Label className="text-white">Update Copy Mode</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={bulkSettings.applySilentMode}
                            onCheckedChange={(checked) => setBulkSettings(prev => ({ ...prev, applySilentMode: !!checked }))}
                          />
                          <Label className="text-white">Update Silent Mode</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowBulkSettings(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpdate} disabled={bulkUpdateMutation.isPending}>
                        Update Pairs
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate()}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      {selectedPairs.length === 0 && (
        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Select pairs above to access bulk management tools</p>
              <p className="text-xs mt-1">Use the checkboxes to select individual pairs or select all</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}