import { logger } from '@/utils/logger';
/**
 * User Approval Management Component
 * For managers to approve/reject pending user signups
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { approvalApi, PendingApproval } from '@/api/approvalApi';
import toast from 'react-hot-toast';

interface ApprovalManagementProps {
  currentUserId: number;
  currentUserRole: string;
}

const ApprovalManagement: React.FC<ApprovalManagementProps> = ({ currentUserId, currentUserRole }) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, [currentUserId, currentUserRole]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      let approvals: PendingApproval[];
      
      if (currentUserRole === 'Sales_VP' || currentUserRole === 'IT_Admin') {
        approvals = await approvalApi.getAllPendingApprovals();
      } else {
        approvals = await approvalApi.getPendingApprovalsForManager(currentUserId);
      }
      
      setPendingApprovals(approvals);
    } catch (error) {
      toast.error('Failed to load pending approvals');
      logger.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (signupId: number, status: 'Approved' | 'Rejected') => {
    try {
      await approvalApi.updateApprovalStatus(signupId, status);
      toast.success(`User ${status.toLowerCase()} successfully`);
      loadPendingApprovals();
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} user`);
      logger.error('Error updating approval:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        <span>Loading pending approvals...</span>
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <div className="text-center p-8">
        <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
        <p className="text-gray-500">All user signups have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Pending User Approvals ({pendingApprovals.length})
      </h2>
      
      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {approval.firstName} {approval.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{approval.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">Role: {approval.role}</span>
                      <span className="text-xs text-gray-500">
                        Applied: {new Date(approval.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApproval(approval.id, 'Approved')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(approval.id, 'Rejected')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalManagement;
