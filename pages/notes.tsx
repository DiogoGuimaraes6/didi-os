import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Notes() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  const loadTasks = async () => {
    try {
      const r = await fetch('/api/tasks');
      setTasks(await r.json());
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const todoTasks = tasks.filter(t => t.status === 'todo');

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={todoTasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Notes</h1>
          <button className="btn-primary">Save Notes</button>
        </div>
        
        <p className="muted">Capture your thoughts, ideas, and important information in one place.</p>

        <div className="dashboard-card">
          <h2>Quick Notes</h2>
          <textarea
            className="notes-textarea"
            placeholder="Write your notes here... Everything you type is automatically saved locally."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={15}
            style={{ minHeight: '400px' }}
          />
        </div>

        <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
          <h2>Coming Soon</h2>
          <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
            <li>Rich text formatting</li>
            <li>Note categories and tags</li>
            <li>Search functionality</li>
            <li>File attachments</li>
            <li>Collaborative notes</li>
            <li>Export to PDF/Markdown</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
