import React from 'react';
import { WorkflowCondition, WorkflowConditionGroup, workflowApi } from '../../../api/workflowApi';

interface ConditionBuilderProps {
  conditions: WorkflowConditionGroup;
  onChange: (conditions: WorkflowConditionGroup) => void;
  entityType: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  entityType
}) => {
  const getFieldsForEntity = (entityType: string): string[] => {
    switch (entityType) {
      case 'Lead':
        return ['firstName', 'lastName', 'email', 'phone', 'company', 'status', 'source', 'score'];
      case 'Contact':
        return ['firstName', 'lastName', 'email', 'phone', 'title', 'department'];
      case 'Deal':
        return ['dealName', 'dealValue', 'stage', 'probability', 'closeDate', 'status'];
      case 'Case':
        return ['subject', 'status', 'priority', 'category', 'origin'];
      case 'Task':
        return ['subject', 'status', 'priority', 'dueDate'];
      default:
        return ['name', 'status', 'createdDate', 'modifiedDate'];
    }
  };

  const addCondition = () => {
    const newCondition: WorkflowCondition = {
      field: '',
      operator: 'equals',
      value: ''
    };
    
    onChange({
      ...conditions,
      conditions: [...conditions.conditions, newCondition]
    });
  };

  const updateCondition = (index: number, condition: WorkflowCondition) => {
    const updatedConditions = [...conditions.conditions];
    updatedConditions[index] = condition;
    
    onChange({
      ...conditions,
      conditions: updatedConditions
    });
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.conditions.filter((_, i) => i !== index);
    
    onChange({
      ...conditions,
      conditions: updatedConditions
    });
  };

  const updateLogic = (logic: 'AND' | 'OR') => {
    onChange({
      ...conditions,
      logic
    });
  };

  const fields = getFieldsForEntity(entityType);
  const operators = workflowApi.getOperators();

  return (
    <div className="space-y-4">
      {/* Logic Selector */}
      {conditions.conditions.length > 1 && (
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Logic:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => updateLogic('AND')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                conditions.logic === 'AND'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              AND
            </button>
            <button
              onClick={() => updateLogic('OR')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                conditions.logic === 'OR'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              OR
            </button>
          </div>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-3">
        {conditions.conditions.map((condition, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
            {index > 0 && (
              <div className="text-sm font-medium text-gray-500 min-w-0">
                {conditions.logic}
              </div>
            )}
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Field */}
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, { ...condition, field: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select field</option>
                {fields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              
              {/* Operator */}
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, { ...condition, operator: e.target.value as any })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              
              {/* Value */}
              {!['is empty', 'is not empty'].includes(condition.operator) && (
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { ...condition, value: e.target.value })}
                  placeholder="Enter value"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {['is empty', 'is not empty'].includes(condition.operator) && (
                <div className="flex items-center text-sm text-gray-500">
                  No value needed
                </div>
              )}
            </div>
            
            {/* Remove Button */}
            <button
              onClick={() => removeCondition(index)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove condition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <button
        onClick={addCondition}
        className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Add Condition</span>
      </button>

      {/* Validation Errors */}
      {conditions.conditions.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>💡 Tip: Use AND logic when all conditions must be true, OR logic when any condition can be true.</p>
        </div>
      )}
    </div>
  );
};

export default ConditionBuilder;
