import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const createPairSchema = z.object({
  sourceChannel: z.string().min(1, 'Source channel is required'),
  destinationChannel: z.string().min(1, 'Destination channel is required'),
  delay: z.number().min(0, 'Delay must be 0 or positive'),
  copyMode: z.boolean().default(false),
  silentMode: z.boolean().default(false),
});

type CreatePairFormData = z.infer<typeof createPairSchema>;

interface NewPairModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePairFormData) => Promise<void>;
}

const DELAY_OPTIONS = [
  { value: 0, label: 'Instant' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export default function NewPairModal({ open, onOpenChange, onSubmit }: NewPairModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreatePairFormData>({
    resolver: zodResolver(createPairSchema),
    defaultValues: {
      sourceChannel: '',
      destinationChannel: '',
      delay: 0,
      copyMode: false,
      silentMode: false,
    },
  });

  const handleSubmit = async (data: CreatePairFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Create Forwarding Pair</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sourceChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Source Channel</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="@source_channel or Channel Name"
                      className="bg-slate-800 border-slate-600 text-text-primary placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="destinationChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Destination Channel</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="@destination_channel or Channel Name"
                      className="bg-slate-800 border-slate-600 text-text-primary placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="delay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Forwarding Delay</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="surface border-slate-700">
                      {DELAY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="copyMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-text-primary">Copy Mode</FormLabel>
                      <p className="text-xs text-text-secondary">Forward as new message (hide source)</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="silentMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-text-primary">Silent Mode</FormLabel>
                      <p className="text-xs text-text-secondary">Forward without notifications</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? 'Creating...' : 'Create Pair'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
