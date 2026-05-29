import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { WorkflowRule, WorkflowConditionGroup, workflowApi } from '../../../api/workflowApi';
import ConditionBuilder from './ConditionBuilder';
import ActionBuilder from './ActionBuilder';

interface WorkflowBuilderProps {
  workflow: WorkflowRule | null;
  onClose: () => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflow, onClose }) => {
  const [formData, setFormData] = useState<WorkflowRule>({
    ruleName: '',
    description: '',
    entityType: 'Lead',
    triggerType: 'OnCreate',
    executionOrder: 1,
    isActive: true
  });
  const [conditions, setConditions] = useState<WorkflowConditionGroup>({
    logic: 'AND',
    conditions: []
  });
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (workflow) {
      setFormData(workflow);
      if (workflow.triggerConditions) {
        try {
          setConditions(JSON.parse(workflow.triggerConditions));
        } catch (e) {
          logger.error('Error parsing conditions:', e);
        }
      }
    }
  }, [workflow]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const workflowData = {
        ...formData,
        triggerConditions: JSON.stringify(conditions)
      };

      if (workflow?.ruleId) {
        await workflowApi.updateWorkflow(workflow.ruleId, workflowData);
      } else {
        await workflowApi.createWorkflow(workflowData);
      }
      
      onClose();
    } catch (error) {
      logger.error('Error saving workflow:', error);
      alert('Error saving workflow');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: '📝' },
    { id: 2, name: 'Conditions', icon: '🔍' },
    { id: 3, name: 'Actions', icon: '⚡' },
    { id: 4, name: 'Review', icon: '✅' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Build automated workflows to streamline your business processes
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Step Navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentStep === step.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{step.icon}</span>
              <span className="text-sm font-medium">{step.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type *
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {workflowApi.getEntityTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type *
                </label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {workflowApi.getTriggerTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Order
                </label>
                <input
                  type="number"
                  value={formData.executionOrder}
                  onChange={(e) => setFormData({ ...formData, executionOrder: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this workflow does"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Activate workflow immediately
              </label>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Trigger Conditions</h3>
            <p className="text-sm text-gray-600">
              Define when this workflow should be triggered. Leave empty to trigger for all records.
            </p>
            
            <ConditionBuilder
              conditions={conditions}
              onChange={setConditions}
              entityType={formData.entityType}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Workflow Actions</h3>
            <p className="text-sm text-gray-600">
              Define what actions should be performed when this workflow is triggered.
            </p>
            
            <ActionBuilder
              actions={actions}
              onChange={setActions}
              entityType={formData.entityType}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review & Save</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Workflow Details</h4>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {formData.ruleName}</p>
                  <p><strong>Entity:</strong> {formData.entityType}</p>
                  <p><strong>Trigger:</strong> {formData.triggerType}</p>
                  <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Conditions</h4>
                <div className="mt-2 text-sm text-gray-600">
                  {conditions.conditions.length > 0 ? (
                    <p>{conditions.conditions.length} condition(s) with {conditions.logic} logic</p>
                  ) : (
                    <p>No conditions (triggers for all records)</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Actions</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{actions.length} action(s) configured</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Workflow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
