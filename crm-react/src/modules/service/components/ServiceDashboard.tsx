import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Case, serviceApi } from '../../../api/serviceApi';

interface ServiceDashboardProps {
  onViewAllCases: () => void;
  onCreateCase: () => void;
}

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ onViewAllCases, onCreateCase }) => {
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    newCases: 0,
    inProgressCases: 0,
    resolvedCases: 0,
    criticalCases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [myOpenCases, allCasesResponse] = await Promise.all([
        serviceApi.getMyCases(),
        serviceApi.getCases(0, 100) // Get more cases for stats
      ]);

      setMyCases(myOpenCases);

      // Calculate stats
      const allCases = allCasesResponse.content;
      setStats({
        totalCases: allCases.length,
        newCases: allCases.filter(c => c.status === 'New').length,
        inProgressCases: allCases.filter(c => c.status === 'InProgress').length,
        resolvedCases: allCases.filter(c => c.status === 'Resolved').length,
        criticalCases: allCases.filter(c => c.priority === 'Critical').length
      });
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'PendingCustomer': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Reopened': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{stats.totalCases}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Cases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{stats.newCases}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Cases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.newCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{stats.inProgressCases}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgressCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{stats.resolvedCases}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolvedCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{stats.criticalCases}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.criticalCases}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Cases Widget */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">My Open Cases</h3>
            <button
              onClick={onViewAllCases}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Cases →
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {myCases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No open cases assigned to you</p>
              <button
                onClick={onCreateCase}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create New Case
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myCases.slice(0, 5).map(caseItem => (
                <div key={caseItem.caseId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{caseItem.caseNumber}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status || 'New')}`}>
                        {caseItem.status}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{caseItem.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {caseItem.accountName} • Created {new Date(caseItem.createdDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </div>
                </div>
              ))}
              
              {myCases.length > 5 && (
                <div className="text-center pt-4">
                  <button
                    onClick={onViewAllCases}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View {myCases.length - 5} more cases
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onCreateCase}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">+</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create New Case</p>
              <p className="text-sm text-gray-500">Start a new customer service case</p>
            </div>
          </button>

          <button
            onClick={onViewAllCases}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">📋</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">View All Cases</p>
              <p className="text-sm text-gray-500">Browse and manage all cases</p>
            </div>
          </button>

          <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">📚</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Knowledge Base</p>
              <p className="text-sm text-gray-500">Browse help articles</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboard;
