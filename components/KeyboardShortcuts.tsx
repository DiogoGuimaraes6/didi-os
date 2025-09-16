import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
}

function QuickTaskModal({ isOpen, onClose, onSubmit }: QuickTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task = {
      title,
      description,
      priority,
      status: 'todo',
      dueDate: dueDate || undefined
    };

    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });

      if (r.ok) {
        const newTask = await r.json();
        onSubmit(newTask);
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h2>Quick Add Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            placeholder="What needs to be done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            required
          />
          
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
          
          <div className="modal-row">
            <select value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            
            <input
              type="date"
              placeholder="Due date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Task
            </button>
          </div>
        </form>
        
        <div className="modal-footer">
          <small>Press <kbd>Escape</kbd> to close or <kbd>Enter</kbd> to save</small>
        </div>
      </div>
    </div>
  );
}

interface KeyboardShortcutsProps {
  onQuickTaskOpen?: () => void;
}

export default function KeyboardShortcuts({ onQuickTaskOpen }: KeyboardShortcutsProps = {}) {
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const router = useRouter();

  const openQuickTask = () => {
    setIsQuickTaskOpen(true);
    if (onQuickTaskOpen) onQuickTaskOpen();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open quick task
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openQuickTask();
      }
      
      // Cmd+/ or Ctrl+/ to show shortcuts help (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Future: show shortcuts help modal
        console.log('Keyboard shortcuts help (coming soon)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTaskCreated = (task: any) => {
    // Optionally navigate to tasks page or refresh current page data
    if (router.pathname !== '/tasks') {
      // If not on tasks page, could show a toast notification
      console.log('Task created:', task.title);
    }
    
    // Refresh the current page to show updated data
    window.location.reload();
  };

  return (
    <>
      <QuickTaskModal 
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        onSubmit={handleTaskCreated}
      />
      
      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <kbd>⌘K</kbd> Quick task
      </div>
    </>
  );
}
