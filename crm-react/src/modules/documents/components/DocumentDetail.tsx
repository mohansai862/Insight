import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { Document, documentsApi } from '../../../api/documentsApi';

interface DocumentDetailProps {
  document: Document;
  onUpdate: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document,
  onUpdate,
  onDelete,
  onDownload
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    documentName: document.documentName,
    description: document.description || '',
    category: document.category || '',
    tags: document.tags || '',
    accessLevel: document.accessLevel || 'Private'
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await documentsApi.updateDocument(document.documentId!, editForm);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      logger.error('Error updating document:', error);
      alert('Error updating document');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      documentName: document.documentName,
      description: document.description || '',
      category: document.category || '',
      tags: document.tags || '',
      accessLevel: document.accessLevel || 'Private'
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={onDownload}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* File Icon and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="text-4xl">
            {documentsApi.getFileIcon(document.fileExtension || '')}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.documentName}
                onChange={(e) => setEditForm({ ...editForm, documentName: e.target.value })}
                className="w-full text-lg font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h4 className="text-lg font-medium text-gray-900">{document.documentName}</h4>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {documentsApi.formatFileSize(document.fileSize || 0)} • {document.fileType}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          {isEditing ? (
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Document description"
            />
          ) : (
            <p className="text-sm text-gray-600">
              {document.description || 'No description provided'}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Document category"
            />
          ) : (
            <p className="text-sm text-gray-600">
              {document.category || 'Uncategorized'}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Comma-separated tags"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {document.tags ? (
                document.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag.trim()}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tags</span>
              )}
            </div>
          )}
        </div>

        {/* Access Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
          {isEditing ? (
            <select
              value={editForm.accessLevel}
              onChange={(e) => setEditForm({ ...editForm, accessLevel: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Private">Private</option>
              <option value="Team">Team</option>
              <option value="Company">Company</option>
              <option value="Public">Public</option>
            </select>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              document.accessLevel === 'Private' ? 'bg-red-100 text-red-800' :
              document.accessLevel === 'Team' ? 'bg-yellow-100 text-yellow-800' :
              document.accessLevel === 'Company' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {document.accessLevel}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Uploaded by:</span>
            <span className="text-gray-900">{document.uploadedByName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Upload date:</span>
            <span className="text-gray-900">
              {new Date(document.uploadedDate || '').toLocaleString()}
            </span>
          </div>
          {document.modifiedDate && document.modifiedDate !== document.uploadedDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Modified:</span>
              <span className="text-gray-900">
                {new Date(document.modifiedDate).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Version:</span>
            <span className="text-gray-900">v{document.version}</span>
          </div>
        </div>

        {/* Preview */}
        {documentsApi.canPreview(document.fileType || '') && (
          <div className="border-t border-gray-200 pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Preview</h5>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {documentsApi.isImageFile(document.fileType || '') ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Image preview available after download</p>
                </div>
              ) : documentsApi.isPDFFile(document.fileType || '') ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500">PDF preview available after download</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetail;
