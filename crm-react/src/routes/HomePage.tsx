/**
 * Tech Tammina CRM - Premium Landing Page
 * Futuristic, professional sales-focused homepage
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { contactFormApi, type ContactFormData } from '@/api/contactFormApi';

import { 
  ArrowRight, 
  CheckCircle,
  Target,
  Zap,
  BarChart3,
  TrendingUp,
  Shield,
  Play,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  Sparkles,
  Rocket,
  Brain,
  ChevronDown,
  Menu,
  X,
  Workflow
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import logoUrl from '@/Tech Tammina logo.png';

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type HomeContactFormData = z.infer<typeof contactSchema>;

const HomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HomeContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onContactSubmit = async (data: HomeContactFormData) => {
    try {
      const result = await contactFormApi.submit(data);
      if (result.success) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d2a4a] border-b border-[#1a3f6f] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <img src={logoUrl} alt="Tech Tammina logo" className="h-24 w-auto object-contain select-none -ml-6" draggable={false} />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-white font-medium transition-colors duration-200 hover:text-white/80">
                About
              </Link>
              <Link to="/contact" className="text-white font-medium transition-colors duration-200 hover:text-white/80">
                Contact
              </Link>
              <Link to="/login" className="text-sky-400 font-semibold hover:text-sky-300 transition-colors duration-200">
                Login
              </Link>

            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0d2a4a] border-t border-[#1a3f6f]"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/about" className="block text-white/80 hover:text-white font-medium">
                About
              </Link>
              <Link to="/contact" className="block text-white/80 hover:text-white font-medium">
                Contact
              </Link>
              <Link to="/login" className="block text-white font-semibold">
                Login
              </Link>

            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              #1 Sales CRM Platform
              <Star className="w-4 h-4 ml-2 text-yellow-500 fill-current" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8"
            >
              <span className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                Insight
              </span>
              <br />
              <span className="text-gray-900">CRM Platform</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed"
            >
              <span className="font-semibold text-primary-600">Delivering Excellence</span> in Sales Management.
              <br />
              Transform your sales process with comprehensive analytics and streamlined workflow optimization.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
            >

              <Button
                as={Link}
                to="/login"
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
                leftIcon={<Play className="w-6 h-6" />}
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-wrap items-center justify-center space-x-8 text-gray-500 text-sm"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>10,000+ Teams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span>99.9% Uptime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </motion.div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Experience the Future of
              <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"> Sales Management</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our advanced dashboard transforms complex sales data into actionable insights
            </p>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser Bar */}
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 bg-white rounded-lg px-4 py-1 text-sm text-gray-600 flex-1">
                    http://crms.tamminahub.com/crm/Dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Revenue Card */}
                  <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Total Revenue</h3>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold mb-2">$2.4M</div>
                    <div className="text-primary-100">+23% from last month</div>
                  </div>

                  {/* Deals Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Active Deals</h3>
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">147</div>
                    <div className="text-green-600">+12 this week</div>
                  </div>

                  {/* Conversion Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">34.2%</div>
                    <div className="text-blue-600">+5.3% improvement</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
                  <div className="h-32 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-end justify-between p-4">
                    {[40, 65, 45, 80, 55, 70, 85].map((height, index) => (
                      <div
                        key={index}
                        className="bg-primary-500 rounded-t-lg"
                        style={{ height: `${height}%`, width: '12%' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Sales Teams Choose
              <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"> Insight</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for sales professionals who demand excellence
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Close Deals Faster',
                description: 'AI-powered insights help you identify the hottest prospects and close deals 40% faster.',
                color: 'from-red-500 to-pink-500'
              },
              {
                icon: <Workflow className="w-8 h-8" />,
                title: 'Manage Your Pipeline',
                description: 'Visual pipeline management with drag-and-drop simplicity and real-time updates.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Automate Workflows',
                description: 'Smart automation handles repetitive tasks so you can focus on selling.',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: 'Real-time Insights',
                description: 'Advanced analytics and reporting give you the data you need to make informed decisions.',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group flex-1 min-w-[250px]"
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Who We Are
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                At Insight, we deliver excellence through innovative CRM solutions tailored specifically for Sales teams. 
                Our platform combines cutting-edge technology with intuitive design to help you achieve unprecedented sales success.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'AI-powered sales intelligence',
                  'Enterprise-grade security',
                  '24/7 customer support',
                  'Seamless integrations'
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <Button
                as={Link}
                to="/about"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Learn More About Us
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative flex-1"
            >
              <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-wrap gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 min-w-[120px]">
                    <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
                    <div className="text-gray-600">Happy Customers</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 min-w-[120px]">
                    <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 min-w-[120px]">
                    <div className="text-3xl font-bold text-blue-600 mb-2">50M+</div>
                    <div className="text-gray-600">Deals Closed</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 min-w-[120px]">
                    <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Let's Connect
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Ready to transform your sales process? Get in touch with our team and discover how Insight can help you deliver excellence.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: <Mail className="w-6 h-6" />, text: 'crms-noreply@tammina.in' },
                  { icon: <Phone className="w-6 h-6" />, text: '+91-891-2555-200' },
                  { 
                    icon: <MapPin className="w-6 h-6 cursor-pointer hover:text-blue-300 transition-colors" onClick={() => window.open('https://maps.google.com/?q=Sree+Tammina+Software+Solutions+SVS+Towers+Visakhapatnam+Andhra+Pradesh+530016+India', '_blank')} />, 
                    text: 'SVS Towers, Visakhapatnam, Andhra Pradesh - 530016, India' 
                  }
                ].map((contact, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-4 text-gray-300"
                  >
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                      {contact.icon}
                    </div>
                    <span className="text-lg">{contact.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                        Full Name
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        id="name"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.name ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="Ramesh Kumar J"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.email ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="ramesh@gmail.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                        Message
                      </label>
                      <textarea
                        {...register('message')}
                        id="message"
                        rows={4}
                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none ${
                          errors.message ? 'border-red-400' : 'border-white/20'
                        }`}
                        placeholder="Tell us about your sales team and how we can help..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={isSubmitting}
                      className="bg-white text-primary-600 hover:bg-gray-100"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending Message...
                        </div>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1 max-w-md">
              <div className="flex items-center space-x-3 mb-6">
                <img src={logoUrl} alt="Tech Tammina logo" className="w-24 h-24 object-contain select-none" draggable={false} />
                <div>
                  <span className="text-2xl font-bold">Insight</span>
                  <div className="text-sm text-gray-400">Delivering Excellence</div>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                Empowering sales teams with cutting-edge CRM technology for better customer relationships and accelerated revenue growth.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h3 className="font-semibold mb-6">Quick Links</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-6">Get Started</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>

                  <li><Link to="/crm" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <p className="text-gray-400 text-sm text-left">
              &copy; 2025 Tech Tammina. All rights reserved. Delivering Excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;