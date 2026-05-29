import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import Button from './Button';

interface NotificationModalProps {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border dark:border-gray-700">
        <div className="p-6 space-y-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Icon and Message */}
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          
          {/* Action button */}
          <div className="flex items-center justify-end pt-2">
            <Button variant="primary" onClick={onClose}>
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;