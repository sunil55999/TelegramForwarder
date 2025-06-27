import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Database, 
  Wifi, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  MemoryStick,
  Cpu,
  HardDrive,
  Network,
  Gauge,
  Zap,
  Timer,
  TrendingUp,
  RefreshCw
} from "lucide-react";

interface SystemMetrics {
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    cpu: { usage: number; cores: number };
    memory: { used: number; total: number; percentage: number };
    disk: { used: number; total: number; percentage: number };
    network: { inbound: number; outbound: number };
    load: number[];
  };
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: { active: number; max: number };
    queries: { slow: number; total: number };
    latency: number;
    size: number;
    backupStatus: 'ok' | 'warning' | 'error';
  };
  telegram: {
    status: 'healthy' | 'warning' | 'error';
    activeSessions: number;
    totalSessions: number;
    apiCalls: { count: number; limit: number; resetTime: string };
    rateLimits: { current: number; limit: number };
    errors: number;
  };
  queue: {
    status: 'healthy' | 'warning' | 'error';
    size: number;
    processing: boolean;
    failed: number;
    throughput: number;
    avgProcessingTime: number;
  };
  alerts: {
    critical: number;
    warnings: number;
    recent: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };
}

export default function SystemMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: metrics, isLoading, refetch } = useQuery<SystemMetrics>({
    queryKey: ['/api/admin/system/metrics'],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

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
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-gray-400">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.alerts.critical > 0 && (
        <Alert className="bg-red-900/20 border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{metrics.alerts.critical} critical alerts</strong> require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Server Status</p>
                <div className={`flex items-center gap-2 mt-2 ${getStatusColor(metrics.server.status)}`}>
                  {getStatusIcon(metrics.server.status)}
                  <span className="font-medium capitalize">{metrics.server.status}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Uptime: {formatUptime(metrics.server.uptime)}
                </p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Database</p>
                <div className={`flex items-center gap-2 mt-2 ${getStatusColor(metrics.database.status)}`}>
                  {getStatusIcon(metrics.database.status)}
                  <span className="font-medium capitalize">{metrics.database.status}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {metrics.database.latency}ms latency
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Telegram API</p>
                <div className={`flex items-center gap-2 mt-2 ${getStatusColor(metrics.telegram.status)}`}>
                  {getStatusIcon(metrics.telegram.status)}
                  <span className="font-medium capitalize">{metrics.telegram.status}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {metrics.telegram.activeSessions} active sessions
                </p>
              </div>
              <Wifi className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Queue Status</p>
                <div className={`flex items-center gap-2 mt-2 ${getStatusColor(metrics.queue.status)}`}>
                  {getStatusIcon(metrics.queue.status)}
                  <span className="font-medium capitalize">{metrics.queue.status}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {metrics.queue.size} items queued
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="server" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="server">Server</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="server" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU & Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Usage</span>
                    <span>{metrics.server.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.server.cpu.usage} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">{metrics.server.cpu.cores} cores</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Usage</span>
                    <span>{metrics.server.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.server.memory.percentage} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formatBytes(metrics.server.memory.used)} / {formatBytes(metrics.server.memory.total)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Disk Usage</span>
                    <span>{metrics.server.disk.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.server.disk.percentage} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formatBytes(metrics.server.disk.used)} / {formatBytes(metrics.server.disk.total)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network & Load
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Network In</span>
                  <span className="font-medium">{formatBytes(metrics.server.network.inbound)}/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Network Out</span>
                  <span className="font-medium">{formatBytes(metrics.server.network.outbound)}/s</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm">System Load</span>
                  <div className="flex gap-2">
                    {metrics.server.load.map((load, index) => (
                      <div key={index} className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">{index === 0 ? '1m' : index === 1 ? '5m' : '15m'}</div>
                        <div className="text-sm font-medium">{load.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connection Pool
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Connections</span>
                    <span>{metrics.database.connections.active} / {metrics.database.connections.max}</span>
                  </div>
                  <Progress 
                    value={(metrics.database.connections.active / metrics.database.connections.max) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Query Latency</span>
                  <span className="font-medium">{metrics.database.latency}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Size</span>
                  <span className="font-medium">{formatBytes(metrics.database.size)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Query Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Queries</span>
                  <span className="font-medium">{metrics.database.queries.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Slow Queries</span>
                  <span className="font-medium text-yellow-400">{metrics.database.queries.slow}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Backup Status</span>
                  <Badge variant={metrics.database.backupStatus === 'ok' ? 'default' : 'destructive'}>
                    {metrics.database.backupStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  API Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sessions</span>
                  <span className="font-medium">{metrics.telegram.activeSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Sessions</span>
                  <span className="font-medium">{metrics.telegram.totalSessions}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>API Calls</span>
                    <span>{metrics.telegram.apiCalls.count} / {metrics.telegram.apiCalls.limit}</span>
                  </div>
                  <Progress 
                    value={(metrics.telegram.apiCalls.count / metrics.telegram.apiCalls.limit) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Resets: {new Date(metrics.telegram.apiCalls.resetTime).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Rate</span>
                    <span>{metrics.telegram.rateLimits.current} / {metrics.telegram.rateLimits.limit}</span>
                  </div>
                  <Progress 
                    value={(metrics.telegram.rateLimits.current / metrics.telegram.rateLimits.limit) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Errors</span>
                  <span className="font-medium text-red-400">{metrics.telegram.errors}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Queue Size</span>
                  <span className="font-medium">{metrics.queue.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processing</span>
                  <Badge variant={metrics.queue.processing ? 'default' : 'secondary'}>
                    {metrics.queue.processing ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Failed Items</span>
                  <span className="font-medium text-red-400">{metrics.queue.failed}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Throughput</span>
                  <span className="font-medium">{metrics.queue.throughput}/min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Processing Time</span>
                  <span className="font-medium">{metrics.queue.avgProcessingTime}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Critical Alerts</p>
                    <p className="text-2xl font-bold text-red-400">{metrics.alerts.critical}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.alerts.warnings}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Alerts</p>
                    <p className="text-2xl font-bold">{metrics.alerts.critical + metrics.alerts.warnings}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.alerts.recent.length > 0 ? (
                  metrics.alerts.recent.map((alert) => (
                    <Alert 
                      key={alert.id} 
                      className={`${
                        alert.type === 'critical' ? 'bg-red-900/20 border-red-800' :
                        alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
                        'bg-blue-900/20 border-blue-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {alert.type === 'critical' ? <XCircle className="h-4 w-4 mt-0.5" /> :
                           alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 mt-0.5" /> :
                           <CheckCircle className="h-4 w-4 mt-0.5" />}
                          <div>
                            <AlertDescription className="font-medium">{alert.message}</AlertDescription>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No recent alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}