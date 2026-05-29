/**
 * Tech Tammina CRM - Tasks Module
 * Task and activity management with calendar view
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { can, getCurrentRole } from '@/utils/rbac';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';
import TasksCalendar from './TasksCalendar';
import TasksList from './TasksList';

const TasksModule: React.FC = () => {
  const role = getCurrentRole();
  const Guard: React.FC<{ action: Parameters<typeof can>[2]; children: React.ReactElement }> = ({ action, children }) => (
    can(role, 'Tasks', action) ? children : <Navigate to="/crm/Dashboard" replace />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route index element={<Guard action="View"><TasksList /></Guard>} />
        <Route path="calendar" element={<Guard action="View"><TasksCalendar /></Guard>} />
        <Route path="new" element={<Guard action="Create"><TaskForm /></Guard>} />
        <Route path=":id" element={<Guard action="View"><TaskDetail /></Guard>} />
        <Route path=":id/edit" element={<Guard action="Edit"><TaskForm /></Guard>} />
      </Routes>
    </motion.div>
  );
};

export default TasksModule;
