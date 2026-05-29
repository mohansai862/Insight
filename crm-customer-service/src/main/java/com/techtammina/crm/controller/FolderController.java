package com.techtammina.crm.controller;

import com.techtammina.crm.dto.DocumentDTO;
import com.techtammina.crm.entity.FolderStructure;
import com.techtammina.crm.service.DocumentService;
import com.techtammina.crm.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;
    private final DocumentService documentService;

    public FolderController(FolderService folderService, DocumentService documentService) {
        this.folderService = folderService;
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<List<FolderStructure>> getAllFolders() {
        List<FolderStructure> folders = folderService.getAllFolders();
        return ResponseEntity.ok(folders);
    }

    @PostMapping
    public ResponseEntity<FolderStructure> createFolder(@RequestBody FolderStructure folder,
                                                       @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        FolderStructure created = folderService.createFolder(folder, userId);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<DocumentDTO>> getDocumentsInFolder(@PathVariable Integer id) {
        List<DocumentDTO> documents = documentService.getDocumentsByFolder(id);
        return ResponseEntity.ok(documents);
    }

    @PostMapping("/{folderId}/move/{documentId}")
    public ResponseEntity<String> moveDocumentToFolder(@PathVariable Integer folderId, 
                                                      @PathVariable Integer documentId) {
        documentService.moveDocumentToFolder(documentId, folderId);
        return ResponseEntity.ok("Document moved successfully");
    }
}

