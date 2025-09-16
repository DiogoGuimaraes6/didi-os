import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

type Project = {
  id: number;
  name: string;
  description?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'On Hold';
  createdAt: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Upcoming'|'In Progress'|'Completed'|'On Hold'>('Upcoming');

  const load = async () => {
    const r = await fetch('/api/projects');
    setProjects(await r.json());
  };

  const loadTasks = async () => {
    const r = await fetch('/api/tasks');
    setTasks(await r.json());
  };

  useEffect(() => { 
    load(); 
    loadTasks();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, status })
    });
    if (r.ok) {
      setName(''); setDescription(''); setStatus('Upcoming');
      load();
    }
  };

  const remove = async (id: number) => {
    await fetch('/api/projects?id=' + id, { method: 'DELETE' });
    load();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return '#6b7280';
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      case 'On Hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');

  return (
    <div className="dashboard-layout">
      <Sidebar taskCount={todoTasks.length} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Projects</h1>
          <button className="btn-primary">New Project</button>
        </div>
        
        <p className="muted">Organize your work into projects with status tracking and task assignments.</p>

      <form onSubmit={add} className="card grid" style={{marginTop: '1rem'}}>
        <input placeholder="Project name" value={name} onChange={e=>setName(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="row">
          <select value={status} onChange={e=>setStatus(e.target.value as any)}>
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          <button className="btn" type="submit">Add Project</button>
        </div>
      </form>

      <div className="grid" style={{marginTop: '1rem'}}>
        {projects.map(p => (
          <div className="card" key={p.id}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <strong>{p.name}</strong>
                {' '}
                <span className="tag" style={{backgroundColor: getStatusColor(p.status), color: 'white', border: 'none'}}>
                  {p.status}
                </span>
              </div>
              <div className="row">
                <button className="btn" onClick={()=>remove(p.id)}>Delete</button>
              </div>
            </div>
            {p.description && <p className="muted">{p.description}</p>}
            <div className="muted">Created: {new Date(p.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      </main>
    </div>
  );
}
