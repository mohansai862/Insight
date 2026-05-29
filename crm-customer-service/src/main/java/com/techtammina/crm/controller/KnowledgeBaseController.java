package com.techtammina.crm.controller;

import com.techtammina.crm.dto.KnowledgeBaseDTO;
import com.techtammina.crm.service.KnowledgeBaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/kb")
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    public KnowledgeBaseController(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @PostMapping
    public ResponseEntity<KnowledgeBaseDTO> createArticle(@RequestBody KnowledgeBaseDTO articleDTO, HttpServletRequest request) {
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) userId = 1;
        KnowledgeBaseDTO result = knowledgeBaseService.createArticle(articleDTO, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Page<KnowledgeBaseDTO>> getAllArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<KnowledgeBaseDTO> articles = knowledgeBaseService.getAllArticles(pageable, status);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeBaseDTO> getArticleById(@PathVariable Integer id) {
        return knowledgeBaseService.getArticleById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeBaseDTO> updateArticle(@PathVariable Integer id, @RequestBody KnowledgeBaseDTO articleDTO) {
        KnowledgeBaseDTO result = knowledgeBaseService.updateArticle(id, articleDTO);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Integer id) {
        knowledgeBaseService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeBaseDTO>> searchArticles(@RequestParam String keyword) {
        List<KnowledgeBaseDTO> articles = knowledgeBaseService.searchArticles(keyword);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<KnowledgeBaseDTO>> getArticlesByCategory(@PathVariable String category) {
        List<KnowledgeBaseDTO> articles = knowledgeBaseService.getArticlesByCategory(category);
        return ResponseEntity.ok(articles);
    }

    @PostMapping("/{id}/helpful")
    public ResponseEntity<Void> markHelpful(@PathVariable Integer id) {
        knowledgeBaseService.markHelpful(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/not-helpful")
    public ResponseEntity<Void> markNotHelpful(@PathVariable Integer id) {
        knowledgeBaseService.markNotHelpful(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/related/{caseId}")
    public ResponseEntity<List<KnowledgeBaseDTO>> getRelatedArticles(@PathVariable Integer caseId) {
        List<KnowledgeBaseDTO> articles = knowledgeBaseService.getRelatedArticles(caseId);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = knowledgeBaseService.getCategories();
        return ResponseEntity.ok(categories);
    }
}

