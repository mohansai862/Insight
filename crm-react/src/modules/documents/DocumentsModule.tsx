import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Document, documentsApi } from '../../api/documentsApi';
import DocumentList from './components/DocumentList';
import DocumentUpload from './components/DocumentUpload';
import DocumentDetail from './components/DocumentDetail';
import DocumentViewer from './components/DocumentViewer';
import FolderTree from './components/FolderTree';
import VersionHistory from './components/VersionHistory';

const DocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadDocuments();
    loadCategories();
  }, [currentPage, selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let documentsData;
      
      if (searchTerm) {
        documentsData = await documentsApi.searchDocuments(searchTerm);
        setDocuments(documentsData);
        setTotalPages(1);
      } else {
        const response = await documentsApi.getDocuments(currentPage, 12, 'uploadedDate', 'desc', selectedCategory);
        setDocuments(response.content);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      logger.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await documentsApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      logger.error('Error loading categories:', error);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setCurrentPage(0);
      loadDocuments();
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadDocuments();
    loadCategories();
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setCurrentPage(0);
    loadDocuments();
  };

  const handleShowVersionHistory = (document: Document) => {
    setSelectedDocument(document);
    setShowVersionHistory(true);
  };

  const handleDocumentUpdate = () => {
    loadDocuments();
    setSelectedDocument(null);
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentsApi.deleteDocument(documentId);
        loadDocuments();
        if (selectedDocument?.documentId === documentId) {
          setSelectedDocument(null);
        }
      } catch (error) {
        logger.error('Error deleting document:', error);
        alert('Error deleting document');
      }
    }
  };

  const handleDownload = async (document: Document) => {
    try {
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
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showUpload ? 'Cancel Upload' : 'Upload Documents'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="flex">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(0);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                loadDocuments();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Upload Component */}
      {showUpload && (
        <div className="mb-6">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree */}
        <div className="lg:col-span-1">
          <FolderTree
            onFolderSelect={handleFolderSelect}
            selectedFolderId={selectedFolderId}
          />
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <DocumentList
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            onDocumentDelete={handleDocumentDelete}
            onDocumentDownload={handleDownload}
            selectedDocument={selectedDocument}
            loading={loading}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-gray-700">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Detail */}
        <div className="lg:col-span-1">
          {selectedDocument ? (
            <div className="space-y-4">
              <DocumentDetail
                document={selectedDocument}
                onUpdate={handleDocumentUpdate}
                onDelete={() => handleDocumentDelete(selectedDocument.documentId!)}
                onDownload={() => handleDownload(selectedDocument)}
              />
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDocumentView(selectedDocument)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    🔍 Preview Document
                  </button>
                  <button
                    onClick={() => handleShowVersionHistory(selectedDocument)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    📋 Version History
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <p>Select a document to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Version History Modal */}
      {showVersionHistory && selectedDocument && (
        <VersionHistory
          document={selectedDocument}
          onClose={() => setShowVersionHistory(false)}
          onVersionRestore={(versionId) => {
            logger.info('Restore version:', versionId);
            // Implement version restore logic
          }}
        />
      )}
    </div>
  );
};

export default DocumentsModule;
