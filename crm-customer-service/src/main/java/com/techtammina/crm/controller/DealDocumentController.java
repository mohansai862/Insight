package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.DealDocument;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.service.DealDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/deals/{dealId}/documents")
public class DealDocumentController {

    private final DealDocumentService dealDocumentService;
    private final DealRepository dealRepository;

    @Autowired
    public DealDocumentController(DealDocumentService dealDocumentService, DealRepository dealRepository) {
        this.dealDocumentService = dealDocumentService;
        this.dealRepository = dealRepository;
    }

    private boolean isAuthorized(Integer userId, String userRole, Deal deal) {
        if (deal == null) return false;
        if (userRole == null) userRole = "";
        // Higher roles have access
        if (userRole.equals("IT_Admin") || userRole.equals("Sales_VP") || userRole.equals("CEO")) return true;
        
        // Sales_Manager: full access + can view won deals
        if (userRole.equals("Sales_Manager")) {
            return true; // Can view all deals including won deals
        }
        
        // Sales_Executive rules: can access if they created the deal OR are reassigned to the deal OR are owner/creator of related account/contact OR deal is won
        if (userRole.equals("Sales_Executive") && userId != null) {
            // Can view won deals regardless of ownership
            if (deal.getStage() == Deal.Stage.Closed_Won) {
                return true;
            }
            // Original ownership rules for non-won deals
            boolean byCreator = deal.getCreatedBy() != null && userId.equals(deal.getCreatedBy().getUserId());
            boolean byReassign = deal.getReassignTo() != null && userId.equals(deal.getReassignTo().getUserId());
            boolean byAccount = deal.getAccount() != null && (
                (deal.getAccount().getCreatedBy() != null && userId.equals(deal.getAccount().getCreatedBy().getUserId())) ||
                (deal.getAccount().getReassignTo() != null && userId.equals(deal.getAccount().getReassignTo().getUserId()))
            );
            boolean byContact = deal.getContact() != null && (
                (deal.getContact().getCreatedBy() != null && userId.equals(deal.getContact().getCreatedBy().getUserId())) ||
                (deal.getContact().getReassignTo() != null && userId.equals(deal.getContact().getReassignTo().getUserId()))
            );
            return byCreator || byReassign || byAccount || byContact;
        }
        return false;
    }

