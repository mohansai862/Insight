package com.techtammina.crm.service;

import com.techtammina.crm.entity.Note;
import com.techtammina.crm.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    public Note createNote(Note note) {
        note.setCreatedDate(LocalDateTime.now());
        return noteRepository.save(note);
    }

    public List<Note> getNotesByEntity(String entityType, Integer entityId) {
        return noteRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderByCreatedDateDesc(
            Note.EntityType.valueOf(entityType), entityId);
    }

    public Note updateNote(Integer noteId, Note note) {
        Note existing = noteRepository.findById(noteId).orElseThrow();
        existing.setNoteTitle(note.getNoteTitle());
        existing.setNoteContent(note.getNoteContent());
        existing.setModifiedDate(LocalDateTime.now());
        existing.setModifiedBy(note.getModifiedBy());
        return noteRepository.save(existing);
    }

    public void deleteNote(Integer noteId) {
        noteRepository.deleteById(noteId);
    }

    public void togglePin(Integer noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        note.setIsPinned(!note.getIsPinned());
        noteRepository.save(note);
    }
}

