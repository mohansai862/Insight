import React from 'react';
import Button from './Button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  showIcon?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  showIcon = true
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" style={{ margin: 0, padding: '1rem', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border dark:border-gray-700">
        <div className="p-6 space-y-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Message */}
          {showIcon ? (
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                variant === 'warning' 
                  ? 'bg-orange-100 dark:bg-orange-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Trash2 className={`w-5 h-5 ${
                  variant === 'warning'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                  {message}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                {message}
              </p>
            </div>
          )}
          
          {/* Warning */}
          <div className={`rounded-lg p-3 border ${
            variant === 'warning'
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                variant === 'warning'
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-red-500 dark:text-red-400'
              }`} />
              <p className={`text-xs ${
                variant === 'warning'
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                This action cannot be undone
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button variant="ghost" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white">
              {cancelText}
            </Button>
            <Button variant={variant === 'warning' ? 'primary' : 'danger'} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
