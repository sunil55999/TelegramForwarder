import { Check, Play, Pause, UserPlus, Circle } from 'lucide-react';

interface ActivityLog {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  metadata?: any;
}

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message_forwarded':
        return { icon: Check, color: 'bg-success/20 text-success' };
      case 'pair_created':
      case 'pair_activated':
        return { icon: Play, color: 'bg-primary/20 text-primary' };
      case 'pair_paused':
        return { icon: Pause, color: 'bg-warning/20 text-warning' };
      case 'user_registered':
        return { icon: UserPlus, color: 'bg-success/20 text-success' };
      default:
        return { icon: Circle, color: 'bg-slate-500/20 text-slate-400' };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-text-secondary">
          <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity) => {
        const { icon: Icon, color } = getActivityIcon(activity.type);
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-primary">{activity.message}</p>
              <p className="text-xs text-text-secondary mt-1">
                {formatTimeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
