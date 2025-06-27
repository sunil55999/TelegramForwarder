import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Send, 
  BarChart3, 
  ArrowRightLeft, 
  Users, 
  Activity, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Forwarding Pairs', href: '/forwarding-pairs', icon: ArrowRightLeft },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Activity Logs', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="w-64 surface border-r border-slate-700 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">AutoForwardX</h1>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-text-secondary hover:bg-slate-800 hover:text-text-primary'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40" />
            <AvatarFallback className="bg-primary text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{user?.username}</p>
            <p className="text-xs text-text-secondary capitalize">{user?.plan} Plan</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-text-secondary hover:text-text-primary p-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
