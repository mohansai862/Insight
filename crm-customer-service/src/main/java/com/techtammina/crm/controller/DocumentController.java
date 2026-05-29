package com.techtammina.crm.controller;

import com.techtammina.crm.dto.DocumentDTO;
import com.techtammina.crm.service.DocumentService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentDTO> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String accessLevel,
            HttpServletRequest request) {
        
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) userId = 1; // Default for testing
        
        DocumentDTO result = documentService.uploadDocument(file, description, category, tags, accessLevel, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Page<DocumentDTO>> getAllDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String fileType,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<DocumentDTO> documents = documentService.getAllDocuments(pageable, category, fileType, userId, userRole);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocumentById(@PathVariable Integer id,
                                                      @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                      @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        return documentService.getDocumentById(id, userId, userRole)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Integer id,
                                                    @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                    @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        try {
            Resource resource = documentService.downloadDocument(id, userId, userRole);
            DocumentDTO document = documentService.getDocumentById(id, userId, userRole).orElse(null);
            
            if (document == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getDocumentName() + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> updateDocument(@PathVariable Integer id,
                                                     @RequestBody DocumentDTO documentDTO,
                                                     @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                     @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        DocumentDTO result = documentService.updateDocument(id, documentDTO, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Integer id,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        documentService.deleteDocument(id, userId, userRole);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/version")
    public ResponseEntity<DocumentDTO> uploadNewVersion(@PathVariable Integer id,
                                                       @RequestParam("file") MultipartFile file,
                                                       @RequestParam(required = false) String changeDescription,
                                                       @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                       @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        DocumentDTO result = documentService.uploadNewVersion(id, file, changeDescription, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<DocumentDTO>> getVersionHistory(@PathVariable Integer id,
                                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        List<DocumentDTO> versions = documentService.getVersionHistory(id, userId, userRole);
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<String> shareDocument(@PathVariable Integer id,
                                               @RequestParam Integer sharedWithUserId,
                                               @RequestParam(defaultValue = "false") Boolean canEdit,
                                               @RequestParam(defaultValue = "true") Boolean canDownload,
                                               @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        String result = documentService.shareDocument(id, sharedWithUserId, canEdit, canDownload, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<DocumentDTO>> getDocumentsByEntity(@PathVariable String entityType,
                                                                 @PathVariable Integer entityId) {
        List<DocumentDTO> documents = documentService.getDocumentsByEntity(entityType, entityId);
        return ResponseEntity.ok(documents);
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<List<DocumentDTO>> bulkUploadDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String accessLevel,
            HttpServletRequest request) {
        
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) userId = 1;
        
        List<DocumentDTO> results = documentService.bulkUploadDocuments(files, category, tags, accessLevel, userId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search")
    public ResponseEntity<List<DocumentDTO>> searchDocuments(@RequestParam String keyword) {
        List<DocumentDTO> documents = documentService.searchDocuments(keyword);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/my-documents")
    public ResponseEntity<List<DocumentDTO>> getMyDocuments(@RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        
        List<DocumentDTO> documents = documentService.getMyDocuments(userId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = documentService.getCategories();
        return ResponseEntity.ok(categories);
    }
}

