import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({
  isOpen,
  onClose,
  errors
}) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Only render if modal is open AND there are actual errors
  if (!isOpen || !errors || errors.length === 0) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto"
      >
        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Upload Error
          </h3>
          <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 text-left">
            {errors.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium mb-3">The following errors were found:</p>
                <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400 mb-1">
                      • {error}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Please fix these issues and re-upload the file.
                </p>
              </div>
            ) : (
              <p>
                The Excel file includes invalid or missing data. Please update all required fields and re-upload the file.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ValidationErrorModal;