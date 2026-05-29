/**
 * Tech Tammina CRM - Leads List
 * Lead management with advanced filters and table view
 */

import { motion } from 'framer-motion';
import {
    Download,
    Eye,
    Filter,
    Mail,
    MoreHorizontal,
    Phone,
    Plus,
    Search,
    Star,
    TrendingUp,
    Upload,
    User,
    UserX,
    X
} from 'lucide-react';
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmailCompose from '@/components/EmailCompose';
import { useLeads } from '@/hooks/useApi';
import { leadsApi } from '@/api/leadsApi';
import { useAppSelector } from '@/lib/store';
import { formatCurrency, formatDate, getStatusColor } from '@/utils';
import { getCurrentRole, getCurrentUserId, hasTeamVisibility } from '@/utils/rbac';

const LeadsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [selectedSource, setSelectedSource] = React.useState<string>('');
  const [scope, setScope] = React.useState<'my' | 'team'>(() => (hasTeamVisibility(getCurrentRole()) ? 'team' : 'my'));
  const [hoveredLeadId, setHoveredLeadId] = React.useState<string | null>(null);

  const ownerId = getCurrentUserId();
  const filtersByScope = scope === 'my' && ownerId ? { ownerId: [ownerId] } : {};

  const [searchParams] = useSearchParams();
  const role = getCurrentRole();
  const isManager = hasTeamVisibility(role);

  const currentUser = useAppSelector((s) => s.auth.user);
  const isSalesExec = role === 'Sales_Executive' || currentUser?.role === 'Sales_Executive';
  
  const [reassignmentModal, setReassignmentModal] = React.useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });
  const [reassignmentReason, setReassignmentReason] = React.useState('');
  const [isSubmittingReassignment, setIsSubmittingReassignment] = React.useState(false);
  const [emailCompose, setEmailCompose] = React.useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });
  const [dropdownOpen, setDropdownOpen] = React.useState<string | null>(null);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleRequestReassignment = async () => {
    if (!reassignmentModal.lead || !reassignmentReason.trim()) return;
    
    setIsSubmittingReassignment(true);
    try {
      await leadsApi.requestReassignment(reassignmentModal.lead.id, reassignmentReason);
      setReassignmentModal({ open: false, lead: null });
      setReassignmentReason('');
      // Trigger notification refresh
      window.dispatchEvent(new Event('refreshNotifications'));
      // Show success message
      import('react-hot-toast').then(({ default: toast }) => {
        toast.success('Reassignment request submitted successfully');
      });
    } catch (error: any) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(error.message || 'Failed to submit reassignment request');
      });
    } finally {
      setIsSubmittingReassignment(false);
    }
  };

  const { data, isLoading, error, refetch } = useLeads({
    search: searchQuery,
    // Managers/Admins: see all leads
    ...(isSalesExec && currentUser?.id ? { assignedToId: currentUser.id, createdById: currentUser.id } : {}),
  });

  // Refetch data when component mounts or search changes
  React.useEffect(() => {
    refetch();
  }, [searchQuery, refetch]);

  // Strict client-side fallback for sales execs (handles backend ignoring filters)
  const leads = React.useMemo(() => {
    const list = data?.data || [];
    if (isSalesExec && currentUser?.id) {
      const myId = String(currentUser.id);
      return list.filter((l: any) => {
        const owner = (l.ownerId ?? l.assignedToId ?? '').toString();
        const creator = (l.createdById ?? '').toString();
        return owner === myId || creator === myId;
      });
    }
    return list;
  }, [data, isSalesExec, currentUser?.id]);
  const pagination = data?.pagination;

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'new', label: 'New' },
  ];

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'email_campaign', label: 'Email Campaign' },
    { value: 'trade_show', label: 'Trade Show' },
  ];



  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website':
        return '🌐';
      case 'social_media':
        return '📱';
      case 'referral':
        return '👥';
      case 'cold_call':
        return '📞';
      case 'email_campaign':
        return '📧';
      case 'trade_show':
        return '🏢';
      default:
        return '📝';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading leads: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your sales leads
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasTeamVisibility(getCurrentRole()) && (
            <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${scope === 'my' ? 'bg-primary-600 text-white' : 'text-gray-700'}`}
                onClick={() => setScope('my')}
              >
                My
              </button>
              <button
                className={`px-3 py-2 text-sm border-l border-gray-200 ${scope === 'team' ? 'bg-primary-600 text-white' : 'text-gray-700'}`}
                onClick={() => setScope('team')}
              >
                Team
              </button>
            </div>
          )}
          <Button variant="ghost" leftIcon={<Upload className="w-4 h-4" />}>
            Import
          </Button>
          <Button variant="ghost" leftIcon={<Download className="w-4 h-4" />}>
            Download Excel
          </Button>
          <Button 
            as={Link} 
            to="/crm/Leads/new" 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-6">
        {[
          { label: 'Total Leads', value: '1,247', change: '+12%', icon: <User className="w-5 h-5" /> },
          { label: 'New This Week', value: '23', change: '+8%', icon: <TrendingUp className="w-5 h-5" /> },
          { label: 'Qualified', value: '156', change: '+15%', icon: <Star className="w-5 h-5" /> },
          { label: 'Conversion Rate', value: '24.8%', change: '-2%', icon: <TrendingUp className="w-5 h-5" /> },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-1 min-w-[200px]"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md relative">
              <Input
                placeholder="Search leads"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sourceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button variant="ghost" leftIcon={<Filter className="w-4 h-4" />}>
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Leads ({pagination?.total || 0}) - Debug: {leads.length} leads loaded
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={9} />
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedStatus || selectedSource
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first lead'
                }
              </p>
              {!searchQuery && !selectedStatus && !selectedSource && (
                <Button as={Link} to="/crm/Leads/new" variant="primary">
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Lead</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Created At</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Created By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => setHoveredLeadId(lead.id)}
                      onMouseLeave={() => setHoveredLeadId(null)}
                    >
                      <td className="py-4 px-4" style={{ pointerEvents: hoveredLeadId === lead.id ? 'none' : 'auto' }}>
                        <div>
                          <Link
                            to={`/crm/Leads/${lead.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                            style={{
                              pointerEvents: hoveredLeadId === lead.id ? 'none' : 'auto',
                              cursor: hoveredLeadId === lead.id ? 'default' : 'pointer'
                            }}
                          >
                            {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unknown'}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {lead.email}
                          </div>
                          {lead.phoneNumber && (
                            <div className="text-sm text-gray-500">
                              {lead.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {lead.companyName || '-'}
                        </div>
                        {lead.designation && (
                          <div className="text-sm text-gray-500">
                            {lead.designation}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getSourceIcon(lead.source)}
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {lead.source.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={getStatusColor(lead.status)}
                          size="sm"
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {typeof lead.value === 'number' ? formatCurrency(lead.value) : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {lead.createdAt ? formatDate(lead.createdAt) : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {lead.createdBy || 'System'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-orange-600 font-medium">
                          {lead.ownerName || lead.assignedToName || lead.assignedTo?.name || lead.owner?.name || lead.createdBy || 'Test Owner'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {(role === 'Sales_Manager' || role === 'Sales_VP') ? (
                            <button 
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              onClick={() => window.location.href = `/crm/Leads/${lead.id}`}
                              title="View Lead"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button 
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                onClick={() => setEmailCompose({ open: true, lead })}
                                title="Send Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              {lead.phoneNumber && (
                                <button 
                                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                                  onClick={() => window.open(`tel:${lead.phoneNumber}`, '_self')}
                                  title="Call Lead"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                                onClick={() => setReassignmentModal({ open: true, lead })}
                              >
                                Reassign
                              </button>
                              <div className="relative">
                                <button 
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  onClick={() => setDropdownOpen(dropdownOpen === lead.id ? null : lead.id)}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {dropdownOpen === lead.id && (
                                  <div className="absolute right-8 bottom-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                      onClick={() => {
                                        window.location.href = `/crm/Leads/${lead.id}`;
                                        setDropdownOpen(null);
                                      }}
                                    >
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                      onClick={() => {
                                        // Handle delete action
                                        setDropdownOpen(null);
                                      }}
                                    >
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => {
                // Handle previous page and scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      // Handle page change and scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => {
                // Handle next page and scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Reassignment Modal */}
      {reassignmentModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Request Lead Reassignment
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Request reassignment of lead: <strong>{reassignmentModal.lead?.firstName} {reassignmentModal.lead?.lastName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reassignment *
              </label>
              <textarea
                value={reassignmentReason}
                onChange={(e) => setReassignmentReason(e.target.value)}
                placeholder="Please provide a reason for the reassignment request"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setReassignmentModal({ open: false, lead: null });
                  setReassignmentReason('');
                }}
                disabled={isSubmittingReassignment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRequestReassignment}
                disabled={!reassignmentReason.trim() || isSubmittingReassignment}
              >
                {isSubmittingReassignment ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Email Compose Modal */}
      <EmailCompose
        isOpen={emailCompose.open}
        onClose={() => setEmailCompose({ open: false, lead: null })}
        recipientEmail={emailCompose.lead?.email}
        recipientName={`${emailCompose.lead?.firstName || ''} ${emailCompose.lead?.lastName || ''}`.trim()}
        entityType="lead"
        entityId={emailCompose.lead?.id}
      />
    </div>
  );
};

export default LeadsList;
