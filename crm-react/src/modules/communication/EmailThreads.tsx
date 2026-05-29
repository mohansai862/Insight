/**
 * Tech Tammina CRM - Email Threads
 * Email conversation threads and management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Search,
  Filter,
  Archive,
  Star,
  Reply,
  Forward,
  MoreHorizontal,
  Paperclip,
  Calendar,
  User,
  Send,
  Plus,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/utils';

const EmailThreads: React.FC = () => {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock email threads data
  const emailThreads = [
    {
      id: '1',
      subject: 'Product Demo Follow-up',
      participants: [
        { name: 'John Smith', email: 'john@company.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
        { name: 'Sarah Wilson', email: 'sarah@techtammina.com', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      ],
      lastMessage: 'Thanks for the demo yesterday. We\'d like to schedule a follow-up meeting to discuss pricing.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      unread: true,
      starred: false,
      hasAttachment: false,
      messageCount: 5,
      status: 'active',
    },
    {
      id: '2',
      subject: 'Contract Renewal Discussion',
      participants: [
        { name: 'Alice Johnson', email: 'alice@enterprise.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
        { name: 'Mike Johnson', email: 'mike@techtammina.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      ],
      lastMessage: 'I\'ve reviewed the renewal terms and have a few questions about the new pricing structure.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      unread: false,
      starred: true,
      hasAttachment: true,
      messageCount: 8,
      status: 'important',
    },
    {
      id: '3',
      subject: 'Technical Integration Support',
      participants: [
        { name: 'Bob Davis', email: 'bob@startup.io', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
        { name: 'Tech Support', email: 'support@techtammina.com', avatar: null },
      ],
      lastMessage: 'The API integration is working perfectly now. Thank you for the quick resolution!',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      unread: false,
      starred: false,
      hasAttachment: false,
      messageCount: 12,
      status: 'resolved',
    },
    {
      id: '4',
      subject: 'Partnership Opportunity',
      participants: [
        { name: 'Carol White', email: 'carol@partner.com', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
        { name: 'Business Dev', email: 'bizdev@techtammina.com', avatar: null },
      ],
      lastMessage: 'We\'re excited about the potential partnership. Let\'s set up a call to discuss next steps.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      unread: true,
      starred: false,
      hasAttachment: true,
      messageCount: 3,
      status: 'new',
    },
  ];

  // Mock individual messages for selected thread
  const getMessagesForThread = (threadId: string) => {
    const mockMessages = [
      {
        id: '1',
        sender: { name: 'John Smith', email: 'john@company.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
        content: 'Hi Sarah,\n\nThank you for the comprehensive product demo yesterday. Our team was impressed with the features and capabilities.\n\nWe\'d like to schedule a follow-up meeting to discuss pricing options and implementation timeline.\n\nBest regards,\nJohn',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        attachments: [],
      },
      {
        id: '2',
        sender: { name: 'Sarah Wilson', email: 'sarah@techtammina.com', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
        content: 'Hi John,\n\nI\'m glad you found the demo valuable! I\'d be happy to discuss pricing and implementation details.\n\nI have availability this week on:\n- Thursday 2-4 PM\n- Friday 10 AM - 12 PM\n\nWould either of these times work for your team?\n\nI\'ll also send over our pricing guide and implementation checklist.\n\nBest,\nSarah',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        attachments: [
          { name: 'Pricing_Guide_2024.pdf', size: '2.4 MB' },
          { name: 'Implementation_Checklist.docx', size: '1.2 MB' },
        ],
      },
    ];
    return mockMessages;
  };

  const filteredThreads = React.useMemo(() => {
    const normalized = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized && !/\S/.test(searchQuery)) return emailThreads;
    if (!normalized) return emailThreads;

    const tokens = normalized.split(' ');

    return emailThreads.filter(thread => {
      const subjectLower = thread.subject.toLowerCase();
      
      if (tokens.length === 1) {
        return subjectLower.includes(tokens[0]) ||
          thread.participants.some(p => p.name.toLowerCase().includes(tokens[0]));
      }

      // Multi-word: check if subject contains all tokens
      const subjectParts = subjectLower.split(/\s+/).filter(Boolean);
      if (subjectParts.length >= tokens.length) {
        const subjectMatch = tokens.every((token, i) => subjectParts[i]?.startsWith(token));
        if (subjectMatch) return true;
      }

      // Multi-word: check participant names (firstName + lastName pattern)
      return thread.participants.some(p => {
        const nameParts = p.name.toLowerCase().split(/\s+/);
        if (tokens.length > nameParts.length) return false;
        return tokens.every((token, i) => nameParts[i]?.startsWith(token));
      });
    });
  }, [searchQuery]);

  const selectedThreadData = selectedThread 
    ? emailThreads.find(t => t.id === selectedThread)
    : null;

  const messages = selectedThread ? getMessagesForThread(selectedThread) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Threads</h2>
          <p className="text-gray-600 mt-1">Manage email conversations with customers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
        {/* Email List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="space-y-4">
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Inbox</span>
                  <Badge variant="default" size="sm">
                    {filteredThreads.filter(t => t.unread).length}
                  </Badge>
                </CardTitle>
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedThread === thread.id ? 'bg-blue-50 border-blue-200' : ''
                    } ${thread.unread ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex -space-x-2">
                        {thread.participants.slice(0, 2).map((participant, index) => (
                          <Avatar
                            key={index}
                            src={participant.avatar}
                            name={participant.name}
                            size="sm"
                            className="border-2 border-white"
                          />
                        ))}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm truncate ${
                            thread.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          }`}>
                            {thread.subject}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {thread.starred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            {thread.hasAttachment && (
                              <Paperclip className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {thread.participants.map(p => p.name).join(', ')}
                        </p>
                        
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {thread.lastMessage}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(thread.timestamp)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={
                                thread.status === 'active' ? 'bg-green-100 text-green-800' :
                                thread.status === 'important' ? 'bg-red-100 text-red-800' :
                                thread.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }
                              size="xs"
                            >
                              {thread.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {thread.messageCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Content */}
        <div className="lg:col-span-2">
          {selectedThreadData ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedThreadData.subject}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedThreadData.participants.map(p => p.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" leftIcon={<Archive className="w-4 h-4" />}>
                      Archive
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Star className="w-4 h-4" />}>
                      Star
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<MoreHorizontal className="w-4 h-4" />}>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={message.id} className="p-6 border-b border-gray-100">
                      <div className="flex items-start space-x-4">
                        <Avatar
                          src={message.sender.avatar}
                          name={message.sender.name}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {message.sender.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {message.sender.email}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-line text-gray-700">
                              {message.content}
                            </p>
                          </div>
                          
                          {message.attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-medium text-gray-700">Attachments:</p>
                              {message.attachments.map((attachment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                                >
                                  <Paperclip className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{attachment.name}</span>
                                  <span className="text-xs text-gray-500">({attachment.size})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reply Section */}
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex items-center space-x-3 mb-4">
                    <Button variant="primary" leftIcon={<Reply className="w-4 h-4" />}>
                      Reply
                    </Button>
                    <Button variant="ghost" leftIcon={<Forward className="w-4 h-4" />}>
                      Forward
                    </Button>
                    <Button variant="ghost" leftIcon={<Calendar className="w-4 h-4" />}>
                      Schedule
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Type your reply..."
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" leftIcon={<Paperclip className="w-4 h-4" />}>
                        Attach File
                      </Button>
                      <Button variant="primary" leftIcon={<Send className="w-4 h-4" />}>
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an email thread
                  </h3>
                  <p className="text-gray-600">
                    Choose an email from the list to view the conversation
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmailThreads;
