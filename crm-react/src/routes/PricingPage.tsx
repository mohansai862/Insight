/**
 * Tech Tammina CRM - Pricing Page
 * Pricing plans and features comparison
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Star } from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 5 users',
        '1,000 contacts',
        'Basic CRM features',
        'Email support',
        'Mobile app access',
        'Basic reporting',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: 79,
      description: 'Ideal for growing businesses',
      features: [
        'Up to 25 users',
        '10,000 contacts',
        'Advanced CRM features',
        'Priority support',
        'Mobile app access',
        'Advanced reporting',
        'Marketing automation',
        'Sales pipeline management',
        'Custom fields',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 149,
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited users',
        'Unlimited contacts',
        'All CRM features',
        '24/7 phone support',
        'Mobile app access',
        'Custom reporting',
        'Advanced automation',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Tech Tammina</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Back to Home
              </Link>
              <Button as={Link} to="/crm" variant="primary">
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the perfect plan for your business. Start free, upgrade anytime.
            </p>
            <div className="flex items-center justify-center space-x-4 mb-12">
              <Badge variant="success">14-day free trial</Badge>
              <Badge variant="info">No setup fees</Badge>
              <Badge variant="primary">Cancel anytime</Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`relative h-full ${
                    plan.popular 
                      ? 'ring-2 ring-primary-500 shadow-large scale-105' 
                      : 'hover-lift'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge variant="primary" className="px-4 py-1">
                        <Star className="w-4 h-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </CardTitle>
                    <p className="text-gray-600 mb-6">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /month per user
                      </span>
                    </div>
                    <Button
                      as={Link}
                      to="/crm"
                      variant={plan.popular ? 'primary' : 'secondary'}
                      fullWidth
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {plan.popular ? 'Start Free Trial' : 'Get Started'}
                    </Button>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                question: 'Can I change plans anytime?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we\'ll prorate any billing differences.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'Absolutely! We offer a 14-day free trial with full access to all features. No credit card required to start.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay by invoice.',
              },
              {
                question: 'Is my data secure?',
                answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest, and we\'re SOC 2 Type II compliant.',
              },
              {
                question: 'Do you offer discounts for annual billing?',
                answer: 'Yes! Save 20% when you pay annually. The discount is automatically applied at checkout.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of companies already using Tech Tammina CRM
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                as={Link}
                to="/crm"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start Free Trial
              </Button>
              <Button
                as={Link}
                to="/contact"
                variant="secondary"
                size="lg"
              >
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;