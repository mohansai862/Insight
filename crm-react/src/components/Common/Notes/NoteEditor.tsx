import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../../api/notesApi';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (noteData: Partial<Note>) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState(note?.noteTitle || '');
  const [content, setContent] = useState(note?.noteContent || '');
  const [isPrivate, setIsPrivate] = useState(note?.isPrivate || false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const maxLength = 10000;
  const isEditing = !!note;

  useEffect(() => {
    if (note?.mentions) {
      try {
        setMentions(JSON.parse(note.mentions));
      } catch (e) {
        setMentions([]);
      }
    }
  }, [note]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      alert('Note content is required');
      return;
    }

    const noteData: Partial<Note> = {
      noteTitle: title.trim() || undefined,
      noteContent: content.trim(),
      isPrivate,
      mentions: mentions.length > 0 ? JSON.stringify(mentions) : undefined
    };

    onSave(noteData);
  };

  const insertMention = (username: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Replace the @query with @username
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newContent = beforeMention + `@${username} ` + textAfterCursor;
      setContent(newContent);
      
      // Add to mentions array if not already present
      if (!mentions.includes(username)) {
        setMentions([...mentions, username]);
      }
    }
    
    setShowMentions(false);
  };

  // Mock users for mention functionality
  const mockUsers = ['john.doe', 'jane.smith', 'mike.johnson', 'sarah.wilson'];
  const filteredUsers = mockUsers.filter(user => 
    user.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="space-y-4">
        {/* Title Input */}
        <input
          type="text"
          placeholder="Note title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Content Editor */}
        <div className="relative">
          <textarea
            ref={contentRef}
            placeholder="Write your note here... Use @username to mention team members"
            value={content}
            onChange={handleContentChange}
            rows={6}
            maxLength={maxLength}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
          
          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
              {filteredUsers.map((user) => (
                <button
                  key={user}
                  onClick={() => insertMention(user)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  @{user}
                </button>
              ))}
            </div>
          )}
          
          {/* Character Count */}
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length}/{maxLength}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Private note</span>
          </label>
          
          {mentions.length > 0 && (
            <div className="text-sm text-gray-600">
              Mentions: {mentions.map(m => `@${m}`).join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
};