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
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [projects, setProjects] = useState<any[]>([]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    // Use local timezone to avoid date offset issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Reset form to default values
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(getTodayDate());
    setProjectId(undefined);
  };

  // Load projects when modal opens and reset form
  useEffect(() => {
    if (isOpen) {
      fetch('/api/projects')
        .then(r => r.json())
        .then(setProjects)
        .catch(console.error);
      
      // Reset form to default values
      resetForm();
    }
  }, [isOpen]);

  // Auto-fill project based on exact word matching
  useEffect(() => {
    if (title.trim() && projects.length > 0) {
      const titleWords = title.toLowerCase().split(/\s+/);
      const matchingProject = projects.find(project => {
        const projectWords = project.name.toLowerCase().split(/\s+/);
        // Check if any complete word from title matches any complete word from project name
        return titleWords.some(word => 
          word.length > 2 && projectWords.some(projectWord => 
            projectWord === word || word === projectWord
          )
        );
      });
      
      if (matchingProject && projectId !== matchingProject.id) {
        setProjectId(matchingProject.id);
      } else if (!matchingProject && projectId) {
        // Clear project if no match found
        setProjectId(undefined);
      }
    }
  }, [title, projects, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task = {
      title,
      description,
      priority,
      status: 'todo',
      dueDate: dueDate || undefined,
      projectId: projectId || undefined
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
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      resetForm();
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Quick Text Task</h2>
            <p className="modal-subtitle">Create a new task quickly</p>
          </div>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Task Title *</label>
            <input
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Additional details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Project {projectId && title.trim() ? <span className="auto-filled-badge">Auto-filled</span> : ''}</label>
              <select 
                value={projectId || ''} 
                onChange={e => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">No project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select value="todo" disabled>
                <option value="todo">To Do</option>
              </select>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Task
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
