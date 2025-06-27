import { MoreVertical, Circle, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ForwardingPair {
  id: number;
  sourceChannel: string;
  destinationChannel: string;
  delay: number;
  isActive: boolean;
  lastActivity: string | null;
}

interface ForwardingPairCardProps {
  pair: ForwardingPair;
  onToggle: (id: number, isActive: boolean) => void;
  onEdit: (pair: ForwardingPair) => void;
  onDelete: (id: number) => void;
}

export default function ForwardingPairCard({ 
  pair, 
  onToggle, 
  onEdit, 
  onDelete 
}: ForwardingPairCardProps) {
  const formatDelay = (seconds: number) => {
    if (seconds === 0) return 'Instant';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
  };

  const getChannelColor = (index: number) => {
    const colors = [
      'bg-blue-500/20 text-blue-400',
      'bg-purple-500/20 text-purple-400',
      'bg-orange-500/20 text-orange-400',
      'bg-green-500/20 text-green-400',
      'bg-pink-500/20 text-pink-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getChannelColor(pair.id)}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84C10.73 11.2 10.73 11.67 10.5 12.03L4.93 17.6C4.54 17.99 4.54 18.62 4.93 19.01C5.32 19.4 5.95 19.4 6.34 19.01L11.91 13.44C12.27 13.17 12.74 13.17 13.1 13.44L18.67 19.01C19.06 19.4 19.69 19.4 20.08 19.01C20.47 18.62 20.47 17.99 20.08 17.6L14.5 12.03C14.27 11.67 14.27 11.2 14.5 10.84L20.17 5.17L22.5 2.5L21 1L15 7V9H21Z"/>
          </svg>
        </div>
        <div>
          <p className="font-medium text-text-primary">
            {pair.sourceChannel} → {pair.destinationChannel}
          </p>
          <p className="text-sm text-text-secondary">
            Delay: {formatDelay(pair.delay)} • Status: {pair.isActive ? 'Active' : 'Paused'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge
          variant={pair.isActive ? 'default' : 'secondary'}
          className={pair.isActive 
            ? 'bg-success/20 text-success border-success/30' 
            : 'bg-warning/20 text-warning border-warning/30'
          }
        >
          {pair.isActive ? <Circle className="w-2 h-2 mr-1 fill-current" /> : <Pause className="w-3 h-3 mr-1" />}
          {pair.isActive ? 'Active' : 'Paused'}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary p-2 h-8 w-8"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="surface border-slate-700">
            <DropdownMenuItem onClick={() => onToggle(pair.id, !pair.isActive)}>
              {pair.isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(pair)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(pair.id)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