    @PostMapping(value = "/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadBatch(
            @PathVariable Integer dealId,
            @RequestParam("files") MultipartFile[] files,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) throws IOException {
        Deal deal = dealRepository.findById(dealId).orElse(null);
        if (!isAuthorized(userId, userRole, deal)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            // Upload all files as a single batch document
            DealDocument doc = dealDocumentService.uploadBatchDocuments(dealId, files, userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("documentId", doc.getDocumentId());
            result.put("documentName", doc.getDocumentName());
            result.put("uploadedBy", doc.getUploadedBy());
            result.put("uploadedAt", doc.getUploadedAt());
            result.put("fileCount", files.length);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("already exist")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "DUPLICATE_DOCUMENTS");
                error.put("message", e.getMessage());
                return ResponseEntity.status(409).body(error);
            }
            throw e;
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(
            @PathVariable Integer dealId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) throws IOException {
        Deal deal = dealRepository.findById(dealId).orElse(null);
        if (!isAuthorized(userId, userRole, deal)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            DealDocument doc = dealDocumentService.uploadDocument(dealId, file, userId);
            Map<String, Object> result = new HashMap<>();
            result.put("documentId", doc.getDocumentId());
            result.put("documentName", doc.getDocumentName());
            result.put("uploadedBy", doc.getUploadedBy());
            result.put("uploadedAt", doc.getUploadedAt());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("already exists")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "DUPLICATE_DOCUMENT");
                error.put("message", e.getMessage());
                return ResponseEntity.status(409).body(error);
            }
            throw e;
        }
    }

    @PostMapping("/update-sizes")
    public ResponseEntity<Map<String, Object>> updateDocumentSizes(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"IT_ADMIN".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            List<DealDocument> allDocs = dealDocumentService.findAll();
            int updated = 0;
            
            for (DealDocument doc : allDocs) {
                if (doc.getDocumentSize() == null && doc.getDocumentData() != null) {
                    doc.setDocumentSize((long) doc.getDocumentData().length);
                    dealDocumentService.save(doc);
                    updated++;
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("updated", updated);
            result.put("message", "Updated " + updated + " documents with size information");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @PathVariable Integer dealId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        Deal deal = dealRepository.findById(dealId).orElse(null);
        if (!isAuthorized(userId, userRole, deal)) {
            return ResponseEntity.status(403).build();
        }
        List<DealDocument> docs = dealDocumentService.listByDeal(dealId);
        List<Map<String, Object>> body = new java.util.ArrayList<>();
        
        for (DealDocument d : docs) {
            // Check if this is a legacy batch upload (comma-separated names)
            if (d.getDocumentName().contains(", ")) {
                String[] fileNames = d.getDocumentName().split(", ");
                for (int i = 0; i < fileNames.length; i++) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("documentId", d.getDocumentId());
                    m.put("documentName", fileNames[i].trim());
                    m.put("fileIndex", i);
                    m.put("uploadedBy", d.getUploadedBy());
                    m.put("uploadedAt", d.getUploadedAt());
                    m.put("documentSize", d.getDocumentSize() != null ? d.getDocumentSize() / fileNames.length : null); // Approximate size per file
                    m.put("dealStage", deal != null ? deal.getStage() : null);
                    body.add(m);
                }
            } else {
                // New format: single file per record
                Map<String, Object> m = new HashMap<>();
                m.put("documentId", d.getDocumentId());
                m.put("documentName", d.getDocumentName());
                m.put("fileIndex", 0);
                m.put("uploadedBy", d.getUploadedBy());
                m.put("uploadedAt", d.getUploadedAt());
                m.put("documentSize", d.getDocumentSize());
                m.put("dealStage", deal != null ? deal.getStage() : null);
                body.add(m);
            }
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<byte[]> download(
            @PathVariable Integer dealId,
            @PathVariable Integer documentId,
            @RequestParam(value = "fileIndex", defaultValue = "0") Integer fileIndex,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        return dealDocumentService.findById(documentId)
                .map(doc -> {
                    Deal deal = doc.getDeal();
                    if (!isAuthorized(userId, userRole, deal)) {
                        return ResponseEntity.status(403).<byte[]>build();
                    }
                    // Handle legacy batch uploads
                    String fileName = doc.getDocumentName();
                    if (doc.getDocumentName().contains(", ")) {
                        String[] fileNames = doc.getDocumentName().split(", ");
                        fileName = fileIndex < fileNames.length ? fileNames[fileIndex].trim() : doc.getDocumentName();
                    }
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20"))
                            .contentType(MediaType.APPLICATION_OCTET_STREAM)
                            .body(doc.getDocumentData());
                })
                .orElse(ResponseEntity.<byte[]>status(404).build());
    }

    @GetMapping("/view/{documentId}")
    public ResponseEntity<byte[]> viewDocument(
            @PathVariable Integer dealId,
            @PathVariable Integer documentId,
            @RequestParam(value = "fileIndex", defaultValue = "0") Integer fileIndex,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        return dealDocumentService.findById(documentId)
                .map(doc -> {
                    Deal deal = doc.getDeal();
                    if (!isAuthorized(userId, userRole, deal)) {
                        return ResponseEntity.status(403).<byte[]>build();
                    }
                    // Handle legacy batch uploads
                    String filename = doc.getDocumentName();
                    if (doc.getDocumentName().contains(", ")) {
                        String[] fileNames = doc.getDocumentName().split(", ");
                        filename = fileIndex < fileNames.length ? fileNames[fileIndex].trim() : doc.getDocumentName();
                    }
                    
                    MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
                    if (filename != null) {
                        String ext = filename.toLowerCase();
                        if (ext.endsWith(".pdf")) contentType = MediaType.APPLICATION_PDF;
                        else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) contentType = MediaType.IMAGE_JPEG;
                        else if (ext.endsWith(".png")) contentType = MediaType.IMAGE_PNG;
                        else if (ext.endsWith(".gif")) contentType = MediaType.IMAGE_GIF;
                        else if (ext.endsWith(".txt")) contentType = MediaType.TEXT_PLAIN;
                        else if (ext.endsWith(".xlsx")) contentType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                        else if (ext.endsWith(".xls")) contentType = MediaType.parseMediaType("application/vnd.ms-excel");
                        else if (ext.endsWith(".ppt")) contentType = MediaType.parseMediaType("application/vnd.ms-powerpoint");
                        else if (ext.endsWith(".pptx")) contentType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation");
                    }
                    
                    return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20"))
                        .contentType(contentType)
                        .body(doc.getDocumentData());
                })
                .orElse(ResponseEntity.<byte[]>status(404).build());
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer dealId,
            @PathVariable Integer documentId,
            @RequestParam(value = "fileIndex", required = false) Integer fileIndex,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        Optional<DealDocument> docOpt = dealDocumentService.findById(documentId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        DealDocument doc = docOpt.get();
        Deal deal = doc.getDeal();
        if (!isAuthorized(userId, userRole, deal)) {
            return ResponseEntity.status(403).build();
        }
        
        if (fileIndex != null) {
            // Delete specific file from batch
            dealDocumentService.deleteSpecificFile(documentId, fileIndex);
        } else {
            // Delete entire document
            dealDocumentService.delete(documentId);
        }
        return ResponseEntity.noContent().build();
    }
}

