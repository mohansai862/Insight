import axios from 'axios';

const API_BASE_URL = '/api';

export interface Document {
  documentId?: number;
  documentName: string;
  description?: string;
  fileSize?: number;
  fileType?: string;
  fileExtension?: string;
  storageLocation?: string;
  uploadedById?: number;
  uploadedByName?: string;
  uploadedDate?: string;
  modifiedById?: number;
  modifiedByName?: string;
  modifiedDate?: string;
  version?: number;
  isLatestVersion?: boolean;
  parentDocumentId?: number;
  category?: string;
  tags?: string;
  accessLevel?: 'Private' | 'Team' | 'Company' | 'Public';
  isActive?: boolean;
  relationships?: DocumentRelationship[];
}

export interface DocumentRelationship {
  relationshipId?: number;
  documentId?: number;
  relatedEntityType: 'Account' | 'Contact' | 'Lead' | 'Deal' | 'Quote' | 'Case' | 'Task' | 'Activity';
  relatedEntityId: number;
  createdDate?: string;
}

export interface FolderStructure {
  folderId?: number;
  folderName: string;
  parentFolderId?: number;
  createdById?: number;
  createdByName?: string;
  createdDate?: string;
  accessLevel?: 'Private' | 'Team' | 'Company';
  subFolders?: FolderStructure[];
}

export interface DocumentUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

class DocumentsApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': userId || '1',
      'X-User-Role': userRole || 'Sales_Manager'
    };
  }

  // Document Management APIs
  async uploadDocument(file: File, description?: string, category?: string, 
                      tags?: string, accessLevel?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (category) formData.append('category', category);
    if (tags) formData.append('tags', tags);
    if (accessLevel) formData.append('accessLevel', accessLevel);

    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async uploadDocumentWithProgress(file: File, description?: string, category?: string, 
                                  tags?: string, accessLevel?: string,
                                  onProgress?: (progress: number) => void): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (category) formData.append('category', category);
    if (tags) formData.append('tags', tags);
    if (accessLevel) formData.append('accessLevel', accessLevel);

    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
    return response.data;
  }

  async getDocuments(page = 0, size = 10, sortBy = 'uploadedDate', sortDir = 'desc',
                    category?: string, fileType?: string): Promise<{
    content: Document[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params: any = { page, size, sortBy, sortDir };
    if (category) params.category = category;
    if (fileType) params.fileType = fileType;

    const response = await axios.get(`${API_BASE_URL}/documents`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getDocumentById(id: number): Promise<Document> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document> {
    const response = await axios.put(`${API_BASE_URL}/documents/${id}`, document, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async downloadDocument(id: number): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
    return response.data;
  }

  async uploadNewVersion(id: number, file: File, changeDescription?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeDescription) formData.append('changeDescription', changeDescription);

    const response = await axios.post(`${API_BASE_URL}/documents/${id}/version`, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getVersionHistory(id: number): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/versions`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async shareDocument(id: number, sharedWithUserId: number, canEdit = false, canDownload = true): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/documents/${id}/share`, null, {
      params: { sharedWithUserId, canEdit, canDownload },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/entity/${entityType}/${entityId}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async bulkUploadDocuments(files: File[], category?: string, tags?: string, 
                           accessLevel?: string): Promise<Document[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (category) formData.append('category', category);
    if (tags) formData.append('tags', tags);
    if (accessLevel) formData.append('accessLevel', accessLevel);

    const response = await axios.post(`${API_BASE_URL}/documents/bulk-upload`, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async searchDocuments(keyword: string): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/search`, {
      params: { keyword },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getMyDocuments(): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/my-documents`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/categories`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileExtension: string): string {
    const extension = fileExtension?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'txt': return '📃';
      default: return '📁';
    }
  }

  isImageFile(fileType: string): boolean {
    return fileType?.startsWith('image/') || false;
  }

  isPDFFile(fileType: string): boolean {
    return fileType === 'application/pdf';
  }

  canPreview(fileType: string): boolean {
    return this.isImageFile(fileType) || this.isPDFFile(fileType);
  }
}

export const documentsApi = new DocumentsApi();