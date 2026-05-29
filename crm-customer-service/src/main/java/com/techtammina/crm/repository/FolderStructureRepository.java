package com.techtammina.crm.repository;

import com.techtammina.crm.entity.FolderStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderStructureRepository extends JpaRepository<FolderStructure, Integer> {
    
    List<FolderStructure> findByParentFolderIsNull();
    
    List<FolderStructure> findByParentFolderFolderId(Integer parentFolderId);
    
    List<FolderStructure> findByCreatedByUserId(Integer userId);
}

