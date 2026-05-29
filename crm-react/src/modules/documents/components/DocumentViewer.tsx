import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { Document, documentsApi } from '../../../api/documentsApi';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await documentsApi.downloadDocument(document.documentId!);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading document:', error);
      alert('Error downloading document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {documentsApi.getFileIcon(document.fileExtension || '')}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{document.documentName}</h3>
              <p className="text-sm text-gray-500">
                {documentsApi.formatFileSize(document.fileSize || 0)} • {document.fileType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {documentsApi.isPDFFile(document.fileType || '') ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h4>
              <p className="text-gray-500 mb-4">
                PDF preview is not available in this view. Please download the file to view it.
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          ) : documentsApi.isImageFile(document.fileType || '') ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🖼️</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Image File</h4>
              <p className="text-gray-500 mb-4">
                Image preview is not available in this view. Please download the file to view it.
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Image
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {document.fileExtension?.toUpperCase()} Document
              </h4>
              <p className="text-gray-500 mb-4">
                Preview is not available for this file type. Please download the file to view it.
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download File
              </button>
            </div>
          )}

          {/* Document Information */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Document Information</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 text-gray-900">{documentsApi.formatFileSize(document.fileSize || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900">{document.fileType}</span>
              </div>
              <div>
                <span className="text-gray-500">Uploaded by:</span>
                <span className="ml-2 text-gray-900">{document.uploadedByName}</span>
              </div>
              <div>
                <span className="text-gray-500">Upload date:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(document.uploadedDate || '').toLocaleDateString()}
                </span>
              </div>
              {document.category && (
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 text-gray-900">{document.category}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Version:</span>
                <span className="ml-2 text-gray-900">v{document.version}</span>
              </div>
            </div>
            
            {document.description && (
              <div className="mt-3">
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 text-gray-900">{document.description}</p>
              </div>
            )}
            
            {document.tags && (
              <div className="mt-3">
                <span className="text-gray-500">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {document.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
