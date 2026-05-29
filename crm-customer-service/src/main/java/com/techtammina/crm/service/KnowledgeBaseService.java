package com.techtammina.crm.service;

import com.techtammina.crm.dto.KnowledgeBaseDTO;
import com.techtammina.crm.entity.Case;
import com.techtammina.crm.entity.KnowledgeBase;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.CaseRepository;
import com.techtammina.crm.repository.KnowledgeBaseRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final UsersRepository usersRepository;
    private final CaseRepository caseRepository;

    public KnowledgeBaseService(KnowledgeBaseRepository knowledgeBaseRepository,
                               UsersRepository usersRepository,
                               CaseRepository caseRepository) {
        this.knowledgeBaseRepository = knowledgeBaseRepository;
        this.usersRepository = usersRepository;
        this.caseRepository = caseRepository;
    }

    public KnowledgeBaseDTO createArticle(KnowledgeBaseDTO articleDTO, Integer userId) {
        KnowledgeBase article = new KnowledgeBase();
        
        Users createdBy = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        article.setCreatedBy(createdBy);
        
        article.setTitle(articleDTO.getTitle());
        article.setContent(articleDTO.getContent());
        article.setCategory(articleDTO.getCategory());
        article.setTags(articleDTO.getTags());
        article.setStatus(KnowledgeBase.Status.valueOf(articleDTO.getStatus()));
        
        article = knowledgeBaseRepository.save(article);
        return convertToDTO(article);
    }

    public Page<KnowledgeBaseDTO> getAllArticles(Pageable pageable, String status) {
        Page<KnowledgeBase> articles;
        
        if (status != null && !status.isEmpty()) {
            articles = knowledgeBaseRepository.findByStatus(KnowledgeBase.Status.valueOf(status), pageable);
        } else {
            articles = knowledgeBaseRepository.findAll(pageable);
        }
        
        return articles.map(this::convertToDTO);
    }

    public Optional<KnowledgeBaseDTO> getArticleById(Integer articleId) {
        Optional<KnowledgeBase> articleOpt = knowledgeBaseRepository.findById(articleId);
        
        if (articleOpt.isPresent()) {
            KnowledgeBase article = articleOpt.get();
            // Increment view count
            article.setViewCount(article.getViewCount() + 1);
            knowledgeBaseRepository.save(article);
            return Optional.of(convertToDTO(article));
        }
        
        return Optional.empty();
    }

    public KnowledgeBaseDTO updateArticle(Integer articleId, KnowledgeBaseDTO articleDTO) {
        KnowledgeBase article = knowledgeBaseRepository.findById(articleId)
            .orElseThrow(() -> new RuntimeException("Article not found"));
        
        article.setTitle(articleDTO.getTitle());
        article.setContent(articleDTO.getContent());
        article.setCategory(articleDTO.getCategory());
        article.setTags(articleDTO.getTags());
        article.setStatus(KnowledgeBase.Status.valueOf(articleDTO.getStatus()));
        
        article = knowledgeBaseRepository.save(article);
        return convertToDTO(article);
    }

    public void deleteArticle(Integer articleId) {
        knowledgeBaseRepository.deleteById(articleId);
    }

    public List<KnowledgeBaseDTO> searchArticles(String keyword) {
        List<KnowledgeBase> articles = knowledgeBaseRepository.searchPublishedArticles(keyword);
        return articles.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<KnowledgeBaseDTO> getArticlesByCategory(String category) {
        List<KnowledgeBase> articles = knowledgeBaseRepository.findByCategory(category);
        return articles.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public void markHelpful(Integer articleId) {
        KnowledgeBase article = knowledgeBaseRepository.findById(articleId)
            .orElseThrow(() -> new RuntimeException("Article not found"));
        
        article.setHelpfulCount(article.getHelpfulCount() + 1);
        knowledgeBaseRepository.save(article);
    }

    public void markNotHelpful(Integer articleId) {
        KnowledgeBase article = knowledgeBaseRepository.findById(articleId)
            .orElseThrow(() -> new RuntimeException("Article not found"));
        
        article.setNotHelpfulCount(article.getNotHelpfulCount() + 1);
        knowledgeBaseRepository.save(article);
    }

    public List<KnowledgeBaseDTO> getRelatedArticles(Integer caseId) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        // Search for articles related to case subject and description
        String searchTerm = caseEntity.getSubject() + " " + caseEntity.getDescription();
        String[] keywords = searchTerm.split("\\s+");
        
        List<KnowledgeBase> relatedArticles = knowledgeBaseRepository.searchPublishedArticles(keywords[0]);
        
        // Limit to top 5 most viewed articles
        return relatedArticles.stream()
            .sorted((a, b) -> b.getViewCount().compareTo(a.getViewCount()))
            .limit(5)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return knowledgeBaseRepository.findDistinctCategories();
    }

    private KnowledgeBaseDTO convertToDTO(KnowledgeBase article) {
        KnowledgeBaseDTO dto = new KnowledgeBaseDTO();
        dto.setArticleId(article.getArticleId());
        dto.setTitle(article.getTitle());
        dto.setContent(article.getContent());
        dto.setCategory(article.getCategory());
        dto.setTags(article.getTags());
        dto.setStatus(article.getStatus().name());
        dto.setCreatedById(article.getCreatedBy().getUserId());
        dto.setCreatedByName(article.getCreatedBy().getFirstName() + " " + article.getCreatedBy().getLastName());
        dto.setCreatedDate(article.getCreatedDate());
        dto.setModifiedDate(article.getModifiedDate());
        dto.setViewCount(article.getViewCount());
        dto.setHelpfulCount(article.getHelpfulCount());
        dto.setNotHelpfulCount(article.getNotHelpfulCount());
        return dto;
    }
}

