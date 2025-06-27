import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { login, register } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import { Send, Phone, ArrowLeft, Shield, Check } from 'lucide-react';

const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+358', country: 'FI', flag: '🇫🇮' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+351', country: 'PT', flag: '🇵🇹' }
];

type LoginStep = 'phone' | 'otp' | 'setup';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('phone');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock phone verification - in real implementation this would call Telegram API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Verification code sent',
        description: 'Check your Telegram app for the verification code.',
      });
      
      setStep('otp');
    } catch (error) {
      toast({
        title: 'Failed to send code',
        description: 'Please check your phone number and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists or needs to set up account
      const mockUserExists = Math.random() > 0.5; // 50% chance user exists
      
      if (mockUserExists) {
        // Existing user - log them in
        const mockUser = {
          id: 1,
          username: 'telegram_user',
          email: `${phoneNumber}@telegram.user`,
          plan: 'free',
          telegramAccounts: [{ phone: selectedCountryCode + phoneNumber }],
          createdAt: new Date().toISOString()
        };
        
        setUser(mockUser);
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in to AutoForwardX.',
        });
        setLocation('/dashboard');
      } else {
        // New user - show setup step
        setStep('setup');
      }
    } catch (error) {
      toast({
        title: 'Invalid verification code',
        description: 'Please check the code and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock account creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: Date.now(),
        username: username,
        email: `${phoneNumber}@telegram.user`,
        plan: 'free',
        telegramAccounts: [{ phone: selectedCountryCode + phoneNumber }],
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      toast({
        title: 'Welcome to AutoForwardX!',
        description: 'Your account has been created successfully.',
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AutoForwardX</h1>
          </Link>
          <p className="text-gray-400">Secure login with your Telegram account</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              {step !== 'phone' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step === 'setup' ? 'otp' : 'phone')}
                  className="text-gray-400 hover:text-white p-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <div className="flex-1" />
            </div>
            
            <CardTitle className="text-white text-center">
              {step === 'phone' && 'Enter Phone Number'}
              {step === 'otp' && 'Verify Your Account'}
              {step === 'setup' && 'Complete Setup'}
            </CardTitle>
            
            <CardDescription className="text-gray-400 text-center">
              {step === 'phone' && 'We\'ll send a verification code to your Telegram'}
              {step === 'otp' && 'Enter the code sent to your Telegram app'}
              {step === 'setup' && 'Choose a username for your account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Country Code</Label>
                  <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                            <span className="text-gray-400">({country.country})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Phone Number</Label>
                  <div className="flex space-x-2">
                    <div className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white min-w-fit">
                      {selectedCountryCode}
                    </div>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="1234567890"
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || !phoneNumber}
                >
                  {loading ? (
                    'Sending code...'
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
                
                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-4">
                  <Shield className="w-4 h-4" />
                  <span>Secured by Telegram's authentication system</span>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-white font-medium">
                    {selectedCountryCode} {phoneNumber}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Code sent to your Telegram app
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Verification Code</Label>
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="bg-slate-700 border-slate-600 text-white text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => setStep('phone')}
                >
                  Didn't receive a code? Try again
                </Button>
              </form>
            )}

            {step === 'setup' && (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <div className="text-white font-medium">Phone Verified!</div>
                  <div className="text-sm text-gray-400">Complete your account setup</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Choose Username</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_username"
                    className="bg-slate-700 border-slate-600 text-white"
                    maxLength={20}
                    required
                  />
                  <div className="text-xs text-gray-400">
                    Only lowercase letters, numbers, and underscores
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || !username || username.length < 3}
                >
                  {loading ? 'Creating account...' : 'Complete Setup'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
