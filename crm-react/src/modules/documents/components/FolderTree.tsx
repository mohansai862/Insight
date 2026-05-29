import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { FolderStructure } from '../../../api/documentsApi';

interface FolderTreeProps {
  onFolderSelect: (folderId: number | null) => void;
  selectedFolderId: number | null;
}

const FolderTree: React.FC<FolderTreeProps> = ({ onFolderSelect, selectedFolderId }) => {
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockFolders: FolderStructure[] = [
        {
          folderId: 1,
          folderName: 'Documents',
          parentFolderId: null,
          accessLevel: 'Company',
          subFolders: [
            { folderId: 2, folderName: 'Contracts', parentFolderId: 1, accessLevel: 'Company' },
            { folderId: 3, folderName: 'Proposals', parentFolderId: 1, accessLevel: 'Company' },
            { folderId: 4, folderName: 'Invoices', parentFolderId: 1, accessLevel: 'Company' },
            { folderId: 5, folderName: 'Marketing Materials', parentFolderId: 1, accessLevel: 'Company' },
            { folderId: 6, folderName: 'Templates', parentFolderId: 1, accessLevel: 'Company' }
          ]
        }
      ];
      setFolders(mockFolders);
      setExpandedFolders(new Set([1])); // Expand root folder by default
    } catch (error) {
      logger.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderStructure, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.folderId!);
    const isSelected = selectedFolderId === folder.folderId;
    const hasSubFolders = folder.subFolders && folder.subFolders.length > 0;

    return (
      <div key={folder.folderId}>
        <div
          className={`flex items-center space-x-2 py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => onFolderSelect(folder.folderId!)}
        >
          {hasSubFolders && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.folderId!);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {!hasSubFolders && <div className="w-5" />}
          
          <div className="text-lg">
            {isExpanded ? '📂' : '📁'}
          </div>
          
          <span className="text-sm font-medium truncate">{folder.folderName}</span>
          
          {folder.accessLevel && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              folder.accessLevel === 'Private' ? 'bg-red-100 text-red-600' :
              folder.accessLevel === 'Team' ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            }`}>
              {folder.accessLevel}
            </span>
          )}
        </div>
        
        {isExpanded && hasSubFolders && (
          <div>
            {folder.subFolders!.map(subFolder => renderFolder(subFolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Folders</h3>
          <button
            onClick={() => onFolderSelect(null)}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              selectedFolderId === null 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Documents
          </button>
        </div>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto">
        {folders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📁</div>
            <p>No folders found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map(folder => renderFolder(folder))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700 transition-colors">
          + Create New Folder
        </button>
      </div>
    </div>
  );
};

export default FolderTree;
