import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { EmailTemplate, workflowApi } from '../../../api/workflowApi';

interface WorkflowAction {
  actionType: string;
  actionSequence: number;
  actionConfig: any;
  delayMinutes?: number;
}

interface ActionBuilderProps {
  actions: WorkflowAction[];
  onChange: (actions: WorkflowAction[]) => void;
  entityType: string;
}

const ActionBuilder: React.FC<ActionBuilderProps> = ({
  actions,
  onChange,
  entityType
}) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      const templates = await workflowApi.getEmailTemplates();
      setEmailTemplates(templates);
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  };

  const addAction = (actionType: string) => {
    const newAction: WorkflowAction = {
      actionType,
      actionSequence: actions.length + 1,
      actionConfig: getDefaultConfig(actionType),
      delayMinutes: 0
    };
    
    onChange([...actions, newAction]);
  };

  const getDefaultConfig = (actionType: string) => {
    switch (actionType) {
      case 'SendEmail':
        return {
          templateId: '',
          to: '{{email}}',
          cc: '',
          attachments: []
        };
      case 'CreateTask':
        return {
          subject: 'Follow up with {{firstName}} {{lastName}}',
          dueDate: '3days',
          assignTo: '{{recordOwner}}',
          priority: 'Medium'
        };
      case 'UpdateField':
        return {
          field: 'status',
          value: 'In Progress'
        };
      case 'SendNotification':
        return {
          message: 'New {{entityType}} requires attention',
          userId: '{{recordOwner}}'
        };
      case 'AssignRecord':
        return {
          assignTo: '{{roundRobin}}'
        };
      case 'CallWebhook':
        return {
          url: 'https://api.example.com/webhook',
          method: 'POST',
          headers: {},
          body: {}
        };
      default:
        return {};
    }
  };

  const updateAction = (index: number, action: WorkflowAction) => {
    const updatedActions = [...actions];
    updatedActions[index] = action;
    onChange(updatedActions);
  };

  const removeAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index);
    // Reorder sequence numbers
    updatedActions.forEach((action, i) => {
      action.actionSequence = i + 1;
    });
    onChange(updatedActions);
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === actions.length - 1)
    ) {
      return;
    }

    const updatedActions = [...actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedActions[index], updatedActions[targetIndex]] = 
    [updatedActions[targetIndex], updatedActions[index]];
    
    // Update sequence numbers
    updatedActions.forEach((action, i) => {
      action.actionSequence = i + 1;
    });
    
    onChange(updatedActions);
  };

  const renderActionConfig = (action: WorkflowAction, index: number) => {
    switch (action.actionType) {
      case 'SendEmail':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Template
              </label>
              <select
                value={action.actionConfig.templateId}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, templateId: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select template</option>
                {emailTemplates.map(template => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.templateName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={action.actionConfig.to}
                  onChange={(e) => updateAction(index, {
                    ...action,
                    actionConfig: { ...action.actionConfig, to: e.target.value }
                  })}
                  placeholder="{{email}}"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CC (optional)
                </label>
                <input
                  type="text"
                  value={action.actionConfig.cc}
                  onChange={(e) => updateAction(index, {
                    ...action,
                    actionConfig: { ...action.actionConfig, cc: e.target.value }
                  })}
                  placeholder="{{salesManager}}"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'CreateTask':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Subject
              </label>
              <input
                type="text"
                value={action.actionConfig.subject}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, subject: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <select
                  value={action.actionConfig.dueDate}
                  onChange={(e) => updateAction(index, {
                    ...action,
                    actionConfig: { ...action.actionConfig, dueDate: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1days">1 day</option>
                  <option value="3days">3 days</option>
                  <option value="1week">1 week</option>
                  <option value="2weeks">2 weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <input
                  type="text"
                  value={action.actionConfig.assignTo}
                  onChange={(e) => updateAction(index, {
                    ...action,
                    actionConfig: { ...action.actionConfig, assignTo: e.target.value }
                  })}
                  placeholder="{{recordOwner}}"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={action.actionConfig.priority}
                  onChange={(e) => updateAction(index, {
                    ...action,
                    actionConfig: { ...action.actionConfig, priority: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'UpdateField':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field
              </label>
              <input
                type="text"
                value={action.actionConfig.field}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, field: e.target.value }
                })}
                placeholder="status"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="text"
                value={action.actionConfig.value}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, value: e.target.value }
                })}
                placeholder="In Progress"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'SendNotification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={action.actionConfig.message}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, message: e.target.value }
                })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notify User
              </label>
              <input
                type="text"
                value={action.actionConfig.userId}
                onChange={(e) => updateAction(index, {
                  ...action,
                  actionConfig: { ...action.actionConfig, userId: e.target.value }
                })}
                placeholder="{{recordOwner}}"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration for {action.actionType} action
          </div>
        );
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'SendEmail': return '📧';
      case 'CreateTask': return '✅';
      case 'UpdateField': return '✏️';
      case 'SendNotification': return '🔔';
      case 'AssignRecord': return '👤';
      case 'CallWebhook': return '🔗';
      case 'CreateRecord': return '➕';
      default: return '⚡';
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getActionIcon(action.actionType)}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {action.actionType}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Step {action.actionSequence}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveAction(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveAction(index, 'down')}
                  disabled={index === actions.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeAction(index)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Delay Configuration */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay (minutes)
              </label>
              <input
                type="number"
                value={action.delayMinutes || 0}
                onChange={(e) => updateAction(index, {
                  ...action,
                  delayMinutes: parseInt(e.target.value) || 0
                })}
                min="0"
                className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Action Configuration */}
            {renderActionConfig(action, index)}
          </div>
        ))}
      </div>

      {/* Add Action Buttons */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Add Action</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {workflowApi.getActionTypes().map(actionType => (
            <button
              key={actionType}
              onClick={() => addAction(actionType)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>{getActionIcon(actionType)}</span>
              <span>{actionType}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      {actions.length > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p>💡 <strong>Tips:</strong></p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• Use placeholders like {{`{fieldName}`}} to insert dynamic values</li>
            <li>• Actions execute in sequence order</li>
            <li>• Add delays between actions if needed</li>
            <li>• Test your workflow before activating</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionBuilder;
