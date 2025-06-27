import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  ArrowRightLeft, 
  Shield, 
  Zap, 
  Users, 
  Globe,
  Check,
  Star,
  Phone,
  CreditCard,
  Bitcoin
} from 'lucide-react';

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const features = [
    {
      icon: ArrowRightLeft,
      title: 'Multi-Channel Forwarding',
      description: 'Forward messages between unlimited Telegram channels with smart routing'
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description: 'Instant message forwarding with customizable delays and smart filters'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Self-healing system with 99.9% uptime and automatic error recovery'
    },
    {
      icon: Users,
      title: 'Multi-Account Support',
      description: 'Manage multiple Telegram accounts from a single, unified dashboard'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Works with channels worldwide, including restricted and private channels'
    },
    {
      icon: Send,
      title: 'Smart Automation',
      description: 'AI-powered content filtering, watermarking, and chain forwarding'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '3 forwarding pairs',
        'Basic forwarding',
        'Community support',
        'Standard delays'
      ],
      popular: false,
      cta: 'Start Free'
    },
    {
      name: 'Pro',
      price: '$3.50',
      period: 'per month',
      description: 'Most popular for individuals',
      features: [
        '15 forwarding pairs',
        'Advanced filtering',
        'Priority support',
        'Custom delays',
        'Copy mode',
        'Silent forwarding'
      ],
      popular: true,
      cta: 'Start Pro'
    },
    {
      name: 'Business',
      price: '$9.50',
      period: 'per month',
      description: 'For teams and agencies',
      features: [
        '50 forwarding pairs',
        'Chain forwarding',
        'Multi-account management',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'API access'
      ],
      popular: false,
      cta: 'Start Business'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Content Creator',
      content: 'AutoForwardX has transformed how I manage my Telegram channels. The automation saves me 3+ hours daily.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'Marketing Manager',
      content: 'The multi-account feature is incredible. Managing 15+ channels has never been this easy and reliable.',
      rating: 5
    },
    {
      name: 'David Rodriguez',
      role: 'Agency Owner',
      content: 'Perfect for our client work. The chain forwarding and custom delays give us complete control.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AutoForwardX</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <Link href="/features" className="text-gray-300 hover:text-white transition-colors">Learn More</Link>
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  Login with Telegram
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Automate Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"> Telegram </span>
              Message Forwarding
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Forward messages between unlimited Telegram channels with smart automation, 
              real-time sync, and multi-account management. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
                  <Phone className="w-5 h-5 mr-2" />
                  Start with Telegram
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-3">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 backdrop-blur-sm border border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">Source Channel</span>
                    </div>
                    <div className="text-white font-medium">@news_channel</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRightLeft className="w-8 h-8 text-primary" />
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">Destination</span>
                    </div>
                    <div className="text-white font-medium">@my_channel</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Badge className="bg-success/20 text-success border-success/30">
                    <Check className="w-3 h-3 mr-1" />
                    Auto-forwarding active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features for Every Need
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From basic forwarding to advanced automation, AutoForwardX has everything 
              you need to manage your Telegram channels efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                View All Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our core forwarding features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 transition-all ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                    <p className="text-gray-300">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-success mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/login">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="text-center mt-12">
            <p className="text-gray-300 mb-4">Secure payments powered by</p>
            <div className="flex justify-center items-center space-x-8">
              <div className="flex items-center space-x-2 text-gray-400">
                <CreditCard className="w-5 h-5" />
                <span>PayPal</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Bitcoin className="w-5 h-5" />
                <span>Crypto (NowPayments)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-300">
              See what our users are saying about AutoForwardX
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your Telegram Channels?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who trust AutoForwardX for their message forwarding needs.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
              <Phone className="w-5 h-5 mr-2" />
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AutoForwardX</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The most reliable and feature-rich Telegram auto-forwarding platform. 
                Trusted by thousands of users worldwide.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-700 text-center">
            <p className="text-gray-400">
              © 2025 AutoForwardX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}