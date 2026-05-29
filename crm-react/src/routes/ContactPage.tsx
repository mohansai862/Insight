/**
 * Tech Tammina CRM - Contact Page
 * Contact form and company information
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { contactFormApi } from '@/api/contactFormApi';

import { 
  Send,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import logoUrl from '@/Tech Tammina logo.png';

// Validation schema
const contactSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage: React.FC = () => {
  const [showOffices, setShowOffices] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const result = await contactFormApi.submit({
        name: data.fullName,
        email: data.email,
        message: data.message,
        subject: data.subject
      });
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
              <Link to="/about" className="text-white transition-colors hover:text-white/80">
                About
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
              Contact Us
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your sales process? Let's connect and discuss how Insight can help your team deliver excellence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <Card className="backdrop-blur-sm bg-white border-gray-200 shadow-large">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Send us a Message
                  </h2>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        {...register('fullName')}
                        type="text"
                        id="fullName"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.fullName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Yash Patel"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="yash@gmail.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        {...register('subject')}
                        type="text"
                        id="subject"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.subject ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="How can we help your sales team?"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        {...register('message')}
                        id="message"
                        rows={5}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none ${
                          errors.message ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Tell us about your sales team, current challenges, and how we can help you deliver excellence..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                      rightIcon={isSubmitting ? undefined : <Send className="w-5 h-5" />}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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

            {/* Company Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8 flex-1"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Get in Touch
                </h2>
                <p className="text-gray-600 mb-8">
                  Our team is here to help you transform your sales process. Whether you have questions about our platform, 
                  need a demo, or want to discuss your specific requirements, we're ready to assist.
                </p>
              </div>

              {/* Contact Information Cards */}
              <div className="space-y-4">
                {[
                  {
                    icon: <Mail className="w-6 h-6" />,
                    title: 'Email Us',
                    content: 'crms-noreply@tammina.in',
                    description: 'Send us an email anytime'
                  },
                  {
                    icon: <Phone className="w-6 h-6" />,
                    title: 'Call Us',
                    content: '+91-891-2555-200',
                    description: 'Mon-Fri from 10am to 6pm IST'
                  },
                  {
                    icon: <MapPin className="w-6 h-6" />,
                    title: 'Visit Us',
                    content: 'Multiple Global Locations',
                    description: 'Click to view all our offices worldwide',
                    isDropdown: true
                  },
                  {
                    icon: <Clock className="w-6 h-6" />,
                    title: 'Response Time',
                    content: 'Within 24 hours',
                    description: 'We respond to all inquiries quickly'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="hover-lift">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className={`flex items-center justify-between ${item.isDropdown ? 'cursor-pointer' : ''}`} onClick={item.isDropdown ? () => setShowOffices(!showOffices) : undefined}>
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {item.title}
                                </h3>
                                <p className="text-gray-900 font-medium mb-1">
                                  {item.content}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.description}
                                </p>
                              </div>
                              {item.isDropdown && (
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showOffices ? 'rotate-180' : ''}`} />
                              )}
                            </div>
                            
                            {item.isDropdown && showOffices && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-3 border-t pt-4"
                              >
                                {[
                                  {
                                    country: 'USA',
                                    company: 'Tech Tammina LLC',
                                    address: '4460 Brookfield Corporate Dr, Suite N, Chantilly, VA 20151, USA',
                                    phone: '+1 703-349-1074',
                                    flag: '🇺🇸'
                                  },
                                  {
                                    country: 'India (Visakhapatnam)',
                                    company: 'Sree Tammina Software Solutions (I) PVT LTD.',
                                    address: 'SVS Towers, Visakhapatnam – 530016, Andhra Pradesh, India',
                                    phone: '+91-891-2555-200 / +91-891-2555-204',
                                    flag: '🇮🇳'
                                  },
                                  {
                                    country: 'India (Hyderabad)',
                                    company: 'Sree Tammina Software Solutions (I) PVT LTD.',
                                    address: '2nd Floor, C-Block, Win Win Towers, Madhapur, HITEC City, Hyderabad – 500081, Telangana, India',
                                    phone: '',
                                    flag: '🇮🇳'
                                  },
                                  {
                                    country: 'Netherlands',
                                    company: 'Tech Tammina BV',
                                    address: 'Keizersgracht 391A, 1016 EJ, Amsterdam, Netherlands',
                                    phone: '',
                                    flag: '🇳🇱'
                                  },
                                  {
                                    country: 'United Kingdom',
                                    company: 'Tech Tammina LTD',
                                    address: 'Woodberry House, 2 Woodberry Grove, Finchley, London – N12 0DR, United Kingdom',
                                    phone: '',
                                    flag: '🇬🇧'
                                  },
                                  {
                                    country: 'UAE',
                                    company: 'Tech Tammina IT Services CO. L.L.C',
                                    address: 'Office No. 106, Level 1, Coastal Building, Near Al Twar Centre, Al Qusais 2, P.O. Box: 51150, Dubai, UAE',
                                    phone: '',
                                    flag: '🇦🇪'
                                  }
                                ].map((office, officeIndex) => (
                                  <div key={officeIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-lg">{office.flag}</span>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 text-sm">{office.country}</h4>
                                      <p className="text-xs text-gray-600 mb-1">{office.company}</p>
                                      <p className="text-xs text-gray-500 mb-1">{office.address}</p>
                                      {office.phone && (
                                        <p className="text-xs text-primary-600 font-medium">{office.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600 mb-4">
                  Skip the contact form and jump straight into experiencing our platform.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    as={Link}
                    to="/signup"
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    as={Link}
                    to="/login"
                    variant="outline"
                    size="sm"
                  >
                    Login to Dashboard
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Offices Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Global Presence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insight operates across multiple continents, bringing world-class CRM solutions to businesses worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                country: 'USA',
                title: 'Corporate Head Quarters',
                company: 'Tech Tammina LLC',
                address: '4460 Brookfield Corporate Dr, Suite N,\nChantilly, VA 20151, USA',
                phone: '+1 703-349-1074',
                flag: '🇺🇸'
              },
              {
                country: 'India (Visakhapatnam)',
                title: 'Development Center',
                company: 'Sree Tammina Software Solutions (I) PVT LTD.',
                address: 'SVS Towers, Visakhapatnam – 530016,\nAndhra Pradesh, India',
                phone: '+91-891-2555-200 / +91-891-2555-204',
                flag: '🇮🇳'
              },
              {
                country: 'India (Hyderabad)',
                title: 'Technology Hub',
                company: 'Sree Tammina Software Solutions (I) PVT LTD.',
                address: '2nd Floor, C-Block, Win Win Towers,\nMadhapur, HITEC City, Hyderabad – 500081,\nTelangana, India',
                phone: '',
                flag: '🇮🇳'
              },
              {
                country: 'Netherlands',
                title: 'European Operations',
                company: 'Tech Tammina BV',
                address: 'Keizersgracht 391A, 1016 EJ,\nAmsterdam, Netherlands',
                phone: '',
                flag: '🇳🇱'
              },
              {
                country: 'United Kingdom',
                title: 'UK Operations',
                company: 'Tech Tammina LTD',
                address: 'Woodberry House, 2 Woodberry Grove,\nFinchley, London – N12 0DR\nUnited Kingdom',
                phone: '',
                flag: '🇬🇧'
              },
              {
                country: 'UAE',
                title: 'Middle East Operations',
                company: 'Tech Tammina IT Services CO. L.L.C',
                address: 'Office No. 106, Level 1,\nCoastal Building, Near Al Twar Centre,\nAl Qusais 2, P.O. Box: 51150\nDubai, UAE',
                phone: '',
                flag: '🇦🇪'
              }
            ].map((office, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-2xl">{office.flag}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{office.country}</h3>
                        <p className="text-sm text-primary-600 font-medium">{office.title}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{office.company}</p>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 whitespace-pre-line">{office.address}</p>
                      </div>
                      
                      {office.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{office.phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
                  <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
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

export default ContactPage;