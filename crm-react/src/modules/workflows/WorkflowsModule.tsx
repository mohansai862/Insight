import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { WorkflowRule, workflowApi } from '../../api/workflowApi';
import WorkflowList from './components/WorkflowList';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowLogs from './components/WorkflowLogs';

const WorkflowsModule: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedEntityType, setSelectedEntityType] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, [currentPage, selectedEntityType]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await workflowApi.getWorkflows(currentPage, 10, selectedEntityType);
      setWorkflows(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      logger.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setShowBuilder(true);
  };

  const handleEditWorkflow = (workflow: WorkflowRule) => {
    setSelectedWorkflow(workflow);
    setShowBuilder(true);
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowApi.deleteWorkflow(workflowId);
        loadWorkflows();
      } catch (error) {
        logger.error('Error deleting workflow:', error);
        alert('Error deleting workflow');
      }
    }
  };

  const handleToggleActive = async (workflowId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await workflowApi.deactivateWorkflow(workflowId);
      } else {
        await workflowApi.activateWorkflow(workflowId);
      }
      loadWorkflows();
    } catch (error) {
      logger.error('Error toggling workflow status:', error);
      alert('Error updating workflow status');
    }
  };

  const handleTestWorkflow = async (workflowId: number) => {
    const testData = {
      status: 'New',
      dealValue: 15000,
      contactName: 'John Doe',
      contactEmail: 'john@example.com'
    };

    try {
      await workflowApi.testWorkflow(workflowId, testData);
      alert('Workflow test executed successfully');
    } catch (error) {
      logger.error('Error testing workflow:', error);
      alert('Error testing workflow');
    }
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setSelectedWorkflow(null);
    loadWorkflows();
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-1">Automate your business processes with custom workflows</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showLogs ? 'Hide Logs' : 'View Logs'}
          </button>
          <button
            onClick={handleCreateWorkflow}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Workflow
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(0);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              {workflowApi.getEntityTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="text-sm text-gray-500">
            Total workflows: {workflows.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {showBuilder ? (
        <WorkflowBuilder
          workflow={selectedWorkflow}
          onClose={handleBuilderClose}
        />
      ) : showLogs ? (
        <WorkflowLogs onClose={() => setShowLogs(false)} />
      ) : (
        <>
          <WorkflowList
            workflows={workflows}
            onEdit={handleEditWorkflow}
            onDelete={handleDeleteWorkflow}
            onToggleActive={handleToggleActive}
            onTest={handleTestWorkflow}
            loading={loading}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-gray-700">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowsModule;
