'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  BookOpen, 
  FileText, 
  Save, 
  AlertCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected note state
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Form State (for selected note editing)
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    subject_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [notesRes, subjectsRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/subjects')
      ]);

      if (!notesRes.ok || !subjectsRes.ok) {
        throw new Error('Failed to load notes data.');
      }

      const notesData = await notesRes.json();
      const subjectsData = await subjectsRes.json();

      setNotes(notesData);
      setSubjects(subjectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update editor form when note selection changes
  useEffect(() => {
    if (selectedNote) {
      setNoteForm({
        title: selectedNote.title,
        content: selectedNote.content,
        subject_id: selectedNote.subject_id || '',
      });
    } else {
      setNoteForm({ title: '', content: '', subject_id: '' });
    }
    setError('');
  }, [selectedNote]);

  const handleInputChange = (e) => {
    setNoteForm({
      ...noteForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateNote = async () => {
    setError('');
    const newNotePayload = {
      title: 'Untitled Note',
      content: '',
      subject_id: subjectFilter !== 'All' && subjectFilter !== 'Uncategorized' ? parseInt(subjectFilter) : null,
    };

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotePayload),
      });

      if (!res.ok) throw new Error('Failed to create note.');
      const data = await res.json();
      
      // Re-fetch all and set selected to the new one
      await fetchData();
      
      // Find and select the newly created note
      setSelectedNote({
        id: data.id,
        title: newNotePayload.title,
        content: newNotePayload.content,
        subject_id: newNotePayload.subject_id,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    setError('');

    const payload = {
      title: noteForm.title || 'Untitled Note',
      content: noteForm.content,
      subject_id: noteForm.subject_id === '' ? null : parseInt(noteForm.subject_id),
    };

    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save note.');

      // Refresh list, keeping the note selected
      await fetchData();
      
      setSelectedNote({
        ...selectedNote,
        ...payload,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setError('');

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note.');

      setSelectedNote(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    // Subject filter
    if (subjectFilter !== 'All') {
      if (subjectFilter === 'Uncategorized' && note.subject_id !== null) return false;
      if (subjectFilter !== 'Uncategorized' && note.subject_id !== parseInt(subjectFilter)) return false;
    }

    // Text search (checks title and content)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(query);
      const matchContent = note.content.toLowerCase().includes(query);
      return matchTitle || matchContent;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          <div className="bg-secondary rounded-2xl"></div>
          <div className="bg-secondary rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Study Notes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Write lecture summaries, code snippets, and review concepts</p>
        </div>
      </div>

      {/* Main split dashboard */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        
        {/* Left Side Pane: Notes Selector List */}
        <div className="border-r border-border p-4 flex flex-col min-h-0 h-full bg-secondary/10">
          
          {/* Controls: Search & Subject filter */}
          <div className="space-y-2 mb-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-border focus:border-primary rounded-xl pl-9 pr-3 py-2 text-xs outline-none"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="flex-1 bg-secondary border border-border px-2 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary"
              >
                <option value="All">All Subjects</option>
                <option value="Uncategorized">Uncategorized</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>

              <button
                onClick={handleCreateNote}
                className="p-2 bg-primary text-white hover:bg-opacity-95 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                title="Create New Note"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto text-muted/45 mb-2" />
                <p className="text-xs font-semibold">No notes found</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Click + to start writing.</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const active = selectedNote && selectedNote.id === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      active 
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10' 
                        : 'bg-card border-border/80 hover:border-primary/30 hover:bg-secondary/45'
                    }`}
                  >
                    <span className="font-bold text-xs truncate block">{note.title || 'Untitled Note'}</span>
                    
                    <div className="flex justify-between items-center w-full gap-2">
                      {note.subject_id ? (
                        <span 
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: active ? 'rgba(255,255,255,0.15)' : `${note.subject_color}15`, 
                            color: active ? '#ffffff' : note.subject_color 
                          }}
                        >
                          {note.subject_code || note.subject_name}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/10 text-white/90' : 'bg-secondary text-muted-foreground'}`}>
                          Uncategorized
                        </span>
                      )}
                      <span className={`text-[9px] shrink-0 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {note.updated_at.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side Pane: Note Editor */}
        <div className="md:col-span-2 p-6 flex flex-col min-h-0 h-full">
          {!selectedNote ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-16">
              <FolderOpen className="h-12 w-12 text-muted/40 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">No Note Selected</p>
              <p className="text-xs text-muted-foreground mt-0.5">Select a note from the left, or create a new one to begin editing.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 h-full space-y-4">
              
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Note options: Subject select, Save & Delete button */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <select
                    name="subject_id"
                    value={noteForm.subject_id}
                    onChange={handleInputChange}
                    className="bg-secondary border border-border px-2 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="">No Subject / Uncategorized</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-primary text-white hover:bg-opacity-95 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Editor Layout */}
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <input
                  type="text"
                  name="title"
                  value={noteForm.title}
                  onChange={handleInputChange}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-xl font-bold border-none outline-none focus:ring-0 text-foreground placeholder-muted-foreground shrink-0"
                />
                
                <textarea
                  name="content"
                  value={noteForm.content}
                  onChange={handleInputChange}
                  placeholder="Start typing your study notes here..."
                  className="w-full flex-1 bg-transparent border-none outline-none resize-none focus:ring-0 text-sm text-foreground/90 placeholder-muted-foreground/60 min-h-0 overflow-y-auto leading-relaxed"
                />
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
