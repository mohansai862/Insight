package com.techtammina.crm.service;

import com.techtammina.crm.entity.FolderStructure;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.FolderStructureRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FolderService {

    private final FolderStructureRepository folderRepository;
    private final UsersRepository usersRepository;

    public FolderService(FolderStructureRepository folderRepository, UsersRepository usersRepository) {
        this.folderRepository = folderRepository;
        this.usersRepository = usersRepository;
    }

    public List<FolderStructure> getAllFolders() {
        return folderRepository.findAll();
    }

    public FolderStructure createFolder(FolderStructure folder, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        folder.setCreatedBy(user);
        return folderRepository.save(folder);
    }
}

