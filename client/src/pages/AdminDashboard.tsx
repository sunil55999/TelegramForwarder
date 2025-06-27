import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Server, 
  Play, 
  Pause, 
  RotateCcw,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Wifi,
  MessageSquare
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, removeAdminToken } from "@/lib/adminAuth";
import { useLocation } from "wouter";
import UserManagement from "@/components/UserManagement";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import SystemMonitoring from "@/components/SystemMonitoring";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalPairs: number;
  activePairs: number;
  messagesForwarded: number;
  queueLength: number;
  errorCount: number;
  revenue: number;
}

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
}

interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: string;
    telegram: string;
    queue: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    sessions: {
      totalSessions: number;
      healthySessions: number;
      unhealthySessions: number;
      averageErrorRate: number;
    };
    errors: {
      total: number;
      resolved: number;
      unresolved: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      autoRecoverable: number;
    };
  };
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    removeAdminToken();
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
    setLocation('/admin/login');
  };

  // Fetch admin dashboard data using admin authentication
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard'],
    queryFn: () => adminApiRequest('GET', '/api/admin/dashboard'),
  });

  const { data: usersResponse, isLoading: usersLoading } = useQuery<{users: User[], pagination: any}>({
    queryKey: ['/api/admin/users'],
    queryFn: () => adminApiRequest('GET', '/api/admin/users'),
  });

  const users = usersResponse?.users || [];

  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/admin/system/health'],
    queryFn: () => adminApiRequest('GET', '/api/admin/system/health'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: errorsResponse, isLoading: errorsLoading } = useQuery<{errors: any[]}>({
    queryKey: ['/api/admin/errors'],
    queryFn: () => adminApiRequest('GET', '/api/admin/errors'),
  });

  const errors = errorsResponse?.errors || [];

  // Mutations for admin actions using admin authentication
  const pauseQueueMutation = useMutation({
    mutationFn: () => adminApiRequest('POST', '/api/admin/system/queue/pause'),
    onSuccess: () => {
      toast({ title: "Queue paused successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });

  const resumeQueueMutation = useMutation({
    mutationFn: () => adminApiRequest('POST', '/api/admin/system/queue/resume'),
    onSuccess: () => {
      toast({ title: "Queue resumed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });

  const clearFailedQueueMutation = useMutation({
    mutationFn: () => adminApiRequest('POST', '/api/admin/system/queue/clear-failed'),
    onSuccess: () => {
      toast({ title: "Failed queue items cleared" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });

  const broadcastToFreeUsersMutation = useMutation({
    mutationFn: (message: string) => adminApiRequest('POST', '/api/admin/broadcast/free-users', { message }),
    onSuccess: () => {
      toast({ title: "Message broadcasted to free users" });
    },
  });

  const updateUserPlanMutation = useMutation({
    mutationFn: ({ userId, plan }: { userId: number; plan: string }) => 
      adminApiRequest('PUT', `/api/admin/users/${userId}/plan`, { plan }),
    onSuccess: () => {
      toast({ title: "User plan updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (statsLoading || usersLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, monitor system health, and control operations</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
          >
            Logout
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-gray-400">
                    {stats?.activeUsers || 0} active users
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                  <p className="text-xs text-gray-400">
                    of {stats?.totalSessions || 0} total sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages Forwarded</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.messagesForwarded || 0}</div>
                  <p className="text-xs text-gray-400">
                    {stats?.queueLength || 0} in queue
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.revenue?.monthlyRevenue || 0}</div>
                  <p className="text-xs text-gray-400">
                    Total earnings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database</span>
                      <div className={`flex items-center gap-1 ${getStatusColor(systemHealth?.services.database === 'connected' ? 'healthy' : 'error')}`}>
                        {getStatusIcon(systemHealth?.services.database === 'connected' ? 'healthy' : 'error')}
                        <span className="text-xs">{systemHealth?.services.database || 'unknown'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Queue</span>
                      <div className={`flex items-center gap-1 ${getStatusColor('healthy')}`}>
                        {getStatusIcon('healthy')}
                        <span className="text-xs">{systemHealth?.services.queue.pending || 0} pending</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Telegram API</span>
                      <div className={`flex items-center gap-1 ${getStatusColor(systemHealth?.services.telegram === 'active' ? 'healthy' : 'error')}`}>
                        {getStatusIcon(systemHealth?.services.telegram === 'active' ? 'healthy' : 'error')}
                        <span className="text-xs">{systemHealth?.services.telegram || 'unknown'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Errors</span>
                        <span>{systemHealth?.services.errors.total || 0}</span>
                      </div>
                      <Progress 
                        value={systemHealth?.services.errors.total ? (systemHealth.services.errors.resolved / systemHealth.services.errors.total) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Sessions Status</span>
                        <span>{systemHealth?.services.sessions.healthySessions || 0}/{systemHealth?.services.sessions.totalSessions || 0}</span>
                      </div>
                      <Progress 
                        value={systemHealth?.services.sessions.totalSessions ? (systemHealth.services.sessions.healthySessions / systemHealth.services.sessions.totalSessions) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => pauseQueueMutation.mutate()}
                      disabled={pauseQueueMutation.isPending}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Queue
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => resumeQueueMutation.mutate()}
                      disabled={resumeQueueMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume Queue
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => clearFailedQueueMutation.mutate()}
                      disabled={clearFailedQueueMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear Failed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Error Management</CardTitle>
                <CardDescription>Monitor and resolve system errors</CardDescription>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <div className="text-center py-8">Loading errors...</div>
                ) : (
                  <div className="space-y-4">
                    {errors && Array.isArray(errors) && errors.length > 0 ? (
                      errors.map((error: any) => (
                        <Alert key={error.id} className="bg-red-900/20 border-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{error.errorType}: {error.errorCode}</div>
                                <div className="text-sm text-gray-400 mt-1">{error.message}</div>
                                <div className="text-xs text-gray-500 mt-2">
                                  {new Date(error.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <Badge variant={error.resolved ? 'default' : 'destructive'}>
                                {error.resolved ? 'Resolved' : 'Open'}
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No errors reported
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Broadcast Messages</CardTitle>
                <CardDescription>Send announcements to user groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message to Free Users</label>
                    <textarea
                      className="w-full p-3 bg-gray-700 border-gray-600 rounded-lg resize-none"
                      rows={4}
                      placeholder="Enter your message for free plan users..."
                      id="free-user-message"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const message = (document.getElementById('free-user-message') as HTMLTextAreaElement)?.value;
                      if (message) {
                        broadcastToFreeUsersMutation.mutate(message);
                      }
                    }}
                    disabled={broadcastToFreeUsersMutation.isPending}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send to Free Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}