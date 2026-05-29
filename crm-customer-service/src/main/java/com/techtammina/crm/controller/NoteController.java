package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Note;
import com.techtammina.crm.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Note note) {
        Note createdNote = noteService.createNote(note);
        return ResponseEntity.ok(createdNote);
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Note>> getNotesByEntity(
            @PathVariable String entityType,
            @PathVariable Integer entityId) {
        List<Note> notes = noteService.getNotesByEntity(entityType, entityId);
        return ResponseEntity.ok(notes);
    }

    @PutMapping("/{noteId}")
    public ResponseEntity<Note> updateNote(@PathVariable Integer noteId, @RequestBody Note note) {
        Note updatedNote = noteService.updateNote(noteId, note);
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Integer noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{noteId}/pin")
    public ResponseEntity<Void> togglePin(@PathVariable Integer noteId) {
        noteService.togglePin(noteId);
        return ResponseEntity.ok().build();
    }
}

