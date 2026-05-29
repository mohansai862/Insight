/**
 * Tech Tammina CRM - About Page
 * Company information and values
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Zap, 
  Eye, 
  Users,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import logoUrl from '@/Tech Tammina logo.png';
import missionImg from '@/our mission.png';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d2a4a] border-b border-[#1a3f6f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <img src={logoUrl} alt="Tech Tammina logo" className="h-24 w-auto object-contain select-none -ml-6" draggable={false} />
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-white transition-colors hover:text-white/80">
                Home
              </Link>
              <Link to="/contact" className="text-white transition-colors hover:text-white/80">
                Contact
              </Link>
              <Link to="/login" className="text-sky-400 font-medium hover:text-sky-300 transition-colors">
                Login
              </Link>
              <Button as={Link} to="/signup" variant="primary">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer below fixed nav */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" />
      </div>

      {/* Hero Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              About Insight
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto">
              Delivering Excellence in Sales CRM
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Vision Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
              Our Vision
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                At Insight, we envision a world where every sales team has access to cutting-edge CRM technology 
                that not only manages customer relationships but transforms them into lasting partnerships that drive 
                sustainable business growth.
              </p>
              <div className="flex flex-wrap gap-8 mt-12">
                {[
                  {
                    icon: <Target className="w-8 h-8" />,
                    title: 'Sales Excellence',
                    description: 'Empowering sales teams to achieve unprecedented results through intelligent automation and insights.',
                  },
                  {
                    icon: <TrendingUp className="w-8 h-8" />,
                    title: 'Growth Focus',
                    description: 'Every feature designed to accelerate revenue growth and expand market opportunities.',
                  },
                  {
                    icon: <Award className="w-8 h-8" />,
                    title: 'Quality First',
                    description: 'Delivering excellence in every interaction, every feature, and every customer experience.',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex-1 min-w-[250px]"
                  >
                    <Card className="h-full backdrop-blur-sm bg-white/80 border-white/20 shadow-glass hover-lift">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                          {item.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {item.title}
                        </h3>
                        <p className="text-gray-600">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Our Mission & Values
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Sales Growth</h3>
                  <p className="text-gray-600">
                    We believe every business deserves tools that don't just manage sales processes, 
                    but actively accelerate revenue growth through intelligent insights and automation.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
                  <p className="text-gray-600">
                    Constantly pushing the boundaries of what's possible in CRM technology, 
                    bringing futuristic solutions to today's sales challenges.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer-First Approach</h3>
                  <p className="text-gray-600">
                    Every feature, every update, every decision is made with our customers' success in mind. 
                    Your growth is our success.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative flex-1"
            >
              <div className="aspect-square flex items-center justify-center">
                <img
                  src={missionImg}
                  alt="Our Mission"
                  className="max-w-[80%] max-h-[80%] object-contain"
                  draggable={false}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Insight?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Three core pillars that make us the preferred choice for sales teams worldwide
              </p>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-8">
            {[
              {
                icon: <Zap className="w-10 h-10" />,
                title: 'Speed',
                description: 'Lightning-fast performance with real-time updates. No more waiting for data to load or processes to complete.',
                features: ['Instant data sync', 'Real-time notifications', 'Quick actions']
              },
              {
                icon: <Target className="w-10 h-10" />,
                title: 'Simplicity',
                description: 'Intuitive design that your team will love. Minimal learning curve, maximum productivity from day one.',
                features: ['Clean interface', 'Easy navigation', 'Smart workflows']
              },
              {
                icon: <Eye className="w-10 h-10" />,
                title: 'Insights',
                description: 'Powerful analytics and reporting that turn your sales data into actionable intelligence for better decisions.',
                features: ['Advanced analytics', 'Custom reports', 'Predictive insights']
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-1 min-w-[300px]"
              >
                <Card className="h-full hover-lift">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary-600">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {item.description}
                    </p>
                    <ul className="space-y-2">
                      {item.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center justify-center text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></div>
                          {feature}
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Experience Excellence?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of sales teams who trust Insight to deliver results.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                as={Link}
                to="/signup"
                variant="secondary"
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started Today
              </Button>
              <Button
                as={Link}
                to="/contact"
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                Contact Our Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1 max-w-md">
              <div className="flex items-center space-x-2 mb-4">
                <img src={logoUrl} alt="Tech Tammina logo" className="w-24 h-24 object-contain select-none" draggable={false} />
                {/* <span className="text-xl font-bold">Insight</span> */}
              </div>
              <p className="text-gray-400 mb-4">
                Delivering Excellence in Sales Management
              </p>
              <p className="text-gray-500 text-sm">
                Empowering sales teams with cutting-edge CRM technology for better customer relationships and accelerated revenue growth.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Get Started</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                  <li><Link to="/signup" className="hover:text-white transition-colors">Signup</Link></li>
                  <li><Link to="/crm" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <p className="text-gray-400 text-sm text-left">
              &copy; 2025 Tech Tammina. All rights reserved. Delivering Excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;