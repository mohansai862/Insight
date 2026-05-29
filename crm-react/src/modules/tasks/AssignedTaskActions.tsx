/**
 * Tech Tammina CRM - Assigned Task Actions
 * Actions for tasks assigned to executives (Sales Manager view)
 */

import React from 'react';
import { Eye, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useDeleteTask } from '@/hooks/useApi';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  priority?: string;
  remarks?: string;
  documentationFilename?: string;
  documentationType?: string;
  hasDocumentation?: boolean;
}

interface AssignedTaskActionsProps {
  task: TaskRow;
}

const AssignedTaskActions: React.FC<AssignedTaskActionsProps> = ({ task }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<'top' | 'bottom'>('bottom');
  const navigate = useNavigate();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const deleteTask = useDeleteTask();

  // Check if task is cancelled or completed
  const isCancelled = task.status && task.status.toLowerCase() === 'cancelled';
  const isCompleted = task.status && task.status.toLowerCase() === 'completed';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200;
      
      setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isOpen]);

  const handleDelete = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Task</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to delete this task? This will remove it from the executive's task list as well.</p>
          <div class="flex justify-end space-x-3">
            <button id="cancel-btn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button id="delete-btn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      modal.querySelector('#delete-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
    });

    if (confirmed) {
      try {
        await deleteTask.mutateAsync(task.id);
        toast.success('Task deleted successfully');
        setIsOpen(false);
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div ref={buttonRef}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<MoreVertical className="w-4 h-4" />}
          onClick={() => setIsOpen(!isOpen)}
        >
          
        </Button>
      </div>
      {isOpen && (
        <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50 ${
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="py-1">
            <button
              onClick={() => {
                navigate(`/crm/Tasks/${task.id}`);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            {!isCancelled && !isCompleted && (
              <button
                onClick={() => {
                  navigate(`/crm/Tasks/${task.id}/edit`);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTaskActions;
