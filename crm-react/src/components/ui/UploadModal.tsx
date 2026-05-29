import React from 'react';
import Button from './Button';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  files: File[];
  uploading: boolean;
  onUpload: () => void;
  onCancel: () => void;
  entityType?: 'deal' | 'task'; // Add entity type prop
  error?: string; // Add error prop for validation messages
}

const UploadModal: React.FC<UploadModalProps> = ({ 
  isOpen, 
  files, 
  uploading, 
  onUpload, 
  onCancel, 
  entityType = 'deal',
  error 
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
    <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border dark:border-gray-700">
        <div className="p-6 space-y-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Confirm Upload
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Upload Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Files List */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto border dark:border-gray-700">
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Confirmation message */}
          {!error && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                These files will be uploaded to the {entityType} when you save.
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={onCancel} 
              disabled={uploading}
              className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onUpload} 
              disabled={uploading || !!error}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
