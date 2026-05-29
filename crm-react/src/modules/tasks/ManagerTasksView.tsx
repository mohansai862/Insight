import React from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, getPriorityColor } from '@/utils';
import { getCurrentRole } from '@/utils/rbac';

interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdByName?: string;
  ownerName?: string;
}

interface Executive {
  id: number;
  name: string;
  email: string;
}

const ManagerTasksView: React.FC = () => {
  const [myTasks, setMyTasks] = React.useState<Task[]>([]);
  const [executives, setExecutives] = React.useState<Executive[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [selectedExecutive, setSelectedExecutive] = React.useState<number | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const session = localStorage.getItem('tech_tammina_session');
    let userId = '';
    let userRole = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        userId = u.id || '';
        userRole = u.role || '';
      } catch {}
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...(userRole ? { 'X-User-Role': userRole } : {}),
    };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load my tasks (both created by me and assigned to me)
      const tasksResponse = await fetch('/api/tasks', {
        headers: getAuthHeaders()
      });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setMyTasks(tasksData);
      }

      // Load executives
      const execResponse = await fetch('/api/tasks/manager/executives', {
        headers: getAuthHeaders()
      });
      if (execResponse.ok) {
        const execData = await execResponse.json();
        setExecutives(execData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleAssignTask = (executiveId: number) => {
    setSelectedExecutive(executiveId);
    setShowTaskForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: My Tasks / Assigned Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {getCurrentRole() === 'Sales_VP' ? 'Assigned Tasks' : 'My Tasks'} ({myTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks assigned to you</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myTasks.map((task) => (
                  <motion.div
                    key={task.taskId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      {getCurrentRole() === 'Sales_VP' && task.ownerName && (
                        <span className="text-xs text-gray-600">{task.ownerName}</span>
                      )}
                      <Badge className={getPriorityColor(task.priority?.toLowerCase() || 'medium')}>
                        {task.priority || 'Medium'}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        {task.createdByName && (
                          <span>Assigned by: {task.createdByName}</span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      <Badge className={
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In_Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {task.status === 'In_Progress' ? 'In Progress' : task.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Assign to Executives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Assign to Executives ({executives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : executives.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No executives available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {executives.map((executive) => (
                  <motion.div
                    key={executive.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{executive.name}</h4>
                        <p className="text-sm text-gray-600">{executive.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => handleAssignTask(executive.id)}
                      >
                        Assign Task
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Assignment Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Assign New Task</h2>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Assigning task to: {executives.find(e => e.id === selectedExecutive)?.name}
              </p>
              <div className="text-center">
                <Button
                  onClick={() => {
                    window.location.href = `/crm/Tasks/new?assignTo=${selectedExecutive}`;
                  }}
                  variant="primary"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasksView;
