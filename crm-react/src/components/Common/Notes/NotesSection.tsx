import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { NoteEditor } from './NoteEditor';
import { NoteCard } from './NoteCard';
import { notesApi, Note } from '../../../api/notesApi';

interface NotesSectionProps {
  entityType: string;
  entityId: number;
  readonly?: boolean;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ 
  entityType, 
  entityId, 
  readonly = false 
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [entityType, entityId]);

  const loadNotes = async () => {
    try {
      const notesData = await notesApi.getNotesForEntity(entityType, entityId);
      setNotes(notesData);
    } catch (error) {
      logger.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      if (editingNote) {
        const updatedNote = await notesApi.updateNote(editingNote.noteId!, {
          ...editingNote,
          ...noteData
        } as Note);
        setNotes(notes.map(n => n.noteId === updatedNote.noteId ? updatedNote : n));
      } else {
        const newNote = await notesApi.createNote({
          relatedEntityType: entityType,
          relatedEntityId: entityId,
          createdBy: parseInt(localStorage.getItem('userId') || '1'),
          ...noteData
        } as Note);
        setNotes([newNote, ...notes]);
      }
      setShowEditor(false);
      setEditingNote(null);
    } catch (error) {
      logger.error('Failed to save note:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await notesApi.deleteNote(noteId);
        setNotes(notes.filter(n => n.noteId !== noteId));
      } catch (error) {
        logger.error('Failed to delete note:', error);
      }
    }
  };

  const handleTogglePin = async (noteId: number) => {
    try {
      const updatedNote = await notesApi.togglePin(noteId);
      setNotes(notes.map(n => n.noteId === noteId ? updatedNote : n));
    } catch (error) {
      logger.error('Failed to toggle pin:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Notes ({notes.length})
        </h3>
        {!readonly && (
          <button
            onClick={() => setShowEditor(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Add Note
          </button>
        )}
      </div>

      {/* Note Editor */}
      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <div>No notes yet</div>
            {!readonly && (
              <div className="text-sm">Click "Add Note" to create the first note</div>
            )}
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.noteId}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onTogglePin={handleTogglePin}
              readonly={readonly}
            />
          ))
        )}
      </div>
    </div>
  );
};
