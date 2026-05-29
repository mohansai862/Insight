import React from 'react';
import { Note, formatRelativeTime } from '../../../api/notesApi';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  onTogglePin: (noteId: number) => void;
  readonly?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  readonly = false 
}) => {
  const currentUserId = parseInt(localStorage.getItem('userId') || '1');
  const canEdit = !readonly && note.createdBy === currentUserId;

  const renderContent = (content: string) => {
    // Simple HTML rendering - in production, use a proper HTML sanitizer
    return { __html: content };
  };

  const renderMentions = (content: string) => {
    // Highlight @mentions in the content
    return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
  };

  return (
    <div className={`border rounded-lg p-4 bg-white shadow-sm ${note.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {note.noteTitle && (
            <h4 className="font-medium text-gray-900 mb-1">{note.noteTitle}</h4>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Created {formatRelativeTime(note.createdDate!)}</span>
            {note.modifiedDate && note.modifiedDate !== note.createdDate && (
              <span>• Edited {formatRelativeTime(note.modifiedDate)}</span>
            )}
            {note.isPrivate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                🔒 Private
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {!readonly && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => onTogglePin(note.noteId!)}
              className={`p-1 rounded hover:bg-gray-100 ${note.isPinned ? 'text-yellow-600' : 'text-gray-400'}`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              📌
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(note)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                  title="Edit note"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(note.noteId!)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                  title="Delete note"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className="text-gray-700 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={renderContent(renderMentions(note.noteContent))}
      />

      {/* Footer */}
      {note.mentions && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Mentions: {JSON.parse(note.mentions).map((mention: string) => (
              <span key={mention} className="text-blue-600 font-medium">@{mention} </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};