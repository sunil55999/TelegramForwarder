import { Check, X, Crown, Zap, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface FeatureRow {
  name: string;
  description?: string;
  free: boolean;
  pro: boolean;
  business: boolean;
}

interface FeatureCategory {
  title: string;
  icon: React.ElementType;
  features: FeatureRow[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "Advanced Forwarding Options",
    icon: Zap,
    features: [
      {
        name: "Chain Forwarding",
        description: "Forward messages through multiple channels sequentially",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Copy Mode",
        description: "Copy messages without forwarding attribution",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Save-Only Channel Support",
        description: "Forward from private saved messages channels",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Custom Delays",
        description: "Set precise timing between message forwards",
        free: false,
        pro: true,
        business: true
      }
    ]
  },
  {
    title: "Smart Content Management",
    icon: Crown,
    features: [
      {
        name: "Sentence Blocking",
        description: "Block messages containing specific text patterns",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Image Blocking",
        description: "Filter out unwanted images and media",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Watermarking",
        description: "Add custom watermarks to forwarded content",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Content Modification",
        description: "Edit messages before forwarding",
        free: false,
        pro: true,
        business: true
      }
    ]
  },
  {
    title: "Real-Time Sync & Recovery",
    icon: Zap,
    features: [
      {
        name: "Real-Time Sync",
        description: "Instant message forwarding with minimal delay",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Session Auto-Recovery",
        description: "Automatically reconnect after network issues",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "History Cloning",
        description: "Forward existing channel history to new destinations",
        free: false,
        pro: true,
        business: true
      },
      {
        name: "Smart Notifications",
        description: "Get alerts about forwarding status and issues",
        free: true,
        pro: true,
        business: true
      }
    ]
  },
  {
    title: "Multi-Account Management",
    icon: Building2,
    features: [
      {
        name: "Telegram Account Limit",
        description: "Number of connected Telegram accounts",
        free: false, // Will show "1" instead
        pro: false,  // Will show "3" instead
        business: false // Will show "10" instead
      },
      {
        name: "Forwarding Pair Limit",
        description: "Maximum number of forwarding configurations",
        free: false, // Will show "3" instead
        pro: false,  // Will show "15" instead
        business: false // Will show "50" instead
      },
      {
        name: "Multi-Account Dashboard",
        description: "Unified interface for managing multiple accounts",
        free: false,
        pro: true,
        business: true
      }
    ]
  },
  {
    title: "Promotional Tools (Admin Controlled)",
    icon: Crown,
    features: [
      {
        name: "Global Promotions to Free User Channels",
        description: "Receive promotional content from platform",
        free: true,
        pro: true,
        business: true
      },
      {
        name: "Custom Business Branding",
        description: "Add your brand to forwarded messages",
        free: false,
        pro: false,
        business: true
      },
      {
        name: "API Access",
        description: "Integrate with your own applications",
        free: false,
        pro: false,
        business: true
      }
    ]
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "border-slate-600",
    bgColor: "bg-slate-800/50",
    popular: false
  },
  {
    name: "Pro",
    price: "$3.50",
    period: "month",
    color: "border-blue-500",
    bgColor: "bg-blue-900/20",
    popular: true
  },
  {
    name: "Business",
    price: "$9.50",
    period: "month",
    color: "border-purple-500",
    bgColor: "bg-purple-900/20",
    popular: false
  }
];

function FeatureIcon({ available, planName, featureName }: { 
  available: boolean; 
  planName: string; 
  featureName: string; 
}) {
  // Special handling for limit features
  if (featureName === "Telegram Account Limit") {
    const limits = { Free: "1", Pro: "3", Business: "10" };
    return (
      <span className="text-blue-400 font-semibold">
        {limits[planName as keyof typeof limits]}
      </span>
    );
  }
  
  if (featureName === "Forwarding Pair Limit") {
    const limits = { Free: "3", Pro: "15", Business: "50" };
    return (
      <span className="text-blue-400 font-semibold">
        {limits[planName as keyof typeof limits]}
      </span>
    );
  }

  return available ? (
    <Check className="w-5 h-5 text-green-400" />
  ) : (
    <X className="w-5 h-5 text-red-400" />
  );
}

export default function FeatureComparisonTable() {
  return (
    <div className="bg-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Feature Comparison
          </h2>
          <p className="text-gray-400 text-lg">
            Choose the plan that best fits your forwarding needs
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          {/* Plan Headers */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-white mb-2">Features</h3>
            </div>
            {plans.map((plan) => (
              <Card key={plan.name} className={`${plan.bgColor} ${plan.color} border-2 relative`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-white">
                    {plan.price}
                    <span className="text-lg text-gray-400">/{plan.period}</span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Feature Categories */}
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              {/* Category Header */}
              <div className="grid grid-cols-4 gap-6 mb-4">
                <div className="flex items-center space-x-3 bg-slate-800 rounded-lg p-4">
                  <category.icon className="w-6 h-6 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">{category.title}</h4>
                </div>
                <div className="col-span-3"></div>
              </div>

              {/* Feature Rows */}
              {category.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="grid grid-cols-4 gap-6 mb-2 py-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                  <div className="flex flex-col justify-center pl-4">
                    <span className="text-white font-medium">{feature.name}</span>
                    {feature.description && (
                      <span className="text-gray-400 text-sm mt-1">{feature.description}</span>
                    )}
                  </div>
                  
                  {plans.map((plan) => (
                    <div key={plan.name} className="flex justify-center items-center">
                      <FeatureIcon 
                        available={feature[plan.name.toLowerCase() as keyof FeatureRow] as boolean}
                        planName={plan.name}
                        featureName={feature.name}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* CTA Buttons */}
          <div className="grid grid-cols-4 gap-6 mt-12">
            <div></div>
            {plans.map((plan) => (
              <div key={plan.name} className="text-center">
                <Link href="/login">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    } transition-all duration-200 transform hover:scale-105`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`${plan.bgColor} ${plan.color} border-2 relative`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {plan.price}
                  <span className="text-lg text-gray-400">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {featureCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <div className="flex items-center space-x-2 mb-3">
                      <category.icon className="w-5 h-5 text-blue-400" />
                      <h4 className="text-white font-semibold">{category.title}</h4>
                    </div>
                    <div className="space-y-2 ml-7">
                      {category.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-white text-sm">{feature.name}</span>
                          </div>
                          <FeatureIcon 
                            available={feature[plan.name.toLowerCase() as keyof FeatureRow] as boolean}
                            planName={plan.name}
                            featureName={feature.name}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Link href="/login">
                  <Button 
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    } transition-all duration-200`}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Gateway Section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-white mb-6">Secure Payment Options</h3>
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <span>PayPal (USD)</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">₿</span>
              </div>
              <span>Crypto via NowPayments</span>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}