package com.techtammina.crm.service;

import com.techtammina.crm.dto.DocumentDTO;
import com.techtammina.crm.dto.DocumentRelationshipDTO;
import com.techtammina.crm.entity.*;
import com.techtammina.crm.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@Transactional
public class DocumentService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final DocumentRepository documentRepository;
    private final DocumentRelationshipRepository relationshipRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentSharingRepository sharingRepository;
    private final UsersRepository usersRepository;

    public DocumentService(DocumentRepository documentRepository,
                          DocumentRelationshipRepository relationshipRepository,
                          DocumentVersionRepository versionRepository,
                          DocumentSharingRepository sharingRepository,
                          UsersRepository usersRepository) {
        this.documentRepository = documentRepository;
        this.relationshipRepository = relationshipRepository;
        this.versionRepository = versionRepository;
        this.sharingRepository = sharingRepository;
        this.usersRepository = usersRepository;
    }

    public DocumentDTO uploadDocument(MultipartFile file, String description, String category, 
                                     String tags, String accessLevel, Integer userId) {
        try {
            // Validate file
            validateFile(file);
            
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            // Sanitize filename to prevent path traversal
            String sanitizedFilename = sanitizeFilename(uniqueFilename);
            Path filePath = uploadPath.resolve(sanitizedFilename);
            
            // Validate the resolved path is within upload directory
            if (!filePath.normalize().startsWith(uploadPath.normalize())) {
                throw new RuntimeException("Invalid file path");
            }
            
            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Create document entity
            Document document = new Document();
            document.setDocumentName(originalFilename);
            document.setDescription(description);
            document.setFileSize(file.getSize());
            document.setFileType(file.getContentType());
            document.setFileExtension(fileExtension);
            document.setStorageLocation(filePath.toString());
            document.setCategory(category);
            document.setTags(tags);
            
            if (accessLevel != null) {
                document.setAccessLevel(Document.AccessLevel.valueOf(accessLevel));
            }
            
            Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            document.setUploadedBy(user);
            document.setModifiedBy(user);
            
            document = documentRepository.save(document);
            
            // Create initial version
            createDocumentVersion(document, file.getSize(), filePath.toString(), "Initial version", userId);
            
            return convertToDTO(document);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        // Check file size (10MB limit) - prevent memory issues
        long maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException(String.format("File size exceeds %dMB limit (current: %.1fMB)", 
                    maxFileSize / (1024 * 1024), file.getSize() / (1024.0 * 1024.0)));
        }
        
        // Memory check before processing large files
        Runtime runtime = Runtime.getRuntime();
        long availableMemory = runtime.maxMemory() - (runtime.totalMemory() - runtime.freeMemory());
        if (file.getSize() > availableMemory * 0.1) { // File should not exceed 10% of available memory
            throw new RuntimeException("Insufficient memory to process file. Please try with a smaller file or try again later.");
        }
        
        // Check file type
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("Invalid filename");
        }
        
        String extension = getFileExtension(filename).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("pdf", "doc", "docx", "xls", "xlsx", 
                                                      "ppt", "pptx", "jpg", "jpeg", "png", "txt");
        
        if (!allowedExtensions.contains(extension)) {
            throw new RuntimeException("File type not allowed: " + extension);
        }
        
        // Block executable files
        List<String> blockedExtensions = Arrays.asList("exe", "bat", "sh", "cmd");
        if (blockedExtensions.contains(extension)) {
            throw new RuntimeException("Executable files are not allowed");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private void createDocumentVersion(Document document, Long fileSize, String storageLocation, 
                                     String changeDescription, Integer userId) {
        DocumentVersion version = new DocumentVersion();
        version.setDocument(document);
        version.setVersionNumber(document.getVersion());
        version.setFileSize(fileSize);
        version.setStorageLocation(storageLocation);
        version.setChangeDescription(changeDescription);
        
        Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        version.setUploadedBy(user);
        
        versionRepository.save(version);
    }

    public Page<DocumentDTO> getAllDocuments(Pageable pageable, String category, String fileType, 
                                           Integer userId, String userRole) {
        Page<Document> documents;
        
        if (category != null && !category.isEmpty()) {
            documents = documentRepository.findByCategoryAndIsActiveTrueAndIsLatestVersionTrue(category, pageable);
        } else {
            documents = documentRepository.findByIsActiveTrueAndIsLatestVersionTrue(pageable);
        }
        
        return documents.map(this::convertToDTO);
    }

    public Optional<DocumentDTO> getDocumentById(Integer documentId, Integer userId, String userRole) {
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (documentOpt.isPresent()) {
            Document document = documentOpt.get();
            // Check access permissions
            if (hasAccessToDocument(document, userId, userRole)) {
                return Optional.of(convertToDTO(document));
            }
        }
        
        return Optional.empty();
    }

    private boolean hasAccessToDocument(Document document, Integer userId, String userRole) {
        // IT_Admin has access to all documents
        if ("IT_Admin".equals(userRole)) {
            return true;
        }
        
        // Document owner has full access
        if (document.getUploadedBy().getUserId().equals(userId)) {
            return true;
        }
        
        // Check access level
        switch (document.getAccessLevel()) {
            case Public:
                return true;
            case Company:
                return true; // All authenticated users
            case Team:
                return "Sales_VP".equals(userRole) || "Sales_Manager".equals(userRole);
            case Private:
                return document.getUploadedBy().getUserId().equals(userId);
            default:
                return false;
        }
    }

    public Resource downloadDocument(Integer documentId, Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (!hasAccessToDocument(document, userId, userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        try {
            // Validate storage location to prevent path traversal
            Path storagePath = Paths.get(document.getStorageLocation()).normalize();
            Path uploadPath = Paths.get(uploadDir).normalize();
            
            if (!storagePath.startsWith(uploadPath)) {
                throw new RuntimeException("Invalid file location");
            }
            
            Resource resource = new UrlResource(storagePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error downloading file: " + e.getMessage());
        }
    }

    public DocumentDTO updateDocument(Integer documentId, DocumentDTO documentDTO, Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        // Check permissions
        if (!document.getUploadedBy().getUserId().equals(userId) && !"IT_Admin".equals(userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        // Update metadata only
        document.setDocumentName(documentDTO.getDocumentName());
        document.setDescription(documentDTO.getDescription());
        document.setCategory(documentDTO.getCategory());
        document.setTags(documentDTO.getTags());
        
        if (documentDTO.getAccessLevel() != null) {
            document.setAccessLevel(Document.AccessLevel.valueOf(documentDTO.getAccessLevel()));
        }
        
        Users modifiedBy = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        document.setModifiedBy(modifiedBy);
        
        document = documentRepository.save(document);
        return convertToDTO(document);
    }

    public void deleteDocument(Integer documentId, Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        // Check permissions
        if (!document.getUploadedBy().getUserId().equals(userId) && !"IT_Admin".equals(userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        // Soft delete
        document.setIsActive(false);
        documentRepository.save(document);
    }

    public DocumentDTO uploadNewVersion(Integer documentId, MultipartFile file, String changeDescription, 
                                       Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        // Check permissions
        if (!document.getUploadedBy().getUserId().equals(userId) && !"IT_Admin".equals(userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        try {
            validateFile(file);
            
            // Save new file
            Path uploadPath = Paths.get(uploadDir);
            String fileExtension = getFileExtension(file.getOriginalFilename());
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            // Sanitize filename to prevent path traversal
            String sanitizedFilename = sanitizeFilename(uniqueFilename);
            Path filePath = uploadPath.resolve(sanitizedFilename);
            
            // Validate the resolved path is within upload directory
            if (!filePath.normalize().startsWith(uploadPath.normalize())) {
                throw new RuntimeException("Invalid file path");
            }
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update document
            document.setVersion(document.getVersion() + 1);
            document.setFileSize(file.getSize());
            document.setStorageLocation(filePath.toString());
            document.setModifiedBy(usersRepository.findById(userId).orElse(null));
            
            document = documentRepository.save(document);
            
            // Create version record
            createDocumentVersion(document, file.getSize(), filePath.toString(), changeDescription, userId);
            
            return convertToDTO(document);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload new version: " + e.getMessage());
        }
    }

    public List<DocumentDTO> getVersionHistory(Integer documentId, Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (!hasAccessToDocument(document, userId, userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        List<Document> versions = documentRepository.findByParentDocumentDocumentIdOrderByVersionDesc(documentId);
        return versions.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public String shareDocument(Integer documentId, Integer sharedWithUserId, Boolean canEdit, 
                               Boolean canDownload, Integer userId, String userRole) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        // Check permissions
        if (!document.getUploadedBy().getUserId().equals(userId) && !"IT_Admin".equals(userRole)) {
            throw new RuntimeException("Access denied");
        }
        
        Users sharedWith = usersRepository.findById(sharedWithUserId)
            .orElseThrow(() -> new RuntimeException("User to share with not found"));
        
        Users sharedBy = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        DocumentSharing sharing = new DocumentSharing();
        sharing.setDocument(document);
        sharing.setSharedWith(sharedWith);
        sharing.setSharedBy(sharedBy);
        sharing.setCanEdit(canEdit);
        sharing.setCanDownload(canDownload);
        
        sharingRepository.save(sharing);
        
        return "Document shared successfully with " + sharedWith.getFirstName() + " " + sharedWith.getLastName();
    }

    public List<DocumentDTO> getDocumentsByEntity(String entityType, Integer entityId) {
        List<Document> documents = documentRepository.findByRelatedEntity(entityType, entityId);
        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<DocumentDTO> bulkUploadDocuments(MultipartFile[] files, String category, String tags, 
                                               String accessLevel, Integer userId) {
        List<DocumentDTO> results = new ArrayList<>();
        
        // Limit bulk upload count to prevent memory issues
        int maxBulkFiles = 20;
        if (files.length > maxBulkFiles) {
            throw new RuntimeException(String.format("Too many files for bulk upload. Maximum allowed: %d, provided: %d", 
                    maxBulkFiles, files.length));
        }
        
        // Calculate total size
        long totalSize = 0;
        for (MultipartFile file : files) {
            totalSize += file.getSize();
        }
        
        // Check total size limit (100MB for bulk upload)
        long maxTotalSize = 100 * 1024 * 1024; // 100MB
        if (totalSize > maxTotalSize) {
            throw new RuntimeException(String.format("Total file size exceeds %dMB limit (current: %.1fMB)", 
                    maxTotalSize / (1024 * 1024), totalSize / (1024.0 * 1024.0)));
        }
        
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentService.class);
        logger.info("Starting bulk upload of {} files, total size: {:.1f}MB", files.length, totalSize / (1024.0 * 1024.0));
        
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            try {
                DocumentDTO result = uploadDocument(file, null, category, tags, accessLevel, userId);
                results.add(result);
                logger.debug("Uploaded file {}/{}: {}", i + 1, files.length, file.getOriginalFilename());
                
                // Memory cleanup every 5 files
                if ((i + 1) % 5 == 0) {
                    System.gc();
                }
            } catch (Exception e) {
                logger.error("File upload failed for {}: {}", file.getOriginalFilename(), e.getMessage(), e);
            }
        }
        
        logger.info("Bulk upload completed: {}/{} files successful", results.size(), files.length);
        return results;
    }

    public List<DocumentDTO> searchDocuments(String keyword) {
        List<Document> documents = documentRepository.searchDocuments(keyword);
        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<DocumentDTO> getMyDocuments(Integer userId) {
        List<Document> documents = documentRepository.findByUploadedByUserIdAndIsActiveTrueAndIsLatestVersionTrue(userId);
        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return documentRepository.findDistinctCategories();
    }

    private DocumentDTO convertToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setDocumentId(document.getDocumentId());
        dto.setDocumentName(document.getDocumentName());
        dto.setDescription(document.getDescription());
        dto.setFileSize(document.getFileSize());
        dto.setFileType(document.getFileType());
        dto.setFileExtension(document.getFileExtension());
        dto.setStorageLocation(document.getStorageLocation());
        dto.setUploadedById(document.getUploadedBy().getUserId());
        dto.setUploadedByName(document.getUploadedBy().getFirstName() + " " + document.getUploadedBy().getLastName());
        dto.setUploadedDate(document.getUploadedDate());
        
        if (document.getModifiedBy() != null) {
            dto.setModifiedById(document.getModifiedBy().getUserId());
            dto.setModifiedByName(document.getModifiedBy().getFirstName() + " " + document.getModifiedBy().getLastName());
        }
        
        dto.setModifiedDate(document.getModifiedDate());
        dto.setVersion(document.getVersion());
        dto.setIsLatestVersion(document.getIsLatestVersion());
        
        if (document.getParentDocument() != null) {
            dto.setParentDocumentId(document.getParentDocument().getDocumentId());
        }
        
        dto.setCategory(document.getCategory());
        dto.setTags(document.getTags());
        dto.setAccessLevel(document.getAccessLevel().name());
        dto.setIsActive(document.getIsActive());
        
        // Convert relationships
        if (document.getRelationships() != null) {
            List<DocumentRelationshipDTO> relationshipDTOs = document.getRelationships().stream()
                .map(this::convertRelationshipToDTO)
                .collect(Collectors.toList());
            dto.setRelationships(relationshipDTOs);
        }
        
        return dto;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "unknown";
        // Remove path traversal characters and keep only safe characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private DocumentRelationshipDTO convertRelationshipToDTO(DocumentRelationship relationship) {
        DocumentRelationshipDTO dto = new DocumentRelationshipDTO();
        dto.setRelationshipId(relationship.getRelationshipId());
        dto.setDocumentId(relationship.getDocument().getDocumentId());
        dto.setRelatedEntityType(relationship.getRelatedEntityType().name());
        dto.setRelatedEntityId(relationship.getRelatedEntityId());
        dto.setCreatedDate(relationship.getCreatedDate());
        return dto;
    }

    public List<DocumentDTO> getDocumentsByFolder(Integer folderId) {
        // Method implementation would require FolderStructure entity relationship
        // For now, return empty list
        return new ArrayList<>();
    }

    public void moveDocumentToFolder(Integer documentId, Integer folderId) {
        // Implementation would involve DocumentFolderMapping entity
        // For now, just a placeholder
    }
}

