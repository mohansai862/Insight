package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Integer> {
    List<Note> findByRelatedEntityTypeAndRelatedEntityIdOrderByCreatedDateDesc(Note.EntityType entityType, Integer entityId);
}

