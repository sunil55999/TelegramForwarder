import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Users, 
  Crown, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Download,
  Upload,
  Trash2,
  Edit,
  MoreHorizontal,
  Calendar,
  Activity
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  telegramSessions: number;
  forwardingPairs: number;
  messagesForwarded: number;
  totalRevenue: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
}

interface UserFilters {
  search: string;
  plan: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UserManagement() {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    plan: 'all',
    status: 'all',
    dateRange: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', filters],
  });

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!user.username.toLowerCase().includes(searchLower) &&
            !user.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Plan filter
      if (filters.plan !== 'all' && user.plan !== filters.plan) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && user.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const userDate = new Date(user.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case '7days':
            if (daysDiff > 7) return false;
            break;
          case '30days':
            if (daysDiff > 30) return false;
            break;
          case '90days':
            if (daysDiff > 90) return false;
            break;
        }
      }

      return true;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof User];
      let bValue = b[filters.sortBy as keyof User];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [users, filters]);

  // Bulk operations
  const bulkUpdatePlanMutation = useMutation({
    mutationFn: ({ userIds, plan }: { userIds: number[]; plan: string }) =>
      apiRequest('POST', '/api/admin/users/bulk-update-plan', { userIds, plan }),
    onSuccess: () => {
      toast({ title: "Users updated successfully" });
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ userIds, status }: { userIds: number[]; status: string }) =>
      apiRequest('POST', '/api/admin/users/bulk-update-status', { userIds, status }),
    onSuccess: () => {
      toast({ title: "User status updated successfully" });
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const exportUsersMutation = useMutation({
    mutationFn: () => apiRequest('GET', '/api/admin/users/export'),
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Users exported successfully" });
    },
  });

  const handleUserSelect = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'suspended': return <Ban className="h-4 w-4" />;
      case 'banned': return <Trash2 className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-400">Manage users, plans, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportUsersMutation.mutate()}
            disabled={exportUsersMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bulk Actions ({selectedUsers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pro Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.plan === 'pro').length}</p>
              </div>
              <Crown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">${users.reduce((sum, u) => sum + u.totalRevenue, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>

            <Select value={filters.plan} onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="lastLogin">Last Login</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="plan">Plan</SelectItem>
                <SelectItem value="messagesForwarded">Messages</SelectItem>
                <SelectItem value="totalRevenue">Revenue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortOrder} onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && selectedUsers.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-plan">Change Plan:</Label>
                <Select onValueChange={(value) => bulkUpdatePlanMutation.mutate({ userIds: selectedUsers, plan: value })}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-status">Change Status:</Label>
                <Select onValueChange={(value) => bulkUpdateStatusMutation.mutate({ userIds: selectedUsers, status: value })}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Pairs</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanColor(user.plan)}>
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{user.telegramSessions}</TableCell>
                  <TableCell>{user.forwardingPairs}</TableCell>
                  <TableCell>{user.messagesForwarded.toLocaleString()}</TableCell>
                  <TableCell>${user.totalRevenue}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle>Edit User: {user.username}</DialogTitle>
                          <DialogDescription>
                            Update user plan, status, and permissions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Plan</Label>
                            <Select defaultValue={user.plan}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Select defaultValue={user.status}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="banned">Banned</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button>Save Changes</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="text-sm text-gray-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}