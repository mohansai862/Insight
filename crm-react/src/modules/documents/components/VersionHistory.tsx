import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Document, documentsApi } from '../../../api/documentsApi';

interface VersionHistoryProps {
  document: Document;
  onClose: () => void;
  onVersionRestore?: (versionId: number) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ 
  document, 
  onClose, 
  onVersionRestore 
}) => {
  const [versions, setVersions] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersionHistory();
  }, [document.documentId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const versionHistory = await documentsApi.getVersionHistory(document.documentId!);
      setVersions(versionHistory);
    } catch (error) {
      logger.error('Error loading version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (version: Document) => {
    try {
      const blob = await documentsApi.downloadDocument(version.documentId!);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.documentName}_v${version.version}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading version:', error);
      alert('Error downloading version');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Version History</h3>
            <p className="text-sm text-gray-500">{document.documentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <p>No version history available</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div
                    key={version.documentId || index}
                    className={`border rounded-lg p-4 ${
                      version.isLatestVersion ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {documentsApi.getFileIcon(version.fileExtension || '')}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              Version {version.version}
                            </h4>
                            {version.isLatestVersion && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <div>
                              {documentsApi.formatFileSize(version.fileSize || 0)} • 
                              Uploaded by {version.uploadedByName}
                            </div>
                            <div>
                              {new Date(version.uploadedDate || '').toLocaleString()}
                            </div>
                          </div>
                          
                          {version.description && (
                            <p className="mt-2 text-sm text-gray-600">
                              {version.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDownloadVersion(version)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Download this version"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        
                        {!version.isLatestVersion && onVersionRestore && (
                          <button
                            onClick={() => onVersionRestore(version.documentId!)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Restore this version"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Version comparison info */}
                    {index < versions.length - 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Changes from previous version:</span>
                          <span>
                            Size: {documentsApi.formatFileSize(
                              (version.fileSize || 0) - (versions[index + 1]?.fileSize || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total versions: {versions.length}</span>
            <span>
              Current size: {documentsApi.formatFileSize(document.fileSize || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
