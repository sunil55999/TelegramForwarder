import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  ArrowRightLeft, 
  Shield, 
  Zap, 
  Users, 
  Globe,
  Copy,
  Pause,
  Clock,
  Filter,
  Image,
  MessageSquare,
  Bot,
  BarChart3,
  Move,
  Bell,
  FileText,
  Search,
  CreditCard,
  Bitcoin,
  Settings,
  CheckCircle,
  Play,
  Eye,
  Layers,
  Smartphone,
  Workflow,
  Database,
  Megaphone
} from 'lucide-react';

export default function Features() {
  const featureCategories = [
    {
      title: 'Advanced Forwarding Options',
      description: 'Powerful forwarding capabilities for any use case',
      features: [
        {
          icon: ArrowRightLeft,
          title: 'Chain Forwarding',
          description: 'Create complex forwarding chains (A → B → C) with custom rules and delays for each step.',
          benefits: ['Multi-step automation', 'Custom routing', 'Intelligent distribution']
        },
        {
          icon: Copy,
          title: 'Copy Mode',
          description: 'Forward messages as new content without showing the original source channel.',
          benefits: ['Hide source attribution', 'Clean message appearance', 'Brand protection']
        },
        {
          icon: Eye,
          title: 'Save-Only Channel Support',
          description: 'Access and forward from restricted, private, and save-only Telegram channels.',
          benefits: ['Bypass restrictions', 'Private channel access', 'Complete coverage']
        },
        {
          icon: Clock,
          title: 'Custom Delays',
          description: 'Set precise forwarding delays from instant to hours for natural posting patterns.',
          benefits: ['Avoid spam detection', 'Natural timing', 'Rate limit compliance']
        }
      ]
    },
    {
      title: 'Smart Content Management',
      description: 'Intelligent filtering and content modification tools',
      features: [
        {
          icon: Filter,
          title: 'Sentence Blocking',
          description: 'Filter out unwanted content using keyword and phrase detection.',
          benefits: ['Content quality control', 'Spam prevention', 'Custom word filters']
        },
        {
          icon: Image,
          title: 'Image Blocking',
          description: 'Automatically detect and block specific types of images or media content.',
          benefits: ['Media filtering', 'Content moderation', 'Bandwidth saving']
        },
        {
          icon: MessageSquare,
          title: 'Watermarking',
          description: 'Add custom watermarks, signatures, or branding to forwarded content.',
          benefits: ['Brand attribution', 'Content ownership', 'Custom signatures']
        },
        {
          icon: Layers,
          title: 'Content Modification',
          description: 'Edit, enhance, or modify messages before forwarding with custom rules.',
          benefits: ['Message enhancement', 'Format conversion', 'Content optimization']
        }
      ]
    },
    {
      title: 'Real-Time Sync & Recovery',
      description: 'Reliable system with automatic recovery capabilities',
      features: [
        {
          icon: Zap,
          title: 'Real-Time Sync',
          description: 'Instant message forwarding with millisecond precision and live status updates.',
          benefits: ['Zero delay processing', 'Live monitoring', 'Instant notifications']
        },
        {
          icon: Shield,
          title: 'Session Auto-Recovery',
          description: 'Self-healing system that automatically recovers from connection issues.',
          benefits: ['99.9% uptime', 'Automatic reconnection', 'Error self-correction']
        },
        {
          icon: Database,
          title: 'History Cloning',
          description: 'Clone message history from source channels in controlled batches.',
          benefits: ['Bulk message import', 'Historical data sync', 'Batch processing']
        },
        {
          icon: Bell,
          title: 'Smart Notifications',
          description: 'Get notified about system status, errors, and important events.',
          benefits: ['Real-time alerts', 'Error notifications', 'Status updates']
        }
      ]
    },
    {
      title: 'Multi-Account Management',
      description: 'Handle multiple Telegram accounts from one dashboard',
      features: [
        {
          icon: Users,
          title: 'Multiple Account Support',
          description: 'Connect and manage unlimited Telegram accounts from a single interface.',
          benefits: ['Centralized control', 'Account switching', 'Unified management']
        },
        {
          icon: Smartphone,
          title: 'Session Management',
          description: 'Secure session handling with automatic login and session persistence.',
          benefits: ['Stay logged in', 'Secure authentication', 'Session backup']
        },
        {
          icon: Settings,
          title: 'Account-Specific Settings',
          description: 'Configure unique settings and rules for each connected account.',
          benefits: ['Custom configurations', 'Individual controls', 'Flexible setup']
        },
        {
          icon: Globe,
          title: 'Global Account Control',
          description: 'Mass operations across all connected accounts with single commands.',
          benefits: ['Bulk operations', 'Time saving', 'Centralized control']
        }
      ]
    },
    {
      title: 'User Dashboard & Interface',
      description: 'Intuitive and powerful user interface',
      features: [
        {
          icon: BarChart3,
          title: 'Real-Time Logs',
          description: 'Live activity feed showing all forwarding operations, errors, and system events.',
          benefits: ['Live monitoring', 'Error tracking', 'Performance insights']
        },
        {
          icon: Move,
          title: 'Drag-and-Drop Setup',
          description: 'Visual forwarding rule builder with intuitive drag-and-drop interface.',
          benefits: ['Easy configuration', 'Visual setup', 'No coding required']
        },
        {
          icon: Workflow,
          title: 'Visual Workflow Builder',
          description: 'Create complex forwarding workflows with visual flowchart interface.',
          benefits: ['Complex automation', 'Visual representation', 'Easy modification']
        },
        {
          icon: Smartphone,
          title: 'Mobile Responsive',
          description: 'Fully optimized mobile interface for managing forwards on the go.',
          benefits: ['Mobile access', 'Touch-friendly', 'Responsive design']
        }
      ]
    },
    {
      title: 'Telegram Bot Control',
      description: 'Advanced bot integration for enhanced control',
      features: [
        {
          icon: Bot,
          title: 'Task Management Bot',
          description: 'Control your forwarding operations directly through Telegram bot commands.',
          benefits: ['Remote control', 'Quick commands', 'Mobile management']
        },
        {
          icon: Bell,
          title: 'Notification Bot',
          description: 'Receive instant notifications about system status and important events.',
          benefits: ['Instant alerts', 'Status updates', 'Error notifications']
        },
        {
          icon: Settings,
          title: 'Bot Configuration',
          description: 'Customize bot behavior, commands, and notification preferences.',
          benefits: ['Custom commands', 'Personalized alerts', 'Flexible setup']
        },
        {
          icon: Play,
          title: 'Remote Operations',
          description: 'Start, stop, and modify forwarding pairs remotely via bot commands.',
          benefits: ['Remote control', 'Quick actions', 'Emergency stops']
        }
      ]
    },
    {
      title: 'Analytics & Reporting',
      description: 'Comprehensive analytics and reporting tools',
      features: [
        {
          icon: BarChart3,
          title: '48-Hour Active Pair Reports',
          description: 'Detailed reports showing forwarding activity, success rates, and performance metrics.',
          benefits: ['Performance tracking', 'Success metrics', 'Trend analysis']
        },
        {
          icon: FileText,
          title: 'Activity Analytics',
          description: 'Deep insights into message volumes, peak times, and forwarding patterns.',
          benefits: ['Usage insights', 'Peak time analysis', 'Pattern recognition']
        },
        {
          icon: CheckCircle,
          title: 'Success Rate Monitoring',
          description: 'Track forwarding success rates and identify potential issues early.',
          benefits: ['Quality monitoring', 'Issue detection', 'Performance optimization']
        },
        {
          icon: Search,
          title: 'Advanced Filtering',
          description: 'Filter and search through activity logs with advanced query options.',
          benefits: ['Easy searching', 'Custom filters', 'Data analysis']
        }
      ]
    },
    {
      title: 'Admin & SEO Tools',
      description: 'Advanced administration and SEO management features',
      features: [
        {
          icon: Megaphone,
          title: 'Global Announcement Tool',
          description: 'Send custom promotional messages to all Free Plan users destination channels.',
          benefits: ['Marketing reach', 'User engagement', 'Promotional campaigns']
        },
        {
          icon: Search,
          title: 'SEO Management',
          description: 'Dynamic sitemap generation, meta tag management, and SEO optimization tools.',
          benefits: ['Search visibility', 'SEO optimization', 'Content management']
        },
        {
          icon: FileText,
          title: 'Blog Publishing System',
          description: 'Built-in blog system for Telegram-related content and SEO keyword targeting.',
          benefits: ['Content marketing', 'SEO boost', 'Knowledge sharing']
        },
        {
          icon: BarChart3,
          title: 'Google Search Console Integration',
          description: 'Direct integration with Google Search Console for performance tracking.',
          benefits: ['Search analytics', 'Performance tracking', 'SEO insights']
        }
      ]
    },
    {
      title: 'Payment & Security',
      description: 'Secure payment processing and data protection',
      features: [
        {
          icon: CreditCard,
          title: 'PayPal Integration',
          description: 'Secure USD payments through PayPal with automatic subscription management.',
          benefits: ['Secure payments', 'Auto-billing', 'Payment protection']
        },
        {
          icon: Bitcoin,
          title: 'Cryptocurrency Support',
          description: 'Accept crypto payments (BTC, ETH, USDT) through NowPayments gateway.',
          benefits: ['Crypto payments', 'Global access', 'Privacy protection']
        },
        {
          icon: Shield,
          title: 'Data Encryption',
          description: 'End-to-end encryption for all data transmission and storage.',
          benefits: ['Data security', 'Privacy protection', 'Secure storage']
        },
        {
          icon: Users,
          title: 'Access Control',
          description: 'Role-based access control and user permission management.',
          benefits: ['Security control', 'User management', 'Permission levels']
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AutoForwardX</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Complete Feature Overview
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover all the powerful features that make AutoForwardX the most 
            advanced Telegram forwarding platform available today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">{category.title}</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <Card key={featureIndex} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 transition-all">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{feature.description}</p>
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Flexible Payment Options</h2>
          <p className="text-xl text-gray-300 mb-8">
            Choose your preferred payment method with secure, global payment processing
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">PayPal</h3>
                <p className="text-gray-300 mb-4">Secure USD payments with buyer protection</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Credit & Debit Cards</li>
                  <li>• Bank Transfers</li>
                  <li>• PayPal Balance</li>
                  <li>• Automatic Billing</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bitcoin className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Cryptocurrency</h3>
                <p className="text-gray-300 mb-4">Private crypto payments via NowPayments</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Bitcoin (BTC)</li>
                  <li>• Ethereum (ETH)</li>
                  <li>• Tether (USDT)</li>
                  <li>• 100+ Cryptocurrencies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Experience AutoForwardX?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start with our free plan and upgrade when you need more features. 
            No setup fees, no hidden costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-3">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/">
                <div className="flex items-center space-x-3 mb-4 cursor-pointer">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">AutoForwardX</span>
                </div>
              </Link>
              <p className="text-gray-400 max-w-md">
                The most reliable and feature-rich Telegram auto-forwarding platform. 
                Trusted by thousands of users worldwide.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link href="/#pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
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