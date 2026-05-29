import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Reuse the existing CallLogs page, but expose it under a dedicated Logs module
import CallLogs from '@/modules/communication/CallLogs';

const LogsModule: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Routes>
        <Route path="/" element={<CallLogs />} />
        {/* Additional log pages can be added here in future (e.g., audit, login logs) */}
        <Route path="*" element={<Navigate to="/crm/logs" replace />} />
      </Routes>
    </motion.div>
  );
};

export default LogsModule;
