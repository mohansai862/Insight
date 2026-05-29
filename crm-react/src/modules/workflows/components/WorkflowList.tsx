import React from 'react';
import { WorkflowRule } from '../../../api/workflowApi';

interface WorkflowListProps {
  workflows: WorkflowRule[];
  onEdit: (workflow: WorkflowRule) => void;
  onDelete: (workflowId: number) => void;
  onToggleActive: (workflowId: number, isActive: boolean) => void;
  onTest: (workflowId: number) => void;
  loading: boolean;
}

const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  onEdit,
  onDelete,
  onToggleActive,
  onTest,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">⚙️</div>
          <p>No workflows found</p>
        </div>
      </div>
    );
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Lead': return '🎯';
      case 'Contact': return '👤';
      case 'Account': return '🏢';
      case 'Deal': return '💰';
      case 'Case': return '📋';
      case 'Task': return '✅';
      case 'Activity': return '📅';
      case 'Quote': return '📄';
      default: return '⚙️';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'OnCreate': return '➕';
      case 'OnUpdate': return '✏️';
      case 'OnDelete': return '🗑️';
      case 'OnFieldChange': return '🔄';
      case 'Scheduled': return '⏰';
      case 'Manual': return '👆';
      default: return '⚡';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Workflows ({workflows.length})</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {workflows.map((workflow) => (
          <div key={workflow.ruleId} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-2xl">
                  {getEntityIcon(workflow.entityType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {workflow.ruleName}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      workflow.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>{getTriggerIcon(workflow.triggerType)}</span>
                      <span>{workflow.triggerType}</span>
                    </span>
                    <span>{workflow.entityType}</span>
                    <span>Order: {workflow.executionOrder}</span>
                    {workflow.executionCount !== undefined && (
                      <span>Executed: {workflow.executionCount} times</span>
                    )}
                  </div>
                  
                  {workflow.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {workflow.description}
                    </p>
                  )}
                  
                  {workflow.lastExecuted && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last executed: {new Date(workflow.lastExecuted).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onTest(workflow.ruleId!)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Test workflow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a3 3 0 116 0v3M5 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onToggleActive(workflow.ruleId!, workflow.isActive!)}
                  className={`p-2 transition-colors ${
                    workflow.isActive 
                      ? 'text-gray-400 hover:text-red-600' 
                      : 'text-gray-400 hover:text-green-600'
                  }`}
                  title={workflow.isActive ? 'Deactivate' : 'Activate'}
                >
                  {workflow.isActive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a3 3 0 116 0v3M5 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                  )}
                </button>
                
                <button
                  onClick={() => onEdit(workflow)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit workflow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onDelete(workflow.ruleId!)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete workflow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowList;
