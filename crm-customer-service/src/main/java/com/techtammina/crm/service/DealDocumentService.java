package com.techtammina.crm.service;

import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.DealDocument;
import com.techtammina.crm.repository.DealDocumentRepository;
import com.techtammina.crm.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class DealDocumentService {

    private final DealDocumentRepository dealDocumentRepository;
    private final DealRepository dealRepository;

    @Autowired
    public DealDocumentService(DealDocumentRepository dealDocumentRepository, DealRepository dealRepository) {
        this.dealDocumentRepository = dealDocumentRepository;
        this.dealRepository = dealRepository;
    }

    public DealDocument uploadBatchDocument(Integer dealId, String documentNames, byte[] combinedData, Integer uploadedBy) {
        Optional<Deal> dealOpt = dealRepository.findById(dealId);
        if (dealOpt.isEmpty()) {
            throw new IllegalArgumentException("Deal not found: " + dealId);
        }
        Deal deal = dealOpt.get();

        // Check for duplicate document names
        List<DealDocument> existingDocs = dealDocumentRepository.findByDeal_DealId(dealId);
        java.util.Set<String> existingFileNames = new java.util.HashSet<>();
        
        for (DealDocument existingDoc : existingDocs) {
            if (existingDoc.getDocumentName().contains(", ")) {
                String[] names = existingDoc.getDocumentName().split(", ");
                for (String name : names) {
                    existingFileNames.add(name.trim().toLowerCase());
                }
            } else {
                existingFileNames.add(existingDoc.getDocumentName().toLowerCase());
            }
        }

        // Check new document names for duplicates
        String[] newFileNames = documentNames.split(", ");
        java.util.List<String> duplicates = new java.util.ArrayList<>();
        for (String fileName : newFileNames) {
            if (existingFileNames.contains(fileName.trim().toLowerCase())) {
                duplicates.add(fileName.trim());
            }
        }
        
        if (!duplicates.isEmpty()) {
            throw new IllegalArgumentException("Document already exist: " + String.join(", ", duplicates));
        }

        DealDocument doc = new DealDocument();
        doc.setDeal(deal);
        doc.setDocumentName(documentNames);
        doc.setDocumentData(combinedData);
        doc.setDocumentSize((long) combinedData.length);
        doc.setUploadedBy(uploadedBy);
        return dealDocumentRepository.save(doc);
    }

    public DealDocument uploadDocument(Integer dealId, MultipartFile file, Integer uploadedBy) throws IOException {
        Optional<Deal> dealOpt = dealRepository.findById(dealId);
        if (dealOpt.isEmpty()) {
            throw new IllegalArgumentException("Deal not found: " + dealId);
        }
        Deal deal = dealOpt.get();

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        
        // Check for duplicate document name in this deal
        List<DealDocument> existingDocs = dealDocumentRepository.findByDeal_DealId(dealId);
        for (DealDocument existingDoc : existingDocs) {
            if (existingDoc.getDocumentName().contains(", ")) {
                // Check batch upload files
                String[] fileNames = existingDoc.getDocumentName().split(", ");
                for (String existingFileName : fileNames) {
                    if (existingFileName.trim().equalsIgnoreCase(fileName)) {
                        throw new IllegalArgumentException("Document already exists: " + fileName);
                    }
                }
            } else {
                // Check single file
                if (existingDoc.getDocumentName().equalsIgnoreCase(fileName)) {
                    throw new IllegalArgumentException("Document already exists: " + fileName);
                }
            }
        }

        DealDocument doc = new DealDocument();
        doc.setDeal(deal);
        doc.setDocumentName(fileName);
        doc.setDocumentData(file.getBytes());
        doc.setDocumentSize(file.getSize());
        doc.setUploadedBy(uploadedBy);
        return dealDocumentRepository.save(doc);
    }

    public DealDocument uploadBatchDocuments(Integer dealId, MultipartFile[] files, Integer uploadedBy) throws IOException {
        Optional<Deal> dealOpt = dealRepository.findById(dealId);
        if (dealOpt.isEmpty()) {
            throw new IllegalArgumentException("Deal not found: " + dealId);
        }
        Deal deal = dealOpt.get();

        // Get existing documents to check for duplicates
        List<DealDocument> existingDocs = dealDocumentRepository.findByDeal_DealId(dealId);
        java.util.Set<String> existingFileNames = new java.util.HashSet<>();
        
        for (DealDocument existingDoc : existingDocs) {
            if (existingDoc.getDocumentName().contains(", ")) {
                String[] names = existingDoc.getDocumentName().split(", ");
                for (String name : names) {
                    existingFileNames.add(name.trim().toLowerCase());
                }
            } else {
                existingFileNames.add(existingDoc.getDocumentName().toLowerCase());
            }
        }

        // Check for duplicates in the batch
        java.util.List<String> duplicates = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            if (existingFileNames.contains(fileName.toLowerCase())) {
                duplicates.add(fileName);
            }
        }
        
        if (!duplicates.isEmpty()) {
            throw new IllegalArgumentException("Documents already exist: " + String.join(", ", duplicates));
        }

        // Combine all file names
        StringBuilder fileNames = new StringBuilder();
        java.io.ByteArrayOutputStream combinedData = new java.io.ByteArrayOutputStream();
        
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (i > 0) fileNames.append(", ");
            fileNames.append(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
            
            // Write file data with separator
            byte[] fileData = file.getBytes();
            combinedData.write(fileData);
            if (i < files.length - 1) {
                combinedData.write("|||FILE_SEPARATOR|||".getBytes());
            }
        }

        DealDocument doc = new DealDocument();
        doc.setDeal(deal);
        doc.setDocumentName(fileNames.toString());
        doc.setDocumentData(combinedData.toByteArray());
        doc.setDocumentSize((long) combinedData.size());
        doc.setUploadedBy(uploadedBy);
        return dealDocumentRepository.save(doc);
    }

    public void deleteFileFromBatch(Integer documentId, Integer fileIndex) {
        Optional<DealDocument> docOpt = dealDocumentRepository.findById(documentId);
        if (docOpt.isEmpty()) return;
        
        DealDocument doc = docOpt.get();
        String[] fileNames = doc.getDocumentName().split(", ");
        
        if (fileNames.length <= 1) {
            // If only one file, delete the entire document
            dealDocumentRepository.deleteById(documentId);
            return;
        }
        
        // Remove the file at the specified index
        java.util.List<String> nameList = new java.util.ArrayList<>(java.util.Arrays.asList(fileNames));
        if (fileIndex >= 0 && fileIndex < nameList.size()) {
            nameList.remove(fileIndex.intValue());
            
            // Update document name
            doc.setDocumentName(String.join(", ", nameList));
            
            // For simplicity, we'll keep the combined data as is
            // In a production system, you might want to reconstruct the data without the deleted file
            dealDocumentRepository.save(doc);
        }
    }

    public List<DealDocument> listByDeal(Integer dealId) {
        return dealDocumentRepository.findByDeal_DealId(dealId);
    }

    public Optional<DealDocument> findById(Integer documentId) {
        return dealDocumentRepository.findById(documentId);
    }

    public void delete(Integer documentId) {
        dealDocumentRepository.deleteById(documentId);
    }

    public List<DealDocument> findAll() {
        return dealDocumentRepository.findAll();
    }

    public DealDocument save(DealDocument document) {
        return dealDocumentRepository.save(document);
    }

    public void deleteSpecificFile(Integer documentId, Integer fileIndex) {
        deleteFileFromBatch(documentId, fileIndex);
    }
}

