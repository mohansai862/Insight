import { logger } from '@/utils/logger';
/**
 * Tech Tammina CRM - Deal Detail View
 * Detailed deal information with stakeholders and activity timeline
 */

import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  TrendingUp,
  Building,
  User,
  FileText,
  MessageSquare,
  Activity,
  Target,
  MapPin,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

import { useDeal, useLeads } from '@/hooks/useApi';
import { dealDocumentsApi } from '@/api/dealDocumentsApi';
import { activitiesApi } from '@/api/activitiesApi';
import { formatCurrency, formatCompactCurrency, formatDate, formatRelativeTime, getStatusColor, formatFileSize } from '@/utils';
import { getCurrentRole, can } from '@/utils/rbac';

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error } = useDeal(id!);
  const { data: allLeadsResp } = useLeads({ limit: 1000 });
  const allLeads = (allLeadsResp as any)?.data || [];

  React.useEffect(() => {
    // Clear navigation flag when detail component mounts
    sessionStorage.removeItem('navigatingToDealDetail');
  }, []);

  const handleBackClick = () => {
    // Set flag to indicate we're returning from detail view
    sessionStorage.setItem('returningFromDealDetail', 'true');
    
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/crm/Deals');
    }
  };

  const deal = data?.data;
  
  // Check if this deal is linked to a converted lead with pending reassignment
  const hasConvertedLeadWithPendingReassignment = React.useMemo(() => {
    if (!deal?.id) return false;
    
    console.log('🔍 Deal ID:', deal.id);
    console.log('🔍 All leads:', allLeads.map(l => ({ id: l.id, convertedDealId: l.convertedDealId, status: l.status, reassignmentPending: l.reassignmentPending })));
    
    const result = allLeads.some((lead: any) => {
      const matches = String(lead.convertedDealId) === String(deal.id) && 
        lead.status === 'converted' && 
        lead.reassignmentPending === true;
      
      if (String(lead.convertedDealId) === String(deal.id)) {
        console.log('🔍 Found matching lead:', { leadId: lead.id, convertedDealId: lead.convertedDealId, status: lead.status, reassignmentPending: lead.reassignmentPending, matches });
      }
      
      return matches;
    });
    
    console.log('🔍 Has pending reassignment:', result);
    
    // TEMPORARY TEST: Force disable for testing
    const testResult = result || deal.id === '1'; // Force disable for deal ID 1
    console.log('🔍 Final result (with test):', testResult);
    return testResult;
  }, [allLeads, deal?.id]);

  const [docs, setDocs] = React.useState<any[]>([]);
  const [documentPreview, setDocumentPreview] = React.useState<{ url: string; name: string; type: string } | null>(null);
  const [excelPreview, setExcelPreview] = React.useState<{ html: string; name: string } | null>(null);
  const [pdfPreview, setPdfPreview] = React.useState<{ url: string; name: string } | null>(null);
  const pdfUrlRef = React.useRef<string | null>(null);
  const [activityTimeline, setActivityTimeline] = React.useState<any[]>([]);

  const fetchDocuments = React.useCallback(async () => {
    if (!deal?.id) return;
    try {
      const list = await dealDocumentsApi.list(deal.id);
      setDocs(list || []);
    } catch (error) {
      logger.error('Error fetching documents:', error);
      setDocs([]);
    }
  }, [deal?.id]);

  React.useEffect(() => {
    if (deal?.id) {
      fetchDocuments();
    }
  }, [fetchDocuments, deal?.id]);

  const fetchActivityTimeline = React.useCallback(async () => {
    if (!deal?.id) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('tech_tammina_session') || '{}');
      const response = await fetch(`/api/deals/${deal.id}/activity`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'X-User-Id': session.id || '',
          'X-User-Role': session.role || '',
        }
      });
      
      if (response.ok) {
        const activities = await response.json();
        if (Array.isArray(activities)) {
          const formattedActivities = activities.map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.changedAt,
            user: a.userName || 'System',
            previousStage: a.previousStage,
            newStage: a.newStage,
            value: a.value
          }));
          setActivityTimeline(formattedActivities);
        }
      }
    } catch (error) {
      logger.error('Error fetching activity timeline:', error);
      setActivityTimeline([]);
    }
  }, [deal?.id]);

  React.useEffect(() => {
    fetchActivityTimeline();
  }, [fetchActivityTimeline]);

  React.useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading deal: {error?.message || 'Deal not found'}</p>
          <Button as={Link} to="/crm/Deals" variant="ghost" className="mt-4">
            Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  const mapStageToDisplay = (stage: string) => {
    if (!stage) return stage;
    const normalizedStage = stage.toLowerCase().trim();
    switch (normalizedStage) {
      case 'closed_won': return 'Won';
      case 'closed_lost': return 'Lost';
      default: return stage;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const session = JSON.parse(localStorage.getItem('tech_tammina_session') || '{}');
      const fileName = doc.documentName.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      
      const response = await fetch(dealDocumentsApi.viewUrl(deal.id, doc.documentId, doc.fileIndex), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'X-User-Id': session.id || session.userId || '',
          'X-User-Role': session.role || ''
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Open supported formats in new tab
        if (['pdf', 'png', 'jpg', 'jpeg', 'txt'].includes(fileExtension)) {
          window.open(url, '_blank');
          return;
        }
        
        // Show popup for unsupported formats
        setDocumentPreview({
          url,
          name: doc.documentName,
          type: fileExtension
        });
      }
    } catch (error) {
      logger.error('Failed to view document:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleBackClick}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className=""
          >
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{deal.name}</h1>
            {/* <p className="text-gray-600 mt-1">
              {deal.company || 'No company'} • {formatCurrency(deal.value)}
            </p> */}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {can(getCurrentRole(), 'Deals', 'Edit') && (
            <Button
              as={hasConvertedLeadWithPendingReassignment ? undefined : Link}
              to={hasConvertedLeadWithPendingReassignment ? undefined : `/crm/Deals/${deal.id}/edit`}
              variant="primary"
              leftIcon={<Edit className="w-4 h-4" />}
              disabled={hasConvertedLeadWithPendingReassignment}
              className={hasConvertedLeadWithPendingReassignment ? 'opacity-50 cursor-not-allowed' : ''}
              title={hasConvertedLeadWithPendingReassignment ? 'Cannot edit - Deal linked to converted lead with pending reassignment' : 'Edit deal'}
              onClick={hasConvertedLeadWithPendingReassignment ? (e) => e.preventDefault() : undefined}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Deal Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(deal.value).replace('$ ', '$')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Probability</p>
                  <p className={`text-2xl font-bold ${getProbabilityColor(deal.probability)}`}>
                    {deal.probability}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Expected Close</p>
                  <p className="text-lg font-bold text-gray-900">
                    {deal.closeDate ? formatDate(deal.closeDate) : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium">{deal.company || '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Stage</p>
                        <Badge 
                          className={`${
                            deal.stage.toLowerCase() === 'qualification' || deal.stage.toLowerCase() === 'qualified' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' :
                            deal.stage.toLowerCase() === 'proposal' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700' :
                            deal.stage.toLowerCase() === 'negotiation' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' :
                            deal.stage.toLowerCase() === 'closed_won' || deal.stage.toLowerCase() === 'won' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' :
                            deal.stage.toLowerCase() === 'closed_lost' || deal.stage.toLowerCase() === 'lost' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' :
                            'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                          }`} 
                          size="sm"
                        >
                          {deal.stage === 'won' ? 'Won' : deal.stage === 'lost' ? 'Lost' : deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(deal as any)?.customFields && (((deal as any).customFields.companyCity) || ((deal as any).customFields.companyCountry)) && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company Location</p>
                          <p className="font-medium">{[((deal as any).customFields.companyCity || ''), ((deal as any).customFields.companyCountry || '')].filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-medium">{deal.leadName || 'Not Available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(deal.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Description */}
          {deal.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{deal.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Deal Remarks (for Lost deals) */}
          {deal.stage === 'lost' && deal.remarks && (
            <Card>
              <CardHeader>
                <CardTitle>Loss Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{deal.remarks}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto p-6">
                <div className="space-y-4">
                  {activityTimeline.length > 0 ? (
                    activityTimeline.map((activity, index) => (
                      <div key={activity.id || activity.activityId || index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          (activity.type === 'STAGE_CHANGE') ? 'bg-purple-100 dark:bg-purple-900' : 
                          (activity.type === 'CREATION') ? 'bg-green-100 dark:bg-green-900' :
                          (activity.type === 'COMMENT') ? 'bg-blue-100 dark:bg-blue-900' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {(activity.type === 'STAGE_CHANGE') && <TrendingUp className="w-4 h-4 text-purple-600" />}
                          {(activity.type === 'CREATION') && <Target className="w-4 h-4 text-green-600" />}
                          {(activity.type === 'COMMENT') && <MessageSquare className="w-4 h-4 text-blue-600" />}
                          {(activity.type === 'NOTE') && <FileText className="w-4 h-4 text-gray-600" />}
                          {!['STAGE_CHANGE', 'CREATION', 'COMMENT', 'NOTE'].includes(activity.type) && <Activity className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{activity.title || activity.type || 'Activity'}</h4>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.type === 'STAGE_CHANGE' && activity.previousStage && activity.newStage ? (
                              <>
                                Stage changed from <span className="font-medium text-orange-600">{mapStageToDisplay(activity.previousStage)}</span> to <span className="font-medium text-green-600">{mapStageToDisplay(activity.newStage)}</span>
                              </>
                            ) : activity.type === 'VALUE_CHANGE' && activity.value ? (
                              <>
                                Deal value updated to {formatCompactCurrency(activity.value).replace('$ ', '$')}
                              </>
                            ) : activity.type === 'CREATION' && activity.value ? (
                              <>
                                Deal created with value {formatCompactCurrency(activity.value).replace('$ ', '$')}
                              </>
                            ) : (
                              activity.description || 'No description'
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">by {activity.user || 'System'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Deal Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deal.stage === 'won' && (deal as any).closedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Closed Date</span>
                    <span className="font-semibold text-green-600">
                      {formatDate((deal as any).closedDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Since Created</span>
                  <span className="font-semibold">
                    {Math.floor((new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Modified</span>
                  <span className="font-semibold">
                    {deal.updatedAt ? formatRelativeTime(deal.updatedAt) : 'N/A'}
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Files & Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Files & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 ${docs.length > 5 ? 'max-h-80 overflow-y-auto' : ''}`} style={docs.length > 5 ? { scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' } : {}}>
                {docs.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                    </p>
                  </div>
                ) : (
                  docs.map((doc) => (
                    <div key={doc.documentId} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.documentName}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          {doc.documentSize && (
                            <span>{formatFileSize(doc.documentSize)}</span>
                          )}
                          <span>•</span>
                          <span>Uploaded {formatRelativeTime(doc.uploadedAt)}</span>
                        </div>
                        <div className="flex space-x-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                const session = JSON.parse(localStorage.getItem('tech_tammina_session') || '{}');
                                const response = await fetch(dealDocumentsApi.downloadUrl(deal.id, doc.documentId, doc.fileIndex), {
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
                                    'X-User-Id': session.id || session.userId || '',
                                    'X-User-Role': session.role || ''
                                  }
                                });
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = doc.documentName;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }
                              } catch (error) {
                                logger.error('Failed to download document:', error);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Excel Preview Modal */}
      {excelPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setExcelPreview(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{excelPreview.name}</h3>
              <button onClick={() => setExcelPreview(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              .excel-preview table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
              .excel-preview th, .excel-preview td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
              .excel-preview th { background-color: #f3f4f6; font-weight: 600; }
              .excel-preview tr:hover { background-color: #f9fafb; }
            ` }} />
            <div className="flex-1 overflow-auto p-4 excel-preview" dangerouslySetInnerHTML={{ __html: excelPreview.html }} />
          </div>
        </div>
      )}

      {/* Document Preview Modal - Smaller Size */}
      {documentPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => {
          URL.revokeObjectURL(documentPreview.url);
          setDocumentPreview(null);
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{documentPreview.name}</h3>
              <button onClick={() => {
                URL.revokeObjectURL(documentPreview.url);
                setDocumentPreview(null);
              }} className="text-gray-500 hover:text-gray-700 ml-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h3>
              <p className="text-gray-600 mb-6">
                {documentPreview.type.toUpperCase()} files need to be downloaded to view.
              </p>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = documentPreview.url;
                  link.download = documentPreview.name;
                  link.click();
                }}
                variant="primary"
                className="w-full"
              >
                Download File
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DealDetail;
