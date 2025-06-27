import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  trend?: {
    value: string;
    positive: boolean;
  };
  iconColor: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  progress,
  trend,
  iconColor 
}: StatsCardProps) {
  return (
    <div className="surface rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {progress && (
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-success text-sm">{progress.label}</span>
          <div className="flex-1 bg-slate-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {trend && (
        <p className={`text-sm mt-4 ${trend.positive ? 'text-success' : 'text-destructive'}`}>
          {trend.value}
        </p>
      )}
      
      {subtitle && !progress && !trend && (
        <p className="text-text-secondary text-sm mt-4">{subtitle}</p>
      )}
    </div>
  );
}
