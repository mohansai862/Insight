import { logger } from '@/utils/logger';
import React, { useState, useRef } from 'react';
import { documentsApi, DocumentUploadProgress } from '../../../api/documentsApi';

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    tags: '',
    accessLevel: 'Private'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const progressArray: DocumentUploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(progressArray);

    try {
      if (files.length === 1) {
        // Single file upload with progress
        await documentsApi.uploadDocumentWithProgress(
          files[0],
          formData.description,
          formData.category,
          formData.tags,
          formData.accessLevel,
          (progress) => {
            setUploadProgress([{
              fileName: files[0].name,
              progress,
              status: 'uploading'
            }]);
          }
        );
        
        setUploadProgress([{
          fileName: files[0].name,
          progress: 100,
          status: 'completed'
        }]);
      } else {
        // Bulk upload
        await documentsApi.bulkUploadDocuments(
          files,
          formData.category,
          formData.tags,
          formData.accessLevel
        );
        
        setUploadProgress(files.map(file => ({
          fileName: file.name,
          progress: 100,
          status: 'completed'
        })));
      }
      
      // Reset form
      setFormData({
        description: '',
        category: '',
        tags: '',
        accessLevel: 'Private'
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadProgress([]);
        onUploadComplete();
      }, 2000);
      
    } catch (error) {
      logger.error('Upload failed:', error);
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error',
        error: 'Upload failed'
      })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
      
      {/* Upload Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Contracts, Proposals"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Comma-separated tags"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Level
          </label>
          <select
            value={formData.accessLevel}
            onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Private">Private</option>
            <option value="Team">Team</option>
            <option value="Company">Company</option>
            <option value="Public">Public</option>
          </select>
        </div>
      </div>
      
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT (Max 10MB)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Select Files'}
          </button>
        </div>
      </div>
      
      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Upload Progress</h4>
          {uploadProgress.map((progress, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {progress.fileName}
                </span>
                <span className="text-sm text-gray-500">
                  {progress.status === 'completed' ? '✅' : 
                   progress.status === 'error' ? '❌' : 
                   `${progress.progress}%`}
                </span>
              </div>
              
              {progress.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              )}
              
              {progress.status === 'error' && progress.error && (
                <p className="text-sm text-red-600 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
