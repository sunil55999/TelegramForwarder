import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Activity,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  LineChart,
  Clock,
  Globe,
  Zap
} from "lucide-react";

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    breakdown: { plan: string; amount: number; users: number }[];
  };
  usage: {
    totalMessages: number;
    dailyAverage: number;
    peakHour: string;
    topChannels: { name: string; messages: number }[];
  };
  users: {
    total: number;
    active: number;
    new: number;
    churn: number;
    retention: number;
    planDistribution: { plan: string; count: number; percentage: number }[];
  };
  performance: {
    successRate: number;
    averageDelay: number;
    errorRate: number;
    uptime: number;
    responseTime: number;
  };
  geography: {
    topCountries: { country: string; users: number; revenue: number }[];
  };
  trends: {
    daily: { date: string; users: number; messages: number; revenue: number }[];
    hourly: { hour: number; messages: number; activeUsers: number }[];
  };
}

interface Filters {
  timeRange: string;
  metric: string;
  plan: string;
}

export default function AdvancedAnalytics() {
  const [filters, setFilters] = useState<Filters>({
    timeRange: '30d',
    metric: 'all',
    plan: 'all'
  });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics', filters],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-400">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.plan} onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.total)}</p>
                <div className="flex items-center mt-2">
                  {analytics.revenue.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(Math.abs(analytics.revenue.growth))}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.users.active)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {formatPercentage((analytics.users.active / analytics.users.total) * 100)} of total
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Messages Forwarded</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.usage.totalMessages)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {formatNumber(analytics.usage.dailyAverage)} daily avg
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analytics.performance.successRate)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.performance.averageDelay}ms avg delay
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.revenue.breakdown.map((item) => (
                    <div key={item.plan} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium capitalize">{item.plan} Plan</div>
                        <div className="text-sm text-gray-400">{item.users} users</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-sm text-gray-400">
                          {formatPercentage((item.amount / analytics.revenue.total) * 100)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Month</span>
                    <span className="font-medium">{formatCurrency(analytics.revenue.monthly)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Growth Rate</span>
                    <div className="flex items-center gap-1">
                      {analytics.revenue.growth >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={analytics.revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatPercentage(Math.abs(analytics.revenue.growth))}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, (analytics.revenue.monthly / analytics.revenue.total) * 100)} 
                    className="h-2 mt-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Messages</span>
                    <span className="font-medium">{formatNumber(analytics.usage.totalMessages)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Daily Average</span>
                    <span className="font-medium">{formatNumber(analytics.usage.dailyAverage)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Peak Hour</span>
                    <span className="font-medium">{analytics.usage.peakHour}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.usage.topChannels.map((channel, index) => (
                    <div key={channel.name} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{channel.name}</div>
                        <div className="text-sm text-gray-400">{formatNumber(channel.messages)} messages</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Users</span>
                    <span className="font-medium">{formatNumber(analytics.users.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>New Users</span>
                    <span className="font-medium text-green-400">{formatNumber(analytics.users.new)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Churn Rate</span>
                    <span className="font-medium text-red-400">{formatPercentage(analytics.users.churn)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Retention Rate</span>
                    <span className="font-medium text-blue-400">{formatPercentage(analytics.users.retention)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Plan Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.users.planDistribution.map((plan) => (
                    <div key={plan.plan} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{plan.plan} Plan</span>
                        <span className="font-medium">{plan.count} users</span>
                      </div>
                      <Progress value={plan.percentage} className="h-2" />
                      <div className="text-sm text-gray-400 text-right">
                        {formatPercentage(plan.percentage)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {formatPercentage(analytics.performance.successRate)}
                  </div>
                  <Progress value={analytics.performance.successRate} className="h-3" />
                  <p className="text-sm text-gray-400 mt-2">System reliability</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {analytics.performance.responseTime}ms
                  </div>
                  <Progress value={Math.min(100, (1000 - analytics.performance.responseTime) / 10)} className="h-3" />
                  <p className="text-sm text-gray-400 mt-2">Average response</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {formatPercentage(analytics.performance.uptime)}
                  </div>
                  <Progress value={analytics.performance.uptime} className="h-3" />
                  <p className="text-sm text-gray-400 mt-2">System availability</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
              <CardDescription>User distribution by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.geography.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{country.country}</div>
                        <div className="text-sm text-gray-400">{country.users} users</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(country.revenue)}</div>
                      <div className="text-sm text-gray-400">
                        {formatPercentage((country.revenue / analytics.revenue.total) * 100)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}