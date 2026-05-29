import React from 'react';
import { Document, documentsApi } from '../../../api/documentsApi';

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: number) => void;
  onDocumentDownload: (document: Document) => void;
  selectedDocument: Document | null;
  loading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  onDocumentDownload,
  selectedDocument,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📄</div>
          <p>No documents found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Documents ({documents.length})</h3>
      </div>
      
      <div className={`divide-y divide-gray-200 ${documents.length > 5 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
        {documents.map((document) => (
          <div
            key={document.documentId}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedDocument?.documentId === document.documentId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={() => onDocumentSelect(document)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-2xl">
                  {documentsApi.getFileIcon(document.fileExtension || '')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {document.documentName}
                    </h4>
                    {document.version && document.version > 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        v{document.version}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{documentsApi.formatFileSize(document.fileSize || 0)}</span>
                    <span>{document.uploadedByName}</span>
                    <span>{new Date(document.uploadedDate || '').toLocaleDateString()}</span>
                    {document.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {document.category}
                      </span>
                    )}
                  </div>
                  
                  {document.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {document.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentDownload(document);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentDelete(document.documentId!);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
