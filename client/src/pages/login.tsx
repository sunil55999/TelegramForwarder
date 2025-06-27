import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { login, register } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import { Send } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await login(email, password);
      setUser(response.user);
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in to AutoForwardX.',
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({
        title: 'Registration failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await register(username, email, password);
      setUser(response.user);
      toast({
        title: 'Welcome to AutoForwardX!',
        description: 'Your account has been created successfully.',
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Username or email already exists.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AutoForwardX</h1>
          </div>
        </div>

        <Card className="surface border-slate-700">
          <CardHeader>
            <CardTitle className="text-text-primary">Welcome</CardTitle>
            <CardDescription className="text-text-secondary">
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="login" className="text-text-secondary data-[state=active]:text-text-primary">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="text-text-secondary data-[state=active]:text-text-primary">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-primary">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-text-primary">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-text-primary">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Choose a username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-text-primary">Email</Label>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-text-primary">Password</Label>
                    <Input
                      id="reg-password"
                      name="password"
                      type="password"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Create a password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-text-primary">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      className="bg-slate-800 border-slate-600 text-text-primary"
                      placeholder="Confirm your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
