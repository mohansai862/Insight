import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import React from 'react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { users as mockUsers } from '@/data/mockData';
import type { User } from '@/types';
import { getCurrentRole } from '@/utils/rbac';

const activityFormSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING'], { required_error: 'Activity type is required' }),
  subject: z.string().min(1, 'This field is required'),
  description: z.string().optional(),
  activityDate: z.string().min(1, 'Date & time is required').refine(
    (val) => new Date(val) <= new Date(),
    { message: 'Activity date cannot be in the future' }
  ),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface LeadActivity {
  activityId: number;
  leadId: number;
  activityType: 'CALL' | 'EMAIL' | 'MEETING';
  subject: string;
  description?: string;
  activityDate: string; // ISO
  createdBy: number;
  createdAt: string;
}

interface ActivitySectionProps {
  leadId: string;
  activities: LeadActivity[];
  onAddActivity: (activity: LeadActivity) => void;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({
  leadId,
  activities,
  onAddActivity,
}) => {
  const currentRole = getCurrentRole();
  logger.info('ActivitySection role:', currentRole);
  const [activityFilterType, setActivityFilterType] = React.useState<'all' | LeadActivity['activityType']>('all');

  const [activityPage, setActivityPage] = React.useState(1);
  const activitiesPerPage = 10;
  const [expandedActivityId, setExpandedActivityId] = React.useState<string | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);

  const filteredActivities = React.useMemo(() => {
    let list = activities;
    if (activityFilterType !== 'all') list = list.filter((a) => a.activityType === activityFilterType);
    // Sort by date desc
    return list.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
  }, [activities, activityFilterType]);

  const activitiesTotalPages = Math.max(1, Math.ceil(filteredActivities.length / activitiesPerPage));
  const activitiesCurrentPage = Math.min(activityPage, activitiesTotalPages);
  const pagedActivities = React.useMemo(() => {
    const start = (activitiesCurrentPage - 1) * activitiesPerPage;
    return filteredActivities.slice(start, start + activitiesPerPage);
  }, [filteredActivities, activitiesCurrentPage]);

  const assignedUser = (id: string): User | undefined => mockUsers.find((u) => u.id === id);

  // Activity form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: 'CALL',
      activityDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    },
  });

  const onSubmitActivity = (values: ActivityFormValues) => {
    logger.info('Activity form values:', values);
    const newActivity: LeadActivity = {
      activityId: 0,
      leadId: parseInt(leadId),
      activityType: values.type,
      subject: values.subject,
      description: values.description || '',
      activityDate: values.activityDate,
      createdBy: 0,
      createdAt: new Date().toISOString(),
    };
    onAddActivity(newActivity);
    setIsActivityModalOpen(false);
  };

  return (
    <>
      <Card className="bg-white/70 backdrop-blur-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities</CardTitle>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                reset({
                  type: 'CALL',
                  subject: '',
                  description: '',
                  activityDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
                });
                setIsActivityModalOpen(true);
              }}
            >
              Add Communication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <select
                value={activityFilterType}
                onChange={(e) => {
                  setActivityFilterType(e.target.value as any);
                  setActivityPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-xl bg-white"
              >
                <option value="all">All Types</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
              </select>


            </div>

            <div className="text-sm text-gray-600">{filteredActivities.length} activities</div>
          </div>

          {/* Activities Table */}
          {filteredActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No activities yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Subject</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedActivities.map((a) => (
                    <React.Fragment key={a.activityId}>
                      <tr
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedActivityId((prev) => (prev === a.activityId.toString() ? null : a.activityId.toString()))}
                      >
                        <td className="py-2 px-3 capitalize">{a.activityType.toLowerCase()}</td>
                        <td className="py-2 px-3">{a.subject}</td>
                        <td className="py-2 px-3">{format(new Date(a.activityDate), 'dd MMM yyyy, hh:mm a')}</td>
                        <td className="py-2 px-3">
                          {assignedUser(a.createdBy.toString())?.firstName || 'Unknown'}
                        </td>

                      </tr>
                      {expandedActivityId === a.activityId.toString() && (
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="py-3 px-3 text-gray-700">
                            <div className="max-h-32 overflow-y-auto overflow-x-hidden break-words">
                              {a.description ? a.description : <span className="text-gray-400">No description</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Activity Pagination */}
          {filteredActivities.length > activitiesPerPage && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {activitiesCurrentPage} of {activitiesTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activitiesCurrentPage <= 1}
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activitiesCurrentPage >= activitiesTotalPages}
                  onClick={() => setActivityPage((p) => Math.min(activitiesTotalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Modal */}
      <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Add Activity" size="lg" closeOnOverlayClick={false}>
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitActivity)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('subject')}
                placeholder="Enter subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('activityDate')}
                max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.activityDate && <p className="mt-1 text-sm text-red-600">{errors.activityDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Add details"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <ModalFooter>
              <Button 
                type="button" 
                onClick={() => setIsActivityModalOpen(false)}
                className="h-10 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white border border-gray-600 dark:border-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                loading={isSubmitting}
                className="h-10"
              >
                Save Activity
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
