import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeatureComparisonTable from '@/components/feature-comparison-table';
import { 
  Check, 
  Star,
  ArrowLeft,
  CreditCard,
  Bitcoin,
  Shield
} from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with basic forwarding",
    features: [
      "1 Telegram Account",
      "3 Forwarding Pairs",
      "Smart Notifications",
      "Basic Support",
      "Community Access"
    ],
    color: "border-slate-600",
    bgColor: "bg-slate-800/50",
    popular: false,
    cta: "Get Started Free"
  },
  {
    name: "Pro",
    price: "$3.50",
    period: "month",
    description: "Advanced features for power users and small teams",
    features: [
      "3 Telegram Accounts",
      "15 Forwarding Pairs",
      "All Advanced Features",
      "Priority Support",
      "Real-time Sync",
      "Content Filtering"
    ],
    color: "border-blue-500",
    bgColor: "bg-blue-900/20",
    popular: true,
    cta: "Start Pro Trial"
  },
  {
    name: "Business",
    price: "$9.50",
    period: "month",
    description: "Enterprise-grade solution for businesses and agencies",
    features: [
      "10 Telegram Accounts",
      "50 Forwarding Pairs",
      "Custom Branding",
      "API Access",
      "Dedicated Support",
      "Advanced Analytics"
    ],
    color: "border-purple-500",
    bgColor: "bg-purple-900/20",
    popular: false,
    cta: "Contact Sales"
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                AutoForwardX
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="text-white font-medium">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent <span className="text-blue-400">Pricing</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your Telegram forwarding needs. 
            Start free, upgrade anytime.
          </p>

          {/* Trust Indicators */}
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 mb-12">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>14-day money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={plan.name} className={`${plan.bgColor} ${plan.color} border-2 relative transform transition-all duration-200 hover:scale-105`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-white text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-white mb-2">
                    {plan.price}
                    <span className="text-lg text-gray-400">/{plan.period}</span>
                  </div>
                  <p className="text-gray-400">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      } transition-all duration-200`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <FeatureComparisonTable />

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept PayPal payments in USD and various cryptocurrencies through NowPayments, including Bitcoin, Ethereum, and USDT."
              },
              {
                question: "Is there a free trial for paid plans?",
                answer: "Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial."
              },
              {
                question: "What happens if I exceed my plan limits?",
                answer: "We'll notify you when you approach your limits. You can upgrade your plan or temporarily pause some forwarding pairs to stay within limits."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 14-day money-back guarantee for all paid plans. Contact our support team for assistance with refunds."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold text-lg mb-3">{faq.question}</h3>
                  <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            Secure Payment Options
          </h2>
          <div className="flex justify-center items-center space-x-12 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">PayPal</div>
                <div className="text-gray-400 text-sm">Secure USD payments</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Crypto</div>
                <div className="text-gray-400 text-sm">Bitcoin, ETH, USDT & more</div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            All payments are processed securely with enterprise-grade encryption.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of users who trust AutoForwardX for their Telegram forwarding needs.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 px-8 py-3 text-lg">
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center space-x-8 mb-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-white">
              Pricing
            </Link>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Support
            </a>
          </div>
          <p className="text-gray-400">
            © 2025 AutoForwardX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}