import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Activity,
  Filter,
  BarChart3
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  summary: {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    successRate: number;
    activePairs: number;
    totalPairs: number;
    uniqueChannels: number;
  };
  dailyStats: Array<{
    date: string;
    messages: number;
    successful: number;
    failed: number;
  }>;
  pairPerformance: Array<{
    pairId: number;
    sourceChannel: string;
    destinationChannel: string;
    messages: number;
    successRate: number;
    avgDelay: number;
  }>;
  channelStats: Array<{
    channelId: string;
    channelTitle: string;
    type: 'source' | 'destination';
    messageCount: number;
    pairCount: number;
  }>;
  errorBreakdown: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

interface FilterOptions {
  dateRange?: DateRange;
  userId?: number;
  pairId?: number;
  channelId?: string;
  status?: string;
}

export default function AnalyticsReporting() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [reportFormat, setReportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.dateRange?.from) params.append('startDate', filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) params.append('endDate', filters.dateRange.to.toISOString());
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.pairId) params.append('pairId', filters.pairId.toString());
      if (filters.channelId) params.append('channelId', filters.channelId);
      if (filters.status) params.append('status', filters.status);
      
      return apiRequest('GET', `/api/analytics?${params.toString()}`);
    },
  });

  const { data: usersData } = useQuery<{users: Array<{id: number, username: string}>}>({
    queryKey: ['/api/users/list'],
    queryFn: () => apiRequest('GET', '/api/users/list'),
  });

  const { data: pairsData } = useQuery<{pairs: Array<{id: number, sourceChannelTitle: string, destinationChannelTitle: string}>}>({
    queryKey: ['/api/forwarding-pairs/list'],
    queryFn: () => apiRequest('GET', '/api/forwarding-pairs/list'),
  });

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const params = new URLSearchParams();
      params.append('format', reportFormat);
      if (filters.dateRange?.from) params.append('startDate', filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) params.append('endDate', filters.dateRange.to.toISOString());
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.pairId) params.append('pairId', filters.pairId.toString());

      const response = await fetch(`/api/analytics/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${reportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: `${reportFormat.toUpperCase()} report generated successfully` });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Unable to generate report. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Analytics Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Date Range</Label>
              <DatePickerWithRange 
                date={filters.dateRange}
                onDateChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
              />
            </div>

            <div>
              <Label className="text-white">User</Label>
              <Select 
                value={filters.userId?.toString() || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  userId: value === 'all' ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usersData?.users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Forwarding Pair</Label>
              <Select 
                value={filters.pairId?.toString() || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  pairId: value === 'all' ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="All pairs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pairs</SelectItem>
                  {pairsData?.pairs.map(pair => (
                    <SelectItem key={pair.id} value={pair.id.toString()}>
                      {pair.sourceChannelTitle} → {pair.destinationChannelTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setFilters({})}
              className="text-gray-400"
            >
              Clear Filters
            </Button>

            <div className="flex items-center space-x-2">
              <Select value={reportFormat} onValueChange={(value: 'csv' | 'pdf') => setReportFormat(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{analyticsData.summary.totalMessages.toLocaleString()}</p>
                    <p className="text-sm text-blue-400">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{analyticsData.summary.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-green-400">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{analyticsData.summary.activePairs}</p>
                    <p className="text-sm text-purple-400">Active Pairs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-500/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{analyticsData.summary.uniqueChannels}</p>
                    <p className="text-sm text-yellow-400">Unique Channels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Daily Message Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="successful" stackId="a" fill="#10B981" name="Successful" />
                    <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Breakdown Pie Chart */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle>Error Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.errorBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.errorBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Table */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle>Top Performing Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">Source → Destination</th>
                      <th className="text-left py-3 px-4 text-gray-400">Messages</th>
                      <th className="text-left py-3 px-4 text-gray-400">Success Rate</th>
                      <th className="text-left py-3 px-4 text-gray-400">Avg Delay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.pairPerformance.map((pair, index) => (
                      <tr key={pair.pairId} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400">{pair.sourceChannel}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-purple-400">{pair.destinationChannel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">{pair.messages.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={`${
                              pair.successRate >= 95 
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : pair.successRate >= 80
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                : 'bg-red-500/20 text-red-400 border-red-500/50'
                            }`}
                          >
                            {pair.successRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{pair.avgDelay.toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}